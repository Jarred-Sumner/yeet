/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SignUpMutation
// ====================================================

export interface SignUpMutation_signUp {
  __typename: "User";
  id: string;
  photoURL: string | null;
  username: string;
  email: string;
  badgeCount: number;
  jwt: string | null;
}

export interface SignUpMutation {
  signUp: SignUpMutation_signUp | null;
}

export interface SignUpMutationVariables {
  email: string;
  mediaId?: string | null;
  username: string;
  password: string;
}
