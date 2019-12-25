/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */
import createReactClass from "create-react-class";
import warning from "fbjs/lib/warning";

import invariant from "invariant";
import React from "react";
import NativeMethodsMixin from "react-native/Libraries/Renderer/shims/NativeMethodsMixin";
import ReactNative from "react-native/Libraries/Renderer/shims/ReactNative";
import TextAncestor from "react-native/Libraries/Text/TextAncestor";
import {
  requireNativeComponent,
  StyleSheet,
  Text,
  Platform,
  TouchableWithoutFeedback,
  findNodeHandle,
  UIManager
} from "react-native";
import {
  currentlyFocusedField,
  focusTextInput,
  blurTextInput,
  focusField,
  unregisterInput,
  registerInput,
  blurField
} from "./TextInputState";

let AndroidTextInput;
let _RCTMultilineTextInputView;
let RCTSinglelineTextInputView;

if (Platform.OS === "android") {
  AndroidTextInput = require("react-native/Libraries/Components/TextInput/AndroidTextInputNativeComponent")
    .default;
} else if (Platform.OS === "ios") {
  _RCTMultilineTextInputView = requireNativeComponent("YeetTextInputView");
  RCTSinglelineTextInputView = () => null;
}

const onlyMultiline = {
  onTextInput: true,
  children: true
};

const emptyFunctionThatReturnsTrue = () => true;

/**
 * A foundational component for inputting text into the app via a
 * keyboard. Props provide configurability for several features, such as
 * auto-correction, auto-capitalization, placeholder text, and different keyboard
 * types, such as a numeric keypad.
 *
 * The simplest use case is to plop down a `TextInput` and subscribe to the
 * `onChangeText` events to read the user input. There are also other events,
 * such as `onSubmitEditing` and `onFocus` that can be subscribed to. A simple
 * example:
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react';
 * import { AppRegistry, TextInput } from 'react-native';
 *
 * export default class UselessTextInput extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = { text: 'Useless Placeholder' };
 *   }
 *
 *   render() {
 *     return (
 *       <TextInput
 *         style={{height: 40, borderColor: 'gray', borderWidth: 1}}
 *         onChangeText={(text) => this.setState({text})}
 *         value={this.state.text}
 *       />
 *     );
 *   }
 * }
 *
 * // skip this line if using Create React Native App
 * AppRegistry.registerComponent('AwesomeProject', () => UselessTextInput);
 * ```
 *
 * Two methods exposed via the native element are .focus() and .blur() that
 * will focus or blur the TextInput programmatically.
 *
 * Note that some props are only available with `multiline={true/false}`.
 * Additionally, border styles that apply to only one side of the element
 * (e.g., `borderBottomColor`, `borderLeftWidth`, etc.) will not be applied if
 * `multiline=false`. To achieve the same effect, you can wrap your `TextInput`
 * in a `View`:
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react';
 * import { AppRegistry, View, TextInput } from 'react-native';
 *
 * class UselessTextInput extends Component {
 *   render() {
 *     return (
 *       <TextInput
 *         {...this.props} // Inherit any props passed to it; e.g., multiline, numberOfLines below
 *         editable = {true}
 *         maxLength = {40}
 *       />
 *     );
 *   }
 * }
 *
 * export default class UselessTextInputMultiline extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = {
 *       text: 'Useless Multiline Placeholder',
 *     };
 *   }
 *
 *   // If you type something in the text box that is a color, the background will change to that
 *   // color.
 *   render() {
 *     return (
 *      <View style={{
 *        backgroundColor: this.state.text,
 *        borderBottomColor: '#000000',
 *        borderBottomWidth: 1 }}
 *      >
 *        <UselessTextInput
 *          multiline = {true}
 *          numberOfLines = {4}
 *          onChangeText={(text) => this.setState({text})}
 *          value={this.state.text}
 *        />
 *      </View>
 *     );
 *   }
 * }
 *
 * // skip these lines if using Create React Native App
 * AppRegistry.registerComponent(
 *  'AwesomeProject',
 *  () => UselessTextInputMultiline
 * );
 * ```
 *
 * `TextInput` has by default a border at the bottom of its view. This border
 * has its padding set by the background image provided by the system, and it
 * cannot be changed. Solutions to avoid this is to either not set height
 * explicitly, case in which the system will take care of displaying the border
 * in the correct position, or to not display the border by setting
 * `underlineColorAndroid` to transparent.
 *
 * Note that on Android performing text selection in input can change
 * app's activity `windowSoftInputMode` param to `adjustResize`.
 * This may cause issues with components that have position: 'absolute'
 * while keyboard is active. To avoid this behavior either specify `windowSoftInputMode`
 * in AndroidManifest.xml ( https://developer.android.com/guide/topics/manifest/activity-element.html )
 * or control this param programmatically with native code.
 *
 */

const TextInput = createReactClass({
  displayName: "TextInput",
  getDefaultProps() {
    return {
      allowFontScaling: true,
      RCTMultilineTextInputView: _RCTMultilineTextInputView,
      rejectResponderTermination: true,
      multiline: true,
      underlineColorAndroid: "transparent"
    };
  },
  /**
   * `NativeMethodsMixin` will look for this when invoking `setNativeProps`. We
   * make `this` look like an actual native component class.
   */

  statics: {
    State: {
      currentlyFocusedField: currentlyFocusedField,
      focusTextInput: focusTextInput,
      blurTextInput: blurTextInput
    }
  },

  /**
   * Returns `true` if the input is currently focused; `false` otherwise.
   */
  isFocused() {
    return (
      currentlyFocusedField() === ReactNative.findNodeHandle(this._inputRef)
    );
  },

  _inputRef: undefined,
  _focusSubscription: undefined,
  _lastNativeText: undefined,
  _lastNativeSelection: undefined,
  _rafId: null,

  componentDidMount() {
    this._lastNativeText = this.props.value;
    const tag = ReactNative.findNodeHandle(this._inputRef);
    if (tag != null) {
      // tag is null only in unit tests
      registerInput(tag);
    }

    if (this.props.autoFocus) {
      this._rafId = requestAnimationFrame(this.focus);
    }
  },

  focus() {
    focusTextInput(ReactNative.findNodeHandle(this._inputRef));
  },
  blur() {
    blurTextInput(ReactNative.findNodeHandle(this._inputRef));
  },

  componentWillUnmount() {
    this._focusSubscription && this._focusSubscription.remove();
    if (this.isFocused()) {
      this.blur();
    }
    const tag = ReactNative.findNodeHandle(this._inputRef);
    if (tag != null) {
      unregisterInput(tag);
    }
    if (this._rafId != null) {
      cancelAnimationFrame(this._rafId);
    }
  },

  /**
   * Removes all text from the `TextInput`.
   */
  clear() {
    this.setNativeProps({ text: "" });
  },

  render() {
    let textInput;
    if (Platform.OS === "ios") {
      textInput = this._renderIOS();
    } else if (Platform.OS === "android") {
      textInput = this._renderAndroid();
    }
    return (
      <TextAncestor.Provider value={true}>{textInput}</TextAncestor.Provider>
    );
  },

  _getText() {
    return typeof this.props.value === "string"
      ? this.props.value
      : typeof this.props.defaultValue === "string"
      ? this.props.defaultValue
      : "";
  },

  _setNativeRef(ref) {
    this._inputRef = ref;
  },

  _renderIOSLegacy() {
    let textContainer;

    const props = Object.assign({}, this.props);

    props.style = [this.props.style];

    if (props.selection && props.selection.end == null) {
      props.selection = {
        start: props.selection.start,
        end: props.selection.start
      };
    }

    if (!props.multiline) {
      if (__DEV__) {
        for (const propKey in onlyMultiline) {
          if (props[propKey]) {
            const error = new Error(
              `TextInput prop \`${propKey}\` is only supported with multiline.`
            );
            warning(false, "%s", error.stack);
          }
        }
      }
      textContainer = (
        <RCTSinglelineTextInputView
          ref={this._setNativeRef}
          {...props}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onSelectionChange={this._onSelectionChange}
          onSelectionChangeShouldSetResponder={emptyFunctionThatReturnsTrue}
          text={this._getText()}
        />
      );
    } else {
      let children = props.children;
      let childCount = 0;
      React.Children.forEach(children, () => ++childCount);
      invariant(
        !(props.value && childCount),
        "Cannot specify both value and children."
      );
      if (childCount >= 1) {
        children = (
          <Text
            style={props.style}
            allowFontScaling={props.allowFontScaling}
            maxFontSizeMultiplier={props.maxFontSizeMultiplier}
          >
            {children}
          </Text>
        );
      }
      if (props.inputView) {
        children = [children, props.inputView];
      }
      props.style.unshift(styles.multilineInput);
      const { RCTMultilineTextInputView } = props;

      textContainer = (
        <RCTMultilineTextInputView
          ref={this._setNativeRef}
          {...props}
          children={children}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onContentSizeChange={this.props.onContentSizeChange}
          onSelectionChange={this._onSelectionChange}
          onTextInput={this._onTextInput}
          onSelectionChangeShouldSetResponder={emptyFunctionThatReturnsTrue}
          text={this._getText()}
          dataDetectorTypes={this.props.dataDetectorTypes}
          onScroll={this._onScroll}
        />
      );
    }

    return (
      <TouchableWithoutFeedback
        onLayout={props.onLayout}
        onPress={this._onPress}
        rejectResponderTermination={true}
        accessible={props.accessible}
        accessibilityLabel={props.accessibilityLabel}
        accessibilityRole={props.accessibilityRole}
        accessibilityState={props.accessibilityState}
        nativeID={this.props.nativeID}
        testID={props.testID}
      >
        {textContainer}
      </TouchableWithoutFeedback>
    );
  },

  _renderIOS() {
    const props = Object.assign({}, this.props);
    props.style = [this.props.style];
    const { RCTMultilineTextInputView } = props;

    if (props.selection && props.selection.end == null) {
      props.selection = {
        start: props.selection.start,
        end: props.selection.start
      };
    }

    const RCTTextInputView = props.multiline
      ? RCTMultilineTextInputView
      : RCTSinglelineTextInputView;

    if (props.multiline) {
      props.style.unshift(styles.multilineInput);
    }

    return (
      <RCTTextInputView
        ref={this._setNativeRef}
        {...props}
        onFocus={this._onFocus}
        onBlur={this._onBlur}
        onChange={this._onChange}
        onContentSizeChange={this.props.onContentSizeChange}
        onSelectionChange={this._onSelectionChange}
        onTextInput={this._onTextInput}
        onSelectionChangeShouldSetResponder={emptyFunctionThatReturnsTrue}
        text={this._getText()}
        dataDetectorTypes={this.props.dataDetectorTypes}
        onScroll={this._onScroll}
      />
    );
  },

  _renderAndroid() {
    const props = Object.assign({}, this.props);
    props.style = [this.props.style];
    props.autoCapitalize = props.autoCapitalize || "sentences";
    let children = this.props.children;
    let childCount = 0;
    React.Children.forEach(children, () => ++childCount);
    invariant(
      !(this.props.value && childCount),
      "Cannot specify both value and children."
    );
    if (childCount > 1) {
      children = <Text>{children}</Text>;
    }

    if (props.selection && props.selection.end == null) {
      props.selection = {
        start: props.selection.start,
        end: props.selection.start
      };
    }

    const textContainer = (
      <AndroidTextInput
        ref={this._setNativeRef}
        {...props}
        mostRecentEventCount={0}
        onFocus={this._onFocus}
        onBlur={this._onBlur}
        onChange={this._onChange}
        onSelectionChange={this._onSelectionChange}
        onTextInput={this._onTextInput}
        text={this._getText()}
        children={children}
        disableFullscreenUI={this.props.disableFullscreenUI}
        textBreakStrategy={this.props.textBreakStrategy}
        onScroll={this._onScroll}
      />
    );

    return (
      <TouchableWithoutFeedback
        onLayout={props.onLayout}
        onPress={this._onPress}
        accessible={this.props.accessible}
        accessibilityLabel={this.props.accessibilityLabel}
        accessibilityRole={this.props.accessibilityRole}
        accessibilityState={this.props.accessibilityState}
        nativeID={this.props.nativeID}
        testID={this.props.testID}
      >
        {textContainer}
      </TouchableWithoutFeedback>
    );
  },

  _onFocus(event) {
    const tag = findNodeHandle(this._inputRef);
    if (!currentlyFocusedField(tag)) {
      this.focus();
    }

    if (this.props.onFocus) {
      this.props.onFocus(event);
    }

    if (this.props.selectionState) {
      this.props.selectionState.focus();
    }
  },

  _onPress(event) {
    if (this.props.editable || this.props.editable === undefined) {
      this.focus();
    }
  },

  _onChange(event) {
    // Make sure to fire the mostRecentEventCount first so it is already set on
    // native when the text value is set.
    if (this._inputRef && this._inputRef.setNativeProps) {
      ReactNative.setNativeProps(this._inputRef, {
        mostRecentEventCount: event.nativeEvent.eventCount
      });
    }

    const text = event.nativeEvent.text;
    this.props.onChange && this.props.onChange(event);
    this.props.onChangeText && this.props.onChangeText(text);

    if (!this._inputRef) {
      // calling `this.props.onChange` or `this.props.onChangeText`
      // may clean up the input itself. Exits here.
      return;
    }

    this._lastNativeText = text;
    this.forceUpdate();
  },

  _onSelectionChange(event) {
    this.props.onSelectionChange && this.props.onSelectionChange(event);

    if (!this._inputRef) {
      // calling `this.props.onSelectionChange`
      // may clean up the input itself. Exits here.
      return;
    }

    this._lastNativeSelection = event.nativeEvent.selection;

    if (this.props.selection || this.props.selectionState) {
      this.forceUpdate();
    }
  },

  componentDidUpdate() {
    // This is necessary in case native updates the text and JS decides
    // that the update should be ignored and we should stick with the value
    // that we have in JS.
    const nativeProps = {};

    if (
      this._lastNativeText !== this.props.value &&
      typeof this.props.value === "string"
    ) {
      nativeProps.text = this.props.value;
    }

    // Selection is also a controlled prop, if the native value doesn't match
    // JS, update to the JS value.
    const { selection } = this.props;
    if (
      this._lastNativeSelection &&
      selection &&
      (this._lastNativeSelection.start !== selection.start ||
        this._lastNativeSelection.end !== selection.end)
    ) {
      nativeProps.selection = this.props.selection;
    }

    if (
      Object.keys(nativeProps).length > 0 &&
      this._inputRef &&
      this._inputRef.setNativeProps
    ) {
      ReactNative.setNativeProps(this._inputRef, nativeProps);
    }

    if (this.props.selectionState && selection) {
      this.props.selectionState.update(selection.start, selection.end);
    }
  },

  _onBlur(event) {
    blurField(findNodeHandle(this._inputRef));

    if (this.props.onBlur) {
      this.props.onBlur(event);
    }

    if (this.props.selectionState) {
      this.props.selectionState.blur();
    }
  },

  _onTextInput(event) {
    this.props.onTextInput && this.props.onTextInput(event);
  },

  _onScroll(event) {
    this.props.onScroll && this.props.onScroll(event);
  }
});

const styles = StyleSheet.create({
  multilineInput: {
    // This default top inset makes RCTMultilineTextInputView seem as close as possible
    // to single-line RCTSinglelineTextInputView defaults, using the system defaults
    // of font size 17 and a height of 31 points.
    paddingTop: 5
  }
});

export default TextInput;
export { TextInput };
