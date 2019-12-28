import { NetworkStatus } from "apollo-client";
import { debounce, Cancelable } from "lodash";
import * as React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextInput as RNTextInput,
  View,
  InteractionManager,
  Task,
  findNodeHandle
} from "react-native";
import {
  BorderlessButton,
  TextInput as GestureTextInput
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { COLORS, SPACING } from "../../../lib/styles";
import { BlurView } from "../../BlurView";
import { IconSearch } from "../../Icon";
import { SemiBoldText } from "../../Text";

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
  spinnerContainer: {
    position: "absolute",
    height: IMAGE_SEARCH_HEIGHT,
    left: SPACING.normal,
    justifyContent: "center",
    zIndex: 10
  },
  right: {
    position: "absolute",
    top: 0,
    right: SPACING.normal,
    alignItems: "center",
    paddingBottom: SPACING.half,
    bottom: 0,
    height: IMAGE_SEARCH_HEIGHT,
    flexDirection: "row"
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
  static defaultProps = {
    autoFocus: false,
    placeholder: "Search GIPHY"
  };

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

  spinnerX = Animated.interpolate(this.props.keyboardVisibleValue, {
    inputRange: [0, 1],
    outputRange: [SPACING.normal * -1, (CANCEL_WIDTH + SPACING.normal) * -1],
    extrapolate: Animated.Extrapolate.CLAMP
  });

  stickerTranslateX =
    this.props.rightActions &&
    Animated.interpolate(this.props.keyboardVisibleValue, {
      inputRange: [0, 1],
      outputRange: [0, (CANCEL_WIDTH - SPACING.half) * -1],
      extrapolate: Animated.Extrapolate.CLAMP
    });

  get textInput() {
    return this.textInputRef?.current?.getNode();
  }

  dismissKeyboard = () => {
    this.blur();

    this.animationFrame = window.requestAnimationFrame(() => {
      this.textInput?.clear();
      this.props?.onChange("");
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

  inputStyles = [styles.textish, styles.text];
  textInputRef = React.createRef<RNTextInput>();

  debouncedChange = debounce(this.props.onChange, 1000);

  didAutoFocus = false;

  componentDidMount() {
    if (
      this.props.show &&
      !this.didAutoFocus &&
      this.props.isFocused &&
      this.props.autoFocus
    ) {
      this.autoFocus();
    }
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.animationFrame);
    this.interactionTask?.cancel();
    this.debouncedChange.cancel();
  }

  get textInputHandle() {
    const input = this.textInput;

    if (input) {
      return findNodeHandle(input);
    } else {
      return null;
    }
  }

  focus() {
    if (!this.textInputHandle) {
      return;
    }

    RNTextInput.State.focusTextInput(this.textInputHandle);
  }

  blur() {
    if (!this.textInputHandle) {
      return;
    }

    RNTextInput.State.blurTextInput(this.textInputHandle);
  }

  clear() {
    this.textInput?.blur();
  }

  autoFocus = () => {
    this.focus();
    this.debouncedChange("");
    this.didAutoFocus = true;
  };

  interactionTask: Cancelable | null = null;

  componentDidUpdate(prevProps) {
    if (
      !this.didAutoFocus &&
      this.props.show &&
      this.props.isFocused &&
      this.props.autoFocus
    ) {
      this.autoFocus();
    } else if (!this.props.show && prevProps.show) {
      this.didAutoFocus = false;
      this.debouncedChange.cancel();

      this.interactionTask = InteractionManager.runAfterInteractions(() => {
        this.clear();
      });
    }
  }

  render() {
    const {
      query,
      onChange,
      onBlur,
      onFocus,
      onSubmit,
      placeholder,
      inset = 0,
      networkStatus,
      offset,
      scrollY,
      disabled,
      translateY,
      keyboardVisibleValue,
      additionalOffset = 0,
      rightActions
    } = this.props;

    const isLoading = [
      NetworkStatus.loading,
      NetworkStatus.refetch,
      NetworkStatus.fetchMore
    ].includes(networkStatus);

    const marginTop = (IMAGE_SEARCH_HEIGHT + offset - additionalOffset) * -1;

    return (
      <Animated.View style={styles.container}>
        <BlurView blurType="dark" style={styles.blur} blurAmount={25}>
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
            <View
              pointerEvents="none"
              style={[styles.textish, styles.iconContainer]}
            >
              <IconSearch
                style={[
                  styles.icon,
                  {
                    opacity: isLoading ? 0 : 1
                  }
                ]}
              />

              {isLoading && (
                <View style={styles.spinnerContainer}>
                  <ActivityIndicator
                    color={COLORS.muted}
                    size="small"
                    animating={isLoading}
                  />
                </View>
              )}
            </View>

            <TextInput
              keyboardAppearance="dark"
              textContentType="none"
              clearButtonMode="never"
              clearTextOnFocus={false}
              autoCompleteType="off"
              ref={this.textInputRef}
              disabled={disabled}
              editable={!disabled}
              enablesReturnKeyAutomatically
              onChangeText={this.debouncedChange}
              onSubmitEditing={onSubmit}
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

            {rightActions && (
              <Animated.View
                style={[
                  styles.right,
                  {
                    transform: [
                      {
                        translateX: this.stickerTranslateX
                      }
                    ]
                  }
                ]}
              >
                {rightActions}
              </Animated.View>
            )}

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
