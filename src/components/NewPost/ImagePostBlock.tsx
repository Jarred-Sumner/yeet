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
      borderRadius: presetsByFormat[PostFormat.caption].borderRadius,
      backgroundColor: "transparent"
    },
    container: {
      paddingVertical: presetsByFormat[PostFormat.caption].paddingVertical,
      width: "100%",
      backgroundColor: "transparent"
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
      source={{
        uri: block.value.src.uri,
        width: block.value.width,
        height: block.value.height
      }}
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
  const width = Math.min(POST_WIDTH, block.value.src.width);
  const ratio = width / block.value.src.width;
  const height = block.value.src.height * ratio;

  return (
    <Image
      source={{
        uri: block.value.src.uri,
        width,
        height
      }}
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
