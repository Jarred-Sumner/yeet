import * as React from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import {
  BorderlessButton,
  TextInput as GestureTextInput
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { interpolateColor } from "react-native-redash";
import tinycolor from "tinycolor2";
import { COLORS, SPACING } from "../../../lib/styles";
import { IconSearch } from "../../Icon";
import { SemiBoldText } from "../../Text";

const TextInput = Animated.createAnimatedComponent(GestureTextInput);

type Props = {
  onChange: (query: string) => void;
  query: string;
};

const CANCEL_WIDTH = 75 + SPACING.half;
const ICON_WIDTH = 25;

export const IMAGE_SEARCH_HEIGHT = 64;

const PLACEHOLDER_COLOR = "#ccc";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    height: IMAGE_SEARCH_HEIGHT,
    paddingLeft: SPACING.half,
    width: "100%",
    alignItems: "center",
    position: "relative",
    flexDirection: "row",
    paddingVertical: SPACING.half
  },
  textish: {
    paddingTop: SPACING.half,
    paddingBottom: SPACING.half,
    borderRadius: 4,
    height: IMAGE_SEARCH_HEIGHT - SPACING.normal,
    paddingHorizontal: SPACING.normal
  },
  text: {
    backgroundColor: "rgb(38, 38, 38)",
    borderWidth: 1,
    flex: 1,
    color: "white",
    fontWeight: "500",
    fontSize: 18,
    paddingLeft: SPACING.normal + ICON_WIDTH
  },
  cancelText: {
    fontSize: 18,
    textAlign: "center"
  },
  cancelWrapper: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: CANCEL_WIDTH
  },
  cancelButton: {
    flex: 0,
    width: CANCEL_WIDTH,
    height: IMAGE_SEARCH_HEIGHT,
    justifyContent: "center",
    alignItems: "center"
  },
  iconContainer: {
    position: "absolute",
    left: SPACING.half,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: SPACING.half,
    flexDirection: "row",
    zIndex: 10
  },
  icon: {
    fontSize: 16,
    color: PLACEHOLDER_COLOR,
    opacity: 0.75,
    flex: 1,
    transform: [
      {
        rotate: "270deg"
      }
    ]
  }
});

export class ImageSearch extends React.Component<Props> {
  containerBackgroundColor = interpolateColor(
    this.props.keyboardVisibleValue,
    {
      inputRange: [0, 1],
      outputRange: [
        tinycolor("#000")
          .darken(20)
          .toRgb(),
        tinycolor("#111")
          .darken(10)
          .toRgb()
      ]
    },
    "rgb"
  );
  paddingRightValue = Animated.interpolate(this.props.keyboardVisibleValue, {
    inputRange: [0, 1],
    outputRange: [SPACING.half, 75 + SPACING.half],
    extrapolate: Animated.Extrapolate.CLAMP
  });

  dismissKeyboard = () => Keyboard.dismiss();
  state = { isFocused: false };

  handleFocus = evt => {
    this.setState({ isFocused: true });
    this.props.onFocus && this.props.onFocus(evt);
  };
  handleBlur = evt => {
    this.setState({ isFocused: false });
    this.props.onBlur && this.props.onBlur(evt);
  };

  render() {
    const {
      query,
      onChange,
      onBlur,
      onFocus,
      onSubmit,
      keyboardVisibleValue
    } = this.props;

    return (
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: this.containerBackgroundColor,
            paddingRight: this.paddingRightValue
          }
        ]}
      >
        <View style={[styles.textish, styles.iconContainer]}>
          <IconSearch style={styles.icon} />
        </View>

        <TextInput
          keyboardAppearance="dark"
          textContentType="none"
          clearButtonMode="always"
          clearTextOnFocus={false}
          autoCompleteType="off"
          enablesReturnKeyAutomatically
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          importantForAutofill={false}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          value={query}
          style={[styles.text, styles.textish]}
          placeholder="Search GIPHY"
          caretColor={COLORS.primary}
          placeholderTextColor={PLACEHOLDER_COLOR}
          tintColor={COLORS.primary}
        ></TextInput>

        <Animated.View
          pointerEvents={this.state.isFocused ? "auto" : "none"}
          style={[
            styles.cancelWrapper,
            {
              opacity: keyboardVisibleValue,
              transform: [
                {
                  translateX: Animated.interpolate(keyboardVisibleValue, {
                    inputRange: [0, 1],
                    outputRange: [CANCEL_WIDTH, 0],
                    extrapolate: Animated.Extrapolate.CLAMP
                  })
                }
              ]
            }
          ]}
        >
          <BorderlessButton onPress={this.dismissKeyboard}>
            <Animated.View style={styles.cancelButton}>
              <SemiBoldText style={styles.cancelText}>Cancel</SemiBoldText>
            </Animated.View>
          </BorderlessButton>
        </Animated.View>
      </Animated.View>
    );
  }
}

export default ImageSearch;
