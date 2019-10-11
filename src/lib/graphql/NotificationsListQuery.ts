/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: NotificationsListQuery
// ====================================================

export interface NotificationsListQuery_notifications_data_participant {
  __typename: "Profile";
  id: string;
  photoURL: string | null;
  username: string;
}

export interface NotificationsListQuery_notifications_data {
  __typename: "Notification";
  id: string;
  notifiableId: string | null;
  notifiableType: string | null;
  status: string;
  kind: string;
  occurredAt: DateTime;
  label: string | null;
  path: string | null;
  participant: NotificationsListQuery_notifications_data_participant | null;
}

export interface NotificationsListQuery_notifications {
  __typename: "NotificationTypeList";
  offset: number;
  limit: number;
  hasMore: boolean;
  id: string;
  data: NotificationsListQuery_notifications_data[];
}

export interface NotificationsListQuery {
  notifications: NotificationsListQuery_notifications;
}

export interface NotificationsListQueryVariables {
  limit?: number | null;
  offset?: number | null;
}
