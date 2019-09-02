import * as React from "react";
import { TextPostBlock } from "../TextPostBlock";
import { ImagePostBlock } from "../ImagePostBlock";
import { PostBlock } from "../NewPostFormat";
import { TextInput } from "react-native-gesture-handler";

export const Block = React.forwardRef(
  (
    {
      block,
      onChange,
      onFocus,
      onBlur,
      onLayout,
      inputRef,
      focusType,
      focusTypeValue,
      annotations,
      focusedBlockValue,
      gestureRef,
      disabled = false
    }: {
      block: PostBlock;
      disabled: boolean;
      inputRef: (TextInput) => void;
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
          focusType={focusType}
          block={block}
          focusTypeValue={focusTypeValue}
          focusedBlockValue={focusedBlockValue}
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
          focusType={focusType}
          gestureRef={gestureRef}
          focusedBlockValue={focusedBlockValue}
          focusTypeValue={focusTypeValue}
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
