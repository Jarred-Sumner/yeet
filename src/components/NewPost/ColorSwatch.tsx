import chroma from "chroma-js";
import * as React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { COLORS, SPACING } from "../../lib/styles";
import { normalizeBackgroundColor } from "../Posts/_normalizedBackgroundColor";
import { BaseButton } from "react-native-gesture-handler";

export type ColorSwatch = {
  backgroundColor: string;
  color: string;
};

type ColorSwatchProps = ColorSwatch & {
  size: number;
};

export const colorSwatchKey = ({ backgroundColor, color }: ColorSwatch) =>
  `${backgroundColor}-${color}`;

export const COMMENT_COLORS: Array<ColorSwatch> = [
  {
    backgroundColor: "#FFFFFF",
    color: "white"
  },
  {
    backgroundColor: "#000000",
    color: "white"
  },

  {
    backgroundColor: "#1B30ED",
    color: "white"
  },

  {
    backgroundColor: "#25F4C3",
    color: "white"
  },
  {
    backgroundColor: "#D42A53",
    color: "white"
  },
  {
    backgroundColor: "#FDC638",
    color: "white"
  },
  {
    backgroundColor: "#A067FC",
    color: "white"
  },
  {
    backgroundColor: "#F967FC",
    color: "white"
  },
  {
    backgroundColor: "rgb(212,18,15)",
    color: "white"
  }
];

const styles = StyleSheet.create({
  container: {
    shadowRadius: 2,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.25,
    shadowColor: "black"
  },
  color: {
    overflow: "hidden",
    borderWidth: 2
  },
  selectableContainer: {
    paddingHorizontal: SPACING.half,
    alignItems: "center",

    justifyContent: "center",
    paddingBottom: 2
  },
  selectedBorder: {
    backgroundColor: COLORS.primary
  },

  unselectedBorder: {
    backgroundColor: "transparent"
  },
  selectableBorder: {
    height: 3
  }
});

const ColorSwatchComponent = React.memo(
  ({ backgroundColor: _backgroundColor, color, size }: ColorSwatchProps) => {
    const backgroundColor = chroma(_backgroundColor)
      .alpha(1)
      .css();

    const sizeStyle = React.useMemo(
      () => ({ width: size, height: size, borderRadius: size / 2 }),
      [size]
    );
    const containerStyle = React.useMemo(() => [styles.container, sizeStyle], [
      styles,
      sizeStyle
    ]);
    const swatchStyle = React.useMemo(
      () => [styles.color, sizeStyle, { borderColor: color, backgroundColor }],
      [styles, color, backgroundColor, sizeStyle]
    );

    return (
      <View style={containerStyle}>
        <View style={swatchStyle}></View>
      </View>
    );
  }
);

export const SelectableColorSwatch = ({
  backgroundColor,
  color,
  size,
  height,
  waitFor,
  selectedSize,
  selected,
  selectedStyle,
  bottomBorderSelected = true,
  onPress
}) => {
  const handlePress = React.useCallback(() => {
    // if (handlerState === State.END) {
    onPress(backgroundColor);
    // }
  }, [backgroundColor, color, selected, onPress]);

  return (
    <BaseButton style={{ overflow: "visible" }} onPress={handlePress}>
      <View
        style={[
          styles.selectableContainer,
          {
            height
          },
          selected && selectedStyle,
          {
            transform: [
              { scale: selectedSize && selected ? selectedSize / size : 1 }
            ]
          }
        ]}
      >
        <ColorSwatchComponent
          color={color}
          backgroundColor={backgroundColor}
          size={size}
        />
      </View>
    </BaseButton>
  );
};
