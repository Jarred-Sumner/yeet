import * as React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";
import { SPACING } from "../lib/styles";
import { HelperText } from "react-native-paper";

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 0,
    position: "relative"
  },
  helperText: {
    position: "absolute",
    bottom: SPACING.half * -1,
    flexShrink: 0,
    left: 0
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
    const hasError = !!error && error.length > 0;
    return (
      <View style={styles.container}>
        <TextInput
          disabled={disabled}
          value={value}
          label={label}
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
