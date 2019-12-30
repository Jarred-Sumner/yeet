import euclideanDistance from "euclidean-distance";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { interpolateColor } from "react-native-redash";
import { SafeAreaContext } from "react-native-safe-area-context";
import chroma from "chroma-js";
import { BOTTOM_Y, SCREEN_DIMENSIONS } from "../../../config";
import { COLORS, SPACING } from "../../lib/styles";
import { BitmapIconNext } from "../BitmapIcon";
import { IconButton } from "../Button";
import ColorSlider from "../ColorSlider";
import {
  IconClose,
  IconJustifyCenter,
  IconJustifyLeft,
  IconJustifyRight,
  IconText,
  IconTrash
} from "../Icon";
import {
  CAROUSEL_HEIGHT,
  FocusType,
  PostFormat,
  TextBorderType,
  TextTemplate
} from "./NewPostFormat";
import { CAROUSEL_BACKGROUND } from "./PostHeader";
import {
  getDenormalizedBackgroundColor,
  getTextBlockAlign,
  getTextBlockBackgroundColor,
  getTextBlockColor,
  getDenormalizedColor,
  getBorderType,
  getSupportedBorderTypes
} from "./Text/TextInput";
import { ToolbarType } from "./Toolbar";
import {
  invertColor,
  isTooDark,
  getDarkColor,
  isTooLight,
  getLightColor,
  isColorLight,
  isColorDark,
  isColorNeutral,
  getNeutralColor
} from "../../lib/colors";
import TextInput from "./Text/CustomTextInputComponent";
import { BoldText } from "../Text";

export const FOOTER_HEIGHT = BOTTOM_Y + 50 + SPACING.half * 2;

const styles = StyleSheet.create({
  footerSide: {
    flexDirection: "row",
    alignItems: "center"
  },
  colorSlider: {
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
  borderButtonContainer: {
    width: 40,
    display: "flex",
    alignItems: "flex-end"
  },
  disabledBorderButtonContainer: {
    width: 40,
    display: "none",
    alignItems: "flex-end"
  },
  borderButtonLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: SPACING.half
  },
  textSidebar: {
    right: 0,
    overflow: "visible",
    width: 100,
    paddingTop: CAROUSEL_HEIGHT,
    height: SCREEN_DIMENSIONS.height,
    alignItems: "flex-end",
    justifyContent: "space-between"
  },
  bottomButtons: {
    paddingRight: 12
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
  const { template } = block.config;
  const border = getBorderType(block);

  let iconType = "fill";
  const Icon = IconText;
  const containerColor = getTextBlockBackgroundColor(block);
  const color = getTextBlockColor(block);
  let nextValue;
  let containerSize = 36;
  let iconSize = 18;
  let borderRadius = 4;
  let borderWidth = 2;

  const willFlipColors = template === TextTemplate.comic;

  if (willFlipColors) {
    borderRadius = 4;
    iconType = "fill";
  } else if (border === TextBorderType.hidden) {
    borderRadius = 4;
    iconType = "fill";
  } else if (
    border === TextBorderType.solid ||
    border === TextBorderType.highlight ||
    border === TextBorderType.invert
  ) {
    iconType = "fill";
    borderRadius = 4;
  }

  const supportedTypes = getSupportedBorderTypes(block);

  const handleChange = React.useCallback(() => {
    const shouldFlipColors = template === TextTemplate.comic;
    let backgroundColor = getTextBlockBackgroundColor(block);
    let color = getTextBlockColor(block);

    if (shouldFlipColors) {
      onChange(border, {
        ...block.config.overrides,
        color: backgroundColor,
        backgroundColor: color
      });
    } else {
      let currentIndex = supportedTypes.indexOf(border);
      const nextType = supportedTypes[currentIndex + 1] ?? supportedTypes[0];

      onChange(nextType, {
        ...block.config.overrides
      });
    }
  }, [
    containerColor,
    color,
    supportedTypes,
    block,
    block.format,
    block?.config?.overrides,
    block?.config?.overrides?.backgroundColor,
    template,
    border,
    onChange
  ]);

  return (
    <View
      style={
        supportedTypes.length > 1
          ? styles.borderButtonContainer
          : styles.disabledBorderButtonContainer
      }
    >
      <BoldText
        numberOfLines={1}
        adjustsFontSizeToFit
        style={styles.borderButtonLabel}
      >
        {
          {
            [TextBorderType.stroke]: "OUTLINE",
            [TextBorderType.solid]: "FILL",
            [TextBorderType.ellipse]: "CIRCLE",
            [TextBorderType.hidden]: "PLAIN",
            [TextBorderType.invert]: "SWAP",
            [TextBorderType.highlight]: "FILL"
          }[border]
        }
      </BoldText>
      <IconButton
        type={iconType}
        color={color}
        borderRadius={borderRadius}
        containerSize={containerSize}
        size={iconType === "shadow" ? containerSize * 0.75 : iconSize}
        borderColor={color}
        backgroundColor={containerColor}
        Icon={Icon}
        borderWidth={borderWidth}
        onPress={handleChange}
      />
    </View>
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

      let overides = { ...block.config.overrides, color };

      if (isColorLight(color)) {
        overides.backgroundColor = getDarkColor(color);
      } else if (isColorDark(color)) {
        overides.backgroundColor = getLightColor(color);
      } else if (isColorNeutral(color)) {
        overides.backgroundColor = getNeutralColor(color);
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

  const textSidebarStyles = React.useMemo(
    () => [
      styles.sidebar,
      styles.textSidebar,
      {
        paddingBottom: height
      }
    ],
    [height, styles.sidebar, styles.textSidebar]
  );

  const textHeaderStyle = React.useMemo(
    () => [styles.container, styles.header, { paddingTop: top }],
    [styles.container, styles.header, top]
  );

  const opacityStyle = React.useMemo(() => ({ opacity }), [opacity]);

  return (
    <Animated.View style={opacityStyle}>
      <Animated.View pointerEvents="box-none" style={textHeaderStyle}>
        <View style={[styles.footerSide, styles.leftHeaderSide]}>
          <IconButton
            Icon={IconClose}
            onPress={onBack}
            type="shadow"
            size={18}
            color="#fff"
          />
        </View>

        <View style={[styles.footerSide, styles.centerHeaderSide]}></View>

        <View style={[styles.footerSide, styles.rightHeaderSide]}>
          {focusType === FocusType.static && (
            <TextAlignmentButton block={block} onChange={onChangeTextAlign} />
          )}
        </View>
      </Animated.View>
      <Animated.View pointerEvents="box-none" style={textSidebarStyles}>
        <ColorSlider
          color={getDenormalizedColor(block)}
          onPress={onChangeColor}
          inputRef={TextInput.State.currentlyFocusedField()}
          colorType={"textColor"}
          style={styles.colorSlider}
        />

        <View style={styles.bottomButtons}>
          <BorderTypeButton
            block={block}
            opacity={opacity}
            onChange={onChangeBorderType}
          />
        </View>
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
