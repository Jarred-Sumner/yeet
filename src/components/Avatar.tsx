import * as React from "react";
import { AvatarImage } from "./Image";
import { buildImgSrc, normalizeFormat as getSize } from "../lib/imgUri";
import { View, StyleSheet } from "react-native";
import CircularProgressBar from "./PostList/CircularProgressBar";

export const Avatar = ({
  PlaceholderComponent,
  label,
  size,
  url,
  srcWidth,
  srcHeight,
  isLocal = false,
  style
}) => {
  const showPlaceholder = !url;

  if (showPlaceholder) {
    return <PlaceholderComponent size={size} label={label} style={style} />;
  } else {
    const _size = getSize(size);
    const src = isLocal ? url : buildImgSrc(url, size);

    return (
      <AvatarImage
        url={src}
        srcWidth={_size}
        style={style}
        srcHeight={_size}
        size={size}
      />
    );
  }
};

export const ProgressAvatar = ({
  size,
  strokeWidth = 2,
  color,
  progress,
  ...avatarProps
}) => {
  return (
    <View
      style={{
        position: "relative",
        width: size + strokeWidth,
        height: size + strokeWidth
      }}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { zIndex: 1, justifyContent: "center", alignItems: "center" }
        ]}
      >
        <AvatarImage size={size} {...avatarProps} />
      </View>

      <View
        style={[
          StyleSheet.absoluteFill,
          { zIndex: 1, justifyContent: "center", alignItems: "center" }
        ]}
      >
        <CircularProgressBar
          width={size + strokeWidth * 2}
          strokeWidth={strokeWidth}
          progress={progress}
        />
      </View>
    </View>
  );
};
