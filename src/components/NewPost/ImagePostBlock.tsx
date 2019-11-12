import { connectActionSheet } from "@expo/react-native-action-sheet";
import assert from "assert";
import * as React from "react";
import { StyleSheet, StyleProp } from "react-native";
import FastImage from "react-native-fast-image";
import {
  LongPressGestureHandler,
  State as GestureState
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import Video from "react-native-video";
import { SharedElement } from "react-navigation-shared-element";
import { SCREEN_DIMENSIONS } from "../../../config";
import { convertCameraRollIDToRNFetchBlobId } from "../../lib/imageResize";
import {
  ImageMimeType,
  YeetImageContainer,
  mediaSourceFromImage,
  mediaSourcesFromImage
} from "../../lib/imageSearch";
import Image from "../Image";
import { ImagePicker, LIST_HEADER_HEIGHT } from "./ImagePicker";
import {
  ChangeBlockFunction,
  ImagePostBlock as ImagePostBlockType,
  PostFormat,
  presetsByFormat
} from "./NewPostFormat";
import MediaPlayer from "../MediaPlayer";
import { BoundsRect } from "../../lib/Rect";
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
  [PostFormat.library]: StyleSheet.create({
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

const MediaComponent = React.forwardRef(
  (
    {
      source,
      dimensions,
      playDuration,
      borderRadius,
      style,
      ...otherProps
    }: {
      source: YeetImageContainer;
      dimensions: BoundsRect;
      playDuration?: number | null;
      style: StyleProp<any>;
    },
    ref
  ) => {
    const sources = React.useMemo(
      () => mediaSourcesFromImage(source, dimensions, playDuration),
      [mediaSourcesFromImage, source, playDuration, dimensions]
    );

    return (
      <MediaPlayer
        {...otherProps}
        paused={false}
        autoPlay
        borderRadius={borderRadius}
        ref={ref}
        sources={sources}
        style={style}
      />
    );
  }
);

const ScreenshotImage = React.forwardRef(
  ({ block }: { block: ImagePostBlockType }, ref) => {
    return (
      <MediaComponent
        ref={ref}
        source={block.value}
        dimensions={block.config.dimensions}
        style={[
          stylesByFormat[block.format].image,
          {
            transform: block.value.image.transform,
            width: block.config.dimensions.width,
            height: block.config.dimensions.height
          }
        ]}
      />
    );
  }
);

const LibraryImage = React.forwardRef(
  ({ block }: { block: ImagePostBlockType }, ref) => {
    return (
      <MediaComponent
        ref={ref}
        source={block.value}
        dimensions={block.config.dimensions}
        style={[
          stylesByFormat[block.format].image,
          {
            transform: block.value.image.transform,
            width: block.config.dimensions.width,
            height: block.config.dimensions.height
          }
        ]}
      />
    );
  }
);

const CaptionImage = React.forwardRef(
  ({ block }: { block: ImagePostBlockType }, ref) => {
    return (
      <MediaComponent
        ref={ref}
        source={block.value}
        dimensions={block.config.dimensions}
        style={[
          stylesByFormat[block.format].image,
          {
            transform: block.value.image.transform,
            width: block.config.dimensions.width,
            height: block.config.dimensions.height
          }
        ]}
      />
    );
  }
);

const StickerImage = React.forwardRef(
  ({ block }: { block: ImagePostBlockType }, ref) => {
    return (
      <MediaComponent
        ref={ref}
        source={block.value}
        dimensions={block.config.dimensions}
        borderRadius={2}
        style={[
          stylesByFormat[block.format].image,
          {
            transform: block.value.image.transform,
            width: block.config.dimensions.width,
            height: block.config.dimensions.height
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
      [PostFormat.sticker]: StickerImage,
      [PostFormat.library]: LibraryImage
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
                width: block.config.dimensions.width,
                height: block.config.dimensions.height,
                overflow: "hidden"
              }
            ]}
          >
            <SharedElement
              style={{
                width: block.config.dimensions.width,
                height: block.config.dimensions.height
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
          ></Animated.View>

          {this.props.children}
        </Animated.View>
      );
    }
  }
}

export const ImagePostBlock = connectActionSheet(RawImagePostBlock);
export default ImagePostBlock;
