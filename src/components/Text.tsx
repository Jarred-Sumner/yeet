import { Text as RNText, StyleSheet, Platform } from "react-native";
import React from "react";

export enum AndroidFontFamily {
  regular = "ProximaNova-Regular",
  thin = "Proxima Nova Thin",
  semiBold = "Proxima Nova Semibold",
  medium = "Proxima Nova Medium",
  bold = "Proxima Nova Bold"
}

export enum iOSFontFamily {
  regular = "Proxima Nova",
  thin = "Proxima Nova",
  semiBold = "Proxima Nova",
  medium = "Proxima Nova",
  bold = "Proxima Nova"
}

export const FontFamily = Platform.select({
  ios: iOSFontFamily,
  android: AndroidFontFamily
});

export const fontStyleSheets = StyleSheet.create({
  muted: {
    color: "#ccc"
  },
  regularFont: {
    fontFamily: FontFamily.regular,
    fontWeight: "normal",
    color: "white"
  },
  thinFont: {
    fontFamily: FontFamily.thin,
    fontWeight: "300",
    color: "white"
  },
  semiBoldFont: {
    fontFamily: FontFamily.semiBold,
    fontWeight: "600",
    color: "white"
  },
  mediumFont: {
    fontFamily: FontFamily.medium,
    fontWeight: "500",
    color: "white"
  },
  boldFont: { fontFamily: FontFamily.bold, fontWeight: "bold", color: "white" }
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
