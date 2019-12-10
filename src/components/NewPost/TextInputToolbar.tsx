import * as React from "react";
import { View, StyleSheet, ImageProps } from "react-native";
import { TextPostBlock, PostFormat, TextTemplate } from "./NewPostFormat";
import { SCREEN_DIMENSIONS } from "../../../config";
import { COLORS, SPACING } from "../../lib/styles";
import {
  ScrollView,
  BorderlessButton,
  RectButton
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { MediumText } from "../Text";
import {
  BitmapIconTemplateClassic,
  BitmapIconTemplateComic,
  BitmapIconTemplateGary,
  BitmapIconTemplatePixel,
  BitmapIconTemplateMonospace
} from "../BitmapIcon";
import tinycolor from "tinycolor2";
import { sendLightFeedback } from "../../lib/Vibration";

const CONTAINER_HEIGHT = 40;

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    marginTop: SPACING.normal,
    width: SCREEN_DIMENSIONS.width,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(25, 25, 25, 0.85)"
  },
  template: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    height: CONTAINER_HEIGHT,
    paddingRight: SPACING.half,
    paddingLeft: SPACING.half
  },
  selectedTemplate: {
    backgroundColor: tinycolor(COLORS.primary)
      .setAlpha(0.25)
      .toString()
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

const UNDERLAY_COLOR = tinycolor(COLORS.primary)
  .setAlpha(0.5)
  .toString();

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
      underlayColor={UNDERLAY_COLOR}
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
  if (block.format === PostFormat.comment) {
    return [TextTemplate.comment];
  } else if (block.format === PostFormat.post) {
    return [TextTemplate.post, TextTemplate.terminal, TextTemplate.pickaxe];
  } else {
    return [
      TextTemplate.basic,
      TextTemplate.terminal,
      TextTemplate.comic,
      TextTemplate.gary,

      TextTemplate.pickaxe
    ];
  }
};

export const TextInputToolbar = ({
  block,
  scrollRef,
  onChooseTemplate
}: {
  block: TextPostBlock;
  onChooseTemplate: Function;
}) => {
  return (
    <ScrollView
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      horizontal
      scrollIndicatorInsets={{ top: 0, bottom: 0, left: 0, right: 0 }}
      contentOffset={{ x: 0, y: 0 }}
      showsHorizontalScrollIndicator={false}
      shouldCancelWhenOutside
      alwaysBounceVertical={false}
      alwaysBounceHorizontal
      showsVerticalScrollIndicator={false}
      directionalLockEnabled
      contentInset={{ top: 0, bottom: 0, left: 0, right: 0 }}
      contentInsetAdjustmentBehavior="never"
      style={styles.container}
    >
      {block &&
        getSupportedTemplates(block).map(template => {
          const selectedTemplate = block.config.template;
          const isSelected = selectedTemplate === template;

          return (
            <TemplateOption
              template={template}
              key={`${template}-${isSelected}`}
              isSelected={isSelected}
              onPress={onChooseTemplate}
            />
          );
        })}
    </ScrollView>
  );
};
