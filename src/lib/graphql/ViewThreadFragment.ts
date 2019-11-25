/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: ViewThreadFragment
// ====================================================

export interface ViewThreadFragment_profile {
  __typename: "Profile";
  username: string;
  id: string;
  photoURL: string | null;
}

export interface ViewThreadFragment_posts_data_likes {
  __typename: "LikeList";
  id: string;
  profileIDs: string[];
}

export interface ViewThreadFragment_posts_data_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface ViewThreadFragment_posts_data_media {
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

export interface ViewThreadFragment_posts_data_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface ViewThreadFragment_posts_data_colors {
  __typename: "ColorGroup";
  background: string | null;
  primary: string | null;
  detail: string | null;
  secondary: string | null;
}

export interface ViewThreadFragment_posts_data {
  __typename: "Post";
  id: string;
  likesCount: number;
  format: string;
  commentsCount: number;
  createdAt: DateTime;
  threadId: string;
  likes: ViewThreadFragment_posts_data_likes;
  blocks: JSON;
  nodes: JSON;
  bounds: ViewThreadFragment_posts_data_bounds;
  media: ViewThreadFragment_posts_data_media;
  profile: ViewThreadFragment_posts_data_profile;
  colors: ViewThreadFragment_posts_data_colors;
  autoplaySeconds: number;
  attachments: JSON;
}

export interface ViewThreadFragment_posts {
  __typename: "PostTypeList";
  offset: number;
  limit: number;
  hasMore: boolean;
  id: string;
  data: ViewThreadFragment_posts_data[];
}

export interface ViewThreadFragment {
  __typename: "PostThread";
  id: string;
  postsCount: number;
  body: string | null;
  profile: ViewThreadFragment_profile;
  posts: ViewThreadFragment_posts;
}
