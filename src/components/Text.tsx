import { Text as RNText, StyleSheet } from "react-native";
import React from "react";

export const fontStyleSheets = StyleSheet.create({
  muted: {
    color: "#ccc"
  },
  regularFont: {
    fontFamily: "Proxima Nova",
    fontWeight: "normal",
    color: "white"
  },
  thinFont: {
    fontFamily: "Proxima Nova Thin",
    fontWeight: "300",
    color: "white"
  },
  semiBoldFont: {
    fontFamily: "Proxima Nova",
    fontWeight: "600",
    color: "white"
  },
  mediumFont: { fontFamily: "Proxima Nova", fontWeight: "500", color: "white" },
  boldFont: { fontFamily: "Proxima Nova", fontWeight: "bold", color: "white" }
});

export const Text = ({ children, style, ...otherProps }) => (
  <RNText {...otherProps} style={[fontStyleSheets.regularFont, style]}>
    {children}
  </RNText>
);

export const ThinText = ({ children, style, ...otherProps }) => (
  <RNText {...otherProps} style={[fontStyleSheets.thinFont, style]}>
    {children}
  </RNText>
);

export const SemiBoldText = ({ children, style, ...otherProps }) => (
  <RNText {...otherProps} style={[fontStyleSheets.semiBoldFont, style]}>
    {children}
  </RNText>
);

export const MediumText = ({ children, style, ...otherProps }) => (
  <RNText {...otherProps} style={[fontStyleSheets.mediumFont, style]}>
    {children}
  </RNText>
);

export const BoldText = ({ children, style, ...otherProps }) => (
  <RNText {...otherProps} style={[fontStyleSheets.boldFont, style]}>
    {children}
  </RNText>
);
