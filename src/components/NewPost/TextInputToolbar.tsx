import chroma from "chroma-js";
import { cloneDeep } from "lodash";
import * as React from "react";
import { ImageProps, ScrollView, StyleSheet, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS } from "../../../config";
import { FocusType } from "../../lib/buildPost";
import {
  getDarkColor,
  getLightColor,
  getNeutralColor,
  isColorDark,
  isColorLight,
  isColorNeutral
} from "../../lib/colors";
import { COLORS, SPACING } from "../../lib/styles";
import { sendSelectionFeedback } from "../../lib/Vibration";
import {
  BitmapIconTemplateBigWords,
  BitmapIconTemplateClassic,
  BitmapIconTemplateComic,
  BitmapIconTemplateGary,
  BitmapIconTemplateMonospace,
  BitmapIconTemplatePixel
} from "../BitmapIcon";
import { InputAccessoryView } from "../InputAccessoryView";
import {
  ColorSwatch,
  COMMENT_COLORS,
  SelectableColorSwatch
} from "./ColorSwatch";
import { BorderTypeButton, TextAlignmentButton } from "./EditorFooter";
import { PostFormat, TextPostBlock, TextTemplate } from "./NewPostFormat";
import { getTextBlockColor } from "./Text/TextBlockUtils";
import { PostSchemaContext } from "./PostSchemaProvider";
import Actions from "../../lib/PostEditor/AllActions";
import { selectTextBlock } from "../../lib/PostEditor/actions";

const CONTAINER_HEIGHT = 40;

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    marginTop: SPACING.normal,
    flexDirection: "row",
    width: SCREEN_DIMENSIONS.width,
    overflow: "visible",
    paddingLeft: SPACING.normal
  },
  colorSliderScrollView: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible"
  },
  staticWrapper: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    overflow: "visible",
    height: 120
  },
  wrapper: {
    height: 120,
    overflow: "visible"
  },
  spacer: {
    marginLeft: SPACING.half,
    marginRight: SPACING.half,
    width: 1,
    marginTop: SPACING.half,
    marginBottom: SPACING.half,
    borderRadius: 8,
    overflow: "hidden",
    flex: 0,
    backgroundColor: "white",
    opacity: 0.25
  },
  bottomContainer: {
    width: SCREEN_DIMENSIONS.width,
    flexDirection: "row",
    paddingVertical: SPACING.normal
  },
  bottomButton: {
    marginRight: SPACING.normal,
    alignItems: "center",
    flex: 0,
    justifyContent: "center"
  },
  colorSlider: {
    flex: 1,
    // height: 13,
    // alignItems: "center",
    // justifyContent: "center",
    alignSelf: "center",
    overflow: "visible"
  },
  colorSliderContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden"
  },
  template: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    height: 32,
    borderWidth: 1,
    borderRadius: 2,
    overflow: "hidden",
    borderColor: "rgba(255, 255, 255, 0.25)",
    paddingRight: SPACING.half,
    paddingLeft: SPACING.half,
    marginRight: SPACING.half
  },
  selectedTemplate: {
    borderColor: "white"
  },
  classicIcon: {
    height: 15,
    width: 60
  },
  monospaceIcon: {
    height: 25,
    width: 75,
    marginTop: 4
  },
  comicIcon: {
    height: 32,
    width: 60
  }
});

const UNDERLAY_COLOR = chroma(COLORS.primary)
  .alpha(0.5)
  .css();

const TemplateIcon = ({ template, ...otherProps }: Partial<ImageProps>) => {
  if (template === TextTemplate.basic || template === TextTemplate.post) {
    return (
      <BitmapIconTemplateClassic
        style={styles.classicIcon}
        resizeMode="contain"
        {...otherProps}
      />
    );
  } else if (template === TextTemplate.comic) {
    return (
      <BitmapIconTemplateComic
        style={styles.comicIcon}
        resizeMode="contain"
        {...otherProps}
      />
    );
  } else if (template === TextTemplate.gary) {
    return <BitmapIconTemplateGary resizeMode="contain" {...otherProps} />;
  } else if (template === TextTemplate.pickaxe) {
    return <BitmapIconTemplatePixel resizeMode="contain" {...otherProps} />;
  } else if (template === TextTemplate.bigWords) {
    return <BitmapIconTemplateBigWords resizeMode="contain" {...otherProps} />;
  } else if (template === TextTemplate.terminal) {
    return (
      <BitmapIconTemplateMonospace
        style={styles.monospaceIcon}
        resizeMode="contain"
        {...otherProps}
      />
    );
  }
};

const TemplateOption = ({ template, isSelected = false, onPress }) => {
  const handlePress = React.useCallback(() => {
    sendSelectionFeedback();
    onPress(template);
  }, [template, onPress]);
  return (
    <RectButton
      exclusive
      disallowInterruption={false}
      underlayColor="transparent"
      activeOpacity={1}
      shouldActivateOnStart={false}
      shouldCancelWhenOutside
      enabled={!isSelected}
      onPress={handlePress}
    >
      <Animated.View
        style={
          isSelected
            ? [styles.template, styles.selectedTemplate]
            : styles.template
        }
      >
        <TemplateIcon template={template} />
      </Animated.View>
    </RectButton>
  );
};

const getSupportedTemplates = (block: TextPostBlock): Array<TextTemplate> => {
  if (!block) {
    return [];
  }

  if (block.format === PostFormat.comment) {
    return [TextTemplate.comment];
  } else if (block.format === PostFormat.post) {
    return [TextTemplate.post, TextTemplate.terminal, TextTemplate.pickaxe];
  } else {
    return [
      TextTemplate.basic,
      TextTemplate.terminal,
      TextTemplate.bigWords,
      TextTemplate.comic,
      TextTemplate.gary,
      TextTemplate.pickaxe
    ];
  }
};

const RawTextInputToolbar = ({
  block,
  blockId,
  scrollRef,
  focusType,
  onLayout,
  updateSchema
}: {
  block: TextPostBlock;
}) => {
  const selectedTemplate = block?.config?.template ?? TextTemplate.basic;

  const onChooseTemplate = React.useCallback(
    template => {
      if (!blockId) {
        return;
      }
      updateSchema(Actions.updateTemplate({ template, blockId }));
    },

    [blockId, updateSchema, Actions.updateTemplate]
  );

  const renderTemplate = React.useCallback(
    template => {
      const isSelected = selectedTemplate === template;

      return (
        <TemplateOption
          template={template}
          key={`${template}-${isSelected}`}
          isSelected={isSelected}
          onPress={onChooseTemplate}
        />
      );
    },
    [selectedTemplate, onChooseTemplate]
  );

  const insets = React.useMemo(
    () => ({
      top: 0,
      bottom: 0,
      left: SPACING.normal,
      right: SPACING.normal
    }),
    []
  );
  const offset = React.useMemo(() => ({ x: insets.left * -1, y: 0 }), [insets]);

  const onChangeColor = React.useCallback(
    color => {
      if (!blockId) {
        return;
      }
      let backgroundColor = undefined;

      if (isColorLight(color)) {
        backgroundColor = getDarkColor(color);
      } else if (isColorDark(color)) {
        backgroundColor = getLightColor(color);
      } else if (isColorNeutral(color)) {
        backgroundColor = getNeutralColor(color);
      }

      sendSelectionFeedback();
      updateSchema(
        Actions.updateBlockColor({ color, backgroundColor, blockId })
      );
    },
    [
      updateSchema,
      isColorLight,
      getDarkColor,
      sendSelectionFeedback,
      blockId,
      isColorDark,
      getLightColor,
      Actions.updateBlockColor,
      isColorNeutral,
      getNeutralColor
    ]
  );

  const onChangeTextAlign = React.useCallback(
    textAlign => {
      if (!blockId) {
        return;
      }

      sendSelectionFeedback();

      updateSchema(Actions.updateTextAlign({ textAlign, blockId }));
    },
    [updateSchema, blockId, Actions.updateTextAlign, sendSelectionFeedback]
  );

  const color = block ? getTextBlockColor(block) : "rgb(255, 255, 255)";

  const renderColor = React.useCallback(
    (swatch: ColorSwatch) => {
      const selected =
        chroma(swatch.backgroundColor).css("rgb") === chroma(color).css("rgb");

      return (
        <SelectableColorSwatch
          color={swatch.color}
          key={`${swatch.backgroundColor}-${selected}`}
          backgroundColor={swatch.backgroundColor}
          onPress={onChangeColor}
          selected={selected}
          size={24}
          selectedSize={30}
        />
      );
    },
    [onChangeColor, color, blockId, updateSchema]
  );
  return (
    <View
      onLayout={onLayout}
      pointerEvents={block ? "auto" : "none"}
      style={
        focusType === FocusType.static ? styles.staticWrapper : styles.wrapper
      }
    >
      <View style={styles.container}>
        <View style={styles.bottomButton}>
          <BorderTypeButton block={block} />
        </View>

        <View style={styles.bottomButton}>
          <TextAlignmentButton
            block={block}
            opacity={1}
            onChange={onChangeTextAlign}
          />
        </View>

        <View style={styles.spacer} />

        <View style={styles.colorSliderContainer}>
          <ScrollView
            contentContainerStyle={styles.colorSliderScrollView}
            horizontal
            keyboardShouldPersistTaps="never"
            disableScrollViewPanResponder
            keyboardDismissMode="none"
            // disableIntervalMomentum
            alwaysBounceHorizontal
            shouldCancelWhenOutside
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            directionalLockEnabled
            contentInsetAdjustmentBehavior="never"
            contentInset={{ right: SPACING.double }}
            style={styles.colorSlider}
          >
            {COMMENT_COLORS.map(renderColor)}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        horizontal
        scrollIndicatorInsets={insets}
        contentOffset={offset}
        showsHorizontalScrollIndicator={false}
        shouldCancelWhenOutside
        alwaysBounceVertical={false}
        alwaysBounceHorizontal
        showsVerticalScrollIndicator={false}
        directionalLockEnabled
        contentInset={insets}
        contentInsetAdjustmentBehavior="never"
        style={styles.bottomContainer}
      >
        {getSupportedTemplates(block).map(renderTemplate)}
      </ScrollView>
    </View>
  );
};

export const TextInputToolbar = ({
  focusedId,
  scrollRef,
  focusType,
  children,

  nativeID
}) => {
  const [{ height, width }, setLayout] = React.useState({
    height: undefined,
    width: SCREEN_DIMENSIONS.width
  });

  const { schema, updateSchema } = React.useContext(PostSchemaContext);

  const block = focusedId ? selectTextBlock(schema, focusedId) : null;
  const accessoryViewStyle = React.useMemo(
    () => ({ height: height ? height : undefined, width }),
    [height, width]
  );

  return (
    <InputAccessoryView nativeID={nativeID} style={accessoryViewStyle}>
      {children}
      <RawTextInputToolbar
        block={block}
        blockId={focusedId}
        scrollRef={scrollRef}
        updateSchema={updateSchema}
        focusType={focusType}
      />
    </InputAccessoryView>
  );
};
