/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ViewPost
// ====================================================

export interface ViewPost_post_likes {
  __typename: "LikeList";
  id: string;
  profileIDs: string[];
}

export interface ViewPost_post_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface ViewPost_post_media {
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

export interface ViewPost_post_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface ViewPost_post_colors {
  __typename: "ColorGroup";
  background: string | null;
  primary: string | null;
  detail: string | null;
  secondary: string | null;
}

export interface ViewPost_post {
  __typename: "Post";
  id: string;
  likesCount: number;
  format: string;
  commentsCount: number;
  likes: ViewPost_post_likes;
  blocks: JSON;
  nodes: JSON;
  bounds: ViewPost_post_bounds;
  media: ViewPost_post_media;
  profile: ViewPost_post_profile;
  colors: ViewPost_post_colors;
  autoplaySeconds: number;
  attachments: JSON;
}

export interface ViewPost {
  post: ViewPost_post;
}

export interface ViewPostVariables {
  id: string;
}
