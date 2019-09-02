import * as React from "react";
import { ScrollView } from "react-native-gesture-handler";
import { PostBlockType } from "./NewPostFormat";
import { BaseNode, EditableNode, EditableNodeMap } from "./Node/BaseNode";
import { Block } from "./Node/Block";
import { View, StyleSheet, UIManager, findNodeHandle } from "react-native";
import memoizee from "memoizee";

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
  onFocus,
  focusTypeValue,
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
        focusType={focusType}
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
  onFocus,
  waitFor,
  maxY,
  focusedBlockValue,
  focusTypeValue,
  onBlur: onBlurNode,
  setNodeRef,
  focusedBlockId
}: EditableNodeListProps) => {
  const containerRef = React.useCallback(
    id => ref => {
      setNodeRef(id, ref);
    },
    [setNodeRef]
  );

  return [...inlineNodes.entries()].map(([id, node]) => {
    return (
      <BaseNode
        maxX={maxX}
        maxY={maxY}
        onBlur={onBlurNode}
        isDragEnabled={!focusedBlockId}
        focusedBlockValue={focusedBlockValue}
        disabled={focusedBlockId && focusedBlockId !== id}
        waitFor={waitFor}
        containerRef={containerRef(id)}
        onFocus={onFocus}
        focusTypeValue={focusTypeValue}
        focusType={focusType}
        key={id}
        isFocused={focusedBlockId === id}
        onTap={onTapNode}
        isHidden={focusedBlockId && focusedBlockId !== id}
        node={node}
        onChange={onChangeNode}
      />
    );
  });
};

export class PostPreview extends React.Component {
  maxY = 0;
  maxX = 0;
  state = {};

  render() {
    const {
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
      focusType,
      focusedBlockValue,
      onBlurNode,
      scrollRef,
      maxHeight,
      onBlur,
      focusTypeValue
    } = this.props;

    return (
      <ScrollView
        directionalLockEnabled
        horizontal={false}
        vertical
        alwaysBounceVertical
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="always"
        ref={scrollRef}
        style={{
          maxHeight,
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
        <BlockList
          setBlockInputRef={setBlockInputRef}
          blocks={blocks}
          onFocus={onFocus}
          focusTypeValue={focusTypeValue}
          focusType={focusType}
          focusedBlockValue={focusedBlockValue}
          onBlur={onBlur}
          setBlockAtIndex={setBlockAtIndex}
        />
      </ScrollView>
    );
  }
}
