import { useActionSheet } from "@expo/react-native-action-sheet";
import assert from "assert";
import * as React from "react";
import { findNodeHandle, StyleProp, StyleSheet, View } from "react-native";
import {
  LongPressGestureHandler,
  State as GestureState,
  TapGestureHandler
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import {
  mediaSourcesFromImage,
  YeetImageContainer,
  isVideo
} from "../../lib/imageSearch";
import { BoundsRect, scaleRectByFactor } from "../../lib/Rect";
import { SPACING } from "../../lib/styles";
import { BitmapIconAddPhoto } from "../BitmapIcon";
import { PlaceholderOverlayGradient } from "../Feed/PostPreviewList";
import MediaPlayer from "../MediaPlayer";
import { MediaPlayerComponent } from "../MediaPlayer/MediaPlayerComponent";
import { AnimatedContextMenu, ContextMenuAction } from "../ContextMenu";
import { IS_IOS_13 } from "../../../config";
import {
  ImagePostBlock as ImagePostBlockType,
  ChangeBlockFunction,
  PostFormat,
  PostLayout
} from "../../lib/enums";
import { BlockActionType } from "./BlockActions";
// import Image from "../Image";

type Props = {
  block: ImagePostBlockType;
  onChange: ChangeBlockFunction;
};

const styles = StyleSheet.create({
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
      // flex: 1
      // backgroundColor: presetsByFormat[PostFormat.post].backgroundColor
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

const stylesByLayout = {
  [PostLayout.media]: StyleSheet.create({
    image: {},
    container: {}
  }),
  [PostLayout.horizontalMediaText]: StyleSheet.create({
    image: {},
    container: {}
  }),
  [PostLayout.horizontalMediaText]: StyleSheet.create({
    image: {},
    container: {}
  })
};

const MediaComponent = ({
  source,
  dimensions,
  playDuration,
  containerTag,
  borderRadius,
  usePreview,
  playerRef,
  layout,
  scale = 1.0,
  paused,
  muted,
  id,
  style,
  ...otherProps
}: {
  source: YeetImageContainer;
  dimensions: BoundsRect;
  playDuration?: number | null;
  style: StyleProp<any>;
  scale: number;
}) => {
  const sources = React.useMemo(
    () =>
      mediaSourcesFromImage(
        source,
        scaleRectByFactor(scale, dimensions),
        playDuration,
        usePreview
      ),
    [mediaSourcesFromImage, source, playDuration, dimensions, usePreview, scale]
  );

  return (
    <MediaPlayer
      {...otherProps}
      containerTag={containerTag}
      autoPlay
      id={id}
      paused={paused}
      muted={muted}
      borderRadius={borderRadius}
      resizeMode={"aspectFill"}
      ref={playerRef}
      sources={sources}
      style={style}
    />
  );
};

const LibraryImage = ({
  block,
  usePreview,
  playerRef,
  paused,
  muted,
  containerTag,
  scale = 1.0
}: {
  block: ImagePostBlockType;
  usePreview: boolean;
  scale: number;
}) => {
  return (
    <MediaComponent
      playerRef={playerRef}
      source={block.value}
      id={block.id}
      paused={paused}
      muted={muted}
      layout={block.layout}
      dimensions={block.config.dimensions}
      containerTag={containerTag}
      usePreview={usePreview}
      style={[
        stylesByFormat[block.format].image,
        stylesByLayout[block.layout]?.image,
        {
          width: block.config.dimensions.width,
          height: block.config.dimensions.height
        },
        {
          transform: block.value.image.transform
        }
      ]}
    />
  );
};

const StickerImage = ({
  block,
  paused,
  muted,
  usePreview,
  playerRef,
  scale = 1.0
}: {
  block: ImagePostBlockType;
  usePreview: boolean;
  scale: number;
}) => {
  return (
    <MediaComponent
      playerRef={playerRef}
      source={block.value}
      usePreview={usePreview}
      id={block.id}
      paused={paused}
      muted={muted}
      layout={block.layout}
      scale={scale}
      dimensions={block.config.dimensions}
      borderRadius={2}
      style={[
        stylesByFormat[block.format].image,
        stylesByLayout[block.layout]?.image,
        {
          width: block.config.dimensions.width,
          height: block.config.dimensions.height
        },
        {
          transform: block.value.image.transform
        }
      ]}
    />
  );
};

class RawImagePostBlock extends React.Component<Props> {
  constructor(props) {
    super(props);

    this.setActions();
  }
  handleChangeImage = (photo: YeetImageContainer) => {
    this.props.onChangePhoto(this.props.block.id, photo);
  };

  handleOpenPicker = () => {
    this.handlePressAction({ nativeEvent: { id: BlockActionType.change } });
  };

  handleOpenSheet = () => {
    const options = this.props.block.required
      ? ["Change image", "Cancel"]
      : ["Change image", "Delete", "Cancel"];
    const cancelButtonIndex = options.length - 1;
    const destructiveButonIndex = this.props.block.required ? 1 : undefined;

    this.props.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButonIndex
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          this.handlePressAction({
            nativeEvent: { id: BlockActionType.change }
          });
        } else if (buttonIndex === destructiveButonIndex) {
          this.handlePressAction({
            nativeEvent: { id: BlockActionType.delete }
          });
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

  get boundsHandle() {
    return findNodeHandle(this.containerRef.current);
  }

  get imageHandle() {
    return this.imageRef.current.nativeNode;
  }

  get isTextPostBlock() {
    return false;
  }

  get isImagePostBlock() {
    return true;
  }

  updateImageRef = (mediaPlayer: MediaPlayerComponent | null) => {
    const { inputRef } = this.props;

    if (typeof inputRef === "function") {
      inputRef(mediaPlayer);
    } else if (typeof inputRef === "object") {
      inputRef.current = mediaPlayer;
    }

    this.imageRef.current = mediaPlayer;
  };

  componentDidMount() {
    if (this.containerRef.current) {
      this.containerTag = findNodeHandle(this.containerRef.current);
    }
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.block !== this.props.block ||
      prevProps.block.value !== this.props.block.value
    ) {
      if (this.containerRef.current) {
        this.containerTag = findNodeHandle(this.containerRef.current);
      }

      this.setActions();
    }
  }

  imageRef = React.createRef<MediaPlayerComponent>();
  containerRef = React.createRef<View>();

  get isVideo() {
    return isVideo(
      (this.props.block.value as YeetImageContainer).image.mimeType
    );
  }

  setActions() {
    const cropAction = {
      id: BlockActionType.crop,
      title: `Crop`,
      systemIcon: "crop"
    };
    const moveAction = {
      id: BlockActionType.move,
      title: `Move`,
      systemIcon: "rectangle.on.rectangle"
    };

    const formatActons =
      this.props.block.format === PostFormat.post
        ? [
            {
              id: BlockActionType.change,
              title: `Replace`,
              systemIcon: "photo"
            },
            cropAction,
            moveAction
          ]
        : [cropAction];
    if (this.isVideo) {
      this.actions = [
        ...formatActons,
        {
          id: BlockActionType.trim,
          title: `Trim`,
          systemIcon: "film"
        },

        {
          id: BlockActionType.delete,
          title: `Delete`,
          systemIcon: "trash",
          destructive: true,
          disabled: !this.props.block.required
        }
      ];
    } else {
      this.actions = [
        ...formatActons,
        {
          id: BlockActionType.delete,
          title: `Delete`,
          systemIcon: "trash",
          destructive: true,
          disabled: !this.props.block.required
        }
      ];
    }
  }

  handlePressAction = ({ nativeEvent: { id } }) => {
    this.props.onAction({
      action: id,
      id: this.props.block.id
    });
  };

  get sizeStyle() {
    const { block } = this.props;

    return {
      width: block.config.dimensions.width,
      height: block.config.dimensions.height
    };
  }

  actions: Array<ContextMenuAction> = [];

  render() {
    const {
      block,
      onLayout,
      scrollRef,
      inputRef,
      scale,
      onTap,
      usePreview = false
    } = this.props;

    const ImageComponent =
      {
        [PostFormat.sticker]: StickerImage,
        [PostFormat.post]: LibraryImage
      }[block.format] || LibraryImage;

    if (!ImageComponent) {
      assert(ImageComponent, `must exist for format: ${block.format}`);
    }
    const sizeStyle = this.sizeStyle;

    if (block.value) {
      return (
        <LongPressGestureHandler
          onGestureEvent={this.handleLongPress}
          enabled={!IS_IOS_13 && !this.props.disabled}
          ref={this.props.gestureRef}
          onHandlerStateChange={this.handleLongPress}
        >
          <AnimatedContextMenu
            ref={this.containerRef}
            onPress={this.handlePressAction}
            actions={this.actions}
            onLayout={onLayout}
            style={[
              styles.container,
              stylesByFormat[block.format].container,
              stylesByLayout[block.layout]?.container,
              {
                overflow: "hidden",
                flex: 0,
                position: "relative"
              }
            ]}
          >
            <ImageComponent
              block={block}
              playerRef={this.updateImageRef}
              usePreview={usePreview}
              muted={this.props.muted}
              paused={this.props.paused}
              containerTag={this.containerTag}
              scale={scale}
            />

            {this.props.children}
          </AnimatedContextMenu>
        </LongPressGestureHandler>
      );
    } else {
      return (
        <TapGestureHandler
          maxDeltaX={5}
          maxDeltaY={5}
          enabled={!IS_IOS_13 && !this.props.disabled}
          maxDist={10}
          ref={this.props.gestureRef}
          onGestureEvent={this.handleTapEvent}
          onHandlerStateChange={this.handleTapEvent}
        >
          <Animated.View
            onLayout={onLayout}
            style={[
              styles.container,
              sizeStyle,
              stylesByFormat[block.format].container,
              stylesByLayout[block.layout]?.container,
              {
                overflow: "hidden",
                backgroundColor: "#000"
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

export const ImagePostBlock = React.forwardRef((props, ref) => {
  const actionSheetProps = useActionSheet();
  return <RawImagePostBlock {...actionSheetProps} {...props} ref={ref} />;
});
export default ImagePostBlock;
