import assert from "assert";
import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import { calculateAspectRatioFit } from "../../lib/imageResize";
import {
  ChangeBlockFunction,
  ImagePostBlock as ImagePostBlockType,
  PostFormat,
  presetsByFormat
} from "./NewPostFormat";
import { MAX_POST_HEIGHT, POST_WIDTH } from "./PostEditor";

type Props = {
  block: ImagePostBlockType;
  onChange: ChangeBlockFunction;
};

const styles = StyleSheet.create({
  container: {
    width: "100%"
  }
});

const stylesByFormat = {
  [PostFormat.caption]: StyleSheet.create({
    image: {
      overflow: "hidden",
      flex: 0,
      borderRadius: presetsByFormat[PostFormat.caption].borderRadius
    },
    container: {
      paddingVertical: presetsByFormat[PostFormat.caption].paddingVertical,
      paddingHorizontal: presetsByFormat[PostFormat.caption].paddingHorizontal,
      width: "100%",
      backgroundColor: presetsByFormat[PostFormat.caption].backgroundColor
    }
  }),
  [PostFormat.screenshot]: StyleSheet.create({
    image: {},
    container: {
      width: "100%",
      backgroundColor: presetsByFormat[PostFormat.screenshot].backgroundColor
    }
  })
};

const ScreenshotImage = ({ block }: { block: ImagePostBlockType }) => {
  return (
    <Image
      source={block.value.src}
      resizeMode="stretch"
      style={[
        stylesByFormat[block.format].image,
        {
          width: block.value.width,
          height: block.value.height
        }
      ]}
    />
  );
};

const CaptionImage = ({ block }: { block: ImagePostBlockType }) => {
  const maxWidth =
    POST_WIDTH - presetsByFormat[PostFormat.caption].paddingHorizontal * 2;
  const { width, height } = calculateAspectRatioFit(
    block.value.src.width,
    block.value.src.height,
    maxWidth,
    Math.min(block.value.height, MAX_POST_HEIGHT)
  );

  return (
    <Image
      source={block.value.src}
      resizeMode="stretch"
      style={[
        stylesByFormat[block.format].image,
        {
          height,
          width
        }
      ]}
    />
  );
};

export class ImagePostBlock extends React.Component<Props> {
  handleChange = text => {
    this.props.onChange({
      ...this.props.block,
      value: text
    });
  };

  render() {
    const { block, onLayout } = this.props;

    const ImageComponent = {
      [PostFormat.caption]: CaptionImage,
      [PostFormat.screenshot]: ScreenshotImage
    }[block.format];

    if (!ImageComponent) {
      assert(ImageComponent, `must exist for format: ${block.format}`);
    }

    return (
      <View
        onLayout={onLayout}
        style={[styles.container, stylesByFormat[block.format].container]}
      >
        <ImageComponent block={block} />

        {this.props.children}
      </View>
    );
  }
}
