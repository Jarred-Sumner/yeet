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
      onOpenImagePicker,
      inputRef,
      focusType,
      focusTypeValue,
      onChangePhoto,
      autoFocus,
      usePreview,
      annotations,
      inputAccessoryView,
      scale,
      focusedBlockValue,
      scrollRef,
      gestureRef,
      onTap,
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
          scale={scale}
          block={block}
          onTap={onTap}
          autoFocus={autoFocus}
          onOpenImagePicker={onOpenImagePicker}
          focusTypeValue={focusTypeValue}
          inputAccessoryView={inputAccessoryView}
          usePreview={usePreview}
          focusedBlockValue={focusedBlockValue}
          scrollRef={scrollRef}
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
          inputRef={ref}
          onOpenImagePicker={onOpenImagePicker}
          onLayout={onLayout}
          onTap={onTap}
          onChangePhoto={onChangePhoto}
          focusType={focusType}
          gestureRef={gestureRef}
          scale={scale}
          usePreview={usePreview}
          focusedBlockValue={focusedBlockValue}
          scrollRef={scrollRef}
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
