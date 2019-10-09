/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: PostListItemFragment
// ====================================================

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
  media: PostListItemFragment_media;
}
