import * as React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";
import { SPACING } from "../lib/styles";
import { HelperText } from "react-native-paper";
import { TextInput as RawTextInput } from "react-native-gesture-handler";
import { FontFamily } from "./Text";

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.half,
    position: "relative"
  },
  input: {
    borderRadius: 2,
    overflow: "hidden"
  },
  passwordInput: {
    paddingVertical: SPACING.normal,
    paddingHorizontal: SPACING.normal,
    backgroundColor: "white",
    fontFamily: FontFamily.regular,
    fontSize: 16
  },
  helperText: {
    flexShrink: 0
  }
});

export const FormField = React.memo(
  ({
    onChangeText,
    onBlur,
    value,
    label,
    mode = "flat",
    underlineColor = "#cccccc",
    disabled = false,
    placeholder,
    autoCompleteType,
    blurOnSubmit = false,
    required,
    inputRef,
    error,
    secureTextEntry,
    autoCapitalize,
    autoFocus,

    enablesReturnKeyAutomatically,
    ...props
  }) => {
    const renderTextInput = React.useCallback(props => {
      return <RawTextInput {...props} />;
    }, []);
    const hasError = !!error && error.length > 0;
    const TextInputComponent = secureTextEntry ? RawTextInput : TextInput;
    return (
      <View style={styles.container}>
        <TextInputComponent
          disabled={disabled}
          value={value}
          label={label}
          keyboardAppearance="dark"
          ref={inputRef}
          required={required}
          blurOnSubmit={blurOnSubmit}
          onChangeText={onChangeText}
          autoCompleteType={autoCompleteType}
          secureTextEntry={secureTextEntry}
          underlineColor={underlineColor}
          onBlur={onBlur}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          enablesReturnKeyAutomatically={enablesReturnKeyAutomatically}
          mode={mode}
          placeholder={placeholder}
          error={hasError}
          {...props}
          render={renderTextInput}
          style={[styles.input, secureTextEntry && styles.passwordInput]}
        />
        <View style={styles.helperText}>
          <HelperText visible={hasError} type="error">
            {error}
          </HelperText>
        </View>
      </View>
    );
  }
);

export default FormField;
