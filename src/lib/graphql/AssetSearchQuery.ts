/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AssetSearchQuery
// ====================================================

export interface AssetSearchQuery_searchAssets_data {
  __typename: "Media";
  id: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  duration: number;
  coverUrl: string;
  url: string;
}

export interface AssetSearchQuery_searchAssets {
  __typename: "MediaTypeList";
  id: string;
  hasMore: boolean;
  limit: number;
  offset: number;
  data: AssetSearchQuery_searchAssets_data[];
}

export interface AssetSearchQuery {
  searchAssets: AssetSearchQuery_searchAssets;
}

export interface AssetSearchQueryVariables {
  offset?: number | null;
  limit?: number | null;
  query?: string | null;
  latest?: boolean | null;
}
