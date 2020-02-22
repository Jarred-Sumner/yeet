import euclideanDistance from "euclidean-distance";
import * as React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
// import { BorderlessButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { BOTTOM_Y, SCREEN_DIMENSIONS } from "../../../config";
import { getTextBlockAlign } from "../../lib/buildPost";
import { COLORS, SPACING } from "../../lib/styles";
import { BitmapIconNext } from "../BitmapIcon";
import { IconButton } from "../Button";
import {
  IconDice,
  IconDie1,
  IconDie2,
  IconDie4,
  IconDie5,
  IconDie6,
  IconJustifyCenter,
  IconJustifyLeft,
  IconJustifyRight,
  IconText,
  IconTrash
} from "../Icon";
import { SemiBoldText, MediumText } from "../Text";
import { CAROUSEL_HEIGHT, TextBorderType, TextTemplate } from "./NewPostFormat";
import { CAROUSEL_BACKGROUND, PostHeader } from "./PostHeader";
import {
  isTextBlockAlignEnabled,
  getTextBlockColor,
  contrastingColor,
  getTextBlockBackgroundColor,
  getBorderType,
  getSupportedBorderTypes
} from "./Text/TextBlockUtils";

import { ToolbarType } from "./Toolbar";
import { sendSelectionFeedback } from "../../lib/Vibration";
import { snapButtonValue } from "../../lib/animations";
import FormatPicker from "./FormatPicker";
import { BorderlessButton } from "react-native-gesture-handler";
import { PostSchemaContext } from "./PostSchemaProvider";
import {
  updateBorderType,
  updateBlockColor
} from "../../lib/PostEditor/TextPostBlock/textActions";

export const FOOTER_HEIGHT = BOTTOM_Y + 120;

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
  deleteFooter: {
    justifyContent: "space-between",
    width: "100%",
    overflow: "visible",
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingRight: SPACING.normal
  },
  deleteFooterContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: "100%",
    paddingBottom: BOTTOM_Y,
    height: FOOTER_HEIGHT
  },
  container: {
    // shadowRadius: StyleSheet.hairlineWidth,
    // shadowOffset: {
    //   width: 0,
    //   height: -1
    // },
    // shadowColor: "rgb(0, 0, 30)",
    // shadowOpacity: 0.8,

    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    overflow: "visible",

    justifyContent: "center"
  },
  doneButton: {
    paddingHorizontal: SPACING.normal,
    flexDirection: "row",
    paddingVertical: SPACING.normal,
    justifyContent: "center",
    alignItems: "center"
  },
  doneButtonLabel: {
    fontSize: 17,
    color: "white"
  },
  footerContainer: {
    paddingTop: SPACING.half,
    paddingBottom: SPACING.half
  },
  header: {
    height: CAROUSEL_HEIGHT,
    top: 0
  },
  footer: {
    bottom: 0
  },
  formatPicker: {
    paddingTop: 12,
    paddingBottom: BOTTOM_Y,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row"
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
  opacity
}: {
  block: TextPostBlock;
}) => {
  const { updateSchema } = React.useContext(PostSchemaContext);
  if (block?.type === "image") {
    return null;
  }

  const blockId = block?.id;

  const { template = TextTemplate.basic } = block?.config ?? {};
  const border = block ? getBorderType(block) : TextBorderType.hidden;

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
      updateSchema(schema => {
        updateBlockColor(schema, {
          color: backgroundColor,
          blockId,
          backgroundColor: color
        });
      });
    } else {
      let currentIndex = supportedTypes.indexOf(border);
      const nextType = supportedTypes[currentIndex + 1] ?? supportedTypes[0];

      updateSchema(schema => {
        updateBorderType(schema, { blockId, borderType: nextType });
      });
    }
  }, [
    backgroundColor,
    color,
    supportedTypes,
    template,
    border,
    updateSchema,
    blockId
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

export const TextHeader = React.memo(({ opacity, onBack }) => {
  const { top } = React.useContext(SafeAreaContext);

  const textHeaderStyle = React.useMemo(
    () => [
      styles.wrapper,
      styles.container,
      styles.header,
      { paddingTop: top }
    ],
    [styles.container, styles.header, top]
  );

  return (
    <View style={textHeaderStyle}>
      <View style={[styles.footerSide, styles.leftHeaderSide]}></View>

      <View style={[styles.footerSide, styles.centerHeaderSide]}></View>

      <View style={[styles.footerSide, styles.rightHeaderSide]}>
        <BorderlessButton onPress={onBack}>
          <View style={styles.doneButton}>
            <MediumText style={styles.doneButtonLabel}>Done</MediumText>
          </View>
        </BorderlessButton>
      </View>
    </View>
  );
});

export const EditorHeader = ({
  type,
  opacity,
  isModal,
  panX,
  panY,
  focusedBlock: block,
  onDelete,
  height,
  onPress,
  onChangeBorderType,
  focusType,
  onChangeOverrides,
  onSend,
  inputRef,
  onBack
}) => {
  if (type === ToolbarType.text) {
    return <TextHeader opacity={1} onBack={onBack} />;
  } else if (!focusType) {
    return <PostHeader onFinish={onSend} />;
  } else {
    return null;
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

export const EditorFooter = React.memo(
  ({ layout, onChangeLayout, toolbar }) => {
    return (
      <View style={[styles.wrapper, styles.footer, styles.container]}>
        <View style={styles.footerContainer}>{toolbar}</View>
        <View style={styles.formatPicker}>
          <FormatPicker value={layout} onChangeLayout={onChangeLayout} />
        </View>
      </View>
    );
  }
);

const DELETE_SIZE = 36;
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

export const DeleteFooter = ({ onDelete, panY, panX, currentScale }) => {
  const distance = React.useRef(new Animated.Value(0));

  const scaleTransform = React.useRef(
    Animated.interpolate(
      distance.current,

      {
        inputRange: DELETE_RANGE,
        outputRange: [1.15, 1.0, 0.9, 0.8],
        extrapolate: Animated.Extrapolate.CLAMP
      }
    )
  );

  return (
    <View pointerEvents="none" style={styles.deleteFooter}>
      <Animated.Code
        exec={Animated.block([
          Animated.set(
            distance.current,
            snapButtonValue(
              MID_X_DELETE_BUTTON,
              MID_Y_DELETE_BUTTON,
              panX,
              panY,
              0
            )
          ),
          Animated.onChange(
            Animated.lessThan(distance.current, DELETE_RANGE[1]),
            Animated.call([], sendSelectionFeedback)
          ),
          Animated.cond(
            Animated.greaterThan(scaleTransform.current, 0.9),
            Animated.set(
              currentScale,
              Animated.interpolate(distance.current, {
                inputRange: DELETE_RANGE,
                outputRange: [0.75, 0.95, 1.0, 1.0],
                extrapolate: Animated.Extrapolate.CLAMP
              })
            )
          )
        ])}
      />
      <View pointerEvents="none" style={styles.deleteFooterContent}>
        <IconButton
          onPress={onDelete}
          Icon={IconTrash}
          color="#fff"
          type="shadow"
          size={DELETE_SIZE}
          transform={[{ scale: scaleTransform.current }]}
        />
      </View>
    </View>
  );
};
