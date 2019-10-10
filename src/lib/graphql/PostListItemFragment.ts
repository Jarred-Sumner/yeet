/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: PostListItemFragment
// ====================================================

export interface PostListItemFragment_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface PostListItemFragment_profile {
  __typename: "Profile";
  id: string;
  photoURL: string | null;
  username: string;
}

export interface PostListItemFragment_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  pixelRatio: number | null;
  previewUrl: string;
}

export interface PostListItemFragment {
  __typename: "Post";
  id: string;
  likesCount: number;
  threadId: string;
  bounds: PostListItemFragment_bounds;
  profile: PostListItemFragment_profile;
  media: PostListItemFragment_media;
}
