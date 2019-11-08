/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ListProfilePosts
// ====================================================

export interface ListProfilePosts_profile_posts_data_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface ListProfilePosts_profile_posts_data_profile {
  __typename: "Profile";
  id: string;
  photoURL: string | null;
  username: string;
}

export interface ListProfilePosts_profile_posts_data_media {
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

export interface ListProfilePosts_profile_posts_data {
  __typename: "Post";
  id: string;
  likesCount: number;
  threadId: string;
  createdAt: DateTime;
  autoplaySeconds: number;
  bounds: ListProfilePosts_profile_posts_data_bounds;
  profile: ListProfilePosts_profile_posts_data_profile;
  media: ListProfilePosts_profile_posts_data_media;
}

export interface ListProfilePosts_profile_posts {
  __typename: "PostTypeList";
  offset: number;
  limit: number;
  hasMore: boolean;
  id: string;
  data: ListProfilePosts_profile_posts_data[];
}

export interface ListProfilePosts_profile {
  __typename: "Profile";
  id: string;
  posts: ListProfilePosts_profile_posts;
}

export interface ListProfilePosts {
  profile: ListProfilePosts_profile;
}

export interface ListProfilePostsVariables {
  profileId: string;
  limit?: number | null;
  offset?: number | null;
}
