/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreatePost
// ====================================================

export interface CreatePost_createPost_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  duration: number;
  url: string;
}

export interface CreatePost_createPost_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface CreatePost_createPost {
  __typename: "Post";
  id: string;
  likesCount: number;
  blocks: JSON;
  nodes: JSON;
  media: CreatePost_createPost_media;
  profile: CreatePost_createPost_profile;
}

export interface CreatePost {
  createPost: CreatePost_createPost | null;
}

export interface CreatePostVariables {
  mediaId: string;
  blocks?: JSON | null;
  nodes?: JSON | null;
  format: string;
  bounds: Rectangle;
}
