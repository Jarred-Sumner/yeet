/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: PostSearchQuery
// ====================================================

export interface PostSearchQuery_searchPosts_data_profile {
  __typename: "Profile";
  id: string;
  username: string;
}

export interface PostSearchQuery_searchPosts_data_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  duration: number;
  previewUrl: string;
}

export interface PostSearchQuery_searchPosts_data {
  __typename: "Post";
  id: string;
  profile: PostSearchQuery_searchPosts_data_profile;
  media: PostSearchQuery_searchPosts_data_media;
}

export interface PostSearchQuery_searchPosts {
  __typename: "PostTypeList";
  id: string;
  hasMore: boolean;
  limit: number;
  offset: number;
  data: PostSearchQuery_searchPosts_data[];
}

export interface PostSearchQuery {
  searchPosts: PostSearchQuery_searchPosts;
}

export interface PostSearchQueryVariables {
  offset?: number | null;
  limit?: number | null;
  query?: string | null;
  latest?: boolean | null;
}
