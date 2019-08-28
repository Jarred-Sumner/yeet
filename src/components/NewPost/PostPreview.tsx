import * as React from "react";
import { ScrollView } from "react-native-gesture-handler";
import { PostBlockType } from "./NewPostFormat";
import { BaseNode, EditableNode, EditableNodeMap } from "./Node/BaseNode";
import { Block } from "./Node/Block";
import { View, StyleSheet, UIManager, findNodeHandle } from "react-native";

type BlockListProps = {
  blocks: Array<PostBlockType>;
  setBlockAtIndex: (block: PostBlockType, index: number) => void;
};
export const BlockList = ({
  blocks,
  setBlockAtIndex,
  onLayout
}: BlockListProps) => {
  const handleChangeBlock = React.useCallback(
    index => block => setBlockAtIndex(block, index),
    [setBlockAtIndex, blocks]
  );

  return blocks.map((block, index) => {
    console.log(block);
    return (
      <Block
        onLayout={onLayout}
        block={block}
        key={block.id}
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
  onFocus,
  waitFor,
  maxY,
  onBlur: onBlurNode,
  setNodeRef,
  focusedNodeId
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
        isDragEnabled={!focusedNodeId}
        waitFor={waitFor}
        containerRef={containerRef(id)}
        onFocus={onFocus}
        key={id}
        isFocused={focusedNodeId === id}
        onTap={onTapNode}
        isHidden={focusedNodeId && focusedNodeId !== id}
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
      onFocus,
      setBlockAtIndex,
      blocks,
      onChangeBlock,
      onlyShow,
      focusedNodeId,
      inlineNodes,
      onTapNode,
      onChangeNode,
      onBlurNode,
      scrollRef,
      maxHeight
    } = this.props;

    return (
      <ScrollView
        directionalLockEnabled
        horizontal={false}
        vertical
        alwaysBounceVertical
        contentInsetAdjustmentBehavior="never"
        ref={scrollRef}
        style={{
          maxHeight,
          width: bounds.width
        }}
        contentContainerStyle={[
          {
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            position: "relative",
            backgroundColor: "#fff"
          }
        ]}
      >
        <BlockList blocks={blocks} setBlockAtIndex={setBlockAtIndex} />
      </ScrollView>
    );
  }
}
