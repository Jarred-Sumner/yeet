/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: PostFragment
// ====================================================

export interface PostFragment_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  duration: number;
  url: string;
}

export interface PostFragment_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface PostFragment {
  __typename: "Post";
  id: string;
  likesCount: number;
  blocks: JSON;
  nodes: JSON;
  media: PostFragment_media;
  profile: PostFragment_profile;
}
