import * as React from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  PostBlockType,
  MAX_POST_HEIGHT,
  POST_WIDTH,
  FocusType
} from "./NewPostFormat";
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
import {
  LongPressGestureHandler,
  FlingGestureHandler,
  TapGestureHandler
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useLayout } from "react-native-hooks";
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
  onChangePhoto,
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
        onChangePhoto={onChangePhoto}
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
  panX: Animated.Value<number>;

  panY: Animated.Value<number>;
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
  panX,
  panY,
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
    id => ({ isPanning, x, y }) => {
      onPan({ blockId: id, isPanning, x, y });
    },
    [onPan]
  );

  const handleSetBlockInputRef = React.useCallback(
    blockId => {
      return setBlockInputRef(blockId);
    },
    [setBlockInputRef]
  );

  return Object.values(inlineNodes).map(node => {
    const { id } = node.block;
    return (
      <BaseNode
        maxX={maxX}
        maxY={maxY}
        containerRef={containerRef(id)}
        onBlur={onBlurNode}
        focusedBlockValue={focusedBlockValue}
        disabled={focusedBlockId && focusedBlockId !== id}
        waitFor={waitFor}
        inputRef={handleSetBlockInputRef(id)}
        onFocus={onFocus}
        absoluteX={panX}
        absoluteY={panY}
        focusTypeValue={focusTypeValue}
        keyboardVisibleValue={keyboardVisibleValue}
        focusType={focusType}
        key={id}
        isFocused={focusedBlockId === id}
        focusedBlockId={focusedBlockId}
        onTap={onTapNode}
        onPan={handlePan(id)}
        isHidden={
          focusedBlockId &&
          focusedBlockId !== id &&
          focusType !== FocusType.panning
        }
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
      onChangePhoto,
      onTapBlock,
      onBlur,
      onOpenImagePicker,
      focusTypeValue,
      swipeOnly,
      onScroll,
      onSwipe,
      bounces,
      waitFor
    },
    ref
  ) => {
    const scrollRef = React.useRef();

    React.useImperativeHandle(ref, () => scrollRef.current);
    const { isBlurred, isBlurring } = useFocusState();
    const { onLayout, ...layout } = useLayout();

    React.useLayoutEffect(() => {
      scrollRef.current.scrollTo({ x: 0, y: paddingTop * -1, animated: false });
    }, [scrollRef.current, paddingTop]);

    const BackgroundGestureHandler = swipeOnly
      ? LongPressGestureHandler
      : TapGestureHandler;

    return (
      <ScrollView
        directionalLockEnabled
        horizontal={false}
        vertical
        bounces={bounces}
        alwaysBounceVertical={bounces}
        overScrollMode="always"
        scrollEnabled={!swipeOnly}
        onScroll={onScroll}
        onLayout={onLayout}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="always"
        keyboardOpeningTime={0}
        ref={scrollRef}
        contentInset={{
          top: paddingTop,
          bottom: 0
        }}
        style={{
          maxHeight,
          width: bounds.width,
          flex: 1,
          borderRadius: 12,
          overflow: "visible",
          backgroundColor
        }}
        contentContainerStyle={[
          {
            borderRadius: 12,
            position: "relative"
          }
        ]}
      >
        <BackgroundGestureHandler
          onHandlerStateChange={onTapBackground}
          onGestureEvent={onTapBackground}
          waitFor={waitFor}
          minDurationMs={swipeOnly ? 150 : undefined}
          maxDist={9999}
        >
          <Animated.View style={{ minHeight: layout.height - paddingTop }}>
            <BlockList
              setBlockInputRef={setBlockInputRef}
              blocks={blocks}
              onFocus={onFocus}
              focusTypeValue={focusTypeValue}
              onOpenImagePicker={onOpenImagePicker}
              onChangePhoto={onChangePhoto}
              focusType={focusType}
              onTap={onTapBlock}
              scrollRef={scrollRef}
              focusedBlockValue={focusedBlockValue}
              onBlur={onBlur}
              setBlockAtIndex={setBlockAtIndex}
            />

            {children}
          </Animated.View>
        </BackgroundGestureHandler>
      </ScrollView>
    );
  }
);
