import * as React from "react";
import { TextPostBlock } from "../TextPostBlock";
import { ImagePostBlock } from "../ImagePostBlock";
import { PostBlock } from "../NewPostFormat";
import { TextInput } from "react-native-gesture-handler";
import { PostLayoutContext } from "../PostLayoutContext";

export const Block = React.forwardRef(
  (
    {
      block,
      onChange,
      onFocus,
      onBlur,
      onLayout,
      onOpenImagePicker,
      maxX,
      inputRef,
      focusType,
      paddingTop,
      focusTypeValue,
      containerRef,
      onChangePhoto,
      autoFocus,
      usePreview,
      annotations,
      inputAccessoryView,
      isSticker = false,
      onFinishEditing,
      isFocused,
      scale,
      focusedBlockValue,
      onContentSizeChange,
      scrollRef,
      gestureRef,
      onAction,
      onTap,
      waitFor,
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
    const layoutContext = React.useContext(PostLayoutContext);
    if (block.type === "text") {
      return (
        <TextPostBlock
          ref={ref}
          disabled={disabled}
          onLayout={onLayout}
          focusType={focusType}
          isSticker={isSticker}
          onAction={onAction}
          scale={scale}
          containerRef={containerRef}
          columnCount={layoutContext.columnCount}
          block={block}
          maxX={maxX}
          onTap={onTap}
          waitFor={waitFor}
          isFocused={isFocused}
          autoFocus={autoFocus}
          onOpenImagePicker={onOpenImagePicker}
          onContentSizeChange={onContentSizeChange}
          onFinishEditing={onFinishEditing}
          focusTypeValue={focusTypeValue}
          inputAccessoryView={inputAccessoryView}
          usePreview={usePreview}
          focusedBlockValue={focusedBlockValue}
          scrollRef={scrollRef}
          onChange={onChange}
          paddingTop={paddingTop}
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
          onOpenImagePicker={onOpenImagePicker}
          containerRef={containerRef}
          columnCount={layoutContext.columnCount}
          isSticker={isSticker}
          onLayout={onLayout}
          onTap={onTap}
          onChangePhoto={onChangePhoto}
          focusType={focusType}
          onAction={onAction}
          gestureRef={gestureRef}
          scale={scale}
          usePreview={usePreview}
          focusedBlockValue={focusedBlockValue}
          onContentSizeChange={onContentSizeChange}
          isFocused={isFocused}
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
