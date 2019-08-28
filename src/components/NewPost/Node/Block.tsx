import * as React from "react";
import { TextPostBlock } from "../TextPostBlock";
import { ImagePostBlock } from "../ImagePostBlock";
import { PostBlock } from "../NewPostFormat";

export const Block = React.forwardRef(
  (
    {
      block,
      onChange,
      onFocus,
      onBlur,
      onLayout,
      annotations,
      disabled
    }: {
      block: PostBlock;
      disabled: boolean;
      onChange: (block: PostBlock) => void;
      onFocus: (block: PostBlock) => void;
    },
    ref
  ) => {
    if (block.type === "text") {
      return (
        <TextPostBlock
          ref={ref}
          disabled={disabled}
          onLayout={onLayout}
          block={block}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          annotations={annotations}
        ></TextPostBlock>
      );
    } else if (block.type === "image") {
      return (
        <ImagePostBlock
          onFocus={onFocus}
          ref={ref}
          onLayout={onLayout}
          block={block}
          onBlur={onBlur}
          onChange={onChange}
          annotations={annotations}
        ></ImagePostBlock>
      );
    } else {
      return null;
    }
  }
);

export default Block;
