import * as React from "react";

import { View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import SafeAreaView from "react-native-safe-area-view";
import {
  BackButton,
  IconButton,
  useBackButtonBehavior,
  IconButtonEllipsis
} from "../Button";
import { Text, MediumText } from "../Text";
import { IconEllipsis, IconClose } from "../Icon";
import { SPACING, COLORS } from "../../lib/styles";
import { TOP_Y, SCREEN_DIMENSIONS } from "../../../config";
import { BlurView } from "@react-native-community/blur";
import tinycolor from "tinycolor2";

export const THREAD_HEADER_HEIGHT = 34 + SPACING.normal;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: SPACING.normal,
    paddingTop: TOP_Y,
    zIndex: 1
  },
  blur: {
    backgroundColor: "rgba(0, 0, 0, 1.0)",
    opacity: 0.9
  },
  bar: {
    position: "absolute",
    top: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    left: 0,

    right: 0,
    zIndex: 0,
    height: THREAD_HEADER_HEIGHT + TOP_Y
  },
  side: {
    flexDirection: "row",
    alignItems: "center",
    height: THREAD_HEADER_HEIGHT
  },
  title: {
    marginTop: 4,
    color: "white",
    fontSize: 14,
    lineHeight: 14,
    textAlign: "center"
  },
  rightSide: {
    justifyContent: "flex-end",
    width: 44
  },
  username: {
    fontSize: 13,
    lineHeight: 13,
    color: COLORS.muted,
    textTransform: "uppercase",
    textAlign: "center"
  },
  titleSide: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    flex: 1
  },
  safe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%"
  },
  leftSide: {
    width: 44
  }
});

export const ThreadHeader = ({ thread }) => {
  const ref = React.useRef();

  const handlePressEllipsis = React.useCallback(() => {}, [thread.id]);

  const behavior = useBackButtonBehavior();
  return (
    <>
      <BlurView
        style={[styles.bar, styles.blur]}
        blurType="dark"
        blurAmount={12}
        viewRef={ref}
      />

      <View ref={ref} style={[styles.bar, styles.container]}>
        <View style={[styles.side, styles.leftSide]}>
          <BackButton behavior={behavior} size={16} />
        </View>

        <View style={[styles.side, styles.titleSide]}>
          <Text style={styles.username} numberOfLines={1}>
            @{thread.profile.username}
          </Text>
          <MediumText numberOfLines={1} style={styles.title}>
            {thread.body}
          </MediumText>
        </View>

        <View style={[styles.side, styles.rightSide]}>
          {/* <IconButtonEllipsis onPress={handlePressEllipsis} /> */}
        </View>
      </View>
    </>
  );
};

export const CommentEditorHeader = ({ onCancel }) => {
  const ref = React.useRef();

  const handlePressCancel = React.useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <>
      <BlurView
        style={[styles.bar, styles.blur]}
        blurType="dark"
        blurAmount={12}
        viewRef={ref}
      />

      <View ref={ref} style={[styles.bar, styles.container]}>
        <View style={[styles.side, styles.leftSide]}>
          {/* <IconButton
            type="shadow"
            Icon={IconClose}
            size={16}
            color="white"
            onPress={handlePressCancel}
          /> */}
        </View>

        <View style={[styles.side, styles.titleSide]}>
          <Text style={styles.username} numberOfLines={1}>
            Post a comment
          </Text>
          <MediumText numberOfLines={1} style={styles.title}>
            Write your comment
          </MediumText>
        </View>

        <View style={[styles.side, styles.rightSide]}>
          {/* <IconButtonEllipsis onPress={handlePressEllipsis} /> */}
        </View>
      </View>
    </>
  );
};
