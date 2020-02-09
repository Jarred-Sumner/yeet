import chroma from "chroma-js";
import * as React from "react";
import { StyleSheet, View, TextInput } from "react-native";
import {
  TouchableWithoutFeedback,
  BaseButton
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { COLORS, SPACING } from "../../lib/styles";
import { IconSearchAlt } from "../Icon";
import { SemiBoldText } from "../Text";
import { SCREEN_DIMENSIONS } from "../../../config";

const styles = StyleSheet.create({
  container: {
    width: SCREEN_DIMENSIONS.width,
    flexDirection: "row",
    flexGrow: 1
  },

  right: {
    flex: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  cancelButton: {
    paddingHorizontal: SPACING.normal,
    paddingVertical: 8,
    paddingLeft: 0,
    marginRight: SPACING.normal,
    justifyContent: "center",
    alignItems: "center",
    flex: 0,
    flexDirection: "row"
  },
  cancelLabel: {
    fontSize: 18,
    flex: 0,
    textAlign: "center"
  },
  searchBar: {
    flex: 1,
    paddingHorizontal: SPACING.normal,

    position: "relative",
    flexDirection: "row"
  },
  textInputStyle: {
    fontFamily: "Inter",
    fontWeight: "500",
    width: SCREEN_DIMENSIONS.width,
    flexShrink: 1,
    position: "relative",
    height: 36,
    marginRight: 0,
    backgroundColor: COLORS.input,
    fontSize: 18,
    color: "white",
    paddingLeft: 28 + SPACING.normal,
    paddingRight: 0,
    marginTop: 0,
    borderRadius: 36,
    overflow: "hidden",
    marginBottom: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  button: {
    flex: 1,
    flexDirection: "row"
  },
  searchIcon: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: SPACING.normal + SPACING.normal,
    alignItems: "center",
    justifyContent: "center",
    flex: 0,
    zIndex: 10
  }
});

export const ImagePickerSearch = ({
  autoFocusSearch = false,
  onPressClose,
  onChangeQuery,
  editable,
  placeholder = "Search",
  openSearch,
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
    setInputFocus && setInputFocus(true);
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
    setInputFocus && setInputFocus(false);
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

  const focusInput = React.useCallback(() => {
    _inputRef.current?.focus();
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
    <TouchableWithoutFeedback enabled={!editable} onPress={openSearch}>
      <View style={styles.container}>
        <Animated.View style={styles.searchBar}>
          <View pointerEvents="none" style={[styles.searchIcon]}>
            <IconSearchAlt
              color={isInputFocused ? "white" : "#ccc"}
              key={`icon-${isInputFocused}`}
              size={18}
            />
          </View>

          <TextInput
            editable={editable}
            placeholder={placeholder}
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
            keyboardAppearance="dark"
            keyboardType="web-search"
            autoCompleteType="off"
            autoCapitalize="none"
            enablesReturnKeyAutomatically
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="always"
            tintColor="white"
            textContentType="none"
            placeholderTextColor="#ccc"
            onChangeText={onChangeQuery}
            onSubmitEditing={onEnter}
          />
        </Animated.View>
        <View
          style={[
            styles.right,
            {
              display: isInputFocused ? "flex" : "none",

              right: isInputFocused ? -16 : -100
            }
          ]}
        >
          <TouchableWithoutFeedback
            style={{ flexDirection: "row", flex: 0 }}
            onPress={blurInput}
          >
            <Animated.View style={styles.cancelButton}>
              <SemiBoldText
                numberOfLines={1}
                adjustsFontSizeToFit
                style={styles.cancelLabel}
              >
                Cancel
              </SemiBoldText>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};
