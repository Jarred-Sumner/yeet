import * as Sentry from "@sentry/react-native";
import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import { basename } from "path";
import qs from "qs";
import * as React from "react";
import { BASE_HOSTNAME } from "../../config";
import ADD_ATTACHMENT_MUTATION from "./addAttachmentMutation.graphql";
import CREATE_POST_MUTATION from "./createPostMutation.graphql";
import CREATE_POST_THREAD_MUTATION from "./createPostThreadMutation.graphql";
import {
  AddAttachmentMutation,
  AddAttachmentMutationVariables
} from "./graphql/AddAttachmentMutation";
import { CreatePost } from "./graphql/CreatePost";
import {
  CreatePostThread,
  CreatePostThread_createPostThread
} from "./graphql/CreatePostThread";
import { PostFragment } from "./graphql/PostFragment";
import { ContentExport, ExportableYeetImage, ExportData } from "./Exporter";
import {
  uploadFile,
  allowSuspendIfBackgrounded,
  cancelUpload
} from "./FileUploader";
import { getRequestHeaders } from "./graphql";
import { CreatePostVariables } from "./graphql/CreatePost";
import { CreatePostThreadVariables } from "./graphql/CreatePostThread";
import { PostFormat, PostLayout } from "../components/NewPost/NewPostFormat";
import { useApolloClient } from "react-apollo";
import { navigate } from "./NavigationService";
import { throttle } from "lodash";
import Storage from "./Storage";
import {
  ViewThread as ViewThreadQuery,
  ViewThreadVariables,
  ViewThread_postThread_posts_data,
  ViewThread_postThread_posts_data_profile
} from "./graphql/ViewThread";
import VIEW_THREAD_QUERY from "./ViewThread.graphql";
import VIEW_THREADS_QUERY from "./ViewThreads.graphql";
import { uniqBy } from "lodash";
import { ViewThreads, ViewThreadsVariables } from "./graphql/ViewThreads";
import { globalUserContext } from "../components/UserContext";
import LIST_PROFILE_POSTS_QUERY from "./ListProfilePostsQuery.graphql";
import {
  ListProfilePosts,
  ListProfilePostsVariables
} from "./graphql/ListProfilePosts";
import { ExampleMap } from "./buildPost";

type PresignResponse = {
  signedUrl: string;
  mediaId: string;
  filename: string;
  originalFilename: string;
  headers: Object;
  fields: Object;
};

export enum MediaUploadStatus {
  waiting = "waiting",
  cancelled = "cancelled",
  complete = "complete",
  progressing = "progressing",
  error = "error"
}

type MediaUploadChange = (mediaUpload: MediaUpload | null) => void;
type MediaUploadProgress = (progress: number) => void;
type MediaTaskProgress = (progress: number, mediaUpload: MediaUpload) => void;

export class MediaUpload {
  media: ExportableYeetImage;
  taskId: string | null = null;
  mediaId: string | null = null;
  presignResponse: PresignResponse | null = null;
  presignStatus: MediaUploadStatus = MediaUploadStatus.waiting;
  uploadProgress: number = 0.0;
  uploadError: Error | null = null;
  presignError: Error | null = null;

  _onChange: MediaUploadChange | null = null;
  _onProgress: MediaUploadProgress | null = null;

  status: MediaUploadStatus;

  constructor({
    media,
    onChange = null,
    onProgress = null,
    taskId = null,
    presignResponse = null,
    presignStatus = MediaUploadStatus.waiting,
    status = MediaUploadStatus.waiting
  }: {
    media: ExportableYeetImage;
    onChange: MediaUploadChange | null;
    onProgress: MediaUploadProgress | null;
    taskId: string | null;
    presignResponse: PresignResponse | null;
    presignStatus: MediaUploadStatus;
    status: MediaUploadStatus;
  }) {
    this._onChange = onChange;
    this._onProgress = onProgress;
    this.media = media;
    this.taskId = taskId;
    this.presignResponse = presignResponse;
    this.presignStatus = presignStatus;
    this.status = status;
  }

  cancel = () => {
    if (!this.taskId) {
      this.status = MediaUploadStatus.cancelled;
      return;
    }

    if (this.isCompleted || this.isFailed) {
      return;
    }

    return cancelUpload(this.taskId);
  };

  startPresign = async () => {
    if (this.presignStatus === MediaUploadStatus.progressing) {
      return Promise.reject();
    }

    const params = qs.stringify({
      objectName: basename(this.media.uri),
      contentType: this.media.mimeType,
      width: this.media.width,
      height: this.media.height,
      type: "Media"
    });

    const headers = new Headers({
      Authorization: `Bearer ${Storage.getCachedJWT()}`,
      "Content-Type": "application/json"
    });

    // const headers = await Promise.resolve(getRequestHeaders());

    this.presignStatus = MediaUploadStatus.progressing;

    window.setTimeout(this.onChange, 1);

    const signURL = `${BASE_HOSTNAME}/api/sign-s3?${params}`;

    console.log("Presign request", signURL, headers);

    try {
      const resp = await fetch(signURL, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        redirect: "follow",
        headers
      });

      console.log("FETCH", resp);

      const json = await resp.json();

      console.log(json);

      if (typeof json === "object" && typeof json.mediaId === "string") {
        this.presignStatus = MediaUploadStatus.complete;
        this.presignResponse = json as PresignResponse;
        this.mediaId = this.presignResponse.mediaId;
        this.onChange();

        return json;
      } else {
        this.presignStatus = MediaUploadStatus.error;
        this.presignError = json;

        this.onChange();
      }
    } catch (error) {
      console.error(error);
    }
  };

  handleError = ({ error }) => {
    this.status = MediaUploadStatus.error;
    this.uploadError = error;

    this.onChange();
  };
  handleCompleted = () => {
    this.status = MediaUploadStatus.complete;

    this.onChange();
  };
  handleProgress = (progress: number) => {
    if (typeof progress === "number") {
      this.uploadProgress = progress;

      this.onProgress();
    }
  };
  handleCancel = () => {
    this.status = MediaUploadStatus.cancelled;
    this.onChange();
  };

  onChange = () => {
    typeof this._onChange === "function" && this._onChange(this);
  };

  onProgress = () => {
    typeof this._onProgress === "function" &&
      this._onProgress(this.uploadProgress);
  };

  startUpload = () => {
    if (this.status === MediaUploadStatus.progressing) {
      return;
    }

    this.status = MediaUploadStatus.progressing;

    this.onChange();

    const headers = {
      ...this.presignResponse.headers,
      "content-type": this.media.mimeType
    };

    console.log("Begin upload!", this.media.uri, { headers });

    uploadFile({
      file: this.media.uri,
      mimeType: this.media.mimeType,
      url: this.presignResponse.signedUrl,
      headers,
      onError: this.handleError,
      onCompleted: this.handleCompleted,
      onProgress: this.handleProgress,
      onCancel: this.handleCancel
    }).then(
      taskId => {
        this.taskId = taskId;
        this.onChange();
      },
      err => {
        this.uploadError = err;
        console.error(err);
        Sentry.captureException(err);

        this.status = MediaUploadStatus.error;
        this.onChange();
      }
    );
  };

  start = () => {
    if (this.presignStatus === MediaUploadStatus.waiting) {
      this.startPresign();
    } else if (
      this.status === MediaUploadStatus.waiting &&
      this.presignStatus === MediaUploadStatus.complete
    ) {
      this.startUpload();
    }
  };

  get isWaiting() {
    return (
      this.presignStatus === MediaUploadStatus.waiting ||
      (this.presignStatus === MediaUploadStatus.complete &&
        this.status === MediaUploadStatus.waiting)
    );
  }

  get isCompleted() {
    return (
      this.presignStatus === MediaUploadStatus.complete &&
      this.status === MediaUploadStatus.complete
    );
  }

  get isProgressing() {
    return (
      this.presignStatus === MediaUploadStatus.progressing ||
      (this.presignStatus === MediaUploadStatus.complete &&
        this.status === MediaUploadStatus.progressing)
    );
  }

  get isFailed() {
    return (
      [MediaUploadStatus.cancelled, MediaUploadStatus.error].includes(
        this.presignStatus
      ) ||
      [MediaUploadStatus.cancelled, MediaUploadStatus.error].includes(
        this.status
      )
    );
  }

  resumeUpload = () => {};

  toJSON() {
    return {
      media: this.media,
      presignResponse: this.presignResponse,
      presignStatus: this.presignStatus,
      taskId: this.taskId,
      status: this.status
    };
  }
}

enum MediaUploadTaskStatus {
  waiting = "waiting",
  cancelled = "cancelled",
  complete = "complete",
  progressing = "progressing",
  error = "error"
}

export class MediaUploadTask {
  optionalFiles: Array<MediaUpload> = [];
  requiredFile: MediaUpload;
  status = MediaUploadTaskStatus.waiting;
  onChangeFile: (old: MediaUpload, _new: MediaUpload | null) => void;

  onProgress: MediaTaskProgress | null = null;

  constructor({
    requiredFile,
    optionalFiles,
    status = MediaUploadTaskStatus.waiting
  }) {
    this.requiredFile = requiredFile;
    this.optionalFiles = optionalFiles;
    this.status = status;

    [requiredFile, ...optionalFiles].filter(Boolean).forEach(file => {
      file._onChange = this.handleChange;
      file._onProgress = this.handleProgress(file);
    });
  }

  get currentFile() {
    const inProgressFile = this.files.find(file => file.isProgressing);

    if (inProgressFile) {
      return inProgressFile;
    }

    const waitingFile = this.files.find(file => file.isWaiting);

    if (waitingFile) {
      return waitingFile;
    }

    return null;
  }

  cancel = () => {
    return Promise.all(this.files.map(file => file.cancel())).then(() => {
      this.status = MediaUploadTaskStatus.cancelled;
      allowSuspendIfBackgrounded();
    });
  };

  handleChange: MediaUploadChange = mediaUpload => {
    let file = this.currentFile;

    console.log("HANDLE CHANGE", { file, mediaUpload, status: this.status });

    if (mediaUpload.isWaiting) {
      mediaUpload.start();
    } else if (mediaUpload.isProgressing) {
      this.status = MediaUploadTaskStatus.progressing;
    } else if (mediaUpload.status === MediaUploadStatus.complete && !file) {
      this.status = MediaUploadTaskStatus.complete;
    } else if (mediaUpload.isFailed && this.requiredFile.isCompleted) {
      this.status = MediaUploadTaskStatus.complete;
    } else if (mediaUpload.isFailed && !this.requiredFile.isCompleted) {
      this.status = MediaUploadTaskStatus.error;
    }

    if (mediaUpload !== file) {
      typeof this.onChangeFile === "function" &&
        this.onChangeFile(mediaUpload, file);
    } else if (mediaUpload === file) {
      typeof this.onChangeFile === "function" &&
        this.onChangeFile(mediaUpload, null);
    }
  };

  handleProgress = (mediaUpload: MediaUpload) => (progress: number) => {
    if (typeof progress !== "number") {
      return;
    }

    typeof this.onProgress === "function" &&
      this.onProgress(progress, mediaUpload);
  };

  static fromExport({
    contentExport,
    exportData,
    onChangeFile,
    onProgress
  }: {
    contentExport: ContentExport;
    exportData: ExportData;
  }): MediaUploadTask {
    const task = new MediaUploadTask({
      requiredFile: new MediaUpload({
        status: MediaUploadStatus.waiting,
        presignStatus: MediaUploadStatus.waiting,
        media: {
          uri: contentExport.uri,
          width: contentExport.width,
          height: contentExport.height,
          mimeType: contentExport.type,
          duration: contentExport.duration
        }
      }),
      optionalFiles: [
        ...exportData.nodes.map(node => node.block),
        ...exportData.blocks
      ]
        .filter(block => {
          if (
            block.type !== "image" ||
            typeof block.value === "string" ||
            !block.value?.uri
          ) {
            return false;
          }

          const image = block.value as ExportableYeetImage;
          const isLocalImage = [
            "ph://",
            "file://",
            "photos://",
            "asset-library://",
            "/"
          ].some(scheme => image.uri.toLowerCase().startsWith(scheme));

          return isLocalImage;
        })
        .map(
          block =>
            new MediaUpload({
              media: block.value as ExportableYeetImage,
              status: MediaUploadStatus.waiting,
              presignStatus: MediaUploadStatus.waiting
            })
        )
    });

    task.onChangeFile = onChangeFile;
    task.onProgress = onProgress;

    return task;
  }

  get files(): Array<MediaUpload> {
    return [this.requiredFile, ...this.optionalFiles].filter(Boolean);
  }

  resume = () => {};
  start = () => {
    const file = this.currentFile;
    if (file && file.isWaiting) {
      this.currentFile.start();
    }
  };

  toJSON = () => {
    return {
      optionalFiles: this.optionalFiles.map(file => file.toJSON()),
      requiredFile: this.requiredFile,
      status: this.status
    };
  };
}

export enum PostUploadTaskStatus {
  uploading = "uploading",
  posting = "posting",
  waiting = "waiting",
  cancelled = "cancelled",
  complete = "complete",
  progressing = "progressing",
  error = "error"
}

export enum PostUploadTaskType {
  newPost = "newPost",
  newThread = "newThread"
}

export class PostUploadTask {
  task: MediaUploadTask;
  contentExport: ContentExport;
  exportData: ExportData;
  client: ApolloClient<InMemoryCache>;
  format: PostFormat;
  threadId: string | null = null;
  body: string;
  post: PostFragment | null = null;
  postThread: CreatePostThread_createPostThread | null = null;
  status: PostUploadTaskStatus = PostUploadTaskStatus.waiting;
  strings: Array<string> = [];
  type: PostUploadTaskType;
  editToken: string;
  layout: PostLayout;

  onChange: (task: PostUploadTask) => void | null = null;
  onProgress: (
    progress: number,
    mediaUpload: MediaUpload,
    task: PostUploadTask
  ) => void | null = null;

  get isFinished() {
    return (
      this.hasPosted &&
      this.task.files.every(file => !file.isWaiting && !file.isProgressing)
    );
  }

  get hasPosted() {
    if (this.type === PostUploadTaskType.newPost) {
      return !!this.post;
    } else if (this.type === PostUploadTaskType.newThread) {
      return !!this.postThread;
    } else {
      return false;
    }
  }

  cancel = async () => {
    await this.task.cancel();
    this.updateStatus();

    this.onChange(this);
  };

  examples: ExampleMap;
  remixId: string | null = null;

  constructor({
    contentExport,
    exportData,
    editToken,
    format,
    threadId,
    body,
    strings,
    client,
    onChange,
    remixId = null,
    examples = {},
    onProgress,
    type,
    layout
  }: Pick<PostUploadTask, "onChange" | "onProgress"> & {
    layout: PostLayout;
    contentExport: ContentExport;
    exportData: ExportData;
    format: PostFormat;
    editToken: string;
    strings: Array<string>;
    threadId: string | null;
    examples: ExampleMap;
    remixId: string | null;
    body: string | null;
    client: ApolloClient<InMemoryCache>;
    type: PostUploadTaskType;
  }) {
    this.editToken = editToken;
    this.layout = layout;
    this.contentExport = contentExport;
    this.exportData = exportData;
    this.format = format;
    this.examples = examples;
    this.remixId = remixId;
    this.threadId = threadId;
    this.body = body;
    this.strings = strings;

    if (client) {
      this.client = client;
    }

    this.type = type;
    this.onChange = onChange;
    this.onProgress = onProgress;

    console.log("CHECK CHECK 123");

    this.task = MediaUploadTask.fromExport({
      contentExport,
      exportData,
      onChangeFile: this.onChangeFile,
      onProgress: this.handleProgress
    });
  }

  handleProgress = throttle((progress: number, mediaUpload: MediaUpload) => {
    typeof this.onProgress === "function" &&
      this.onProgress(progress, mediaUpload, this);
  }, 100);

  onChangeFile = (oldFile: MediaUpload, newFile: MediaUpload | null) => {
    const isRequiredFile = oldFile === this.task.requiredFile;
    const isRequiredFileCompleted = this.task.requiredFile.isCompleted;

    console.log("Change file", oldFile, newFile);

    if (this.status === PostUploadTaskStatus.error) {
      return;
    }

    if (isRequiredFileCompleted && isRequiredFile && this.isWaitingToSubmit) {
      this.submit().then(() => {
        if (
          this.status !== PostUploadTaskStatus.error &&
          this.status != PostUploadTaskStatus.complete
        ) {
          return this.task.start();
        }
      });
    } else if (newFile !== oldFile && oldFile.isWaiting) {
      oldFile.start();
      this.updateStatus();
    } else if (newFile !== oldFile && newFile?.isWaiting) {
      newFile.start();
      this.updateStatus();
    } else {
      this.updateStatus();
    }

    typeof this.onChange === "function" && this.onChange(this);
  };

  get isWaitingToSubmit() {
    if (this.type === PostUploadTaskType.newPost) {
      return !this.post;
    } else if (this.type === PostUploadTaskType.newThread) {
      return !this.postThread;
    }
  }

  start() {
    if (this.status === PostUploadTaskStatus.uploading) {
      return;
    }

    this.status = PostUploadTaskStatus.uploading;
    console.log("Starting task", this.task);
    this.task.start();
  }

  addAtachment = (imageUrl: string, mediaId: string, postId: string) => {
    return this.client.mutate<
      AddAttachmentMutation,
      AddAttachmentMutationVariables
    >({
      mutation: ADD_ATTACHMENT_MUTATION,
      variables: {
        mediaId,
        postId,
        id: imageUrl
      }
    });
  };

  addAttachments = () => {
    const { id: postId = null } = this.post ?? {};

    if (!postId) {
      return;
    }

    this.task.optionalFiles
      .filter(file => file.isCompleted)
      .map(file => {
        this.addAtachment(file.presignResponse.signedUrl, file.mediaId, postId);
      });
  };

  createPost = () => {
    console.log("Creating post", this);
    return this.client
      .mutate<CreatePost, CreatePostVariables>({
        mutation: CREATE_POST_MUTATION,
        errorPolicy: "ignore",
        variables: {
          mediaId: this.task.requiredFile.mediaId,
          editToken: this.editToken,
          layout: this.layout,
          blocks: this.exportData.blocks,
          nodes: this.exportData.nodes,
          examples: this.examples,
          remixId: this.remixId,
          strings: this.strings,
          format: this.format,
          autoplaySeconds: this.contentExport.duration,
          bounds: this.exportData.bounds,
          colors: {
            primary: this.contentExport.colors?.primary,
            detail: this.contentExport.colors?.detail,
            background: this.contentExport.colors?.background,
            secondary: this.contentExport.colors?.secondary
          },
          threadId: this.threadId
        },
        update: (store, { data: { createPost } }) => {
          // Read the data from our cache for this query.
          const variables = {
            threadId: this.threadId,
            postOffset: 0,
            postsCount: 10
          };
          const data = store.readQuery<ViewThreadQuery, ViewThreadVariables>({
            query: VIEW_THREAD_QUERY,
            variables
          });

          // Add our comment from the mutation to the end.
          data.postThread.posts.data = uniqBy(
            [...data.postThread.posts.data, createPost],
            "id"
          );

          const profileId = globalUserContext.userId;

          if (profileId) {
            try {
              const variables = {
                profileId,
                offset: 0,
                limit: 20
              };

              const listPosts = store.readQuery<
                ListProfilePosts,
                ListProfilePostsVariables
              >({
                variables,
                query: LIST_PROFILE_POSTS_QUERY
              });

              const data = listPosts?.profile?.posts?.data;
              if (data) {
                listPosts.profile.posts.data = [
                  createPost,
                  ...listPosts?.profile?.posts?.data
                ];

                store.writeQuery({
                  query: LIST_PROFILE_POSTS_QUERY,
                  variables,
                  data: listPosts
                });
              }
            } catch (exception) {
              console.error(exception);
            }
          }

          // Write our data back to the cache.
          store.writeQuery({ query: VIEW_THREAD_QUERY, data, variables });
        }
      })
      .then(resp => {
        this.post = resp?.data?.createPost;

        if (!this.post) {
          this.status = PostUploadTaskStatus.error;
        } else {
          this.updateStatus();
        }

        allowSuspendIfBackgrounded();

        this.onChangeFile(this.task.requiredFile, this.task.optionalFiles[0]);

        return resp;
      });
  };

  createPostThread = () => {
    console.log("Posting thread", this);

    return this.client
      .mutate<CreatePostThread, CreatePostThreadVariables>({
        errorPolicy: "all",
        mutation: CREATE_POST_THREAD_MUTATION,
        variables: {
          mediaId: this.task.requiredFile.mediaId,
          blocks: this.exportData.blocks,
          nodes: this.exportData.nodes,
          examples: this.examples,
          remixId: this.remixId,
          editToken: this.editToken,
          strings: this.strings,
          layout: this.layout,
          format: this.format,
          autoplaySeconds: this.contentExport.duration,
          bounds: this.exportData.bounds,
          body: this.body,
          colors: {
            primary: this.contentExport.colors?.primary,
            detail: this.contentExport.colors?.detail,
            background: this.contentExport.colors?.background,
            secondary: this.contentExport.colors?.secondary
          }
        },
        update: (store, { data: { createPostThread } }) => {
          try {
            // Read the data from our cache for this query.
            const variables = {
              limit: 20,
              postsCount: 4
            };
            const data = store.readQuery<ViewThreads, ViewThreadsVariables>({
              query: VIEW_THREADS_QUERY,
              variables
            });

            // Add our comment from the mutation to the end.
            data.postThreads.data = uniqBy(
              [createPostThread, ...data.postThreads.data],
              "id"
            );

            const profileId = globalUserContext.userId;
            const post = createPostThread?.posts?.data[0];

            if (profileId && post) {
              try {
                console.log({ profileId });
                const variables = {
                  profileId,
                  offset: 0,
                  limit: 20
                };

                const listPosts = store.readQuery<
                  ListProfilePosts,
                  ListProfilePostsVariables
                >({
                  query: LIST_PROFILE_POSTS_QUERY,
                  variables
                });

                const data = listPosts?.profile?.posts?.data;
                if (data) {
                  listPosts.profile.posts.data = [
                    post,
                    ...listPosts?.profile?.posts?.data
                  ];

                  store.writeQuery({
                    query: LIST_PROFILE_POSTS_QUERY,
                    variables,
                    data: listPosts
                  });
                }
              } catch (exception) {
                console.error(exception);
              }
            }
            // Write our data back to the cache.
            store.writeQuery({ query: VIEW_THREADS_QUERY, data, variables });
          } catch (exception) {
            console.error(exception);
          }
        }
      })
      .then(
        resp => {
          console.log(resp);
          this.postThread = resp?.data?.createPostThread;

          const posts = resp?.data?.createPostThread?.posts?.data ?? [];

          if (posts.length > 0) {
            this.post = posts[0];
          }

          if (!this.postThread || !this.post) {
            this.status = PostUploadTaskStatus.error;
          } else {
            this.updateStatus();
          }

          allowSuspendIfBackgrounded();

          this.onChangeFile(this.task.requiredFile, this.task.optionalFiles[0]);

          return resp;
        },
        err => {
          console.error(err);
          this.status = PostUploadTaskStatus.error;
          this.onChange();
        }
      );
  };

  updateStatus = () => {
    if (this.post && this.status === PostUploadTaskStatus.posting) {
      if (this.task.optionalFiles.some(file => !file.isCompleted)) {
        this.status = PostUploadTaskStatus.uploading;
      } else {
        this.status = PostUploadTaskStatus.complete;
      }
    } else if (this.task.files.every(media => media.isCompleted)) {
      this.status = PostUploadTaskStatus.complete;
    } else if (
      this.task.files.find(media => media.status == MediaUploadStatus.cancelled)
    ) {
      this.status = PostUploadTaskStatus.cancelled;
    } else if (
      this.task.files.find(media => media.status == MediaUploadStatus.error)
    ) {
      this.status = PostUploadTaskStatus.error;
    } else if (this.task.files.find(media => media.isProgressing)) {
      this.status = PostUploadTaskStatus.progressing;
    }
  };

  submit = () => {
    if (this.task.requiredFile.isCompleted) {
      this.status = PostUploadTaskStatus.posting;
    }

    if (this.type === PostUploadTaskType.newPost) {
      return this.createPost();
    } else if (this.type === PostUploadTaskType.newThread) {
      return this.createPostThread();
    } else {
      return Promise.reject();
    }
  };
}

type MediaUploadContextValue = {
  postUploadTask: PostUploadTask | null;
  setPostUploadTask: (postUploadTask: PostUploadTask | null) => void;
  progress: number;
  onPressPost: () => void;
  status: PostUploadTaskStatus;
  currentFile: MediaUpload | null;
};
export const MediaUploadContext = React.createContext<MediaUploadContextValue | null>(
  null
);

export const MediaUploadProvider = ({ children }) => {
  const client = useApolloClient();
  const [postUploadTask, setPostUploadTask] = React.useState<PostUploadTask>(
    null
  );

  const [progress, setProgress] = React.useState(0.0);
  const [status, setStatus] = React.useState(
    postUploadTask?.status ?? PostUploadTaskStatus.waiting
  );

  const [currentFile, setCurrentFile] = React.useState(
    postUploadTask?.task?.currentFile
  );

  const handleProgress = React.useCallback(
    (progress: number) => {
      setProgress(progress / 100);
    },
    [setProgress]
  );

  const handleChange = React.useCallback(
    (upload: PostUploadTask) => {
      setStatus(upload.status);
      setCurrentFile(upload.task.currentFile);
    },
    [setStatus, setCurrentFile]
  );

  React.useEffect(() => {
    if (!postUploadTask) {
      setProgress(0);
      setStatus(PostUploadTaskStatus.waiting);
      setCurrentFile(null);
      return;
    }

    postUploadTask.client = client;
    postUploadTask.onProgress = handleProgress;
    postUploadTask.onChange = handleChange;
  }, [
    setProgress,
    postUploadTask,
    client,
    handleProgress,
    handleChange,
    setCurrentFile,
    setStatus
  ]);

  const onPressPost = React.useCallback(() => {
    if (!postUploadTask) {
      return;
    }

    const thread = postUploadTask.postThread;
    const post = postUploadTask.post;

    if (post) {
      navigate("ViewThread", {
        threadId: thread?.id ?? postUploadTask.threadId,
        thread: thread,
        post: post,
        postId: post.id
      });

      setPostUploadTask(null);
    }
  }, [
    postUploadTask,
    postUploadTask?.post?.id,
    postUploadTask?.postThread?.id,
    postUploadTask?.status,
    setPostUploadTask
  ]);

  const contextValue = React.useMemo(
    () => ({
      postUploadTask,
      setPostUploadTask,
      progress,
      onPressPost,
      status,
      currentFile
    }),
    [
      postUploadTask,
      setPostUploadTask,
      progress,
      onPressPost,
      status,
      currentFile
    ]
  );

  return (
    <MediaUploadContext.Provider value={contextValue}>
      {children}
    </MediaUploadContext.Provider>
  );
};
