import { Text as RNText, StyleSheet, Platform, TextProps } from "react-native";
import React from "react";
import { isArray } from "lodash";

export const LETTER_SPACING_MAPPING = {
  "6": 0.043,
  "7": 0.032,
  "8": 0.024,
  "9": 0.016,
  "10": 0.01,
  "11": 0.005,
  "12": 0,
  "13": -0.0025,
  "14": -0.006,
  "15": -0.009,
  "16": -0.011,
  "17": -0.013,
  "18": -0.014,
  "20": -0.017,
  "24": -0.019,
  "30": -0.021,
  "40": -0.022,
  "80": -0.022
};

// export const getLetterSpacing = (size: number) => {

//   let lastSize = 6;
//   Object.keys(LETTER_SPACING_MAPPING).map(key => {
//     const _size = parseInt(key, 10);

//     return Math.abs(_size - size)
//   })
// }

export enum AndroidFontFamily {
  regular = "Sharp Grotesk Exp",
  thin = "Sharp Grotesk Exp",
  semiBold = "Sharp Grotesk Exp",
  medium = "Sharp Grotesk Exp",
  bold = "Sharp Grotesk Exp",
  extraBoldFont = "Sharp Grotesk Exp",
  black = "Sharp Grotesk Exp"
}

export enum iOSFontFamily {
  regular = "Sharp Grotesk Exp",
  thin = "Sharp Grotesk Exp",
  semiBold = "Sharp Grotesk Exp",
  medium = "Sharp Grotesk Exp",
  bold = "Sharp Grotesk Exp",
  extraBoldFont = "Sharp Grotesk Exp",
  black = "Sharp Grotesk Exp"
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
  boldFont: {
    fontFamily: FontFamily.bold,
    fontWeight: "bold",
    color: "white"
  },
  extraBoldFont: {
    fontFamily: FontFamily.extraBoldFont,
    fontWeight: "700",
    color: "white"
  },
  blackFont: {
    fontFamily: FontFamily.black,
    fontWeight: "900",
    color: "white"
  }
});

const combinedStyles = styles => {
  let grouped = [];

  styles.forEach(style => {
    if (isArray(style)) {
      grouped = grouped.concat(style);
    } else {
      grouped.push(style);
    }
  });

  return styles.filter(Boolean);
};

export const Text = React.memo(({ children, style, ...otherProps }) => (
  <RNText
    {...otherProps}
    style={combinedStyles([fontStyleSheets.regularFont, style])}
  >
    {children}
  </RNText>
)) as React.ComponentType<TextProps>;

export const ThinText = React.memo(({ children, style, ...otherProps }) => (
  <RNText
    {...otherProps}
    style={combinedStyles([fontStyleSheets.thinFont, style])}
  >
    {children}
  </RNText>
)) as React.ComponentType<TextProps>;

export const SemiBoldText = React.memo(({ children, style, ...otherProps }) => (
  <RNText
    {...otherProps}
    style={combinedStyles([fontStyleSheets.semiBoldFont, style])}
  >
    {children}
  </RNText>
)) as React.ComponentType<TextProps>;

export const MediumText = React.memo(({ children, style, ...otherProps }) => (
  <RNText
    {...otherProps}
    style={combinedStyles([fontStyleSheets.mediumFont, style])}
  >
    {children}
  </RNText>
)) as React.ComponentType<TextProps>;

export const BoldText = React.memo(({ children, style, ...otherProps }) => (
  <RNText
    {...otherProps}
    style={combinedStyles([fontStyleSheets.boldFont, style])}
  >
    {children}
  </RNText>
)) as React.ComponentType<TextProps>;

export const ExtraBoldText = React.memo(
  ({ children, style, ...otherProps }) => (
    <RNText
      {...otherProps}
      style={combinedStyles([fontStyleSheets.extraBoldFont, style])}
    >
      {children}
    </RNText>
  )
) as React.ComponentType<TextProps>;

export const BlackText = React.memo(({ children, style, ...otherProps }) => (
  <RNText
    {...otherProps}
    style={combinedStyles([fontStyleSheets.blackFont, style])}
  >
    {children}
  </RNText>
)) as React.ComponentType<TextProps>;
