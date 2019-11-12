import { CurrentUserQuery_currentUser } from "../lib/graphql/CurrentUserQuery";
import OneSignal from "react-native-onesignal";
import * as Sentry from "@sentry/react-native";
import { InteractionManager } from "react-native";
import analytics from "@react-native-firebase/analytics";

export const handleSignIn = (user: CurrentUserQuery_currentUser) => {
  OneSignal.setExternalUserId(user.id);
  Sentry.setUser({
    id: user.id,
    email: user.email
  });

  Sentry.addBreadcrumb({
    category: "auth",
    message: "Authenticated user " + user.id,
    level: Sentry.Severity.Info
  });

  analytics().setUserId(user.id);
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
