import * as React from "react";
import { TextPostBlock } from "../TextPostBlock";
import { ImagePostBlock } from "../ImagePostBlock";
import { PostBlock } from "../NewPostFormat";
import { TextInput } from "react-native-gesture-handler";
import { PostLayoutContext } from "../PostLayoutContext";
import { PostSchemaContext } from "../PostSchemaProvider";

class BlockContainer extends React.Component {
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const {
      autoFocus,
      block,
      blockRef,
      containerRef,
      disabled,
      focusedBlockValue,
      focusType,
      gestureRef,
      inputAccessoryView,
      isFocused,
      isSticker,
      columnCount,
      muted,
      onAction,
      onBlur,
      onChange,
      onChangePhoto,
      onContentSizeChange,
      onFinishEditing,
      onFocus,
      onLayout,
      onOpenImagePicker,
      onTap,
      paddingTop,
      paused,
      scrollRef,
      usePreview,
      waitFor
    } = this.props;

    const isBlockChanged =
      nextProps.block !== block ||
      nextProps.block?.config?.overrides !== block?.config?.overrides ||
      nextProps.block?.value !== block?.value ||
      nextProps.block?.id !== block?.id ||
      nextProps.block?.config !== block?.config;

    return (
      isBlockChanged ||
      autoFocus !== nextProps.autoFocus ||
      columnCount !== nextProps.columnCount ||
      containerRef !== nextProps.containerRef ||
      disabled !== nextProps.disabled ||
      focusedBlockValue !== nextProps.focusedBlockValue ||
      focusType !== nextProps.focusType ||
      gestureRef !== nextProps.gestureRef ||
      inputAccessoryView !== nextProps.inputAccessoryView ||
      isFocused !== nextProps.isFocused ||
      isSticker !== nextProps.isSticker ||
      columnCount !== nextProps.columnCount ||
      muted !== nextProps.muted ||
      onAction !== nextProps.onAction ||
      onBlur !== nextProps.onBlur ||
      onChange !== nextProps.onChange ||
      onChangePhoto !== nextProps.onChangePhoto ||
      onContentSizeChange !== nextProps.onContentSizeChange ||
      onFinishEditing !== nextProps.onFinishEditing ||
      onFocus !== nextProps.onFocus ||
      onLayout !== nextProps.onLayout ||
      onOpenImagePicker !== nextProps.onOpenImagePicker ||
      onTap !== nextProps.onTap ||
      paddingTop !== nextProps.paddingTop ||
      paused !== nextProps.paused ||
      scrollRef !== nextProps.scrollRef ||
      usePreview !== nextProps.usePreview ||
      waitFor !== nextProps.waitFor
    );
  }

  render() {
    const {
      autoFocus,
      block,
      blockRef,
      containerRef,
      disabled,
      focusedBlockValue,
      focusType,
      gestureRef,
      inputAccessoryView,
      isFocused,
      isSticker,
      columnCount,
      muted,
      onAction,
      onBlur,
      onChange,
      onChangePhoto,
      onContentSizeChange,
      onFinishEditing,
      onFocus,
      onLayout,
      onOpenImagePicker,
      onTap,
      paddingTop,
      paused,
      scrollRef,
      usePreview,
      waitFor,
      updateSchema
    } = this.props;

    if (block.type === "text") {
      return (
        <TextPostBlock
          ref={blockRef}
          disabled={disabled}
          onLayout={onLayout}
          focusType={focusType}
          paused={paused}
          muted={muted}
          isSticker={isSticker}
          onAction={onAction}
          containerRef={containerRef}
          columnCount={columnCount}
          block={block}
          updateSchema={updateSchema}
          onTap={onTap}
          waitFor={waitFor}
          isFocused={isFocused}
          autoFocus={autoFocus}
          onOpenImagePicker={onOpenImagePicker}
          onContentSizeChange={onContentSizeChange}
          onFinishEditing={onFinishEditing}
          inputAccessoryView={inputAccessoryView}
          usePreview={usePreview}
          focusedBlockValue={focusedBlockValue}
          scrollRef={scrollRef}
          paddingTop={paddingTop}
          onBlur={onBlur}
          onFocus={onFocus}
        ></TextPostBlock>
      );
    } else if (block.type === "image") {
      return (
        <ImagePostBlock
          onFocus={onFocus}
          ref={blockRef}
          onOpenImagePicker={onOpenImagePicker}
          containerRef={containerRef}
          columnCount={columnCount}
          isSticker={isSticker}
          onLayout={onLayout}
          onTap={onTap}
          onChangePhoto={onChangePhoto}
          focusType={focusType}
          onAction={onAction}
          updateSchema={updateSchema}
          gestureRef={gestureRef}
          paused={paused}
          muted={muted}
          usePreview={usePreview}
          focusedBlockValue={focusedBlockValue}
          onContentSizeChange={onContentSizeChange}
          isFocused={isFocused}
          scrollRef={scrollRef}
          block={block}
          onBlur={onBlur}
        ></ImagePostBlock>
      );
    } else {
      return null;
    }
  }
}

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
      paused,
      muted,
      onAction,
      onTap,
      waitFor,
      disabled = false
    },
    ref
  ) => {
    const { columnCount } = React.useContext(PostLayoutContext);
    const { updateSchema } = React.useContext(PostSchemaContext);

    return (
      <BlockContainer
        columnCount={columnCount}
        block={block}
        onChange={onChange}
        blockRef={ref}
        onFocus={onFocus}
        onBlur={onBlur}
        onLayout={onLayout}
        onOpenImagePicker={onOpenImagePicker}
        maxX={maxX}
        inputRef={inputRef}
        updateSchema={updateSchema}
        focusType={focusType}
        paddingTop={paddingTop}
        focusTypeValue={focusTypeValue}
        containerRef={containerRef}
        onChangePhoto={onChangePhoto}
        autoFocus={autoFocus}
        usePreview={usePreview}
        annotations={annotations}
        inputAccessoryView={inputAccessoryView}
        isSticker={isSticker}
        onFinishEditing={onFinishEditing}
        isFocused={isFocused}
        scale={scale}
        focusedBlockValue={focusedBlockValue}
        onContentSizeChange={onContentSizeChange}
        scrollRef={scrollRef}
        gestureRef={gestureRef}
        paused={paused}
        muted={muted}
        onAction={onAction}
        onTap={onTap}
        waitFor={waitFor}
        disabled={disabled}
      />
    );
  }
);

export default Block;
