/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: createCommentMutation
// ====================================================

export interface createCommentMutation_createComment_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  duration: number;
  pixelRatio: number | null;
  highQualityUrl: string;
  mediumQualityUrl: string;
  lowQualityUrl: string;
  coverUrl: string;
  url: string;
}

export interface createCommentMutation_createComment_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface createCommentMutation_createComment {
  __typename: "Comment";
  id: string;
  media: createCommentMutation_createComment_media | null;
  profile: createCommentMutation_createComment_profile;
  textColor: string;
  backgroundColor: string;
  body: string | null;
  x: number;
  y: number;
  timeOffset: number;
  autoplaySeconds: number;
}

export interface createCommentMutation {
  createComment: createCommentMutation_createComment | null;
}

export interface createCommentMutationVariables {
  mediaId?: string | null;
  body?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  x: number;
  y: number;
  postId: string;
  autoplaySeconds: number;
  timeOffset: number;
}
