import chroma from "chroma-js";
import * as React from "react";
import { ImageProps, ScrollView, StyleSheet } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS } from "../../../config";
import { COLORS, SPACING } from "../../lib/styles";
import { sendLightFeedback } from "../../lib/Vibration";
import { useLayout } from "react-native-hooks";
import {
  BitmapIconTemplateBigWords,
  BitmapIconTemplateClassic,
  BitmapIconTemplateComic,
  BitmapIconTemplateGary,
  BitmapIconTemplateMonospace,
  BitmapIconTemplatePixel
} from "../BitmapIcon";
import { PostFormat, TextPostBlock, TextTemplate } from "./NewPostFormat";
import { BorderTypeButton, TextAlignmentButton } from "./EditorFooter";
import { ColorSlider } from "../ColorSlider";
import { View } from "react-native";
import {
  getTextBlockColor,
  getTextBlockBackgroundColor
} from "./Text/TextInput";
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
import { buildTextBlock, FocusType } from "../../lib/buildPost";
import { InputAccessoryView } from "../InputAccessoryView";

const CONTAINER_HEIGHT = 40;

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    marginTop: SPACING.normal,
    flexDirection: "row",
    width: SCREEN_DIMENSIONS.width,
    paddingHorizontal: SPACING.normal
  },
  staticWrapper: {
    backgroundColor: "rgba(0, 0, 0, 0.75)"
  },
  spacer: {
    marginLeft: SPACING.half,
    marginRight: SPACING.normal,
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
    height: 13,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center"
  },
  colorSliderContainer: {
    flex: 1,
    flexDirection: "row",
    paddingLeft: SPACING.normal
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
    sendLightFeedback();
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

const RawTextInputToolbar = React.memo(
  ({
    block,
    scrollRef,
    onChooseTemplate,
    focusType,
    onLayout,
    onChangeOverrides,
    onChangeBorderType
  }: {
    block: TextPostBlock;
    onChooseTemplate: Function;
  }) => {
    const selectedTemplate = block?.config?.template ?? TextTemplate.basic;

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
    const offset = React.useMemo(() => ({ x: insets.left * -1, y: 0 }), [
      insets
    ]);

    const _overrides = block?.config?.overrides ?? {};

    const onChangeColor = React.useCallback(
      ({ nativeEvent: { color } }) => {
        let overides = { ..._overrides, color };

        if (isColorLight(color)) {
          overides.backgroundColor = getDarkColor(color);
        } else if (isColorDark(color)) {
          overides.backgroundColor = getLightColor(color);
        } else if (isColorNeutral(color)) {
          overides.backgroundColor = getNeutralColor(color);
        }

        onChangeOverrides(overides);
      },
      [
        onChangeOverrides,
        _overrides,

        isColorLight,
        getDarkColor,
        isColorDark,
        getLightColor,
        isColorNeutral,
        getNeutralColor
      ]
    );

    const onChangeTextAlign = React.useCallback(
      textAlign => {
        const overrides = { ..._overrides, textAlign };

        onChangeOverrides(overrides);
      },
      [onChangeOverrides, _overrides]
    );

    const color = block ? getTextBlockColor(block) : "rgb(255, 255, 255)";
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
            <BorderTypeButton block={block} onChange={onChangeBorderType} />
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
            <ColorSlider
              style={styles.colorSlider}
              color={color}
              onPress={onChangeColor}
            />
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
  }
);

export const TextInputToolbar = ({
  block,
  scrollRef,
  focusType,
  onChooseTemplate,
  onChangeOverrides,
  onChangeBorderType,
  nativeID
}) => {
  const [{ height, width }, setLayout] = React.useState({
    height: undefined,
    width: SCREEN_DIMENSIONS.width
  });

  const handleChangeLayout = React.useCallback(
    ({
      nativeEvent: {
        layout: { width, height }
      }
    }) => {
      setLayout({ width, height });
    },
    [setLayout]
  );

  const accessoryViewStyle = React.useMemo(
    () => ({ height: height ? height : undefined, width }),
    [height, width]
  );

  return (
    <InputAccessoryView nativeID={nativeID} style={accessoryViewStyle}>
      <RawTextInputToolbar
        block={block}
        scrollRef={scrollRef}
        focusType={focusType}
        onChooseTemplate={onChooseTemplate}
        onLayout={handleChangeLayout}
        onChangeOverrides={onChangeOverrides}
        onChangeBorderType={onChangeBorderType}
      />
    </InputAccessoryView>
  );
};
