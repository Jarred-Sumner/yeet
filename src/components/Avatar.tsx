import * as React from "react";
import { AvatarImage } from "./Image";
import { buildImgSrc, normalizeFormat as getSize } from "../lib/imgUri";
import { View, StyleSheet, StyleProp } from "react-native";
import CircularProgressBar from "./PostList/CircularProgressBar";
import { UserContext } from "./UserContext";
import chroma from "chroma-js";

import { Avatar as PlaceholderAvatar } from "react-native-paper";

type CommonAvatarProps = {
  PlaceholderComponent: React.ComponentType<{
    label: string;
    size: number;
    style: StyleProp<any>;
  }>;
  size: number;
  srcWidth?: number;
  srcHeight?: number;
  style?: StyleProp<any>;
};

type AvatarProps = CommonAvatarProps & {
  isLocal: Boolean;
  label: string;
  url: string | null;
};

export const Avatar = React.forwardRef(
  (
    {
      PlaceholderComponent = PlaceholderAvatar.Text,
      label = "",
      size,
      url,
      id,
      srcWidth,
      srcHeight,
      isLocal = false,
      style
    }: AvatarProps,
    ref
  ) => {
    const showPlaceholder = typeof url !== "string" || !url;

    if (showPlaceholder) {
      const color =
        "#" + label
          ? (Math.abs(label.hashCode()).toString() * 100000)
              .toString(16)
              .substr(0, 6)
          : "333";
      return (
        <PlaceholderComponent
          ref={ref}
          size={size}
          label={
            label
              ? (
                  label.substr(0, 1) + label.substr(label.length - 1)
                ).toUpperCase()
              : "HI"
          }
          style={[style, { backgroundColor: chroma(color).css() }]}
        />
      );
    } else {
      const _size = getSize(size);
      const src = isLocal ? url : buildImgSrc(url, size);

      return (
        <AvatarImage
          ref={ref}
          url={src}
          srcWidth={_size}
          id={id}
          style={style}
          srcHeight={_size}
          size={size}
        />
      );
    }
  }
);

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

export const CurrentUserAvatar = (props: CommonAvatarProps) => {
  const { currentUser } = React.useContext(UserContext);

  if (currentUser) {
    return (
      <Avatar
        {...props}
        isLocal={false}
        url={currentUser.photoURL}
        label={currentUser.username}
      />
    );
  } else {
    return <Avatar {...props} isLocal={false} url={null} label={"Guest"} />;
  }
};
