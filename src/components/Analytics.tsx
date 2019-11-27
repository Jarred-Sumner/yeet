import { CurrentUserQuery_currentUser } from "../lib/graphql/CurrentUserQuery";
import OneSignal from "react-native-onesignal";
import * as Sentry from "@sentry/react-native";
import { InteractionManager } from "react-native";
import analytics from "@react-native-firebase/analytics";

export const handleSignIn = (user: CurrentUserQuery_currentUser) => {
  const _id = __DEV__ ? `${user.id}__dev` : user.id;

  OneSignal.setExternalUserId(_id);
  Sentry.setUser({
    id: _id,
    email: user.email
  });

  Sentry.addBreadcrumb({
    category: "auth",
    message: "Authenticated user " + _id,
    level: Sentry.Severity.Info
  });

  analytics().setUserId(_id);
};

export const trackScreenTransition = (
  from: string,
  to: string,
  params: any
) => {
  const timestamp = new Date().getTime();

  InteractionManager.runAfterInteractions(() => {
    Sentry.addBreadcrumb({
      category: "route",
      message: `Route change ${from} -> ${to}`,
      data: params,
      timestamp,
      level: Sentry.Severity.Info
    });

    return analytics().setCurrentScreen(to);
  });
};
