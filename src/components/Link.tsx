import * as React from "react";
import { View, StyleSheet, Linking } from "react-native";
import Animated from "react-native-reanimated";
import { Text } from "./Text";
import { BorderlessButton } from "react-native-gesture-handler";
import InAppBrowser from "react-native-inappbrowser-reborn";
import * as Sentry from "@sentry/react-native";

export const openLink = async (url: string) => {
  try {
    if (await InAppBrowser.isAvailable()) {
      return await InAppBrowser.open(url, {
        // iOS Properties
        dismissButtonStyle: "cancel",
        readerMode: true,
        animated: true,
        modalEnabled: true,
        modalPresentationStyle: "automatic",
        enableBarCollapsing: false,
        preferredBarTintColor: "#000",
        preferredControlTintColor: "#fff",

        // Android Properties
        showTitle: true,
        toolbarColor: "#6200EE",
        secondaryToolbarColor: "black",
        enableUrlBarHiding: true,
        enableDefaultShare: true,
        forceCloseOnRedirection: false
        // // Specify full animation resource identifier(package:anim/name)
        // // or only resource name(in case of animation bundled with app).
        // animations: {
        //   startEnter: "slide_in_right",
        //   startExit: "slide_out_left",
        //   endEnter: "slide_in_left",
        //   endExit: "slide_out_right"
        // }
      });
    } else Linking.openURL(url);
  } catch (error) {
    Sentry.captureException(error);
  }
};

const styles = StyleSheet.create({
  link: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1
  }
});

export const Link = ({ style, children, TextComponent = Text, href }) => {
  const handlePressLink = React.useCallback(() => {
    openLink(href);
  }, [href, openLink]);
  return (
    <BorderlessButton onPress={handlePressLink}>
      <Animated.View style={(styles.link, style)}>
        <TextComponent style={{ color: "pink" }}>{children}</TextComponent>
      </Animated.View>
    </BorderlessButton>
  );
};
