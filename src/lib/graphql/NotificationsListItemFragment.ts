/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: NotificationsListItemFragment
// ====================================================

export interface NotificationsListItemFragment_participant {
  __typename: "Profile";
  id: string;
  photoURL: string | null;
  username: string;
}

export interface NotificationsListItemFragment {
  __typename: "Notification";
  id: string;
  notifiableId: string | null;
  notifiableType: string | null;
  status: string;
  kind: string;
  occurredAt: DateTime;
  label: string | null;
  path: string | null;
  participant: NotificationsListItemFragment_participant | null;
}
