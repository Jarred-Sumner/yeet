import { StyleSheet, PixelRatio } from "react-native";
import { TextTemplate } from "../../../lib/buildPost";
import { COLORS } from "../../../lib/styles";
import { normalizeBackgroundColor } from "../../Posts/CommentsViewer";

export const textInputPresets = {
  [TextTemplate.comment]: {
    fontSizes: {
      "0": 14,
      "8": 14,
      "12": 14,
      "24": 14
    },
    presets: {
      backgroundColor: normalizeBackgroundColor("#7367FC"),
      color: "white",
      highlightInset: -6,
      highlightCornerRadius: 2
    }
  },
  [TextTemplate.post]: {
    fontSizes: {
      "0": 24,
      "8": 24,
      "12": 24,
      "24": 24
    },
    presets: {
      backgroundColor: "#fff",
      color: "#000",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "#ccc",
      highlightInset: 0,
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: null
    }
  },
  [TextTemplate.basic]: {
    fontSizes: {
      "0": 24,
      "8": 24,
      "12": 24,
      "24": 24
    },
    presets: {
      backgroundColor: "#000",
      color: "#fff",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "#ccc",
      highlightInset: -6,
      highlightCornerRadius: 2,
      textShadowOffset: {
        width: StyleSheet.hairlineWidth,
        height: StyleSheet.hairlineWidth
      },
      textShadowRadius: 0
    }
  },
  [TextTemplate.bigWords]: {
    fontSizes: {
      "0": 48,
      "8": 36,
      "12": 36,
      "24": 30
    },
    presets: {
      backgroundColor: "#000",
      color: "#fff",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "#ccc",
      textAlign: "center",
      highlightInset: -6,
      highlightCornerRadius: 2,
      textShadowOffset: {
        width: StyleSheet.hairlineWidth,
        height: StyleSheet.hairlineWidth
      },
      textShadowRadius: 0
    }
  },
  [TextTemplate.gary]: {
    fontSizes: {
      "0": 48,
      "8": 48,
      "12": 48,
      "24": 48
    },
    presets: {
      backgroundColor: COLORS.secondary,
      textAlign: "center",
      color: "rgb(250,197,194)",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: StyleSheet.hairlineWidth
    }
  },
  [TextTemplate.comic]: {
    fontSizes: {
      "0": 20,
      "8": 20,
      "12": 20,
      "24": 20
    },
    presets: {
      backgroundColor: "white",
      textAlign: "center",
      color: "black",
      borderRadius: 0,
      highlightInset: -12,

      highlightCornerRadius: 4,

      textShadowColor: "transparent",
      placeholderColor: "white",

      textShadowOffset: {
        width: 0,
        height: 0
      },
      textShadowRadius: null
    }
  },

  [TextTemplate.pickaxe]: {
    fontSizes: {
      "0": 24,
      "8": 24,
      "12": 24,
      "24": 24
    },
    presets: {
      backgroundColor: COLORS.secondary,
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      textShadowOffset: {
        width: 1,
        height: 1
      },
      textShadowRadius: StyleSheet.hairlineWidth
    }
  },
  [TextTemplate.terminal]: {
    fontSizes: {
      "0": 24,
      "8": 24,
      "12": 24,
      "24": 24
    },
    presets: {
      backgroundColor: COLORS.secondary,
      color: "white",
      textShadowColor: "rgba(51,51,51, 0.25)",
      placeholderColor: "white",
      highlightInset: -6,
      textAlign: "left",
      highlightCornerRadius: 2,
      textShadowOffset: {
        width: StyleSheet.hairlineWidth,
        height: StyleSheet.hairlineWidth
      },
      textShadowRadius: 0
    }
  }
};
