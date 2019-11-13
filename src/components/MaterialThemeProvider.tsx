import * as React from "react";
import { DefaultTheme, Provider as PaperProvider } from "react-native-paper";
import { FontFamily } from "./Text";
import { COLORS } from "../lib/styles";

const theme = {
  dark: true,
  mode: "exact",
  roundness: 8,
  colors: {
    primary: "#000",
    accent: COLORS.secondary,
    text: "#000",
    error: COLORS.error,
    placeholder: "#AAA",
    disabled: "#999",
    background: "#CCC"
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
