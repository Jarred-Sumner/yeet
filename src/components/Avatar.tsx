import * as React from "react";
import { AvatarImage } from "./Image";
import { buildImgSrc, normalizeFormat as getSize } from "../lib/imgUri";

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
