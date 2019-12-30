import * as React from "react";
import { StyleSheet, View } from "react-native";
import {
  BitmapIconShareCardInstagram,
  BitmapIconShareCardInstagramStory,
  BitmapIconShareCardSnapchat,
  BitmapIconSocialLogoInstagram,
  BitmapIconSocialLogoSnapchat,
  BitmapIconInstagramPostFooter,
  BitmapIconInstagramTabBar
} from "../BitmapIcon";
import Animated from "react-native-reanimated";
import { useLayout } from "react-native-hooks";
import { SCREEN_DIMENSIONS, TOP_Y, BOTTOM_Y } from "../../../config";
import { THREAD_HEADER_HEIGHT } from "../ThreadList/ThreadHeader";

export enum ShareNetworkType {
  instagramPost = "instagram",
  instagramStory = "instagramStory",
  snapchat = "snapchat"
}

export const SHARE_CARD_HEIGHT =
  SCREEN_DIMENSIONS.height - 210 - THREAD_HEADER_HEIGHT - TOP_Y - BOTTOM_Y;
export const SHARE_CARD_WIDTH = SHARE_CARD_HEIGHT * (9 / 16);

const styles = StyleSheet.create({
  container: {
    height: SHARE_CARD_HEIGHT,
    width: SHARE_CARD_WIDTH
  },
  overlayStyle: { width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT },
  background: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    position: "absolute",

    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#666",
    borderRadius: 2,
    overflow: "hidden",
    zIndex: -1
  },
  darkBackground: { backgroundColor: "#111" },
  lightBackground: {
    backgroundColor: "#333"
  },

  overlay: {
    position: "absolute",

    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    zIndex: 9998
  },
  logo: {
    width: 48,
    height: 48,
    position: "absolute",
    zIndex: 9999,
    top: -24,
    left: -24
  },
  instagramTabBar: {
    position: "absolute",
    right: 0,
    left: 0,
    width: SHARE_CARD_WIDTH - 2,
    borderTopWidth: 1,
    borderTopColor: "#666",
    backgroundColor: "#333",
    marginLeft: 1,
    height: 41,
    marginBottom: 1,
    bottom: 0,

    zIndex: 9999
  },
  instagramFooterContainer: {
    position: "absolute",
    height: SHARE_CARD_HEIGHT,
    overflow: "hidden",
    left: 0,
    right: 0,
    marginLeft: 8,

    zIndex: 9998
  },
  instagramFooter: {
    width: SHARE_CARD_WIDTH - 16,
    height: 138
  }
});

const InstagramPostOverlay = React.memo(({ translateY = 0, height }) => {
  const footerStyles = React.useMemo(
    () => [
      styles.instagramFooterContainer,
      styles.instagramFooter,
      { transform: [{ translateY: 38 }, { translateY }] }
    ],
    [styles.instagramFooterContainer, styles.instagramFooter, translateY]
  );

  const containerStyle = React.useMemo(
    () => ({ height: height - 1, overflow: "hidden" }),
    [height]
  );

  return (
    <>
      <View style={containerStyle}>
        <BitmapIconInstagramPostFooter
          resizeMode="contain"
          style={footerStyles}
        />
      </View>
      <BitmapIconInstagramTabBar
        resizeMode="cover"
        style={styles.instagramTabBar}
      />
    </>
  );
});

const ShareNetwork = ({
  Logo,
  Overlay,
  backgroundStyle,
  onLayoutComplete,
  overlayProps: { translateY = 0 } = {}
}) => {
  const { onLayout, width, height, x, y } = useLayout();
  const handleLayout = React.useCallback(
    (...layoutArgs) => {
      onLayout.apply(this, layoutArgs);
      typeof onLayoutComplete === "function" && onLayoutComplete(...layoutArgs);
    },
    [onLayoutComplete, onLayout]
  );

  const overlayContainerStyle = React.useMemo(
    () => [
      styles.overlay,
      {
        display: typeof width === "number" ? "flex" : "none",
        width,
        height,
        top: y,
        left: x
      }
    ],
    [width, height, y, x, styles.overlay]
  );

  const backgroundStyles = React.useMemo(
    () => [styles.background, backgroundStyle],
    [styles.background, backgroundStyle]
  );

  return (
    <>
      <Animated.View onLayout={handleLayout} style={styles.container}>
        <View style={backgroundStyles} />
      </Animated.View>

      <Animated.View style={overlayContainerStyle}>
        <Logo resizeMode="contain" style={styles.logo} />
        <Overlay
          translateY={translateY}
          x={x}
          y={y}
          height={height}
          style={styles.overlayStyle}
          resizeMode="contain"
        />
      </Animated.View>
    </>
  );
};

export const InstagramShareNetwork = ({
  onPress,
  contentExportHeight = 0,
  onLayoutComplete
}) => (
  <ShareNetwork
    Overlay={InstagramPostOverlay}
    onLayoutComplete={onLayoutComplete}
    overlayProps={{
      translateY: contentExportHeight
    }}
    backgroundStyle={styles.lightBackground}
    Logo={BitmapIconSocialLogoInstagram}
  ></ShareNetwork>
);

export const InstagramStoryShareNetwork = ({ onPress, onLayoutComplete }) => (
  <ShareNetwork
    Overlay={BitmapIconShareCardInstagramStory}
    onLayoutComplete={onLayoutComplete}
    backgroundStyle={styles.darkBackground}
    Logo={BitmapIconSocialLogoInstagram}
  />
);

export const SnapchatShareNetwork = ({ onPress, onLayoutComplete }) => (
  <ShareNetwork
    Overlay={BitmapIconShareCardSnapchat}
    onLayoutComplete={onLayoutComplete}
    backgroundStyle={styles.darkBackground}
    Logo={BitmapIconSocialLogoSnapchat}
  />
);
