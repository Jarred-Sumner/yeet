import * as React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton } from "../Button";
import { COLORS } from "../../lib/styles";
import { sendLightFeedback } from "../../lib/Vibration";
import { IconSticker } from "../Icon";

const styles = StyleSheet.create({
  iconContainer: {}
});

export const TransparentToggle = ({ value, onPress, defaultTransparent }) => {
  const initialTransparentValue = React.useRef(defaultTransparent);
  const handlePress = React.useCallback(() => {
    sendLightFeedback();
    onPress(!value);
  }, [value, onPress]);

  return (
    <IconButton
      type="shadow"
      size={24}
      Icon={IconSticker}
      onPress={handlePress}
      color={value ? COLORS.primary : COLORS.muted}
    />
  );
};
