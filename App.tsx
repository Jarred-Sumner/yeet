/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import * as Sentry from "@sentry/react-native";
import React from "react";
import { ApolloProvider } from "react-apollo";
import { Platform, StatusBar, StyleSheet, View } from "react-native";
import OneSignal from "react-native-onesignal";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getInset } from "react-native-safe-area-view";
import { enableScreens } from "react-native-screens";
import SplashScreen from "react-native-splash-screen";
import { NavigationState } from "react-navigation";
import { ONESIGNAL_APP_ID } from "./config";
import { Routes } from "./Routes";
import { trackScreenTransition } from "./src/components/Analytics";
import { ClipboardProvider } from "./src/components/Clipboard/ClipboardContext";
import { MaterialThemeProvider } from "./src/components/MaterialThemeProvider";
import { ModalContextProvider } from "./src/components/ModalContext";
import { Toast } from "./src/components/Toast";
import { UserContextProvider } from "./src/components/UserContext";
import APOLLO_CLIENT from "./src/lib/graphql";
import { ImagePickerProvider } from "./src/lib/ImagePickerContext";
import { MediaUploadProvider } from "./src/lib/MediaUploadTask";
import NavigationService from "./src/lib/NavigationService";
import { isWaitlisted } from "./src/lib/Settings";
import { RecentlyUsedContent } from "./src/lib/db/models/RecentlyUsedContent";

Sentry.init({
  dsn: "https://bb66d2e2c6e448108a088854b419e539@sentry.io/1816224",
  environment: process.env.NODE_ENV
});

const styles = StyleSheet.create({
  wrap: { flex: 1, width: "100%", height: "100%" }
});

function getActiveRouteName(navigationState: NavigationState): string | null {
  if (!navigationState) {
    return null;
  }
  const route = navigationState.routes[navigationState.index];
  // dive into nested navigators
  if (route.routes) {
    return getActiveRouteName(route);
  }
  return route.routeName;
}

const APP_PREFIX = "yeet://";

type State = {
  ready: Boolean;
};

export class App extends React.Component {
  settingsWatcher: number;
  constructor(props) {
    super(props);

    OneSignal.init(ONESIGNAL_APP_ID, { kOSSettingsKeyAutoPrompt: false });

    OneSignal.addEventListener("received", this.onReceived);
    OneSignal.addEventListener("opened", this.onOpened);
    OneSignal.addEventListener("ids", this.onIds);

    this.state = {
      waitlisted: Platform.select({ ios: isWaitlisted(), android: null }),
      ready: Platform.select({
        ios: true,
        android: false
      }),
      client: APOLLO_CLIENT
    };
  }

  get initialRouteName() {
    if (this.state.waitlisted) {
      return "Waitlist";
    } else {
      return "Root";
    }
  }

  handleChangeWaitlistStatus = () => {};

  handleNavigationStateChange = (
    prevState: NavigationState,
    currentState: NavigationState,
    action
  ) => {
    const currentRouteName = getActiveRouteName(currentState);
    const previousRouteName = getActiveRouteName(prevState);

    if (previousRouteName !== currentRouteName) {
      trackScreenTransition(
        previousRouteName,
        currentRouteName,
        currentState.params
      );
    }
  };

  _hasMountedApp = false;
  componentDidMount() {
    this._hasMountedApp = true;
    window.requestIdleCallback(RecentlyUsedContent.getRealm);

    if (this.state.ready) {
      global.YeetJSI.hideSplashScreen();
    } else {
      isWaitlisted().then(waitlisted =>
        this.setState({ ready: true, waitlisted })
      );
    }

    Sentry.addBreadcrumb({
      category: "lifecycle",
      message: "App booted",
      level: Sentry.Severity.Info
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.ready !== prevState.ready && this.state.ready) {
      global.YeetJSI.hideSplashScreen();
    }
  }

  onReceived(notification) {
    console.log("Notification received: ", notification);
  }

  onOpened(openResult) {
    const { isAppInFocus = false } = openResult?.notification ?? {};
    const { additionalData: data = {} } =
      openResult?.notification?.payload ?? {};

    console.log("Message: ", openResult.notification.payload.body);
    console.log("Data: ", openResult.notification.payload.additionalData);
    console.log("isActive: ", openResult.notification.isAppInFocus);
    console.log("openResult: ", openResult);
  }

  onIds(device) {
    console.log("Device info: ", device);
  }

  componentWillUnmount() {
    this._hasMountedApp = false;
    OneSignal.removeEventListener("received", this.onReceived);
    OneSignal.removeEventListener("opened", this.onOpened);
    OneSignal.removeEventListener("ids", this.onIds);
  }

  setNavRef = navigatorRef => {
    NavigationService.setTopLevelNavigator(navigatorRef);
  };

  initialSafeAreaInsets = {
    top: getInset("top"),
    bottom: getInset("bottom"),
    left: getInset("left"),
    right: getInset("right")
  };

  render() {
    if (!this.state.ready) {
      return null;
    }

    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <SafeAreaProvider initialSafeAreaInsets={this.initialSafeAreaInsets}>
          <MaterialThemeProvider>
            <ApolloProvider client={this.state.client}>
              <UserContextProvider>
                <MediaUploadProvider>
                  <ImagePickerProvider>
                    <ActionSheetProvider>
                      <ClipboardProvider>
                        <ModalContextProvider>
                          <>
                            <Toast />

                            <Routes
                              initialRouteName={this.initialRouteName}
                              ref={this.setNavRef}
                              uriPrefix={APP_PREFIX}
                            />
                          </>
                        </ModalContextProvider>
                      </ClipboardProvider>
                    </ActionSheetProvider>
                  </ImagePickerProvider>
                </MediaUploadProvider>
              </UserContextProvider>
            </ApolloProvider>
          </MaterialThemeProvider>
        </SafeAreaProvider>
      </>
    );
  }
}

export default App;
