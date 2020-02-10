/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SearchHashtag
// ====================================================

export interface SearchHashtag_searchHashtag_data_profile {
  __typename: "Profile";
  id: string;
  username: string;
}

export interface SearchHashtag_searchHashtag_data_media {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  duration: number;
  coverUrl: string;
  url: string;
}

export interface SearchHashtag_searchHashtag_data {
  __typename: "Post";
  id: string;
  profile: SearchHashtag_searchHashtag_data_profile;
  media: SearchHashtag_searchHashtag_data_media;
}

export interface SearchHashtag_searchHashtag {
  __typename: "PostTypeList";
  id: string;
  data: SearchHashtag_searchHashtag_data[];
}

export interface SearchHashtag {
  searchHashtag: SearchHashtag_searchHashtag;
}

export interface SearchHashtagVariables {
  hashtag: string;
  limit?: number | null;
  offset?: number | null;
}
