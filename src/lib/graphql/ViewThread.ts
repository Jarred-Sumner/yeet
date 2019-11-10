/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ViewThread
// ====================================================

export interface ViewThread_postThread_profile {
  __typename: "Profile";
  username: string;
  id: string;
  photoURL: string | null;
}

export interface ViewThread_postThread_posts_data_likes {
  __typename: "LikeList";
  id: string;
  profileIDs: string[];
}

export interface ViewThread_postThread_posts_data_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface ViewThread_postThread_posts_data_media {
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

export interface ViewThread_postThread_posts_data_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface ViewThread_postThread_posts_data_colors {
  __typename: "ColorGroup";
  background: string | null;
  primary: string | null;
  detail: string | null;
  secondary: string | null;
}

export interface ViewThread_postThread_posts_data {
  __typename: "Post";
  id: string;
  likesCount: number;
  format: string;
  commentsCount: number;
  likes: ViewThread_postThread_posts_data_likes;
  blocks: JSON;
  nodes: JSON;
  bounds: ViewThread_postThread_posts_data_bounds;
  media: ViewThread_postThread_posts_data_media;
  profile: ViewThread_postThread_posts_data_profile;
  colors: ViewThread_postThread_posts_data_colors;
  autoplaySeconds: number;
  attachments: JSON;
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
  profile: ViewThread_postThread_profile;
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
