import * as React from "react";
import { KeyboardAccessoryView } from "react-native-keyboard-input";
import { TextInput } from "react-native";

export const InputAccessoryView = ({ children, nativeID }) => {
  return null;
  return (
    <KeyboardAccessoryView
      renderContent={() => children}
      addBottomV
      kbInputRef={TextInput.State.currentlyFocusedField()}
    />
  );
};
