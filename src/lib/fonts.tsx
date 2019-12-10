import { StyleSheet } from "react-native";

export const SPONGEBOB_FONT = "Some Time Later";
export const INCONSOLATA_FONT = "Inconsolata";
export const MINECRAFT_FONT = "Minecrafter";
export const COMIC_BOOK = "DigitalStrip";

export const FONT_STYLES = StyleSheet.create({
  spongebob: {
    fontFamily: SPONGEBOB_FONT,
    fontWeight: "normal"
  },
  comic: {
    fontFamily: COMIC_BOOK,
    fontWeight: "normal"
  },
  minecraft: {
    fontFamily: MINECRAFT_FONT,
    fontWeight: "normal"
  },
  monospace: {
    fontFamily: INCONSOLATA_FONT,
    fontWeight: "bold"
  }
});
