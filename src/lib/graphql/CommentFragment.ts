/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CommentFragment
// ====================================================

export interface CommentFragment_media {
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

export interface CommentFragment_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface CommentFragment {
  __typename: "Comment";
  id: string;
  media: CommentFragment_media | null;
  profile: CommentFragment_profile;
  textColor: string;
  backgroundColor: string;
  body: string | null;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  timeOffset: number;
  autoplaySeconds: number;
}
