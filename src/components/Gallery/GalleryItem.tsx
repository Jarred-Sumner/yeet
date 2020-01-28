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

export const galleryItemMediaSource = memoizee(
  (image: YeetImageContainer, width: number, height: number) => {
    return mediaSourceFromImage(image, { width, height }, true, true);
  }
);

export const galleryItemResizeMode = ({ image, width, height }) => {
  const isSquareInAHorizontalImage =
    width / height === 1 && image.preview?.width / image.preview?.height > 1.3;

  return image.image.duration > 0 || isSquareInAHorizontalImage
    ? "aspectFit"
    : "aspectFill";
};

const AuthorLabel = React.memo(({ username }) => (
  <View style={photoCellStyles.author}>
    <MediumText
      numberOfLines={1}
      // adjustsFontSizeToFit
      style={photoCellStyles.username}
    >
      @{username}
    </MediumText>
  </View>
));

export const GalleryItem = React.memo(
  ({
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
    }, [image, width, height, galleryItemMediaSource]);

    const _onPress = React.useCallback(() => {
      onPress(image, post);
    }, [onPress, image, post]);

    const sizeStyle = React.useMemo(() => ({ height, width }), [width, height]);

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

    const _isVideo =
      image.image.duration > 0 && isVideo(image.preview.mimeType);
    const borderStyles = React.useMemo(
      () => [sizeStyle, photoCellStyles.insetBorder],
      [sizeStyle]
    );

    const showUsername = !!username;

    if (_isVideo) {
      return (
        <BaseButton
          shouldCancelWhenOutside
          shouldActivateOnStart={false}
          exclusive={false}
          onPress={_onPress}
          style={containerStyle}
        >
          <View style={viewStyle}>
            <MediaPlayer
              sources={sources}
              muted
              paused={paused}
              loop
              resizeMode={
                resizeMode || galleryItemResizeMode({ image, width, height })
              }
              id={image.id}
              autoPlay={false}
              borderRadius={1}
              // onError={onError}
              style={sizeStyle}
            />
            <View pointerEvents="none" style={borderStyles} />

            <View pointerEvents="none" style={photoCellStyles.footer}>
              <DurationLabel
                duration={image.image.duration}
                style={photoCellStyles.durationContainer}
              />

              {showUsername && <AuthorLabel username={username} />}
            </View>

            {isSelected && (
              <View style={photoCellStyles.selectedIcon}>
                <BitmapIconCircleCheckSelected />
              </View>
            )}
          </View>
        </BaseButton>
      );
    } else {
      return (
        <BaseButton
          shouldCancelWhenOutside
          shouldActivateOnStart={false}
          exclusive={false}
          onPress={_onPress}
        >
          <View style={viewStyle}>
            <MediaPlayer
              sources={sources}
              muted
              paused={paused}
              loop
              resizeMode={
                resizeMode || galleryItemResizeMode({ image, width, height })
              }
              id={image.id}
              autoPlay={false}
              // onError={onError}
              style={sizeStyle}
            />

            <View pointerEvents="none" style={borderStyles} />

            {showUsername && (
              <View pointerEvents="none" style={photoCellStyles.footer}>
                <AuthorLabel username={username} />
              </View>
            )}

            {isSelected && (
              <View style={photoCellStyles.selectedIcon}>
                <BitmapIconCircleCheckSelected />
              </View>
            )}
          </View>
        </BaseButton>
      );
    }
  }
);

export default GalleryItem;
