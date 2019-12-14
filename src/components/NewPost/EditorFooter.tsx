import euclideanDistance from "euclidean-distance";
import * as React from "react";
import { Dimensions, StyleSheet, View, TextInput } from "react-native";
import Animated from "react-native-reanimated";
import { interpolateColor } from "react-native-redash";
import { getInset } from "react-native-safe-area-view";
import { COLORS, SPACING } from "../../lib/styles";
import { IconButton } from "../Button";
import {
  IconDownload,
  IconSend,
  IconTrash,
  IconClose,
  IconJustifyLeft,
  IconJustifyCenter,
  IconJustifyRight,
  IconText
} from "../Icon";
import {
  MAX_POST_HEIGHT,
  CAROUSEL_HEIGHT,
  FocusType,
  TextBorderType,
  TextTemplate,
  PostFormat
} from "./NewPostFormat";
import { BOTTOM_Y, SCREEN_DIMENSIONS } from "../../../config";
import { BitmapIconNext } from "../BitmapIcon";
import { CAROUSEL_BACKGROUND } from "./PostHeader";
import { ToolbarType } from "./Toolbar";
import { SafeAreaContext } from "react-native-safe-area-context";
import ColorSlider from "../ColorSlider";
import { useToggle } from "../../lib/useToggle";
import {
  getTextBlockColor,
  getTextBlockBackgroundColor,
  getTextBlockAlign,
  contrastingColor,
  getDenormalizedColor,
  getDenormalizedBackgroundColor
} from "./Text/TextInput";
import { SelectableColorSwatch } from "./ColorSwatch";
import tinycolor from "tinycolor2";

export const FOOTER_HEIGHT = BOTTOM_Y + 50 + SPACING.half * 2;

const styles = StyleSheet.create({
  footerSide: {
    flexDirection: "row",
    alignItems: "center"
  },
  leftHeaderSide: {
    paddingLeft: SPACING.normal
  },
  centerHeaderSide: {
    justifyContent: "center"
  },
  rightHeaderSide: {
    paddingRight: 0,
    justifyContent: "flex-end"
  },
  sidebar: {
    position: "absolute",
    top: 0,
    right: 0,

    width: 60,
    height: "100%"
  },
  container: {
    shadowRadius: StyleSheet.hairlineWidth,
    shadowOffset: {
      width: 0,
      height: -1
    },
    shadowColor: "rgb(0, 0, 30)",
    shadowOpacity: 0.8,

    justifyContent: "space-between",
    width: "100%",
    flexDirection: "row",
    paddingRight: SPACING.normal,
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: CAROUSEL_BACKGROUND
  },
  header: {
    height: CAROUSEL_HEIGHT,
    top: 0
  },
  footer: {
    paddingTop: SPACING.half,
    paddingBottom: BOTTOM_Y,
    height: FOOTER_HEIGHT,

    bottom: 0
  }
});

const FooterButton = ({ Icon, onPress, color, size = 32 }) => {
  return (
    <IconButton
      size={size}
      Icon={Icon}
      color={color}
      type="fill"
      backgroundColor={COLORS.secondaryOpacity}
      onPress={onPress}
    />
  );
};

const NextButton = ({ onPress, waitFor }) => {
  return (
    <IconButton
      size={24}
      type="fill"
      onPress={onPress}
      iconNode={<BitmapIconNext />}
    />
  );
};

const BorderTypeButton = ({
  block,
  opacity,
  onChange
}: {
  block: TextPostBlock;
  onChange;
}) => {
  const { border, template } = block.config;

  let iconType = "shadow";
  const Icon = IconText;
  const containerColor = getTextBlockBackgroundColor(block);
  const color = getTextBlockColor(block);
  let nextValue;
  let containerSize = 28;
  let iconSize = 14;
  let borderRadius = undefined;

  const willFlipColors =
    template === TextTemplate.comic || block.format === PostFormat.post;

  if (willFlipColors) {
    borderRadius = 1;
    iconType = "fill";
  } else if (border === TextBorderType.hidden) {
    borderRadius = 2;
  } else if (
    border === TextBorderType.solid ||
    border === TextBorderType.highlight ||
    border === TextBorderType.invert
  ) {
    iconType = "fill";
    borderRadius = 2;
  }

  const handleChange = React.useCallback(() => {
    const shouldFlipColors =
      template === TextTemplate.comic || block.format === PostFormat.post;
    let backgroundColor = getDenormalizedBackgroundColor(block);
    let color = getTextBlockColor(block);

    const isTooDark =
      tinycolor(backgroundColor).isDark() && tinycolor(color).isDark();
    const isTooLight =
      tinycolor(backgroundColor).isLight() && tinycolor(color).isLight();

    if (shouldFlipColors) {
      if (isTooDark) {
        color = "#fff";
      } else if (isTooLight) {
        color = "#000";
      }
      onChange(border, {
        ...block.config.overrides,
        color: backgroundColor,
        backgroundColor: color
      });
    } else if (border === TextBorderType.hidden) {
      if (isTooDark) {
        backgroundColor = "#fff";
      } else if (isTooLight) {
        backgroundColor = "#000";
      }

      onChange(TextBorderType.highlight, {
        ...block.config.overrides,
        backgroundColor,
        color
      });
    } else if (border === TextBorderType.highlight) {
      if (isTooDark) {
        backgroundColor = "#fff";
      } else if (isTooLight) {
        backgroundColor = "#000";
      }

      onChange(TextBorderType.invert, {
        ...block.config.overrides,
        color,
        backgroundColor
      });
    } else if (border === TextBorderType.invert) {
      onChange(TextBorderType.hidden);
    }
  }, [containerColor, color, block, template, border, onChange]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            scale: Animated.interpolate(opacity, {
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.25, 1.0]
            })
          }
        ]
      }}
    >
      <IconButton
        type={iconType}
        color={color}
        borderRadius={borderRadius}
        containerSize={containerSize}
        size={iconType === "shadow" ? containerSize * 0.75 : iconSize}
        borderColor={color}
        backgroundColor={containerColor}
        Icon={Icon}
        onPress={handleChange}
      />
    </Animated.View>
  );
};

const TextAlignmentButton = ({
  block,
  onChange
}: {
  block: TextPostBlock;
  onChange;
}) => {
  const textAlign = getTextBlockAlign(block);

  let Icon;
  let nextValue;

  if (textAlign === "left" || !textAlign) {
    Icon = IconJustifyLeft;
    nextValue = "center";
  } else if (textAlign === "center") {
    Icon = IconJustifyCenter;
    nextValue = "right";
  } else if (textAlign === "right") {
    Icon = IconJustifyRight;
    nextValue = "left";
  }

  const handleChange = React.useCallback(() => {
    onChange(nextValue);
  }, [nextValue, onChange]);

  return (
    <IconButton
      type="shadow"
      color="white"
      size={20}
      Icon={Icon}
      onPress={handleChange}
    />
  );
};

export const TextHeader = ({
  opacity,
  onBack,
  onChangeOverrides,
  onChangeBorderType,
  focusType,
  block,
  height
}) => {
  const { top } = React.useContext(SafeAreaContext);

  const color = getTextBlockColor(block);
  const backgroundColor = getTextBlockBackgroundColor(block);

  const onChangeColor = React.useCallback(
    ({ nativeEvent: { color } }) => {
      const backgroundColor = getTextBlockBackgroundColor(block);

      const isTooDark =
        tinycolor(backgroundColor).isDark() && tinycolor(color).isDark();
      const isTooLight =
        tinycolor(backgroundColor).isLight() && tinycolor(color).isLight();

      let overides = { ...block.config.overrides, color };

      if (isTooDark) {
        overides.backgroundColor = "white";
      } else if (isTooLight) {
        overides.backgroundColor = "black";
      }

      onChangeOverrides(overides);
    },
    [onChangeOverrides, block]
  );

  const onChangeTextAlign = React.useCallback(
    textAlign => {
      const overrides = { ...block.config.overrides, textAlign };

      onChangeOverrides(overrides);
    },
    [onChangeOverrides, block]
  );

  return (
    <Animated.View style={{ opacity: opacity }}>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.container, styles.header, { paddingTop: top }]}
      >
        <View style={[styles.footerSide, styles.leftHeaderSide]}>
          <IconButton
            Icon={IconClose}
            onPress={onBack}
            type="shadow"
            size={18}
            color="#fff"
          />
        </View>

        <View style={[styles.footerSide, styles.centerHeaderSide]}>
          <BorderTypeButton
            opacity={opacity}
            block={block}
            onChange={onChangeBorderType}
          />
        </View>

        <View style={[styles.footerSide, styles.rightHeaderSide]}>
          {focusType === FocusType.static && (
            <TextAlignmentButton block={block} onChange={onChangeTextAlign} />
          )}
        </View>
      </Animated.View>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.sidebar,
          {
            top: CAROUSEL_HEIGHT,
            right: 0,
            overflow: "visible",
            width: 100,
            alignItems: "flex-end",

            height: Animated.sub(height, top + CAROUSEL_HEIGHT)
          }
        ]}
      >
        <ColorSlider
          color={color}
          onPress={onChangeColor}
          inputRef={TextInput.State.currentlyFocusedField()}
          colorType={"textColor"}
          style={{
            height: 220,
            justifyContent: "flex-end",
            alignItems: "flex-end",
            overflow: "visible",
            flex: 0,
            width: 20,
            marginRight: SPACING.normal,
            transform: [
              {
                translateY: SPACING.double
              }
            ]
          }}
        />
      </Animated.View>
    </Animated.View>
  );
};

export const EditorHeader = ({
  type,
  opacity,
  isModal,
  panX,
  panY,
  focusedBlock: block,
  height,
  onPress,
  onChangeBorderType,
  focusType,
  onChangeOverrides,
  inputRef,
  onBack
}) => {
  if (type === ToolbarType.text) {
    return (
      <TextHeader
        opacity={opacity}
        height={height}
        block={block}
        onBack={onBack}
        onChangeOverrides={onChangeOverrides}
        onChangeBorderType={onChangeBorderType}
        focusType={focusType}
      />
    );
  } else {
    return <Animated.View />;
  }
};

export const EditorFooter = ({
  onPressDownload,
  onPressSend,
  waitFor,
  toolbar
}) => (
  <View pointerEvents="box-none" style={[styles.container, styles.footer]}>
    {toolbar}

    <View
      pointerEvents="box-none"
      style={[styles.footerSide, styles.footerSideRight]}
    >
      <NextButton onPress={onPressSend} waitFor={waitFor} />
    </View>
  </View>
);

const DELETE_SIZE = 26;
const MID_Y_DELETE_BUTTON =
  SCREEN_DIMENSIONS.height - BOTTOM_Y - (DELETE_SIZE * 1.25) / 2;
const MID_X_DELETE_BUTTON = SCREEN_DIMENSIONS.width / 2;

const DELETE_RANGE = [
  euclideanDistance(
    [MID_X_DELETE_BUTTON, MID_Y_DELETE_BUTTON],
    [MID_X_DELETE_BUTTON, MID_Y_DELETE_BUTTON]
  ),
  euclideanDistance(
    [MID_X_DELETE_BUTTON - DELETE_SIZE, MID_Y_DELETE_BUTTON - DELETE_SIZE],
    [MID_X_DELETE_BUTTON, MID_Y_DELETE_BUTTON]
  ),
  euclideanDistance(
    [
      MID_X_DELETE_BUTTON - DELETE_SIZE * 1.5,
      MID_Y_DELETE_BUTTON - DELETE_SIZE * 1.5
    ],
    [MID_X_DELETE_BUTTON, MID_Y_DELETE_BUTTON]
  ),
  euclideanDistance([0, 0], [MID_X_DELETE_BUTTON, MID_Y_DELETE_BUTTON])
];

export const isDeletePressed = (x: number, y: number) => {
  const distance = euclideanDistance(
    [x, y],
    [MID_X_DELETE_BUTTON, MID_Y_DELETE_BUTTON]
  );

  return distance >= DELETE_RANGE[0] && distance <= DELETE_RANGE[1];
};

export const DeleteFooter = ({ onDelete, panY, panX }) => {
  const distance = React.useRef(new Animated.Value(0));

  const opacity = React.useRef(
    Animated.interpolate(
      distance.current,

      {
        inputRange: DELETE_RANGE,
        outputRange: [1, 1, 0.95, 0.5]
      }
    )
  );

  const scaleTransform = React.useRef(
    Animated.interpolate(
      distance.current,

      {
        inputRange: DELETE_RANGE,
        outputRange: [1.01, 1.0, 0.97, 0.95]
      }
    )
  );

  const backgroundColor = React.useRef(
    interpolateColor(
      distance.current,
      {
        inputRange: DELETE_RANGE,
        outputRange: [
          {
            r: 120,
            g: 120,
            b: 120
          },
          {
            r: 75,
            g: 75,
            b: 75
          },
          {
            r: 50,
            g: 50,
            b: 50
          },
          {
            r: 0,
            g: 0,
            b: 0
          }
        ]
      },
      "rgb"
    )
  );

  return (
    <View
      pointerEvents="none"
      style={[styles.container, styles.footer, styles.footerCenter]}
    >
      <Animated.Code
        exec={Animated.block([
          Animated.set(
            distance.current,
            Animated.sqrt(
              Animated.add(
                Animated.multiply(
                  Animated.sub(MID_X_DELETE_BUTTON, panX),
                  Animated.sub(MID_X_DELETE_BUTTON, panX)
                ),
                Animated.multiply(
                  Animated.sub(MID_Y_DELETE_BUTTON, panY),
                  Animated.sub(MID_Y_DELETE_BUTTON, panY)
                )
              )
            )
          )
        ])}
      />
      <View
        pointerEvents="none"
        style={[
          styles.footerSide,
          {
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            width: "100%"
          }
        ]}
      >
        <IconButton
          onPress={onDelete}
          Icon={IconTrash}
          color="#fff"
          size={DELETE_SIZE}
          backgroundColor={backgroundColor.current}
          opacity={opacity.current}
          transform={[{ scale: scaleTransform.current }]}
          borderColor="#fff"
          type="fill"
        />
      </View>
    </View>
  );
};
