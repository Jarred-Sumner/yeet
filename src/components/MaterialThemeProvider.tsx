import * as React from "react";
import { DefaultTheme, Provider as PaperProvider } from "react-native-paper";
import { FontFamily } from "./Text";
import { COLORS } from "../lib/styles";

const theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: "white",
    accent: COLORS.secondary,
    text: "#fcfcfc",
    error: COLORS.error,
    placeholder: "#aaa",
    disabled: "#999",
    background: COLORS.primaryDark
  },
  fonts: {
    regular: FontFamily.regular,
    medium: FontFamily.medium,
    light: FontFamily.thin,
    thin: FontFamily.thin,
    bold: FontFamily.bold
  }
};

export const MaterialThemeProvider = ({ children }) => (
  <PaperProvider theme={theme}>{children}</PaperProvider>
);

export default MaterialThemeProvider;
