/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ViewThreads
// ====================================================

export interface ViewThreads_postThreads_firstPost_likes {
  __typename: "LikeList";
  id: string;
  profileIDs: string[];
}

export interface ViewThreads_postThreads_firstPost_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface ViewThreads_postThreads_firstPost_media {
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
  url: string;
}

export interface ViewThreads_postThreads_firstPost_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface ViewThreads_postThreads_firstPost_colors {
  __typename: "ColorGroup";
  background: string | null;
  primary: string | null;
  detail: string | null;
  secondary: string | null;
}

export interface ViewThreads_postThreads_firstPost {
  __typename: "Post";
  id: string;
  likesCount: number;
  format: string;
  likes: ViewThreads_postThreads_firstPost_likes;
  blocks: JSON;
  nodes: JSON;
  bounds: ViewThreads_postThreads_firstPost_bounds;
  media: ViewThreads_postThreads_firstPost_media;
  profile: ViewThreads_postThreads_firstPost_profile;
  colors: ViewThreads_postThreads_firstPost_colors;
  autoplaySeconds: number;
  attachments: JSON;
}

export interface ViewThreads_postThreads {
  __typename: "PostThread";
  id: string;
  postsCount: number;
  firstPost: ViewThreads_postThreads_firstPost;
}

export interface ViewThreads {
  postThreads: ViewThreads_postThreads[];
}

export interface ViewThreadsVariables {
  after?: string | null;
  limit?: number | null;
}
