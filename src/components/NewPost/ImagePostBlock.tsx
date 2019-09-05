import assert from "assert";
import * as React from "react";
import { Image as RNImage, StyleSheet, View, Dimensions } from "react-native";
import { calculateAspectRatioFit } from "../../lib/imageResize";
import {
  ChangeBlockFunction,
  ImagePostBlock as ImagePostBlockType,
  PostFormat,
  POST_WIDTH,
  MAX_POST_HEIGHT,
  presetsByFormat
} from "./NewPostFormat";
import { ImagePicker, LIST_HEADER_HEIGHT } from "./ImagePicker";
import { SharedElement } from "react-navigation-sharedelement";
import Animated from "react-native-reanimated";
import { debounce } from "lodash";
import {
  FlingGestureHandler,
  Directions,
  State as GestureState,
  ScrollView,
  TapGestureHandler
} from "react-native-gesture-handler";
import { SemiBoldText } from "../Text";
import Image from "../Image";
const SCREEN_DIMENSIONS = Dimensions.get("window");

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
        uri: block.value.image.uri,
        ...block.config.dimensions
      }}
      resizeMode="stretch"
      style={[stylesByFormat[block.format].image, block.config.dimensions]}
    />
  );
};

const CaptionImage = ({ block }: { block: ImagePostBlockType }) => {
  return (
    <Image
      source={{
        uri: block.value.image.uri,
        ...block.config.dimensions
      }}
      resizeMode="stretch"
      style={[stylesByFormat[block.format].image, block.config.dimensions]}
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

  handleOpenPicker = () => {
    this.props.onOpenImagePicker(this.props.block);
  };

  handleTapEvent = ({ nativeEvent: { state: gestureState } }) => {
    if (gestureState === GestureState.BEGAN && this.props.onTap) {
      this.props.onTap(this.props.block.id);
    }
  };

  render() {
    const { block, onLayout, scrollRef, inputRef, onTap } = this.props;

    const ImageComponent = {
      [PostFormat.caption]: CaptionImage,
      [PostFormat.screenshot]: ScreenshotImage
    }[block.format];

    if (!ImageComponent) {
      assert(ImageComponent, `must exist for format: ${block.format}`);
    }

    if (block.value) {
      return (
        <View
          onLayout={onLayout}
          style={[styles.container, stylesByFormat[block.format].container]}
        >
          <SharedElement id={`block.imagePicker.${block.id}`}>
            <ImageComponent block={block} />
          </SharedElement>

          {this.props.children}
        </View>
      );
    } else {
      const translateY =
        PostFormat.screenshot === block.format
          ? 0
          : -1 * (LIST_HEADER_HEIGHT + 15);

      return (
        <TapGestureHandler
          enabled={!!this.props.onTap}
          onHandlerStateChange={this.handleTapEvent}
          onGestureEvent={this.handleTapEvent}
          waitFor={[scrollRef]}
        >
          <Animated.View
            onLayout={onLayout}
            style={[
              styles.container,
              stylesByFormat[block.format].container,
              {
                flex: 1,
                overflow: "hidden"
              }
            ]}
          >
            <Animated.View
              style={{
                transform: [{ translateY }],
                backgroundColor: "#000"
              }}
            >
              <SharedElement
                style={{
                  width: SCREEN_DIMENSIONS.width,
                  height: SCREEN_DIMENSIONS.height
                }}
                id={`block.imagePicker.${block.id}`}
              >
                <ImagePicker
                  width={SCREEN_DIMENSIONS.width}
                  scrollEnabled={false}
                  height={SCREEN_DIMENSIONS.height}
                />
              </SharedElement>
            </Animated.View>

            {this.props.children}
          </Animated.View>
        </TapGestureHandler>
      );
    }
  }
}
