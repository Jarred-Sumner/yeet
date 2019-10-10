/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ListFollowers
// ====================================================

export interface ListFollowers_profile_followers_data {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
}

export interface ListFollowers_profile_followers {
  __typename: "ProfileTypeList";
  hasMore: boolean;
  limit: number;
  offset: number;
  data: ListFollowers_profile_followers_data[];
}

export interface ListFollowers_profile {
  __typename: "Profile";
  followers: ListFollowers_profile_followers;
}

export interface ListFollowers {
  profile: ListFollowers_profile;
}

export interface ListFollowersVariables {
  profileId: string;
  limit?: number | null;
  offset?: number | null;
}
