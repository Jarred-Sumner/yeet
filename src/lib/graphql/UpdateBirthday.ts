/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateBirthday
// ====================================================

export interface UpdateBirthday_updateUser {
  __typename: "Profile";
  id: string;
}

export interface UpdateBirthday {
  updateUser: UpdateBirthday_updateUser;
}

export interface UpdateBirthdayVariables {
  birthday: DateTime;
}
