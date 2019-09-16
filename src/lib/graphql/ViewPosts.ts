/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ViewPosts
// ====================================================

export interface ViewPosts_posts_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  duration: number;
  url: string;
}

export interface ViewPosts_posts_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface ViewPosts_posts {
  __typename: "Post";
  id: string;
  likesCount: number;
  blocks: JSON;
  nodes: JSON;
  media: ViewPosts_posts_media;
  profile: ViewPosts_posts_profile;
}

export interface ViewPosts {
  posts: ViewPosts_posts[];
}

export interface ViewPostsVariables {
  threadId: string;
  limit?: number | null;
  offset?: number | null;
}
