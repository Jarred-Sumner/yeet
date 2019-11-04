/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: PostFragment
// ====================================================

export interface PostFragment_likes {
  __typename: "LikeList";
  id: string;
  profileIDs: string[];
}

export interface PostFragment_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface PostFragment_media {
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

export interface PostFragment_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface PostFragment_colors {
  __typename: "ColorGroup";
  background: string | null;
  primary: string | null;
  detail: string | null;
  secondary: string | null;
}

export interface PostFragment {
  __typename: "Post";
  id: string;
  likesCount: number;
  format: string;
  likes: PostFragment_likes;
  blocks: JSON;
  nodes: JSON;
  bounds: PostFragment_bounds;
  media: PostFragment_media;
  profile: PostFragment_profile;
  colors: PostFragment_colors;
  autoplaySeconds: number;
  attachments: JSON;
}
