/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: LikePost
// ====================================================

export interface LikePost_likePost_likes {
  __typename: "LikeList";
  id: string;
  profileIDs: string[];
}

export interface LikePost_likePost_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface LikePost_likePost_media {
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
  url: string;
}

export interface LikePost_likePost_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface LikePost_likePost_colors {
  __typename: "ColorGroup";
  background: string | null;
  primary: string | null;
  detail: string | null;
  secondary: string | null;
}

export interface LikePost_likePost {
  __typename: "Post";
  id: string;
  likesCount: number;
  format: string;
  likes: LikePost_likePost_likes;
  blocks: JSON;
  nodes: JSON;
  bounds: LikePost_likePost_bounds;
  media: LikePost_likePost_media;
  profile: LikePost_likePost_profile;
  colors: LikePost_likePost_colors;
  autoplaySeconds: number;
  attachments: JSON;
}

export interface LikePost {
  likePost: LikePost_likePost | null;
}

export interface LikePostVariables {
  postId: string;
}
