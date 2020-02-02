/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: LoadEditorPostQuery
// ====================================================

export interface LoadEditorPostQuery_post_colors {
  __typename: "ColorGroup";
  background: string | null;
  primary: string | null;
}

export interface LoadEditorPostQuery_post_bounds {
  __typename: "Rectangle";
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface LoadEditorPostQuery_post_profile {
  __typename: "Profile";
  id: string;
  photoURL: string | null;
  username: string;
}

export interface LoadEditorPostQuery_post_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  pixelRatio: number | null;
  mimeType: string | null;
  duration: number;
  coverUrl: string;
  previewUrl: string;
  url: string;
}

export interface LoadEditorPostQuery_post {
  __typename: "Post";
  id: string;
  blocks: JSON;
  format: string;
  examples: JSON;
  layout: string | null;
  colors: LoadEditorPostQuery_post_colors;
  nodes: JSON;
  bounds: LoadEditorPostQuery_post_bounds;
  profile: LoadEditorPostQuery_post_profile;
  media: LoadEditorPostQuery_post_media;
}

export interface LoadEditorPostQuery {
  post: LoadEditorPostQuery_post;
}

export interface LoadEditorPostQueryVariables {
  id: string;
}
