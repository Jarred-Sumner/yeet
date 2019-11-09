/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ViewComments
// ====================================================

export interface ViewComments_comments_data_media {
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

export interface ViewComments_comments_data_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface ViewComments_comments_data {
  __typename: "Comment";
  id: string;
  media: ViewComments_comments_data_media | null;
  profile: ViewComments_comments_data_profile;
  textColor: string;
  backgroundColor: string;
  body: string | null;
  x: number;
  y: number;
  timeOffset: number;
  autoplaySeconds: number;
}

export interface ViewComments_comments {
  __typename: "CommentTypeList";
  data: ViewComments_comments_data[];
  hasMore: boolean;
  limit: number;
  offset: number;
  id: string;
}

export interface ViewComments {
  comments: ViewComments_comments;
}

export interface ViewCommentsVariables {
  postId: string;
  offset?: number | null;
  limit?: number | null;
}
