/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ViewProfile
// ====================================================

export interface ViewProfile_profile {
  __typename: "Profile";
  id: string;
  username: string;
  photoURL: string | null;
  isFollowing: boolean;
  followersCount: number;
  remixesCount: number;
  postsCount: number;
}

export interface ViewProfile {
  profile: ViewProfile_profile;
}

export interface ViewProfileVariables {
  profileId: string;
}
