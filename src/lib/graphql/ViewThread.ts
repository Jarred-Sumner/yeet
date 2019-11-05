/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ViewThread
// ====================================================

export interface ViewThread_postThread_posts_data_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface ViewThread_postThread_posts_data_profile {
  __typename: "Profile";
  id: string;
  photoURL: string | null;
  username: string;
}

export interface ViewThread_postThread_posts_data_media {
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

export interface ViewThread_postThread_posts_data {
  __typename: "Post";
  id: string;
  likesCount: number;
  threadId: string;
  createdAt: DateTime;
  bounds: ViewThread_postThread_posts_data_bounds;
  profile: ViewThread_postThread_posts_data_profile;
  media: ViewThread_postThread_posts_data_media;
}

export interface ViewThread_postThread_posts {
  __typename: "PostTypeList";
  offset: number;
  limit: number;
  hasMore: boolean;
  id: string;
  data: ViewThread_postThread_posts_data[];
}

export interface ViewThread_postThread {
  __typename: "PostThread";
  id: string;
  postsCount: number;
  body: string | null;
  posts: ViewThread_postThread_posts;
}

export interface ViewThread {
  postThread: ViewThread_postThread;
}

export interface ViewThreadVariables {
  threadId: string;
  postOffset: number;
  postsCount: number;
}
