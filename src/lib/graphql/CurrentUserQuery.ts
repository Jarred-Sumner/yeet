/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CurrentUserQuery
// ====================================================

export interface CurrentUserQuery_currentUser {
  __typename: "User";
  id: string;
  photoURL: string | null;
  username: string;
  email: string;
  badgeCount: number;
}

export interface CurrentUserQuery {
  currentUser: CurrentUserQuery_currentUser | null;
  isWaitlisted: boolean;
}
