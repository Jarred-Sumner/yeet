import * as React from "react";
import {
  Keyboard,
  StyleSheet,
  View,
  TextInput as RNTextInput
} from "react-native";
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
import { BlurView } from "@react-native-community/blur";
import { TOP_Y } from "../../../../config";

export const ImageSearchContext = React.createContext(null);
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
    height: IMAGE_SEARCH_HEIGHT,
    width: "100%"
  },
  blur: {
    height: IMAGE_SEARCH_HEIGHT,
    width: "100%"
  },
  content: {
    height: IMAGE_SEARCH_HEIGHT,
    paddingLeft: SPACING.half,
    position: "relative",
    width: "100%",
    alignItems: "center",
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
    borderWidth: 1,
    borderColor: "transparent",
    paddingTop: SPACING.half,
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
    flex: 1
  }
});

class ImageSearchComponent extends React.Component<Props> {
  paddingRightValue = Animated.interpolate(this.props.keyboardVisibleValue, {
    inputRange: [0, 1],
    outputRange: [SPACING.half, 75 + SPACING.half],
    extrapolate: Animated.Extrapolate.CLAMP
  });

  translateX = Animated.interpolate(this.props.keyboardVisibleValue, {
    inputRange: [0, 1],
    outputRange: [CANCEL_WIDTH, 0],
    extrapolate: Animated.Extrapolate.CLAMP
  });

  dismissKeyboard = () => {
    this.textInputRef.current.getNode().blur();

    window.requestAnimationFrame(() => {
      this.textInputRef.current.getNode().clear();
      this.props.onChange("");
    });
  };
  state = { isFocused: false, defaultQuery: this.props.query };

  handleFocus = evt => {
    this.setState({ isFocused: true });
    this.props.onFocus && this.props.onFocus(evt);
  };
  handleBlur = evt => {
    this.setState({ isFocused: false });
    this.props.onBlur && this.props.onBlur(evt);
  };

  static defaultProps = {
    placeholder: "Search GIPHY"
  };

  inputStyles = [styles.textish, styles.text];
  textInputRef = React.createRef<RNTextInput>();

  render() {
    const {
      query,
      onChange,
      onBlur,
      onFocus,
      onSubmit,
      placeholder,
      inset = 0,
      offset,
      hasTextValue,
      scrollY,
      disabled,
      translateY,
      keyboardVisibleValue,
      additionalOffset = 0
    } = this.props;

    const marginTop = (IMAGE_SEARCH_HEIGHT + offset - additionalOffset) * -1;

    return (
      <Animated.View
        style={[
          styles.container,
          {
            // marginTop,
            // transform: [
            //   {
            //     translateY: Animated.block([
            //       Animated.interpolate(scrollY, {
            //         inputRange: [-100, offset, 0],
            //         outputRange: [additionalOffset, inset, inset],
            //         extrapolate: Animated.Extrapolate.CLAMP
            //       })
            //     ])
            //   }
            // ]
          }
        ]}
      >
        <BlurView blurType="extraDark" style={styles.blur} blurAmount={25}>
          <Animated.View
            style={[
              styles.content,
              // { height: IMAGE_SEARCH_HEIGHT - inset },
              {
                paddingRight: this.paddingRightValue
                // transform: [
                //   {
                //     translateY
                //   }
                // ]
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
              ref={this.textInputRef}
              disabled={disabled}
              editable={!disabled}
              enablesReturnKeyAutomatically
              onChangeText={onChange}
              onSubmitEditing={onSubmit}
              importantForAutofill={false}
              onFocus={this.handleFocus}
              onBlur={this.handleBlur}
              defaultValue={this.state.defaultQuery}
              style={this.inputStyles}
              placeholder={placeholder}
              caretColor={COLORS.primary}
              placeholderTextColor={PLACEHOLDER_COLOR}
              tintColor={COLORS.primary}
              selectionColor={COLORS.primary}
            ></TextInput>

            <Animated.View
              pointerEvents={this.state.isFocused ? "auto" : "none"}
              style={[
                styles.cancelWrapper,
                {
                  opacity: keyboardVisibleValue,
                  transform: [
                    {
                      translateX: this.translateX
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
        </BlurView>
      </Animated.View>
    );
  }
}

export const ImageSearch = ({ inset, offset }) => {
  const imageSearchProps = React.useContext(ImageSearchContext);

  return (
    <ImageSearchComponent inset={inset} offset={offset} {...imageSearchProps} />
  );
};

export default ImageSearch;
