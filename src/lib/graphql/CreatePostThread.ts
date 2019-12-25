/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { RectangleInputObject, ColorsInputObject } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreatePostThread
// ====================================================

export interface CreatePostThread_createPostThread_profile {
  __typename: "Profile";
  username: string;
  id: string;
  photoURL: string | null;
}

export interface CreatePostThread_createPostThread_posts_data_likes {
  __typename: "LikeList";
  id: string;
  profileIDs: string[];
}

export interface CreatePostThread_createPostThread_posts_data_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface CreatePostThread_createPostThread_posts_data_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  duration: number;
  pixelRatio: number | null;
  highQualityUrl: string;
  mediumQualityUrl: string;
  lowQualityUrl: string;
  coverUrl: string;
  previewUrl: string;
  url: string;
}

export interface CreatePostThread_createPostThread_posts_data_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface CreatePostThread_createPostThread_posts_data_colors {
  __typename: "ColorGroup";
  background: string | null;
  primary: string | null;
  detail: string | null;
  secondary: string | null;
}

export interface CreatePostThread_createPostThread_posts_data {
  __typename: "Post";
  id: string;
  likesCount: number;
  format: string;
  commentsCount: number;
  createdAt: DateTime;
  threadId: string;
  likes: CreatePostThread_createPostThread_posts_data_likes;
  blocks: JSON;
  nodes: JSON;
  bounds: CreatePostThread_createPostThread_posts_data_bounds;
  media: CreatePostThread_createPostThread_posts_data_media;
  profile: CreatePostThread_createPostThread_posts_data_profile;
  colors: CreatePostThread_createPostThread_posts_data_colors;
  autoplaySeconds: number;
  attachments: JSON;
}

export interface CreatePostThread_createPostThread_posts {
  __typename: "PostTypeList";
  offset: number;
  limit: number;
  hasMore: boolean;
  id: string;
  data: CreatePostThread_createPostThread_posts_data[];
}

export interface CreatePostThread_createPostThread {
  __typename: "PostThread";
  createdAt: DateTime;
  id: string;
  postsCount: number;
  body: string | null;
  profile: CreatePostThread_createPostThread_profile;
  posts: CreatePostThread_createPostThread_posts;
}

export interface CreatePostThread {
  createPostThread: CreatePostThread_createPostThread | null;
}

export interface CreatePostThreadVariables {
  mediaId: string;
  blocks?: JSON | null;
  body?: string | null;
  nodes?: JSON | null;
  format: string;
  strings?: string[] | null;
  autoplaySeconds?: number | null;
  bounds: RectangleInputObject;
  colors: ColorsInputObject;
  postOffset?: number | null;
  postsCount?: number | null;
  editToken?: string | null;
  layout?: string | null;
}
