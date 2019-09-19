import assert from "assert";
import * as React from "react";
import { StyleSheet, View, Dimensions } from "react-native";
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
import { SharedElement } from "react-navigation-shared-element";
import Animated from "react-native-reanimated";
import { debounce } from "lodash";
import {
  FlingGestureHandler,
  Directions,
  State as GestureState,
  ScrollView,
  TapGestureHandler,
  LongPressGestureHandler
} from "react-native-gesture-handler";
import { SemiBoldText } from "../Text";
import Image from "../Image";
import FastImage from "react-native-fast-image";
import { YeetImageContainer } from "../../lib/imageSearch";
import { connectActionSheet } from "@expo/react-native-action-sheet";
import { SCREEN_DIMENSIONS } from "../../../config";
// import Image from "../Image";

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
  }),
  [PostFormat.sticker]: StyleSheet.create({
    image: {
      backgroundColor: "transparent"
    },
    container: {
      backgroundColor: "transparent"
    }
  })
};

const ScreenshotImage = React.forwardRef(
  ({ block }: { block: ImagePostBlockType }, ref) => {
    return (
      <Image
        ref={ref}
        source={{
          uri: block.value.image.uri,
          width: block.value.image.width,
          height: block.value.image.height,
          cache: FastImage.cacheControl.web
        }}
        resizeMode="stretch"
        style={[
          stylesByFormat[block.format].image,
          {
            transform: block.value.image.transform,
            width: block.config.dimensions.maxX - block.config.dimensions.x,
            height: block.config.dimensions.maxY - block.config.dimensions.y
          }
        ]}
      />
    );
  }
);

const CaptionImage = React.forwardRef(
  ({ block }: { block: ImagePostBlockType }, ref) => {
    return (
      <Image
        ref={ref}
        source={{
          uri: block.value.image.uri,
          width: block.value.image.width,
          height: block.value.image.height,
          cache: FastImage.cacheControl.web
        }}
        resizeMode="stretch"
        style={[
          stylesByFormat[block.format].image,
          {
            transform: block.value.image.transform,
            width: block.config.dimensions.maxX - block.config.dimensions.x,
            height: block.config.dimensions.maxY - block.config.dimensions.y
          }
        ]}
      />
    );
  }
);

const StickerImage = React.forwardRef(
  ({ block }: { block: ImagePostBlockType }, ref) => {
    return (
      <Image
        ref={ref}
        source={{
          uri: block.value.image.uri,
          width: block.value.image.width,
          height: block.value.image.height,
          cache: FastImage.cacheControl.web
        }}
        resizeMode="stretch"
        style={[
          stylesByFormat[block.format].image,
          {
            transform: block.value.image.transform,
            borderRadius: 2,
            width: block.config.dimensions.maxX - block.config.dimensions.x,
            height: block.config.dimensions.maxY - block.config.dimensions.y
          }
        ]}
      />
    );
  }
);

class RawImagePostBlock extends React.Component<Props> {
  handleChangeImage = (photo: YeetImageContainer) => {
    console.log("CHANGE", photo);
    this.props.onChangePhoto(this.props.block.id, photo);
  };

  handleOpenPicker = () => {
    this.props.onOpenImagePicker(this.props.block);
  };

  handleOpenSheet = () => {
    const options = this.props.block.required
      ? ["Change image", "Cancel"]
      : ["Change image", "Delete", "Cancel"];
    const cancelButtonIndex = options.length - 1;
    const descructiveButtonIndex = this.props.block.required ? 1 : undefined;

    this.props.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        descructiveButtonIndex
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          this.handleOpenPicker();
        }
      }
    );
  };

  handleTapEvent = ({ nativeEvent: { state: gestureState } }) => {
    if (gestureState === GestureState.BEGAN && this.props.onTap) {
      this.props.onTap(this.props.block.id);
    }
  };

  handleLongPress = Animated.event(
    [
      {
        nativeEvent: ({ state: gestureState }) =>
          Animated.cond(
            Animated.eq(gestureState, GestureState.END),
            Animated.call([], this.handleOpenSheet)
          )
      }
    ],
    { useNativeDriver: true }
  );

  render() {
    const { block, onLayout, scrollRef, inputRef, onTap } = this.props;

    const ImageComponent = {
      [PostFormat.caption]: CaptionImage,
      [PostFormat.screenshot]: ScreenshotImage,
      [PostFormat.sticker]: StickerImage
    }[block.format];

    if (!ImageComponent) {
      assert(ImageComponent, `must exist for format: ${block.format}`);
    }

    if (block.value) {
      return (
        <LongPressGestureHandler
          onGestureEvent={this.handleLongPress}
          onHandlerStateChange={this.handleLongPress}
        >
          <Animated.View
            onLayout={onLayout}
            ref={inputRef}
            style={[
              styles.container,
              stylesByFormat[block.format].container,
              {
                width: block.config.dimensions.maxX - block.config.dimensions.x,
                height:
                  block.config.dimensions.maxY - block.config.dimensions.y,
                overflow: "hidden"
              }
            ]}
          >
            <SharedElement
              style={{
                width: block.config.dimensions.maxX - block.config.dimensions.x,
                height: block.config.dimensions.maxY - block.config.dimensions.y
              }}
              id={`block.imagePicker.${block.id}`}
            >
              <ImageComponent block={block} />
            </SharedElement>

            {this.props.children}
          </Animated.View>
        </LongPressGestureHandler>
      );
    } else {
      const translateY =
        PostFormat.screenshot === block.format
          ? 0
          : -1 * (LIST_HEADER_HEIGHT + 15);

      return (
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
              flex: 1,
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
                onChange={this.handleChangeImage}
                height={SCREEN_DIMENSIONS.height}
              />
            </SharedElement>
          </Animated.View>

          {this.props.children}
        </Animated.View>
      );
    }
  }
}

export const ImagePostBlock = connectActionSheet(RawImagePostBlock);
export default ImagePostBlock;
