/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ListRemixesQuery
// ====================================================

export interface ListRemixesQuery_profile_posts_data_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface ListRemixesQuery_profile_posts_data_profile {
  __typename: "Profile";
  id: string;
  photoURL: string | null;
  username: string;
}

export interface ListRemixesQuery_profile_posts_data_media {
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

export interface ListRemixesQuery_profile_posts_data {
  __typename: "Post";
  id: string;
  likesCount: number;
  threadId: string;
  bounds: ListRemixesQuery_profile_posts_data_bounds;
  profile: ListRemixesQuery_profile_posts_data_profile;
  media: ListRemixesQuery_profile_posts_data_media;
}

export interface ListRemixesQuery_profile_posts {
  __typename: "PostTypeList";
  offset: number;
  limit: number;
  hasMore: boolean;
  id: string;
  data: ListRemixesQuery_profile_posts_data[];
}

export interface ListRemixesQuery_profile {
  __typename: "Profile";
  id: string;
  posts: ListRemixesQuery_profile_posts;
}

export interface ListRemixesQuery {
  profile: ListRemixesQuery_profile;
}

export interface ListRemixesQueryVariables {
  profileId: string;
  limit?: number | null;
  offset?: number | null;
}
