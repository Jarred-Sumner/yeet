import { PostFragment } from "../../graphql/PostFragment";
import {
  ImageMimeType,
  ImageSourceType,
  YeetImageContainer
} from "../../imageSearch";
import Realm from "realm";

export class RecentlyUsedContent {
  static schema = {
    name: "RecentlyUsedContent",
    primaryKey: "id",
    properties: {
      id: { type: "string" },
      lastUsedAt: { type: "date", indexed: true },
      createdAt: { type: "date", indexed: true },
      username: { type: "string", optional: true },
      contentType: { type: "int", indexed: true, default: 0 },
      profileId: { type: "string", optional: true },
      imageUri: { type: "string", optional: true },
      imageWidth: { type: "int", optional: true },
      imageHeight: { type: "int", optional: true },
      imagePixelRatio: { type: "float", optional: true },
      imageDuration: { type: "float", optional: true },
      imageMimeType: { type: "string", optional: true },
      previewUri: { type: "string", optional: true },
      previewWidth: { type: "int", optional: true },
      previewHeight: { type: "int", optional: true },
      previewPixelRatio: { type: "float", optional: true },
      previewDuration: { type: "float", optional: true },
      previewMimeType: { type: "string", optional: true },
      sourceType: { type: "string", optional: true }
    }
  };

  static schemaVersion = 0;
  static _realm: Realm | null = null;
  static getRealm = async () => {
    if (!RecentlyUsedContent._realm) {
      RecentlyUsedContent._realm = await Realm.open({
        schema: [RecentlyUsedContent],
        schemaVersion: RecentlyUsedContent.schemaVersion
      });
    }

    return RecentlyUsedContent._realm;
  };

  id: string;
  lastUsedAt: Date;
  createdAt: Date;
  contentType: RecentlyUsedContentType;
  username?: string;

  profileId?: string;
  imageUri?: string;
  imageWidth?: number;
  imageHeight?: number;
  imagePixelRatio?: string;
  imageDuration?: number;
  imageMimeType?: ImageMimeType;
  previewUri?: string;
  previewWidth?: number;
  previewHeight?: number;
  previewPixelRatio?: string;
  previewDuration?: number;
  previewMimeType?: ImageMimeType;
  sourceType?: string;

  static fromPost(post: Partial<PostFragment>): RecentlyUsedContent {
    return {
      username: post.profile?.username,
      profileId: post.profile?.id,
      contentType: RecentlyUsedContentType.post,

      previewUri:
        post.media.coverUrl ?? post.media.previewUrl ?? post.media.url,
      previewWidth: post.media.width,
      previewHeight: post.media.height,
      previewDuration: post.media.duration,
      previewMimeType: post.media.mimeType
    };
  }

  static fromYeetImageContainer(
    container: YeetImageContainer
  ): Partial<RecentlyUsedContent> {
    return {
      imageUri: container.image.uri,
      imageWidth: container.image.width,
      imageHeight: container.image.height,
      imageDuration: container.image.duration,
      imageMimeType: container.image.mimeType,
      contentType: RecentlyUsedContentType.image,
      previewUri: container.preview?.uri,
      previewWidth: container.preview?.width,
      previewHeight: container.preview?.height,
      previewDuration: container.preview?.duration,
      previewMimeType: container.preview?.mimeType,
      sourceType: container.sourceType
    };
  }

  get yeetImageContainer(): YeetImageContainer {
    const {
      id,
      imageUri,
      imageWidth,
      imageHeight,
      imageDuration,
      imageMimeType,
      previewUri,
      previewWidth,
      previewHeight,
      previewDuration,
      previewMimeType,
      sourceType = ImageSourceType.yeet
    } = this;

    return {
      id,
      __typename: "YeetImageContainer",
      timestamp: this.lastUsedAt.toString(),
      image: {
        uri: imageUri,
        width: imageWidth,
        height: imageHeight,
        duration: imageDuration,
        mimeType: imageMimeType,
        __typename: "YeetImage",
        transform: []
      },
      preview: {
        uri: previewUri,
        width: previewWidth,
        height: previewHeight,
        duration: previewDuration,
        mimeType: previewMimeType,
        __typename: "YeetImage",
        transform: []
      },
      sourceType
    };
  }

  get asPost(): Partial<PostFragment> {
    const { id, username, profileId } = this;

    return {
      id,
      __typename: "_Post",
      profile: {
        id: profileId,
        username,
        __typename: "_Profile"
      },
      media: this.mediaSource
    };
  }

  get mediaSource() {
    return {
      id: `${this.id}/media`,
      previewUrl: this.previewUri,
      width: this.previewWidth,
      height: this.previewHeight,
      duration: this.previewDuration,
      mimeType: this.previewMimeType
    };
  }

  get isPost() {
    return this.contentType === RecentlyUsedContentType.post;
  }

  get graphql() {
    if (this.isPost) {
      return {
        id: this.id,
        post: this.asPost,
        mediaSource: this.mediaSource,
        image: null,
        __typename: "RecentlyUsedContent"
      };
    } else {
      return {
        id: this.id,
        post: null,
        mediaSource: null,
        image: this.yeetImageContainer,
        __typename: "RecentlyUsedContent"
      };
    }
  }
}

export enum RecentlyUsedContentType {
  post = 1,
  image = 0
}
