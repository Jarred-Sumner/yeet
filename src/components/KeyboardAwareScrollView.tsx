/*       */

import React from "react";
import PropTypes from "prop-types";
import {
  Keyboard,
  Platform,
  UIManager,
  TextInput,
  findNodeHandle,
  ScrollViewProps
} from "react-native";
import Animated from "react-native-reanimated";
import { isIphoneX } from "react-native-iphone-x-helper";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";

const ScrollView = Animated.createAnimatedComponent(GestureScrollView);

const _KAM_DEFAULT_TAB_BAR_HEIGHT = isIphoneX() ? 83 : 49;
const _KAM_KEYBOARD_OPENING_TIME = 250;
const _KAM_EXTRA_HEIGHT = 75;

const supportedKeyboardEvents = [
  "keyboardWillShow",
  "keyboardDidShow",
  "keyboardWillHide",
  "keyboardDidHide",
  "keyboardWillChangeFrame",
  "keyboardDidChangeFrame"
];
const keyboardEventToCallbackName = eventName =>
  "on" + eventName[0].toUpperCase() + eventName.substring(1);
const keyboardEventPropTypes = supportedKeyboardEvents.reduce(
  (acc, eventName) => ({
    ...acc,
    [keyboardEventToCallbackName(eventName)]: PropTypes.func
  }),
  {}
);
const keyboardAwareHOCTypeEvents = supportedKeyboardEvents.reduce(
  (acc, eventName) => ({
    ...acc,
    [keyboardEventToCallbackName(eventName)]: Function
  }),
  {}
);

function getDisplayName(WrappedComponent) {
  return (
    (WrappedComponent &&
      (WrappedComponent.displayName || WrappedComponent.name)) ||
    "Component"
  );
}

const ScrollIntoViewDefaultOptions = {
  enableOnAndroid: false,
  contentContainerStyle: undefined,
  enableAutomaticScroll: true,
  extraHeight: _KAM_EXTRA_HEIGHT,
  extraScrollHeight: 0,
  enableResetScrollToCoords: true,
  keyboardOpeningTime: _KAM_KEYBOARD_OPENING_TIME,
  viewIsInsideTabBar: false,

  // The ref prop name that will be passed to the wrapped component to obtain a ref
  // If your ScrollView is already wrapped, maybe the wrapper permit to get a ref
  // For example, with glamorous-native ScrollView, you should use "innerRef"
  refPropName: "ref",
  // Sometimes the ref you get is a ref to a wrapped view (ex: Animated.ScrollView)
  // We need access to the imperative API of a real native ScrollView so we need extraction logic
  extractNativeRef: ref => {
    // getNode() permit to support Animated.ScrollView automatically
    // see https://github.com/facebook/react-native/issues/19650
    // see https://stackoverflow.com/questions/42051368/scrollto-is-undefined-on-animated-scrollview/48786374
    if (ref.getNode) {
      return ref.getNode();
    } else {
      return ref;
    }
  }
};

export class KeyboardAwareScrollView extends React.Component<ScrollViewProps> {
  // HOC options are used to init default props, so that these options can be overriden with component props
  static defaultProps = {
    enableAutomaticScroll: ScrollIntoViewDefaultOptions.enableAutomaticScroll,
    extraHeight: ScrollIntoViewDefaultOptions.extraHeight,
    extraScrollHeight: ScrollIntoViewDefaultOptions.extraScrollHeight,
    enableResetScrollToCoords:
      ScrollIntoViewDefaultOptions.enableResetScrollToCoords,
    keyboardOpeningTime: ScrollIntoViewDefaultOptions.keyboardOpeningTime,
    viewIsInsideTabBar: ScrollIntoViewDefaultOptions.viewIsInsideTabBar,
    enableOnAndroid: ScrollIntoViewDefaultOptions.enableOnAndroid,
    defaultPosition: { x: 0, y: 0 }
  };

  constructor(props) {
    super(props);
    this.callbacks = {};
    this.position = props.defaultPosition;
    this.defaultResetScrollToCoords = props.defaultPosition;
    const keyboardSpace = props.viewIsInsideTabBar
      ? _KAM_DEFAULT_TAB_BAR_HEIGHT
      : 0;
    this.state = { keyboardSpace };
  }

  componentDidMount() {
    this.mountedComponent = true;
  }

  componentDidUpdate(prevProps) {
    if (this.props.viewIsInsideTabBar !== prevProps.viewIsInsideTabBar) {
      const keyboardSpace = this.props.viewIsInsideTabBar
        ? _KAM_DEFAULT_TAB_BAR_HEIGHT
        : 0;
      if (this.state.keyboardSpace !== keyboardSpace) {
        this.setState({ keyboardSpace });
      }
    }

    if (
      this.props.paddingBottom !== prevProps.paddingBottom ||
      this.props.paddingTop !== prevProps.paddingTop
    ) {
      const responder = this.getScrollResponder();

      responder.setNativeProps({
        contentInset: {
          top: this.props.paddingTop,
          bottom: this.props.paddingBottom
        }
      });
    }
  }

  componentWillUnmount() {
    this.mountedComponent = false;
  }

  getScrollResponder = () => {
    return (
      this._rnkasv_keyboardView &&
      this._rnkasv_keyboardView.getScrollResponder()
    );
  };

  scrollToPosition = (x, y, animated = true) => {
    const responder = this.getScrollResponder();
    responder && responder.scrollResponderScrollTo({ x, y, animated });
  };

  scrollToEnd = (animated = true) => {
    const responder = this.getScrollResponder();
    responder && responder.scrollResponderScrollToEnd({ animated });
  };

  scrollForExtraHeightOnAndroid = extraHeight => {
    this.scrollToPosition(0, this.position.y + extraHeight, true);
  };

  /**
   * @param keyboardOpeningTime: takes a different keyboardOpeningTime in consideration.
   * @param extraHeight: takes an extra height in consideration.
   */
  scrollToFocusedInput = (reactNode, extraHeight, keyboardOpeningTime) => {
    if (extraHeight === undefined) {
      extraHeight = this.props.extraHeight || 0;
    }
    if (keyboardOpeningTime === undefined) {
      keyboardOpeningTime = this.props.keyboardOpeningTime || 0;
    }
    // setTimeout(() => {
    if (!this.mountedComponent) {
      return;
    }
    const responder = this.getScrollResponder();
    responder &&
      responder.scrollResponderScrollNativeHandleToKeyboard(
        reactNode,
        extraHeight,
        true
      );
    // }, keyboardOpeningTime);
  };

  scrollIntoView = async (element, options = {}) => {
    if (!this._rnkasv_keyboardView || !element) {
      return;
    }

    const [parentLayout, childLayout] = await Promise.all([
      this._measureElement(this._rnkasv_keyboardView),
      this._measureElement(element)
    ]);

    const getScrollPosition =
      options.getScrollPosition || this._defaultGetScrollPosition;
    const { x, y, animated } = getScrollPosition(
      parentLayout,
      childLayout,
      this.position
    );
    this.scrollToPosition(x, y, animated);
  };

  _defaultGetScrollPosition = (parentLayout, childLayout, contentOffset) => {
    return {
      x: 0,
      y: Math.max(0, childLayout.y - parentLayout.y + contentOffset.y),
      animated: true
    };
  };

  _measureElement = element => {
    const node = findNodeHandle(element);
    return new Promise(resolve => {
      UIManager.measureInWindow(node, (x, y, width, height) => {
        resolve({ x, y, width, height });
      });
    });
  };

  // Keyboard actions
  handleKeyboardEvent = frames => {
    // Automatically scroll to focused TextInput
    if (this.props.enableAutomaticScroll) {
      let keyboardSpace =
        frames.endCoordinates.height + this.props.extraScrollHeight;
      if (this.props.viewIsInsideTabBar) {
        keyboardSpace -= _KAM_DEFAULT_TAB_BAR_HEIGHT;
      }
      this.setState({ keyboardSpace });
      const currentlyFocusedField = TextInput.State.currentlyFocusedField();
      const responder = this.getScrollResponder();
      if (!currentlyFocusedField || !responder) {
        return;
      }
      UIManager.viewIsDescendantOf(
        currentlyFocusedField,
        responder.getInnerViewNode(),
        isAncestor => {
          if (isAncestor) {
            // Check if the TextInput will be hidden by the keyboard
            UIManager.measureInWindow(
              currentlyFocusedField,
              (x, y, width, height) => {
                const textInputBottomPosition = y + height;
                const keyboardPosition = frames.endCoordinates.screenY;
                const totalExtraHeight =
                  this.props.extraScrollHeight + this.props.extraHeight;
                if (Platform.OS === "ios") {
                  if (
                    textInputBottomPosition >
                    keyboardPosition - totalExtraHeight
                  ) {
                    this._scrollToFocusedInputWithNodeHandle(
                      currentlyFocusedField
                    );
                  }
                } else {
                  // On android, the system would scroll the text input just
                  // above the keyboard so we just neet to scroll the extra
                  // height part
                  if (textInputBottomPosition > keyboardPosition) {
                    // Since the system already scrolled the whole view up
                    // we should reduce that amount
                    keyboardSpace =
                      keyboardSpace -
                      (textInputBottomPosition - keyboardPosition);
                    this.setState({ keyboardSpace });
                    this.scrollForExtraHeightOnAndroid(totalExtraHeight);
                  } else if (
                    textInputBottomPosition >
                    keyboardPosition - totalExtraHeight
                  ) {
                    this.scrollForExtraHeightOnAndroid(
                      totalExtraHeight -
                        (keyboardPosition - textInputBottomPosition)
                    );
                  }
                }
              }
            );
          }
        }
      );
    }
    if (!this.props.resetScrollToCoords) {
      if (!this.defaultResetScrollToCoords) {
        this.defaultResetScrollToCoords = this.position;
      }
    }
  };

  resetKeyboardSpace = () => {
    const keyboardSpace = this.props.viewIsInsideTabBar
      ? _KAM_DEFAULT_TAB_BAR_HEIGHT
      : 0;
    this.setState({ keyboardSpace });
    // Reset scroll position after keyboard dismissal
    if (this.props.enableResetScrollToCoords === false) {
      this.defaultResetScrollToCoords = null;
      return;
    } else if (this.props.resetScrollToCoords) {
      this.scrollToPosition(
        this.props.resetScrollToCoords.x,
        this.props.resetScrollToCoords.y,
        true
      );
    } else {
      if (this.defaultResetScrollToCoords) {
        this.scrollToPosition(
          this.defaultResetScrollToCoords.x,
          this.defaultResetScrollToCoords.y,
          true
        );
        this.defaultResetScrollToCoords = null;
      } else {
        this.scrollToPosition(0, 0, true);
      }
    }
  };

  _scrollToFocusedInputWithNodeHandle = (
    nodeID,
    extraHeight,
    keyboardOpeningTime
  ) => {
    if (extraHeight === undefined) {
      extraHeight = this.props.extraHeight;
    }
    const reactNode = findNodeHandle(nodeID);
    this.scrollToFocusedInput(
      reactNode,
      extraHeight + this.props.extraScrollHeight,
      keyboardOpeningTime !== undefined
        ? keyboardOpeningTime
        : this.props.keyboardOpeningTime || 0
    );
  };
  contentOffsetYValue = new Animated.Value(this.props.defaultPosition.y);
  contentOffsetXValue = new Animated.Value(this.props.defaultPosition.x);
  contentInsetValue = new Animated.Value(this.props.paddingTop);

  onScrollEvent = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            y: this.contentOffsetYValue,
            x: this.contentOffsetXValue
          }
          // contentInset: { top: this.contentInsetValue }
        }
      }
    ],
    { useNativeDriver: true }
  );

  _handleOnScroll = ([y]) => {
    this.position = {
      x: 0,
      y
    };
  };

  _handleRef = ref => {
    this._rnkasv_keyboardView = ref
      ? ScrollIntoViewDefaultOptions.extractNativeRef(ref)
      : ref;
    if (this.props.innerRef) {
      this.props.innerRef(this._rnkasv_keyboardView);
    }
  };

  update = () => {
    const currentlyFocusedField = TextInput.State.currentlyFocusedField();
    const responder = this.getScrollResponder();

    if (!currentlyFocusedField || !responder) {
      return;
    }

    this._scrollToFocusedInputWithNodeHandle(currentlyFocusedField);
  };

  render() {
    const {
      enableOnAndroid,
      contentContainerStyle,
      keyboardDismissMode = "interactive",
      onScroll,
      paddingTop = 0,
      paddingBottom = 0,
      paddingLeft = 0,
      paddingRight = 0,
      ...otherProps
    } = this.props;
    const { keyboardSpace } = this.state;
    let newContentContainerStyle;
    if (Platform.OS === "android" && enableOnAndroid) {
      newContentContainerStyle = [].concat(contentContainerStyle).concat({
        paddingBottom:
          ((contentContainerStyle || {}).paddingBottom || 0) + keyboardSpace
      });
    }

    return (
      <>
        <ScrollView
          {...otherProps}
          keyboardDismissMode={keyboardDismissMode}
          contentInset={{
            top: paddingTop,
            bottom: keyboardSpace + paddingBottom,
            left: paddingLeft,
            right: paddingRight
          }}
          automaticallyAdjustContentInsets={false}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={1}
          ref={this._handleRef}
          contentContainerStyle={
            newContentContainerStyle || contentContainerStyle
          }
          getScrollResponder={this.getScrollResponder}
          scrollToPosition={this.scrollToPosition}
          scrollToEnd={this.scrollToEnd}
          scrollForExtraHeightOnAndroid={this.scrollForExtraHeightOnAndroid}
          scrollToFocusedInput={this.scrollToFocusedInput}
          scrollIntoView={this.scrollIntoView}
          handleOnScroll={this._handleOnScroll}
          update={this.update}
          onScroll={this.onScrollEvent}
        />
        <Animated.Code
          exec={Animated.block([
            this.props.scrollY &&
              Animated.set(this.props.scrollY, this.contentOffsetYValue),

            this.props.scrollX &&
              Animated.set(this.props.scrollX, this.contentOffsetXValue),

            this.props.topInsetValue &&
              Animated.set(this.props.topInsetValue, this.contentInsetValue),
            Animated.onChange(this.contentOffsetYValue, [
              Animated.call([this.contentOffsetYValue], this._handleOnScroll)
            ])
          ])}
        />
      </>
    );
  }
}
