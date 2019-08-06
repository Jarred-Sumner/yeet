import * as React from "react";
import { AvatarImage } from "./Image";
import { buildImgSrc } from "../lib/imgUri";

export const Avatar = ({
  PlaceholderComponent,
  label,
  size,
  url,
  srcWidth,
  srcHeight,
  isLocal
}) => {
  const showPlaceholder = !url;

  if (showPlaceholder) {
    return <PlaceholderComponent size={size} label={label} />;
  } else {
    return (
      <AvatarImage
        url={isLocal ? url : buildImgSrc(url, size)}
        srcWidth={srcWidth}
        srcHeight={srcHeight}
        size={size}
      />
    );
  }
};
