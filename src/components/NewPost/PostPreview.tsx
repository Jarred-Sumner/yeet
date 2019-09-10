import * as React from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { PostBlockType } from "./NewPostFormat";
import { BaseNode, EditableNode, EditableNodeMap } from "./Node/BaseNode";
import { Block } from "./Node/Block";
import {
  View,
  StyleSheet,
  UIManager,
  findNodeHandle,
  ScrollView as RNScrollView
} from "react-native";
import memoizee from "memoizee";
import createNativeWrapper from "react-native-gesture-handler/createNativeWrapper";
import { useFocusState } from "react-navigation-hooks";
import { TapGestureHandler } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

export const ScrollView = createNativeWrapper(RNScrollView, {
  disallowInterruption: true
});

type BlockListProps = {
  blocks: Array<PostBlockType>;
  setBlockAtIndex: (block: PostBlockType, index: number) => void;
};
export const BlockList = ({
  blocks,
  setBlockAtIndex,
  setBlockInputRef,
  focusType,
  focusedBlockValue,
  onBlur,
  onOpenImagePicker,
  onTap,
  onFocus,
  focusTypeValue,
  scrollRef,
  onLayout
}: BlockListProps) => {
  const handleChangeBlock = React.useCallback(
    index => block => setBlockAtIndex(block, index),
    [setBlockAtIndex, blocks]
  );

  const handleSetBlockInputRef = React.useCallback(
    block => {
      return setBlockInputRef(block.id);
    },
    [setBlockInputRef]
  );

  return blocks.map((block, index) => {
    return (
      <Block
        onLayout={onLayout}
        block={block}
        onFocus={onFocus}
        focusedBlockValue={focusedBlockValue}
        scrollRef={scrollRef}
        onOpenImagePicker={onOpenImagePicker}
        focusType={focusType}
        onTap={onTap}
        onBlur={onBlur}
        focusTypeValue={focusTypeValue}
        key={block.id}
        ref={handleSetBlockInputRef(block)}
        onChange={handleChangeBlock(index)}
      />
    );
  });
};

type EditableNodeListProps = {
  inlineNodes: EditableNodeMap;
  inlineNodeRefs: Map<string, React.Ref<View>>;
  maxY: number;
  maxX: number;
  onTapNode: (node: EditableNode) => void;
  onChangeNode: (node: EditableNode) => void;
};
export const EditableNodeList = ({
  inlineNodes,
  onChangeNode,
  onTapNode,
  maxX,
  focusType,
  keyboardVisibleValue,
  onFocus,
  waitFor,
  maxY,
  focusedBlockValue,
  focusTypeValue,
  onBlur: onBlurNode,
  setNodeRef,
  setBlockInputRef,
  onPan,
  focusedBlockId
}: EditableNodeListProps) => {
  const containerRef = React.useCallback(
    id => ref => {
      setNodeRef(id, ref);
    },
    [setNodeRef]
  );

  const handlePan = React.useCallback(
    id => isPanning => {
      onPan(id, isPanning);
    },
    [onPan]
  );

  const handleSetBlockInputRef = React.useCallback(
    blockId => {
      return setBlockInputRef(blockId);
    },
    [setBlockInputRef]
  );

  return [...inlineNodes.entries()].map(([id, node]) => {
    return (
      <BaseNode
        maxX={maxX}
        maxY={maxY}
        containerRef={containerRef(id)}
        onBlur={onBlurNode}
        isDragEnabled={!focusedBlockId || focusedBlockId !== id}
        focusedBlockValue={focusedBlockValue}
        disabled={focusedBlockId && focusedBlockId !== id}
        waitFor={waitFor}
        inputRef={handleSetBlockInputRef(id)}
        onFocus={onFocus}
        focusTypeValue={focusTypeValue}
        keyboardVisibleValue={keyboardVisibleValue}
        focusType={focusType}
        key={id}
        isFocused={focusedBlockId === id}
        onTap={onTapNode}
        onPan={handlePan(id)}
        isHidden={focusedBlockId && focusedBlockId !== id}
        node={node}
        onChange={onChangeNode}
      />
    );
  });
};

export const PostPreview = React.forwardRef(
  (
    {
      bounds,
      maxX,
      maxY,
      backgroundColor,
      onFocus,
      setBlockAtIndex,
      blocks,
      setBlockInputRef,
      onChangeBlock,
      onlyShow,
      focusedBlockId,
      inlineNodes,
      onTapNode,
      onChangeNode,
      onTapBackground,
      focusType,
      focusedBlockValue,
      onBlurNode,
      children,
      maxHeight,
      paddingTop,
      onTapBlock,
      onBlur,
      onOpenImagePicker,
      focusTypeValue,
      onScroll,
      onScrollBeginDrag,
      bounces
    },
    ref
  ) => {
    const scrollRef = React.useRef();

    React.useImperativeHandle(ref, () => scrollRef.current);
    const { isBlurred, isBlurring } = useFocusState();

    return (
      <ScrollView
        directionalLockEnabled
        horizontal={false}
        vertical
        bounces={bounces}
        alwaysBounceVertical={bounces}
        overScrollMode="always"
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="always"
        keyboardOpeningTime={0}
        removeClippedSubviews={isBlurred || isBlurring}
        ref={scrollRef}
        contentOffset={{
          y: paddingTop * -1
        }}
        contentInset={{
          top: paddingTop,
          bottom: 50
        }}
        style={{
          // maxHeight,
          width: bounds.width,
          backgroundColor
        }}
        contentContainerStyle={[
          {
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            position: "relative",
            backgroundColor
          }
        ]}
      >
        <TapGestureHandler onHandlerStateChange={onTapBackground}>
          <Animated.View>
            <BlockList
              setBlockInputRef={setBlockInputRef}
              blocks={blocks}
              onFocus={onFocus}
              focusTypeValue={focusTypeValue}
              onOpenImagePicker={onOpenImagePicker}
              focusType={focusType}
              onTap={onTapBlock}
              scrollRef={scrollRef}
              focusedBlockValue={focusedBlockValue}
              onBlur={onBlur}
              setBlockAtIndex={setBlockAtIndex}
            />

            {children}
          </Animated.View>
        </TapGestureHandler>
      </ScrollView>
    );
  }
);
