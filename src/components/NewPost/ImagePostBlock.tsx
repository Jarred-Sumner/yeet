import { connectActionSheet } from "@expo/react-native-action-sheet";
import assert from "assert";
import * as React from "react";
import { StyleProp, StyleSheet, View } from "react-native";
import {
  LongPressGestureHandler,
  State as GestureState,
  TapGestureHandler
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SharedElement } from "react-navigation-shared-element";
import {
  mediaSourcesFromImage,
  YeetImageContainer
} from "../../lib/imageSearch";
import { BoundsRect } from "../../lib/Rect";
import MediaPlayer from "../MediaPlayer";
import { LIST_HEADER_HEIGHT } from "./ImagePicker";
import {
  ChangeBlockFunction,
  ImagePostBlock as ImagePostBlockType,
  PostFormat,
  presetsByFormat
} from "./NewPostFormat";
import { IconPlus, IconPhoto, IconUploadphoto } from "../Icon";
import { MediumText } from "../Text";
import { PlaceholderOverlayGradient } from "../Feed/PostPreviewList";
import { SPACING } from "../../lib/styles";
import { BitmapIconAddPhoto } from "../BitmapIcon";
// import Image from "../Image";

type Props = {
  block: ImagePostBlockType;
  onChange: ChangeBlockFunction;
};

const styles = StyleSheet.create({
  container: {
    width: "100%"
  },
  placeholderGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0
  },
  placeholderContent: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  placeholderIcon: {
    fontSize: 32,
    color: "#eee",
    transform: [{ scale: 1.5 }]
  },
  placeholderLabel: {
    fontSize: 18,
    paddingHorizontal: SPACING.normal,
    color: "#eee",

    textAlign: "center",
    marginTop: SPACING.double
  }
});

const stylesByFormat = {
  [PostFormat.post]: StyleSheet.create({
    image: {},
    container: {
      width: "100%",
      backgroundColor: presetsByFormat[PostFormat.post].backgroundColor
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
      layout,
      id,
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

    React.useImperativeHandle(ref, () => ref.current);

    return (
      <MediaPlayer
        {...otherProps}
        paused={false}
        autoPlay
        id={id}
        key={`${id}-${layout}`}
        borderRadius={borderRadius}
        ref={ref}
        sources={sources}
        style={style}
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
        id={block.id}
        layout={block.layout}
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
        id={block.id}
        layout={block.layout}
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
    if (gestureState === GestureState.END) {
      this.handleOpenPicker();
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

    const ImageComponent =
      {
        [PostFormat.sticker]: StickerImage,
        [PostFormat.post]: LibraryImage
      }[block.format] || LibraryImage;

    if (!ImageComponent) {
      assert(ImageComponent, `must exist for format: ${block.format}`);
    }

    const sizeStyle = {
      width: block.config.dimensions.width,
      height: block.config.dimensions.height
    };

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
              sizeStyle,
              {
                overflow: "hidden"
              }
            ]}
          >
            <SharedElement
              style={sizeStyle}
              id={`block.imagePicker.${block.id}`}
            >
              <ImageComponent block={block} />
            </SharedElement>

            {this.props.children}
          </Animated.View>
        </LongPressGestureHandler>
      );
    } else {
      return (
        <TapGestureHandler
          maxDeltaX={5}
          maxDeltaY={5}
          maxDist={10}
          onGestureEvent={this.handleTapEvent}
          onHandlerStateChange={this.handleTapEvent}
        >
          <Animated.View
            onLayout={onLayout}
            style={[
              styles.container,
              sizeStyle,
              stylesByFormat[block.format].container,
              {
                overflow: "hidden"
              }
            ]}
          >
            <View
              style={[styles.placeholderGradient, sizeStyle]}
              pointerEvents="none"
            >
              <PlaceholderOverlayGradient
                width={sizeStyle.width}
                height={sizeStyle.height}
              />
            </View>

            <View style={[styles.placeholderContent, sizeStyle]}>
              <View style={styles.placeholderIcon}>
                <BitmapIconAddPhoto
                  style={styles.placeholderIcon}
                  color="#fff"
                />
              </View>
            </View>
          </Animated.View>
        </TapGestureHandler>
      );
    }
  }
}

export const ImagePostBlock = connectActionSheet(RawImagePostBlock);
export default ImagePostBlock;
