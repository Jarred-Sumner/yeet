import { View, StyleSheet } from "react-native";
import * as React from "react";
import { MediaPlayer, MediaSource } from "../MediaPlayer";
import { BaseButton } from "react-native-gesture-handler";
import {
  YeetImageContainer,
  mediaSourceFromImage,
  ImageSourceType,
  isVideo
} from "../../lib/imageSearch";
import { DurationLabel } from "../NewPost/ImagePicker/DurationLabel";
import { SPACING, COLORS } from "../../lib/styles";
import memoizee from "memoizee";
import { get } from "lodash";
import { BitmapIconCircleCheckSelected } from "../BitmapIcon";
import { MediumText, Text } from "../Text";
import { PostFragment } from "../../lib/graphql/PostFragment";
import {
  SQUARE_ITEM_HEIGHT,
  SQUARE_ITEM_WIDTH,
  VERTICAL_ITEM_HEIGHT,
  VERTICAL_ITEM_WIDTH,
  MEMES_ITEM_WIDTH,
  MEMES_ITEM_HEIGHT
} from "./sizes";
import Animated from "react-native-reanimated";
import { COLUMN_GAP } from "./COLUMN_COUNT";

const BORDER_RADIUS = 1;

const photoCellStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#222",

    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    justifyContent: "center"
  },
  insetBorder: {
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    overflow: "hidden",
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
    overflow: "hidden",
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
  durationContainer: {},
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2
  },
  author: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderBottomLeftRadius: BORDER_RADIUS,
    borderBottomRightRadius: BORDER_RADIUS,
    overflow: "hidden",
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 2
  }
});

const sizeStyles = StyleSheet.create({
  square: {
    width: SQUARE_ITEM_WIDTH,
    height: SQUARE_ITEM_HEIGHT
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
    flexDirection: "row"
  },
  fourColumn: {
    justifyContent: "space-evenly",
    paddingHorizontal: COLUMN_GAP,
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

export const galleryItemResizeMode = ({ image, width, height }) => {
  const isSquareInAHorizontalImage =
    width / height === 1 && image.preview?.width / image.preview?.height > 1.3;

  return image.image.duration > 0 || isSquareInAHorizontalImage
    ? "aspectFit"
    : "aspectFill";
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
    viewStyle,
    width,
    height,
    image,
    resizeMode,
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
              sources={sources}
              muted
              paused={paused}
              loop
              resizeMode={resizeMode}
              id={id}
              autoPlay={false}
              borderRadius={1}
              // onError={onError}
              style={mediaPlayerStyle}
            />
            <View
              width={width}
              height={height}
              pointerEvents="none"
              style={borderStyle}
            />

            {/* <View
              width={width}
              pointerEvents="none"
              style={photoCellStyles.footer}
            >
              <DurationLabel
                duration={duration}
                style={photoCellStyles.durationContainer}
              />

              {username && (
                <AuthorLabel username={username} width={width} height={24} />
              )}
            </View> */}

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
          <Animated.View style={viewStyle}>
            <MediaPlayer
              sources={sources}
              muted
              paused={paused}
              loop
              resizeMode={resizeMode}
              id={id}
              autoPlay={false}
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
                <AuthorLabel username={username} width={width} height={24} />
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
  paused: boolean;
}) => {
  const sources = React.useMemo(() => {
    return [galleryItemMediaSource(image, width, height)];
  }, [image, width, height, id, galleryItemMediaSource]);

  const _onPress = React.useCallback(() => {
    onPress(image, post);
  }, [onPress, image, post]);

  let sizeStyle;

  if (height === VERTICAL_ITEM_HEIGHT) {
    sizeStyle = sizeStyles.vertical;
  } else if (height === SQUARE_ITEM_HEIGHT) {
    sizeStyle = sizeStyles.square;
  } else if (height === MEMES_ITEM_HEIGHT) {
    sizeStyle = sizeStyles.fourColumn;
  }

  const viewStyle = React.useMemo(() => {
    return [
      transparent
        ? photoCellStyles.transparentContainer
        : photoCellStyles.container,
      isSelected && photoCellStyles.selectedContainer,
      sizeStyle
    ];
  }, [sizeStyle, isSelected, transparent]);

  const containerStyle = React.useMemo(() => {
    return [
      transparent
        ? photoCellStyles.transparentContainer
        : photoCellStyles.container,
      isSelected && photoCellStyles.selectedContainer,
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

  const _isVideo = image.image.duration > 0 && isVideo(image.preview.mimeType);
  const borderStyles = React.useMemo(
    () => [sizeStyle, photoCellStyles.insetBorder],
    [sizeStyle]
  );

  return (
    <GalleryItemComponent
      isVideo={_isVideo}
      sources={sources}
      username={username}
      containerStyle={containerStyle}
      paused={paused}
      isSelected={isSelected}
      borderStyle={borderStyles}
      id={id}
      key={id}
      duration={image.image?.duration ?? 0}
      resizeMode={resizeMode}
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
  transparent = false,
  id,
  post,
  username = null,
  height,
  isSelected = false,
  width,
  paused
}) => {
  if (!image) {
    return <View width={width} height={height} />;
  } else {
    return (
      <GalleryItem
        onPress={onPress}
        image={image}
        resizeMode={resizeMode}
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
          username={get(first, "post.profile.username")}
          paused={paused}
        />

        <GalleryRowItem
          onPress={onPress}
          width={width}
          height={height}
          transparent={transparent}
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
      <View height={height} style={rowStyles.column}>
        <GalleryRowItem
          onPress={onPress}
          width={width}
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
