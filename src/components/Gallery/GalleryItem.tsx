import { get, isFinite } from "lodash";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { BaseButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { PostFragment } from "../../lib/graphql/PostFragment";
import {
  ImageMimeType,
  mediaSourceFromImage,
  YeetImageContainer,
  isVideo,
  ImageSourceType,
  imageContainerFromMediaSource
} from "../../lib/imageSearch";
import { COLORS, SPACING } from "../../lib/styles";
import { useMemoOne } from "use-memo-one";
import { BitmapIconCircleCheckSelected } from "../BitmapIcon";
import { MediaPlayer, MediaSource } from "../MediaPlayer";
import { DurationLabel } from "../NewPost/ImagePicker/DurationLabel";
import { MediumText } from "../Text";
import { COLUMN_GAP } from "./COLUMN_COUNT";
import chroma from "chroma-js";
import {
  HORIZONTAL_ITEM_HEIGHT,
  HORIZONTAL_ITEM_WIDTH,
  MEMES_ITEM_HEIGHT,
  MEMES_ITEM_WIDTH,
  SQUARE_ITEM_HEIGHT,
  SQUARE_ITEM_WIDTH,
  VERTICAL_ITEM_HEIGHT,
  VERTICAL_ITEM_WIDTH,
  INSET_SQUARE_ITEM_HEIGHT,
  INSET_SQUARE_ITEM_WIDTH,
  INSET_SQUARE_INSET
} from "./sizes";
import { cloneDeep } from "lodash";
import { MediaPlayerComponent } from "../MediaPlayer/MediaPlayerComponent";

const BORDER_RADIUS = 0;

const photoCellStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderRadius: BORDER_RADIUS,
    justifyContent: "center"
  },
  button: {
    alignItems: "center",
    overflow: "visible",

    borderRadius: BORDER_RADIUS,
    justifyContent: "center",
    backgroundColor: "#222"
  },
  transparentButton: { backgroundColor: "transparent" },
  insetBorder: {
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  username: {
    color: "white",
    fontSize: 12,
    textShadowColor: "black",
    textShadowRadius: 1,
    textShadowOffset: {
      width: 0,
      height: 0
    }
  },
  transparentContainer: {
    alignItems: "center",
    overflow: "visible",
    justifyContent: "center"
  },
  selectedContainer: {
    borderColor: COLORS.primary,
    borderWidth: 1
  },
  selectedIcon: {
    position: "absolute",
    right: SPACING.half,
    bottom: SPACING.half
  },
  durationContainer: {
    position: "absolute",
    right: SPACING.half,
    justifyContent: "center",
    bottom: SPACING.half
  },
  durationContainerTop: {
    position: "absolute",
    top: 2,
    justifyContent: "center",
    right: 2
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    justifyContent: "center",
    bottom: 0,
    zIndex: 2
  },
  author: {
    borderBottomLeftRadius: BORDER_RADIUS,
    borderBottomRightRadius: BORDER_RADIUS,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 2,
    paddingHorizontal: 2
  }
});

const sizeStyles = StyleSheet.create({
  square: {
    width: SQUARE_ITEM_WIDTH,
    height: SQUARE_ITEM_HEIGHT
  },
  insetSquare: {
    width: INSET_SQUARE_ITEM_WIDTH,
    height: INSET_SQUARE_ITEM_HEIGHT
  },
  horizontal: {
    width: HORIZONTAL_ITEM_WIDTH,
    height: HORIZONTAL_ITEM_HEIGHT
  },
  vertical: {
    width: VERTICAL_ITEM_WIDTH,
    height: VERTICAL_ITEM_HEIGHT
  },
  fourColumn: {
    width: MEMES_ITEM_WIDTH,
    height: MEMES_ITEM_HEIGHT
  }
});

const rowStyles = StyleSheet.create({
  column: {
    justifyContent: "space-around",
    marginLeft: 0,
    width: "100%",
    flexDirection: "row",
    backgroundColor: COLORS.primaryDark
  },
  padded: {
    justifyContent: "space-evenly",
    // paddingHorizontal: INSET_SQUARE_INSET,
    height: INSET_SQUARE_ITEM_HEIGHT + COLUMN_GAP * 2,
    paddingVertical: COLUMN_GAP * 2,
    backgroundColor: chroma
      .blend(chroma(COLORS.primary).alpha(0.95), "blue", "darken")
      .alpha(0.55)
      .css(),
    width: "100%",
    flexDirection: "row"
  },
  fourColumn: {
    justifyContent: "space-evenly",
    paddingHorizontal: COLUMN_GAP,
    backgroundColor: COLORS.primaryDark,
    width: "100%",
    flexDirection: "row"
  }
});

export const galleryItemMediaSource = (
  image: YeetImageContainer,
  width: number,
  height: number
) => {
  return mediaSourceFromImage(image, { width, height }, true, true);
};

export const galleryItemResizeMode = ({ source, width, height }) => {
  // const isSquareInAHorizontalImage =
  //   width / height > 0.9 &&
  //   width / height < 1.1 &&
  //   source.width / source.height > 1.3;

  return "aspectFill";
  // return source.duration > 0 ? "aspectFit" : "aspectFill";
};

const AuthorLabel = React.memo(({ username, width, height }) => (
  <View style={photoCellStyles.author}>
    <MediumText
      numberOfLines={1}
      // adjustsFontSizeToFit
      width={width}
      height={height}
      style={photoCellStyles.username}
    >
      @{username}
    </MediumText>
  </View>
));

const GalleryItemComponent = React.memo(
  ({
    isVideo,
    onPress,
    containerStyle,
    playerRef,
    viewStyle,
    width,
    height,
    mediaSource,
    image,
    resizeMode,
    transparent,
    id,
    mediaPlayerStyle,
    borderStyle,
    duration,
    username,
    isSelected,
    sources,
    paused
  }) => {
    if (isVideo) {
      return (
        <BaseButton
          shouldCancelWhenOutside
          shouldActivateOnStart={false}
          exclusive={false}
          onPress={onPress}
          style={containerStyle}
          width={width}
          height={height}
        >
          <Animated.View style={viewStyle}>
            <MediaPlayer
              mediaSource={mediaSource}
              sources={sources}
              muted
              ref={playerRef}
              thumbnail
              paused={paused}
              opaque={!transparent}
              loop
              resizeMode={resizeMode}
              id={id}
              autoPlay={false}
              borderRadius={1}
              // onError={onError}
              style={mediaPlayerStyle}
            />
            {!transparent && (
              <View
                width={width}
                height={height}
                pointerEvents="none"
                style={borderStyle}
              />
            )}

            {/* {username && (
              <View
                width={width}
                pointerEvents="none"
                style={photoCellStyles.footer}
              >
                <AuthorLabel username={username} width={width} />
              </View>
            )} */}

            <DurationLabel
              duration={duration}
              style={
                username
                  ? photoCellStyles.durationContainerTop
                  : photoCellStyles.durationContainer
              }
            />

            {isSelected && (
              <View style={photoCellStyles.selectedIcon}>
                <BitmapIconCircleCheckSelected />
              </View>
            )}
          </Animated.View>
        </BaseButton>
      );
    } else {
      return (
        <BaseButton
          shouldCancelWhenOutside
          shouldActivateOnStart={false}
          exclusive={false}
          onPress={onPress}
          style={containerStyle}
        >
          <Animated.View width={width} height={height} style={viewStyle}>
            <MediaPlayer
              mediaSource={mediaSource}
              sources={sources}
              muted
              thumbnail
              paused={paused}
              ref={playerRef}
              loop
              resizeMode={resizeMode}
              id={id}
              autoPlay
              // onError={onError}
              style={mediaPlayerStyle}
            />

            <View
              width={width}
              height={height}
              testID="borderView"
              pointerEvents="none"
              style={borderStyle}
            />

            {/* {username && (
              <View
                testId="footer"
                width={width}
                pointerEvents="none"
                style={photoCellStyles.footer}
              >
                <AuthorLabel username={username} width={width} />
              </View>
            )} */}

            {isSelected && (
              <View style={photoCellStyles.selectedIcon}>
                <BitmapIconCircleCheckSelected />
              </View>
            )}
          </Animated.View>
        </BaseButton>
      );
    }
  }
);

export const GalleryItem = ({
  onPress,
  image,
  resizeMode,
  transparent = false,
  id,
  mediaSource = null,
  post,
  username = null,
  height,
  isSelected = false,
  width,
  paused
}: {
  transparent: boolean;
  onPress: (id: string) => void;
  image: YeetImageContainer;
  height: number;
  isSelected: boolean;
  post: Partial<PostFragment>;
  id: string;
  username: string | null;
  width: number;
  mediaSource: MediaSource | null;
  paused: boolean;
}) => {
  const playerRef = React.useRef<MediaPlayerComponent | null>(null);
  const sources = React.useMemo(() => {
    if (mediaSource) {
      return [mediaSource];
    } else {
      return [galleryItemMediaSource(image, width, height)];
    }
  }, [image, width, height, id, galleryItemMediaSource, mediaSource]);

  const _onPress = React.useCallback(() => {
    if (mediaSource) {
      const hasSize =
        isFinite(mediaSource.width) &&
        mediaSource.width > 0 &&
        isFinite(mediaSource.height) &&
        mediaSource.height > 0;

      let _mediaSource = mediaSource;
      if (!hasSize && playerRef.current) {
        return playerRef.current.getSize().then(size => {
          _mediaSource = {
            ...cloneDeep(mediaSource),
            width: size.width,
            height: size.height
          };

          onPress(imageContainerFromMediaSource(_mediaSource, null), post);
        });
      }
      onPress(imageContainerFromMediaSource(_mediaSource, null), post);
    } else {
      const hasSize =
        isFinite(image.image.width) &&
        image.image.width > 0 &&
        isFinite(image.image.height) &&
        image.image.height > 0;

      let _image = image;

      if (!hasSize && playerRef.current) {
        return playerRef.current.getSize().then(size => {
          _image = cloneDeep(image);
          _image.image.width = size.width;
          _image.image.height = size.height;
          onPress(_image, post);
        });
      }

      onPress(_image, post);
    }
  }, [onPress, image, post, id, mediaSource, playerRef]);

  let sizeStyle;

  if (height === VERTICAL_ITEM_HEIGHT) {
    sizeStyle = sizeStyles.vertical;
  } else if (height === SQUARE_ITEM_HEIGHT) {
    sizeStyle = sizeStyles.square;
  } else if (height === MEMES_ITEM_HEIGHT) {
    sizeStyle = sizeStyles.fourColumn;
  } else if (height === HORIZONTAL_ITEM_HEIGHT) {
    sizeStyle = sizeStyles.horizontal;
  } else if (height === INSET_SQUARE_ITEM_HEIGHT) {
    sizeStyle = sizeStyles.insetSquare;
  }

  const viewStyle = useMemoOne(() => {
    return [
      transparent
        ? photoCellStyles.transparentContainer
        : photoCellStyles.container,
      isSelected && photoCellStyles.selectedContainer,
      sizeStyle
    ];
  }, [sizeStyle, isSelected, transparent]);

  const containerStyle = useMemoOne(() => {
    return [
      photoCellStyles.button,
      transparent && photoCellStyles.transparentButton,
      sizeStyle
    ];
  }, [sizeStyle, isSelected, transparent]);

  // const onError = React.useCallback(() => {
  //   if (image.sourceType === ImageSourceType.giphy) {
  //     setSource({
  //       width: Number(image.source.images.fixed_height_small_still.width),
  //       height: Number(image.source.images.fixed_height_small_still.height),
  //       uri: image.source.images.fixed_height_small_still.url,
  //       cache: Image.cacheControl.web
  //     });
  //   }
  // }, [setSource, image]);

  let duration = 0;

  let _isVideo = false;

  if (mediaSource) {
    if (isVideo(mediaSource.mimeType)) {
      _isVideo = true;
      duration = mediaSource.duration ?? 0;
    }
  } else if (image) {
    const _image = image.preview ?? image.image;
    if (isVideo(_image.mimeType)) {
      _isVideo = true;
      duration = _image.duration ?? 0;
    }
  }

  const borderStyles = useMemoOne(
    () => [sizeStyle, photoCellStyles.insetBorder],
    [sizeStyle]
  );

  return (
    <GalleryItemComponent
      sources={sources}
      username={username}
      containerStyle={containerStyle}
      paused={paused}
      isSelected={isSelected}
      isVideo={_isVideo}
      borderStyle={borderStyles}
      playerRef={playerRef}
      transparent={transparent}
      id={id}
      duration={duration}
      resizeMode={"aspectFill"}
      viewStyle={viewStyle}
      onPress={_onPress}
      mediaPlayerStyle={sizeStyle}
    />
  );
};

export default GalleryItem;

const GalleryRowItem = ({
  onPress,
  image,
  resizeMode,
  mediaSource,
  transparent = false,
  id,
  post,
  username = null,
  height,
  isSelected = false,
  width,
  paused
}) => {
  if (!image && !mediaSource) {
    return <View width={width} height={height} />;
  } else {
    return (
      <GalleryItem
        onPress={onPress}
        image={image}
        resizeMode={resizeMode}
        mediaSource={mediaSource}
        transparent={transparent}
        id={id}
        post={post}
        username={username}
        height={height}
        isSelected={isSelected}
        width={width}
        paused={paused}
      />
    );
  }
};

export const GalleryRow = ({
  numColumns,
  width,
  height,
  onPress,
  resizeMode,
  selectedIDs,
  paused,
  transparent,
  padding,

  first,
  second,
  third,
  fourth
}) => {
  if (numColumns === 4) {
    return (
      <View height={height} style={rowStyles.fourColumn}>
        <GalleryRowItem
          onPress={onPress}
          width={width}
          height={height}
          transparent={transparent}
          resizeMode={resizeMode}
          isSelected={selectedIDs.includes(first?.id)}
          id={first?.id}
          post={first?.post}
          image={first?.image}
          mediaSource={first?.mediaSource}
          username={get(first, "post.profile.username")}
          paused={paused}
        />

        <GalleryRowItem
          onPress={onPress}
          width={width}
          height={height}
          transparent={transparent}
          mediaSource={second?.mediaSource}
          resizeMode={resizeMode}
          isSelected={selectedIDs.includes(second?.id)}
          id={second?.id}
          post={second?.post}
          image={second?.image}
          username={get(second, "post.profile.username")}
          paused={paused}
        />
        <GalleryRowItem
          onPress={onPress}
          width={width}
          height={height}
          transparent={transparent}
          resizeMode={resizeMode}
          mediaSource={third?.mediaSource}
          isSelected={selectedIDs.includes(third?.id)}
          id={third?.id}
          post={third?.post}
          image={third?.image}
          username={get(third, "post.profile.username")}
          paused={paused}
        />
        <GalleryRowItem
          onPress={onPress}
          width={width}
          height={height}
          transparent={transparent}
          resizeMode={resizeMode}
          mediaSource={fourth?.mediaSource}
          isSelected={selectedIDs.includes(fourth?.id)}
          id={fourth?.id}
          post={fourth?.post}
          image={fourth?.image}
          username={get(first, "post.profile.username")}
          paused={paused}
        />
      </View>
    );
  } else if (numColumns === 3) {
    return (
      <View
        height={height}
        style={padding ? rowStyles.padded : rowStyles.column}
      >
        <GalleryRowItem
          onPress={onPress}
          width={width}
          mediaSource={first?.mediaSource}
          height={height}
          transparent={transparent}
          resizeMode={resizeMode}
          isSelected={selectedIDs.includes(first.id)}
          id={first.id}
          post={first.post}
          image={first.image}
          username={get(first, "post.profile.username")}
          paused={paused}
        />

        <GalleryRowItem
          onPress={onPress}
          width={width}
          height={height}
          transparent={transparent}
          resizeMode={resizeMode}
          mediaSource={second?.mediaSource}
          isSelected={selectedIDs.includes(second?.id)}
          id={second?.id}
          post={second?.post}
          image={second?.image}
          username={get(second, "post.profile.username")}
          paused={paused}
        />
        <GalleryRowItem
          onPress={onPress}
          width={width}
          height={height}
          transparent={transparent}
          resizeMode={resizeMode}
          mediaSource={third?.mediaSource}
          isSelected={selectedIDs.includes(third?.id)}
          id={third?.id}
          post={third?.post}
          image={third?.image}
          username={get(third, "post.profile.username")}
          paused={paused}
        />
      </View>
    );
  } else if (numColumns === 2) {
    return (
      <View style={rowStyles.column}>
        <GalleryRowItem
          onPress={onPress}
          width={width}
          height={height}
          transparent={transparent}
          resizeMode={resizeMode}
          mediaSource={first?.mediaSource}
          isSelected={selectedIDs.includes(first.id)}
          id={first.id}
          post={first.post}
          image={first.image}
          username={get(first, "post.profile.username")}
          paused={paused}
        />

        <GalleryRowItem
          onPress={onPress}
          width={width}
          height={height}
          transparent={transparent}
          mediaSource={second?.mediaSource}
          resizeMode={resizeMode}
          isSelected={selectedIDs.includes(second?.id)}
          id={second?.id}
          post={second?.post}
          image={second?.image}
          username={get(second, "post.profile.username")}
          paused={paused}
        />
      </View>
    );
  } else if (numColumns === 1) {
    return (
      <View style={rowStyles.column}>
        <GalleryRowItem
          onPress={onPress}
          width={width}
          height={height}
          transparent={transparent}
          mediaSource={first?.mediaSource}
          resizeMode={resizeMode}
          isSelected={selectedIDs.includes(first.id)}
          id={first.id}
          post={first.post}
          image={first.image}
          username={get(first, "post.profile.username")}
          paused={paused}
        />
      </View>
    );
  } else {
    return null;
  }
};
