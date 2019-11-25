/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { RectangleInputObject, ColorsInputObject } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreatePost
// ====================================================

export interface CreatePost_createPost_likes {
  __typename: "LikeList";
  id: string;
  profileIDs: string[];
}

export interface CreatePost_createPost_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface CreatePost_createPost_media {
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

export interface CreatePost_createPost_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface CreatePost_createPost_colors {
  __typename: "ColorGroup";
  background: string | null;
  primary: string | null;
  detail: string | null;
  secondary: string | null;
}

export interface CreatePost_createPost {
  __typename: "Post";
  id: string;
  likesCount: number;
  format: string;
  commentsCount: number;
  createdAt: DateTime;
  threadId: string;
  likes: CreatePost_createPost_likes;
  blocks: JSON;
  nodes: JSON;
  bounds: CreatePost_createPost_bounds;
  media: CreatePost_createPost_media;
  profile: CreatePost_createPost_profile;
  colors: CreatePost_createPost_colors;
  autoplaySeconds: number;
  attachments: JSON;
}

export interface CreatePost {
  createPost: CreatePost_createPost | null;
}

export interface CreatePostVariables {
  mediaId: string;
  blocks?: JSON | null;
  nodes?: JSON | null;
  format: string;
  bounds: RectangleInputObject;
  autoplaySeconds?: number | null;
  colors: ColorsInputObject;
  threadId: string;
}
