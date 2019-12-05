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
import { SPACING } from "../../lib/styles";
import memoizee from "memoizee";

const photoCellStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#222",

    borderRadius: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    justifyContent: "center"
  },
  durationContainer: {
    position: "absolute",
    left: SPACING.half,
    bottom: SPACING.half
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

export const GalleryItem = React.memo(
  ({
    onPress,
    image,
    id,
    height,
    width,
    paused
  }: {
    onPress: (id: string) => void;
    image: YeetImageContainer;
    height: number;
    id: string;
    width: number;
    paused: boolean;
  }) => {
    const sources = React.useMemo(() => {
      return [galleryItemMediaSource(image, width, height)];
    }, [image, width, height, galleryItemMediaSource]);

    const _onPress = React.useCallback(() => {
      onPress(image);
    }, [onPress, image]);

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

    return (
      <BaseButton exclusive={false} onPress={_onPress}>
        <View style={[photoCellStyles.container, { width, height }]}>
          <MediaPlayer
            sources={sources}
            muted
            paused={paused}
            loop
            resizeMode={galleryItemResizeMode({ image, width, height })}
            id={image.id}
            autoPlay={false}
            // onError={onError}
            style={{ height, width }}
          />

          {image.image.duration > 0 && isVideo(image.preview.mimeType) && (
            <DurationLabel
              duration={image.image.duration}
              style={photoCellStyles.durationContainer}
            />
          )}
        </View>
      </BaseButton>
    );
  }
);

export default GalleryItem;
