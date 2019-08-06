/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Prompts
// ====================================================

export interface Prompts_prompts_profile {
  __typename: "Profile";
  username: string;
  id: string;
  photoURL: string | null;
}

export interface Prompts_prompts_topPosts_profile {
  __typename: "Profile";
  id: string;
  photoURL: string | null;
  username: string;
}

export interface Prompts_prompts_topPosts_media {
  __typename: "Media";
  url: string;
  id: string;
  mimeType: string | null;
  sourceType: string | null;
}

export interface Prompts_prompts_topPosts {
  __typename: "Post";
  id: string;
  likesCount: number;
  profile: Prompts_prompts_topPosts_profile;
  media: Prompts_prompts_topPosts_media;
}

export interface Prompts_prompts {
  __typename: "Prompt";
  id: string;
  body: string;
  profile: Prompts_prompts_profile;
  topPosts: Prompts_prompts_topPosts[];
}

export interface Prompts {
  prompts: Prompts_prompts[];
}

export interface PromptsVariables {
  limit?: number | null;
  offset?: number | null;
}
