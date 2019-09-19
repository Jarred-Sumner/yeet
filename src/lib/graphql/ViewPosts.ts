/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ViewPosts
// ====================================================

export interface ViewPosts_posts_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface ViewPosts_posts_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  duration: number;
  pixelRatio: number | null;
  url: string;
}

export interface ViewPosts_posts_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface ViewPosts_posts_colors {
  __typename: "ColorGroup";
  background: string | null;
  primary: string | null;
  detail: string | null;
  secondary: string | null;
}

export interface ViewPosts_posts {
  __typename: "Post";
  id: string;
  likesCount: number;
  format: string;
  blocks: JSON;
  nodes: JSON;
  bounds: ViewPosts_posts_bounds;
  media: ViewPosts_posts_media;
  profile: ViewPosts_posts_profile;
  colors: ViewPosts_posts_colors;
  autoplaySeconds: number;
  attachments: JSON;
}

export interface ViewPosts {
  posts: ViewPosts_posts[];
}

export interface ViewPostsVariables {
  threadId: string;
  limit?: number | null;
  offset?: number | null;
}
