/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ViewThreads
// ====================================================

export interface ViewThreads_postThreads_firstPost_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  duration: number;
  url: string;
}

export interface ViewThreads_postThreads_firstPost_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface ViewThreads_postThreads_firstPost {
  __typename: "Post";
  id: string;
  likesCount: number;
  blocks: JSON;
  nodes: JSON;
  media: ViewThreads_postThreads_firstPost_media;
  profile: ViewThreads_postThreads_firstPost_profile;
}

export interface ViewThreads_postThreads {
  __typename: "PostThread";
  id: string;
  firstPost: ViewThreads_postThreads_firstPost;
}

export interface ViewThreads {
  postThreads: ViewThreads_postThreads[];
}

export interface ViewThreadsVariables {
  after?: string | null;
  limit?: number | null;
}
