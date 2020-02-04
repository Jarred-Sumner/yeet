import { Model } from "@nozbe/watermelondb";
import {
  field,
  relation,
  date,
  action,
  json,
  readonly
} from "@nozbe/watermelondb/decorators";
import { identity } from "lodash";
import { YeetImageContainer } from "../../imageSearch";
import { PostFragment } from "../../graphql/PostFragment";
import { ImageContainer } from "./ImageContainer";

export class RecentlyUsedContent extends Model {
  static table = "recently_used_contents";
  @field("uid") uid;
  @date("last_used_at") lastUsedAt;
  @date("created_at") createdAt;
  @date("updated_at") updatedAt;
  @field("username") username;
  @field("contentType") contentType;
  @field("profile_id") profileId;
  @json("blocks", identity) blocks;
  @json("asset", identity) asset;
  @json("nodes", identity) nodes;
  @field("width") width;
  @field("height") height;
  @field("x") x;
  @field("y") y;
  @json("examples", identity) examples;
  @readonly @date("created_at") createdAt;
  @readonly @date("updated_at") updatedAt;
  @field("image_uri") imageUri;
  @field("image_width") imageWidth;
  @field("image_height") imageHeight;
  @field("image_pixel_ratio") imagePixelRatio;
  @field("image_duration") imageDuration;
  @field("image_mime_type") imageMimeType;
  @field("preview_uri") previewUri;
  @field("preview_width") previewWidth;
  @field("preview_height") previewHeight;
  @field("preview_pixel_ratio") previewPixelRatio;
  @field("preview_duration") previewDuration;
  @field("preview_mime_type") previewMimeType;
  @field("source_type") sourceType;

  _imageContainer: ImageContainer;

  static associations = {
    imageContainer: { type: "belongs_to", key: "image_container_id" }
  };

  static fromPost(post: Partial<PostFragment>) {
    return {
      uid: post.id,
      username: post.profile?.username,
      profileId: post.profile?.id,
      blocks: post.blocks,
      asset: post.assets,
      nodes: post.nodes,
      width: post.bounds?.width,
      height: post.bounds?.height,
      x: post.bounds?.x,
      y: post.bounds?.y,
      contentType: RecentlyUsedContentType.post,
      examples: post.examples,

      previewUri: post.media.coverUrl ?? post.media.previewUrl,
      previewWidth: post.media.width,
      previewHeight: post.media.height,
      previewDuration: post.media.duration,
      previewMimeType: post.media.mimeType
    };
  }

  static fromYeetImageContainer(
    container: YeetImageContainer
  ): Partial<ImageContainer> {
    return {
      uid: container.id,
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
      uid,
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
      sourceType
    } = this;

    return {
      id: uid,
      __typename: "YeetImageContainer",
      timestamp: this.createdAt.toString(),
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
    const {
      uid,
      username,
      profileId,
      blocks,
      asset,
      nodes,
      width,
      height,
      x = 0,
      y = 0,
      examples
    } = this;

    return {
      id: uid,
      __typename: "_Post",
      profile: {
        id: profileId,
        username,
        __typename: "_Profile"
      },
      blocks,
      assets: asset,
      nodes,
      bounds: { width, height, x, y, __typename: "Rectangle" },
      examples,
      media: this.mediaSource
    };
  }

  get mediaSource() {
    return {
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
        id: this.uid,
        post: this.asPost,
        mediaSource: this.mediaSource,
        image: null,
        __typename: "RecentlyUsedContent"
      };
    } else {
      return {
        id: this.uid,
        post: null,
        mediaSource: null,
        image: this.yeetImageContainer,
        __typename: "RecentlyUsedContent"
      };
    }
  }
}

export enum RecentlyUsedContentType {
  post = "post",
  image = "image"
}
