import * as React from "react";
import { View, StyleSheet, TextInput, LayoutAnimation } from "react-native";
import { IconButton } from "../../Button";
import {
  IconClose,
  IconSearch,
  IconSearchAlt,
  IconChevronLeft
} from "../../Icon";
import { SPACING, COLORS } from "../../../lib/styles";
import { SafeAreaContext } from "react-native-safe-area-context";
import chroma from "chroma-js";
import { SemiBoldText } from "../../Text";
import Animated from "react-native-reanimated";
import {
  BorderlessButton,
  TouchableWithoutFeedback
} from "react-native-gesture-handler";
import { SCREEN_DIMENSIONS } from "../../../../config";

const styles = StyleSheet.create({
  container: {
    width: "100%",

    flexDirection: "row",
    // overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(200, 200, 200, 0.25)"
  },
  backgroundContainer: {
    backgroundColor: chroma(COLORS.primary)
      .alpha(0.05)
      .css(),
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1
  },
  unfocusedBackgroundContainer: {
    backgroundColor: chroma
      .blend(chroma(COLORS.primary).alpha(0.25), "#333", "multiply")
      .alpha(0.5)
      .css(),
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1
  },
  right: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0
  },
  cancelButton: {
    paddingHorizontal: SPACING.normal,
    paddingVertical: SPACING.normal
  },
  cancelLabel: {
    fontSize: 18
  },
  searchBar: {
    flex: 1,
    position: "relative",
    alignItems: "center",
    flexDirection: "row"
  },
  textInputStyle: {
    flex: 1,
    fontFamily: "Inter",
    fontWeight: "500",

    paddingTop: SPACING.normal,
    paddingBottom: SPACING.normal,
    fontSize: 18,
    color: "white",
    paddingRight: 12,
    paddingLeft: 28,
    marginTop: 0,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 0,
    maxWidth: SCREEN_DIMENSIONS.width - 100,
    marginLeft: 0,
    marginRight: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent"
  },
  searchIcon: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    flex: 0
  }
});

export const GallerySheetHeader = ({
  autoFocusSearch = false,
  onPressClose,
  onChangeQuery,
  isInputFocused,
  onChangeInputFocus: setInputFocus,
  textInputRef
}) => {
  const { top } = React.useContext(SafeAreaContext);
  const _inputRef = React.useRef();
  const handleFocus = React.useCallback(() => {
    // LayoutAnimation.configureNext({
    //   ...LayoutAnimation.Presets.easeInEaseOut,
    //   create: {
    //     ...LayoutAnimation.Presets.easeInEaseOut.create,
    //     type: LayoutAnimation.Types.keyboard
    //   },
    //   update: {
    //     ...LayoutAnimation.Presets.easeInEaseOut.update,
    //     type: LayoutAnimation.Types.keyboard
    //   },
    //   delete: {
    //     ...LayoutAnimation.Presets.easeInEaseOut.delete,
    //     type: LayoutAnimation.Types.keyboard
    //   }
    // });
    setInputFocus(true);
  }, [setInputFocus]);

  const handleBlur = React.useCallback(() => {
    // LayoutAnimation.configureNext({
    //   ...LayoutAnimation.Presets.easeInEaseOut,
    //   create: {
    //     ...LayoutAnimation.Presets.easeInEaseOut.create,
    //     type: LayoutAnimation.Types.keyboard
    //   },
    //   update: {
    //     ...LayoutAnimation.Presets.easeInEaseOut.update,
    //     type: LayoutAnimation.Types.keyboard
    //   },
    //   delete: {
    //     ...LayoutAnimation.Presets.easeInEaseOut.delete,
    //     type: LayoutAnimation.Types.keyboard
    //   }
    // });
    setInputFocus(false);
  }, [setInputFocus]);

  const blurInput = React.useCallback(() => {
    _inputRef.current?.blur();
    // LayoutAnimation.configureNext({
    //   ...LayoutAnimation.Presets.easeInEaseOut,
    //   create: {
    //     ...LayoutAnimation.Presets.easeInEaseOut.create,
    //     type: LayoutAnimation.Types.keyboard
    //   },
    //   update: {
    //     ...LayoutAnimation.Presets.easeInEaseOut.update,
    //     type: LayoutAnimation.Types.keyboard
    //   },
    //   delete: {
    //     ...LayoutAnimation.Presets.easeInEaseOut.delete,
    //     type: LayoutAnimation.Types.keyboard
    //   }
    // });
  }, [_inputRef]);

  const onEnter = React.useCallback(() => {}, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: 8,
          transform: [{ translateY: isInputFocused ? 0 : -8 }],
          paddingHorizontal: 16
        }
      ]}
    >
      <View
        style={
          isInputFocused
            ? styles.backgroundContainer
            : styles.unfocusedBackgroundContainer
        }
        pointerEvents="none"
      />

      <View style={styles.searchBar}>
        <View pointerEvents="none" style={[styles.searchIcon]}>
          <IconSearchAlt
            color={isInputFocused ? "white" : "#ccc"}
            key={`icon-${isInputFocused}`}
            size={18}
          />
        </View>

        <TextInput
          placeholder="Search"
          style={[
            styles.textInputStyle,
            {
              // backgroundColor: isInputFocused
              //   ? "rgba(0,0,0,0)"
              //   : "rgba(25,25,25,0.75)"
            }
          ]}
          autoFocus={autoFocusSearch}
          multiline={false}
          ref={_inputRef}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor="white"
          numberOfLines={1}
          textContentType="none"
          clearButtonMode="never"
          placeholderTextColor="#ccc"
          selectTextOnFocus
          onChangeText={onChangeQuery}
          onSubmitEditing={onEnter}
        />

        <View
          style={[
            styles.right,
            {
              display: isInputFocused ? "flex" : "none",

              right: isInputFocused ? -16 : -100
            }
          ]}
        >
          <TouchableWithoutFeedback onPress={blurInput}>
            <Animated.View style={styles.cancelButton}>
              <SemiBoldText style={styles.cancelLabel}>Cancel</SemiBoldText>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </View>
  );
};
