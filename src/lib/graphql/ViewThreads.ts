/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ViewThreads
// ====================================================

export interface ViewThreads_postThreads_data_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface ViewThreads_postThreads_data_posts_data_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface ViewThreads_postThreads_data_posts_data_profile {
  __typename: "Profile";
  id: string;
  photoURL: string | null;
  username: string;
}

export interface ViewThreads_postThreads_data_posts_data_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  pixelRatio: number | null;
  mimeType: string | null;
  duration: number;
  coverUrl: string;
  previewUrl: string;
  url: string;
}

export interface ViewThreads_postThreads_data_posts_data {
  __typename: "Post";
  id: string;
  likesCount: number;
  threadId: string;
  createdAt: DateTime;
  commentsCount: number;
  autoplaySeconds: number;
  bounds: ViewThreads_postThreads_data_posts_data_bounds;
  profile: ViewThreads_postThreads_data_posts_data_profile;
  media: ViewThreads_postThreads_data_posts_data_media;
}

export interface ViewThreads_postThreads_data_posts {
  __typename: "PostTypeList";
  offset: number;
  limit: number;
  hasMore: boolean;
  id: string;
  data: ViewThreads_postThreads_data_posts_data[];
}

export interface ViewThreads_postThreads_data {
  __typename: "PostThread";
  id: string;
  postsCount: number;
  body: string | null;
  createdAt: DateTime;
  profile: ViewThreads_postThreads_data_profile;
  posts: ViewThreads_postThreads_data_posts;
}

export interface ViewThreads_postThreads {
  __typename: "PostThreadTypeList";
  offset: number;
  limit: number;
  hasMore: boolean;
  id: string;
  data: ViewThreads_postThreads_data[];
}

export interface ViewThreads {
  postThreads: ViewThreads_postThreads;
}

export interface ViewThreadsVariables {
  after?: string | null;
  limit?: number | null;
  postsCount?: number | null;
  offset?: number | null;
}
