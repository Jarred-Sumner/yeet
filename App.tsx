/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import React from "react";
import { StatusBar } from "react-native";
import OneSignal from "react-native-onesignal";
import { PortalProvider, WhitePortal } from "react-native-portal";
import { enableScreens } from "react-native-screens";
import { ONESIGNAL_APP_ID } from "./config";
import { MaterialThemeProvider } from "./src/components/MaterialThemeProvider";
import { Toast } from "./src/components/Toast";
import { UserContextProvider } from "./src/components/UserContext";
import { ApolloProvider } from "./src/containers/ApolloProvider";
import { ImagePickerProvider } from "./src/lib/ImagePickerContext";
import NavigationService from "./src/lib/NavigationService";
import { Routes } from "./Routes";
import * as Sentry from "@sentry/react-native";
import { NavigationState } from "react-navigation";
import { trackScreenTransition } from "./src/components/Analytics";
import { ReportModal } from "./src/components/ReportModal";
import { ModalContextProvider } from "./src/components/ModalContext";

Sentry.init({
  dsn: "https://bb66d2e2c6e448108a088854b419e539@sentry.io/1816224",
  environment: process.env.NODE_ENV
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

export class App extends React.Component {
  constructor(props) {
    super(props);

    enableScreens();

    OneSignal.init(ONESIGNAL_APP_ID, { kOSSettingsKeyAutoPrompt: false });

    OneSignal.addEventListener("received", this.onReceived);
    OneSignal.addEventListener("opened", this.onOpened);
    OneSignal.addEventListener("ids", this.onIds);
  }

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

  componentDidMount() {
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
    OneSignal.removeEventListener("received", this.onReceived);
    OneSignal.removeEventListener("opened", this.onOpened);
    OneSignal.removeEventListener("ids", this.onIds);
  }

  setNavRef = navigatorRef => {
    NavigationService.setTopLevelNavigator(navigatorRef);
  };

  render() {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <PortalProvider>
          <MaterialThemeProvider>
            <ApolloProvider>
              <UserContextProvider>
                <ImagePickerProvider>
                  <ActionSheetProvider>
                    <ModalContextProvider>
                      <>
                        <Toast />
                        <Routes ref={this.setNavRef} uriPrefix={APP_PREFIX} />
                        <WhitePortal name="modal" />
                      </>
                    </ModalContextProvider>
                  </ActionSheetProvider>
                </ImagePickerProvider>
              </UserContextProvider>
            </ApolloProvider>
          </MaterialThemeProvider>
        </PortalProvider>
      </>
    );
  }
}

export default App;
