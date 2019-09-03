import * as React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-navigation";
import { COLORS, SPACING } from "../../lib/styles";
import { IconButton } from "../Button";
import { IconDownload, IconSend } from "../Icon";

const styles = StyleSheet.create({
  footerSide: {
    flexDirection: "row",
    alignItems: "flex-end"
  },
  footer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    paddingHorizontal: SPACING.double,
    left: 0,
    right: 0,
    height: 60,
    width: "100%",
    justifyContent: "space-between"
  }
});

const FooterButton = ({ Icon, onPress, color, size = 32 }) => {
  return (
    <IconButton
      size={size}
      Icon={Icon}
      color={color}
      type="fill"
      backgroundColor={COLORS.secondaryOpacity}
      onPress={onPress}
    />
  );
};

const NextButton = ({ onPress, waitFor }) => {
  return (
    <IconButton
      size={24}
      type="fill"
      onPress={onPress}
      Icon={IconSend}
      backgroundColor={COLORS.secondary}
    />
  );
};

export const EditorFooter = ({ onPressDownload, onPressSend, waitFor }) => (
  <SafeAreaView
    forceInset={{
      top: "never",
      left: "never",
      right: "never",
      bottom: "always"
    }}
    style={styles.footer}
  >
    <View style={[styles.footerSide]}>
      <IconButton
        onPress={onPressDownload}
        Icon={IconDownload}
        color="#fff"
        waitFor={waitFor}
        size={32}
        type="shadow"
      />
    </View>

    <View style={[styles.footerSide, styles.footerSideRight]}>
      <NextButton onPress={onPressSend} waitFor={waitFor} />
    </View>
  </SafeAreaView>
);
