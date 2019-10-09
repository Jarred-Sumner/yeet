/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ListProfilePosts
// ====================================================

export interface ListProfilePosts_profile_posts_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  pixelRatio: number | null;
  previewUrl: string;
}

export interface ListProfilePosts_profile_posts {
  __typename: "Post";
  id: string;
  likesCount: number;
  threadId: string;
  media: ListProfilePosts_profile_posts_media;
}

export interface ListProfilePosts_profile {
  __typename: "Profile";
  posts: ListProfilePosts_profile_posts[];
}

export interface ListProfilePosts {
  profile: ListProfilePosts_profile;
}

export interface ListProfilePostsVariables {
  profileId: string;
  limit?: number | null;
  offset?: number | null;
}
