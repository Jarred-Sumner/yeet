import * as React from "react";
import TextInput from "./CustomTextInputComponent";
import { requireNativeComponent, Platform } from "react-native";

let EmojiInput = null;
if (Platform.OS === "ios") {
  EmojiInput = requireNativeComponent("EmojiTextInputView");
}

export const EmojiTextInput = React.forwardRef((props, ref) => {
  return (
    <TextInput
      {...props}
      emojiOnly
      ref={ref}
      keyboardAppeareance="dark"
      RCTMultilineTextInputView={EmojiInput}
    />
  );
});
