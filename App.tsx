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
import { StatusBar, StyleSheet, View, Settings } from "react-native";
import OneSignal from "react-native-onesignal";
import { enableScreens } from "react-native-screens";
import SplashScreen from "react-native-splash-screen";
import { NavigationState } from "react-navigation";
import { ONESIGNAL_APP_ID } from "./config";
import { creatRouteseApp, Routes } from "./Routes";
import { trackScreenTransition } from "./src/components/Analytics";
import { MaterialThemeProvider } from "./src/components/MaterialThemeProvider";
import { ModalContextProvider } from "./src/components/ModalContext";
import { Toast } from "./src/components/Toast";
import { UserContextProvider } from "./src/components/UserContext";
import APOLLO_CLIENT, { hasLoadedCache, waitForReady } from "./src/lib/graphql";
import { ImagePickerProvider } from "./src/lib/ImagePickerContext";
import NavigationService from "./src/lib/NavigationService";
import { WATCH_KEYS } from "./src/lib/Storage";
import { MediaUploadProvider } from "./src/lib/MediaUploadTask";
import { MediaUploadProgress } from "./src/components/MediaUploadProgress";

Sentry.init({
  dsn: "https://bb66d2e2c6e448108a088854b419e539@sentry.io/1816224",
  environment: process.env.NODE_ENV
});

const styles = StyleSheet.create({
  wrap: { flex: 1 }
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

    enableScreens();

    OneSignal.init(ONESIGNAL_APP_ID, { kOSSettingsKeyAutoPrompt: false });

    OneSignal.addEventListener("received", this.onReceived);
    OneSignal.addEventListener("opened", this.onOpened);
    OneSignal.addEventListener("ids", this.onIds);

    this.settingsWatcher = Settings.watchKeys(
      [WATCH_KEYS.WAITLILST],
      this.handleChangeWaitlistStatus
    );

    this.state = {
      ready: true,
      client: APOLLO_CLIENT
    };

    if (!hasLoadedCache) {
      SplashScreen.show();
      waitForReady().then(client => {
        if (this._hasMountedApp) {
          this.setState({ ready: true, client }, () => SplashScreen.hide());
        } else {
          this.state = { ready: true, client };
        }
      });
    }
  }

  get initialRouteName() {
    if (this.showWaitlist) {
      return "Waitlist";
    } else {
      return "Root";
    }
  }

  get hideWaitlist() {
    return !!Settings.get(WATCH_KEYS.WAITLILST);
  }

  get showWaitlist() {
    return !this.hideWaitlist;
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
    if (this.state.ready) {
      SplashScreen.hide();
    }

    Sentry.addBreadcrumb({
      category: "lifecycle",
      message: "App booted",
      level: Sentry.Severity.Info
    });
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
    Settings.clearWatch(this.settingsWatcher);
    OneSignal.removeEventListener("received", this.onReceived);
    OneSignal.removeEventListener("opened", this.onOpened);
    OneSignal.removeEventListener("ids", this.onIds);
  }

  setNavRef = navigatorRef => {
    NavigationService.setTopLevelNavigator(navigatorRef);
  };

  render() {
    return (
      <View style={styles.wrap}>
        <StatusBar barStyle="light-content" />

        <MaterialThemeProvider>
          <ApolloProvider client={this.state.client}>
            <UserContextProvider>
              <MediaUploadProvider>
                <ImagePickerProvider>
                  <ActionSheetProvider>
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
                  </ActionSheetProvider>
                </ImagePickerProvider>
              </MediaUploadProvider>
            </UserContextProvider>
          </ApolloProvider>
        </MaterialThemeProvider>
      </View>
    );
  }
}

export default App;
