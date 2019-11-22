import { CreatePostThreadVariables } from "./graphql/CreatePostThread";
import { CreatePostVariables } from "./graphql/CreatePost";
import { UpdateAvatarVariables } from "./graphql/UpdateAvatar";
import { YeetImage, extensionByMimeType } from "./imageSearch";
import { ExportableYeetImage, ContentExport, ExportData } from "./Exporter";
import { uploadFile } from "./FileUploader";
import { BASE_HOSTNAME } from "../../config";
import qs from "qs";
import { basename } from "path";
import { getRequestHeaders } from "./graphql";

type PresignResponse = {
  signedUrl: string;
  mediaId: string;
  filename: string;
  originalFilename: string;
  headers: Object;
  fields: Object;
};

enum MediaUploadStatus {
  waiting = "waiting",
  cancelled = "cancelled",
  completed = "completed",
  progressing = "progressing",
  error = "error"
}

type MediaUploadChange = (mediaUpload: MediaUpload | null) => void;
type MediaUploadProgress = (progress: number) => void;
type MediaTaskProgress = (progress: number, mediaUpload: MediaUpload) => void;

class MediaUpload {
  media: ExportableYeetImage;
  taskId: string | null = null;
  presignResponse: PresignResponse | null = null;
  presignStatus: MediaUploadStatus = MediaUploadStatus.waiting;
  uploadProgress: number = 0.0;
  uploadError: Error | null = null;
  presignError: Error | null = null;

  _onChange: MediaUploadChange | null = null;
  _onProgress: MediaUploadProgress | null = null;

  status: MediaUploadStatus;

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

    this.presignStatus = MediaUploadStatus.progressing;

    const fetcher = window.fetch(`${BASE_HOSTNAME}/api/sign-s3?${params}`, {
      headers: {
        ...(await getRequestHeaders()),
        "content-type": "application/json"
      }
    });

    return fetcher
      .then(resp => resp.json())
      .then(json => {
        this.presignStatus = MediaUploadStatus.completed;
        this.presignResponse = json;

        this.onChange();

        return json;
      })
      .catch(err => {
        this.presignStatus = MediaUploadStatus.error;
        this.presignError = err;

        this.onChange();

        return Promise.reject(err);
      });
  };

  handleError = ({ error }) => {
    this.status = MediaUploadStatus.error;
    this.uploadError = error;

    this.onChange();
  };
  handleCompleted = () => {
    this.status = MediaUploadStatus.completed;

    this.onChange();
  };
  handleProgress = ({ progress }: { progress: number }) => {
    this.uploadProgress = progress;

    this.onProgress();
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
    uploadFile({
      file: this.media.uri.replace("file://", ""),
      url: this.presignResponse.signedUrl,
      headers: {
        ...this.presignResponse.headers
      },
      onError: this.handleError,
      onCompleted: this.handleCompleted,
      onProgress: this.handleProgress,
      onCancel: this.handleCancel
    }).then(taskId => {
      this.taskId = taskId;
    });
  };

  start = () => {
    if (this.presignStatus === MediaUploadStatus.waiting) {
      this.startPresign();
    } else if (
      this.status === MediaUploadStatus.waiting &&
      this.presignStatus === MediaUploadStatus.completed
    ) {
      this.startUpload();
    }
  };

  get isWaiting() {
    return (
      this.presignStatus === MediaUploadStatus.waiting ||
      (this.presignStatus === MediaUploadStatus.completed &&
        this.status === MediaUploadStatus.waiting)
    );
  }

  get isCompleted() {
    return (
      this.presignStatus === MediaUploadStatus.completed &&
      this.status === MediaUploadStatus.completed
    );
  }

  get isProgressing() {
    return (
      this.presignStatus === MediaUploadStatus.progressing ||
      (this.presignStatus === MediaUploadStatus.completed &&
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

  constructor(
    media: ExportableYeetImage,
    onChange: MediaUploadChange | null = null,
    onProgress: MediaUploadProgress | null = null,
    taskId: string | null = null,
    presignResponse: PresignResponse | null = null,
    presignStatus: MediaUploadStatus = MediaUploadStatus.waiting,
    status: MediaUploadStatus = MediaUploadStatus.waiting
  ) {
    this._onChange = onChange;
    this._onProgress = onProgress;
    this.media = media;
    this.taskId = taskId;
    this.presignResponse = presignResponse;
    this.presignStatus = presignStatus;
    this.status = status;
  }

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
  failed = "failed",
  progressing = "progressing",
  complete = "complete"
}

export class MediaUploadTask {
  optionalFiles: Array<MediaUpload> = [];
  requiredFile: MediaUpload;
  status = MediaUploadTaskStatus.waiting;
  onChangeFile: MediaUploadChange | null = null;
  onProgress: MediaTaskProgress | null = null;

  constructor({
    requiredFile,
    optionalFiles,
    status = MediaUploadTaskStatus.waiting
  }) {
    this.requiredFile = requiredFile;
    this.optionalFiles = optionalFiles;
    this.status = status;

    this.files.forEach(file => {
      file.onChange = this.handleChange;
      file.onProgress = this.handleProgress(file);
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

  handleChange: MediaUploadChange = mediaUpload => {
    let file = this.currentFile;

    if (
      mediaUpload.status === MediaUploadStatus.completed &&
      file &&
      file.isWaiting
    ) {
      file.start();
    } else if (mediaUpload.isProgressing) {
      this.status = MediaUploadTaskStatus.progressing;
    } else if (mediaUpload.status === MediaUploadStatus.completed && !file) {
      this.status = MediaUploadTaskStatus.complete;
    } else if (mediaUpload.isFailed && this.requiredFile.isCompleted) {
      this.status = MediaUploadTaskStatus.complete;
    } else if (mediaUpload.isFailed && !this.requiredFile.isCompleted) {
      this.status = MediaUploadTaskStatus.failed;
    }

    typeof this.onChangeFile === "function" && this.onChangeFile(file);
  };

  handleProgress = (mediaUpload: MediaUpload) => (progress: number) => {
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
        uri: contentExport.uri,
        width: contentExport.width,
        height: contentExport.height,
        mimeType: contentExport.type,
        duration: contentExport.duration
      }),
      optionalFiles: [
        ...exportData.nodes.map(node => node.block),
        ...exportData.blocks
      ]
        .filter(block => typeof block.value === "object")
        .map(block => new MediaUpload(block.value as ExportableYeetImage))
    });

    task.onChangeFile = onChangeFile;
    task.onProgress = onProgress;

    return task;
  }

  get files(): Array<MediaUpload> {
    return [this.requiredFile, ...this.optionalFiles];
  }

  resume = () => {};
  start = () => {
    if (this.currentFile) {
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

export const MediaUploadContext = React.createContext({
  mediaUploadTask: null,
  setMediaUploadTask
});
