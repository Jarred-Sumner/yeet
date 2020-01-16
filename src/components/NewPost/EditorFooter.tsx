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
  IconTrash,
  IconDie1,
  IconDie2,
  IconDie3,
  IconDie4,
  IconDice,
  IconDie5,
  IconDie6
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
  getSupportedBorderTypes,
  contrastingColor,
  isTextBlockAlignEnabled
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
  getNeutralColor,
  getStrokeColor
} from "../../lib/colors";
import TextInput from "./Text/CustomTextInputComponent";
import { BoldText, SemiBoldText } from "../Text";
import { BaseButton, BorderlessButton } from "react-native-gesture-handler";

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
    display: "flex",
    alignItems: "flex-end",
    width: 40
  },
  disabledBorderButtonContainer: {
    width: 40,
    opacity: 0.1,
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
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0
  },
  subfooter: {
    paddingHorizontal: SPACING.normal,
    flexDirection: "row",
    paddingBottom: SPACING.normal
  },
  container: {
    // shadowRadius: StyleSheet.hairlineWidth,
    // shadowOffset: {
    //   width: 0,
    //   height: -1
    // },
    // shadowColor: "rgb(0, 0, 30)",
    // shadowOpacity: 0.8,

    justifyContent: "space-between",
    width: "100%",
    overflow: "visible",
    flexDirection: "row",
    paddingRight: SPACING.normal,
    backgroundColor: CAROUSEL_BACKGROUND
  },
  doneButton: {
    paddingLeft: SPACING.normal,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  doneButtonLabel: {
    fontSize: 18,
    color: "white"
  },
  footerContainer: {
    paddingTop: SPACING.half,
    paddingBottom: BOTTOM_Y
  },
  header: {
    height: CAROUSEL_HEIGHT,
    top: 0
  },
  footer: {
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

export const BorderTypeButton = ({
  block,
  opacity,
  onChange
}: {
  block: TextPostBlock;
  onChange;
}) => {
  if (block?.type === "image") {
    return null;
  }

  const { template = TextTemplate.basic } = block?.config ?? {};
  const border = block ? getBorderType(block) : TextBorderType.hidden;
  const overrides = React.useMemo(() => block?.config?.overrides ?? {}, [
    block
  ]);

  let iconType = "fill";
  const Icon = IconText;
  const backgroundColor = block
    ? getTextBlockBackgroundColor(block)
    : "rgb(0, 0, 0)";
  const color = block ? getTextBlockColor(block) : "rgb(255, 255, 255)";
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
    borderRadius = 1;
  } else if (border === TextBorderType.stroke) {
    iconType = "fill";
  }

  const supportedTypes = React.useMemo(
    () => (block ? getSupportedBorderTypes(block) : []),
    [block]
  );

  const handleChange = React.useCallback(() => {
    const shouldFlipColors = template === TextTemplate.comic;

    if (shouldFlipColors) {
      onChange(border, {
        ...overrides,
        color: backgroundColor,
        backgroundColor: color
      });
    } else {
      let currentIndex = supportedTypes.indexOf(border);
      const nextType = supportedTypes[currentIndex + 1] ?? supportedTypes[0];

      onChange(nextType, {
        ...overrides
      });
    }
  }, [
    backgroundColor,
    color,
    supportedTypes,
    block,
    overrides,
    template,
    border,
    onChange
  ]);

  let size = iconSize;
  if (iconType === "shadow") {
    size = containerSize * 0.75;
  }

  if (border === TextBorderType.stroke) {
    size = 20;
  }

  return (
    <View
      style={
        supportedTypes.length > 1
          ? styles.borderButtonContainer
          : styles.disabledBorderButtonContainer
      }
    >
      <IconButton
        type={iconType}
        color={color}
        borderRadius={borderRadius}
        containerSize={containerSize}
        iconStyle={
          border === TextBorderType.stroke
            ? {
                textShadowColor: contrastingColor(color),
                textShadowRadius: 2,
                textShadowOffset: {
                  width: 1,

                  height: 1
                }
              }
            : undefined
        }
        size={size}
        borderColor={color}
        backgroundColor={
          border === TextBorderType.stroke ? "transparent" : backgroundColor
        }
        enabled={!!block}
        Icon={Icon}
        borderWidth={borderWidth}
        onPress={handleChange}
      />
    </View>
  );
};

export const TextAlignmentButton = ({
  block,
  onChange
}: {
  block: TextPostBlock;
  onChange;
}) => {
  const textAlign = block ? getTextBlockAlign(block) : "center";

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
      enabled={isTextBlockAlignEnabled(block)}
      size={20}
      hitSlop={null}
      Icon={Icon}
      containerSize={20}
      style={{ width: 30 }}
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
    () => [
      styles.wrapper,
      styles.container,
      styles.header,
      { paddingTop: top }
    ],
    [styles.container, styles.header, top]
  );

  const opacityStyle = React.useMemo(() => ({ opacity }), [opacity]);

  return (
    <Animated.View style={opacityStyle}>
      <Animated.View pointerEvents="box-none" style={textHeaderStyle}>
        <View style={[styles.footerSide, styles.leftHeaderSide]}></View>

        <View style={[styles.footerSide, styles.centerHeaderSide]}></View>

        <View style={[styles.footerSide, styles.rightHeaderSide]}>
          <BorderlessButton onPress={onBack}>
            <View style={styles.doneButton}>
              <SemiBoldText style={styles.doneButtonLabel}>Done</SemiBoldText>
            </View>
          </BorderlessButton>
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

const getExampleDiceIcon = (count: number, offset: number) => {
  const diceNumber = Math.min(count, 5) - Math.max(offset, -1);

  if (diceNumber === 5) {
    return IconDie6;
  } else if (diceNumber === 4) {
    return IconDie5;
  } else if (diceNumber === 3) {
    return IconDie4;
  } else if (diceNumber === 2) {
    return IconDie2;
  } else if (diceNumber === 1) {
    return IconDie2;
  } else {
    return IconDie1;
  }
};

const ExampleCountButton = ({ onPress, exampleCount, exampleIndex }) => {
  // const DiceIcon = getExampleDiceIcon(exampleCount, exampleIndex);

  return (
    <IconButton
      onPress={onPress}
      type="fill"
      size={36}
      containerSize={48}
      borderRadius={24}
      borderWidth={1}
      Icon={IconDice}
      color="white"
      backgroundColor={"rgba(0, 0, 0, 0.75)"}
      borderColor="transparent"
    />
  );
};

export const EditorFooter = ({
  onPressDownload,
  exampleCount,
  exampleIndex,
  onPressSend,
  onPressExample,
  hasExamples = false,
  waitFor,
  toolbar
}) => {
  return (
    <View pointerEvents="box-none" style={[styles.wrapper, styles.footer]}>
      {hasExamples && (
        <View pointerEvents="box-none" style={styles.subfooter}>
          <ExampleCountButton
            exampleCount={exampleCount}
            exampleIndex={exampleIndex}
            onPress={onPressExample}
          />
        </View>
      )}

      <View
        pointerEvents="box-none"
        style={[styles.container, styles.footerContainer]}
      >
        {toolbar}

        <View
          pointerEvents="box-none"
          style={[styles.footerSide, styles.footerSideRight]}
        >
          <NextButton onPress={onPressSend} waitFor={waitFor} />
        </View>
      </View>
    </View>
  );
};

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
      style={[
        styles.wrapper,
        styles.container,
        styles.footer,
        styles.footerContainer,
        styles.footerCenter
      ]}
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
