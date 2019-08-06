/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: PostPreviewFragment
// ====================================================

export interface PostPreviewFragment_profile {
  __typename: "Profile";
  id: string;
  photoURL: string | null;
  username: string;
}

export interface PostPreviewFragment_media {
  __typename: "Media";
  url: string;
  id: string;
  mimeType: string | null;
  sourceType: string | null;
}

export interface PostPreviewFragment {
  __typename: "Post";
  id: string;
  likesCount: number;
  profile: PostPreviewFragment_profile;
  media: PostPreviewFragment_media;
}
