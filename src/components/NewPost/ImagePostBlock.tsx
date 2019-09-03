import assert from "assert";
import * as React from "react";
import { Image, StyleSheet, View, Dimensions } from "react-native";
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

    if (block.value.src) {
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
                width: block.value.width,
                height: block.value.height,
                overflow: "hidden"
              }
            ]}
          >
            <Animated.View
              style={{
                transform: [{ translateY: -1 * (LIST_HEADER_HEIGHT + 15) }],
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
