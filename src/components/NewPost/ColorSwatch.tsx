import * as React from "react";
import { View, StyleSheet } from "react-native";
import {
  BaseButton,
  TouchableWithoutFeedback,
  LongPressGestureHandler,
  TapGestureHandler,
  State
} from "react-native-gesture-handler";
import { SPACING, COLORS } from "../../lib/styles";
import chroma from "chroma-js";
import { normalizeBackgroundColor } from "../Posts/CommentsViewer";

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
    backgroundColor: normalizeBackgroundColor("#000"),
    color: "white"
  },
  {
    backgroundColor: normalizeBackgroundColor("#FC6767"),
    color: "white"
  },

  {
    backgroundColor: normalizeBackgroundColor("#FCC067"),
    color: "white"
  },

  {
    backgroundColor: normalizeBackgroundColor("#C3FC67"),
    color: "white"
  },
  {
    backgroundColor: normalizeBackgroundColor("#67ABFC"),
    color: "white"
  },
  {
    backgroundColor: normalizeBackgroundColor("#67FCCF"),
    color: "white"
  },
  {
    backgroundColor: normalizeBackgroundColor("#A067FC"),
    color: "white"
  },
  {
    backgroundColor: normalizeBackgroundColor("#F967FC"),
    color: "white"
  },
  {
    backgroundColor: normalizeBackgroundColor("rgb(212,18,15)"),
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
    borderWidth: 3
  },
  selectableContainer: {
    paddingHorizontal: SPACING.half,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 3,
    borderBottomWidth: 3
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
  selected,
  selectedStyle,
  bottomBorderSelected = true,
  onPress
}) => {
  const handlePress = React.useCallback(() => {
    // if (handlerState === State.END) {
    onPress({ backgroundColor, color });
    // }
  }, [backgroundColor, color]);

  const selectedColor =
    backgroundColor && backgroundColor !== "transparent"
      ? chroma(backgroundColor)
          .alpha(0.5)
          .css()
      : COLORS.primaryDark;

  return (
    <BaseButton onPress={handlePress}>
      <View
        style={[
          styles.selectableContainer,
          {
            height
          },
          selected &&
            (selectedStyle || {
              borderBottomColor: selected ? selectedColor : "transparent"
            })
        ]}
      >
        <ColorSwatchComponent
          backgroundColor={backgroundColor}
          color={color}
          size={size}
        />
      </View>
    </BaseButton>
  );
};
