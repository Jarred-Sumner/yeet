import * as React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaContext } from "react-native-safe-area-context";
import { COLORS, SPACING } from "../../lib/styles";
import { SCREEN_DIMENSIONS } from "../../../config";
import { IconButton } from "../Button";
import { IconSave, IconLink, IconEllipsis } from "../Icon";
import { BaseButton, BorderlessButton } from "react-native-gesture-handler";
import { ShareNetworkType } from "./ShareNetwork";
import {
  BitmapIconSocialButtonInstagram,
  BitmapIconSocialButtonSnapchat
} from "../BitmapIcon";
import { MediumText, Text } from "../Text";

const BUTTON_WIDTH = 300;
const BUTTON_HEIGHT = 50;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111",
    borderTopColor: "#222",
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: SPACING.normal
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    width: BUTTON_WIDTH,
    marginTop: SPACING.double
  },
  buttonContainer: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,

    overflow: "hidden",
    position: "relative",
    shadowRadius: 2,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowColor: "#fff",
    shadowOpacity: 0.1
  },
  buttonBackground: {
    position: "absolute",
    top: 0,
    left: 0,

    bottom: 0,
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 100,
    overflow: "hidden",
    zIndex: 0
  },
  buttonText: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  darkButtonText: {
    color: "#000",
    fontSize: 18
  },
  lightButtonText: {
    color: "#fff",
    fontSize: 18
  },
  footerButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: SPACING.normal,
    flex: 1,
    paddingHorizontal: SPACING.normal
  },
  footerLabel: {
    fontSize: 14,
    color: "#fff",
    marginTop: SPACING.normal,
    textAlign: "center"
  },
  footerIcon: {
    width: 48,
    height: 48,

    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
    borderWidth: 1
  }
});

const FooterButton = ({ Icon, onPress, children }) => {
  return (
    <BorderlessButton
      onPress={onPress}
      exclusive
      borderless
      shouldActivateOnStart={false}
      shouldCancelWhenOutside
    >
      <View style={styles.footerButton}>
        <View style={styles.footerIcon}>
          <Icon color="white" size={Icon === IconEllipsis ? 6 : 20} />
        </View>
        {/* <Text style={styles.footerLabel}>{children}</Text> */}
      </View>
    </BorderlessButton>
  );
};

const BackgroundComponent = ({ network }) => {
  if (
    network === ShareNetworkType.instagramPost ||
    network === ShareNetworkType.instagramStory
  ) {
    return (
      <BitmapIconSocialButtonInstagram
        style={styles.buttonBackground}
        resizeMode="cover"
      />
    );
  } else if (network === ShareNetworkType.snapchat) {
    return (
      <BitmapIconSocialButtonSnapchat
        style={styles.buttonBackground}
        resizeMode="cover"
      />
    );
  }
};

const NETWORK_LABEL = {
  [ShareNetworkType.instagramPost]: "Share to Instagram",
  [ShareNetworkType.instagramStory]: "Add to Instagram Story",
  [ShareNetworkType.snapchat]: "Add to Snapchat Story"
};

export const ShareFooter = ({
  network,
  onPressLink,
  onPressSave,
  onPressMore,
  onPressButton
}) => {
  const { bottom } = React.useContext(SafeAreaContext);
  return (
    <View style={[styles.container, { paddingBottom: bottom }]}>
      <BaseButton onPress={onPressButton}>
        <View style={[styles.buttonContainer]}>
          <BackgroundComponent network={network} />

          <View style={styles.buttonText}>
            <MediumText
              style={
                network === ShareNetworkType.snapchat
                  ? styles.darkButtonText
                  : styles.lightButtonText
              }
            >
              {NETWORK_LABEL[network]}
            </MediumText>
          </View>
        </View>
      </BaseButton>

      <View style={styles.buttons}>
        <FooterButton Icon={IconSave} onPress={onPressSave}>
          Save
        </FooterButton>
        {/* <FooterButton Icon={IconLink} onPress={onPressLink}>
          Link
        </FooterButton> */}
        <FooterButton Icon={IconEllipsis} onPress={onPressMore}>
          More
        </FooterButton>
      </View>
    </View>
  );
};
