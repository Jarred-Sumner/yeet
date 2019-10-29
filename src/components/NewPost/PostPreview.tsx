import * as React from "react";
import { View } from "react-native";
import {
  LongPressGestureHandler,
  TapGestureHandler
} from "react-native-gesture-handler";
import { useLayout } from "react-native-hooks";
import { KeyboardAwareScrollView } from "../KeyboardAwareScrollView";
import Animated from "react-native-reanimated";
import { useFocusState } from "react-navigation-hooks";
import { FocusType, PostBlockType, CAROUSEL_HEIGHT } from "./NewPostFormat";
import { BaseNode, EditableNode, EditableNodeMap } from "./Node/BaseNode";
import { Block } from "./Node/Block";
import { getInset } from "react-native-safe-area-view";
export const ScrollView = KeyboardAwareScrollView;

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
  focusedBlockId,
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
        isFocused={focusedBlockId === block.id}
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
  format,
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
        enableAutomaticScroll
        absoluteY={panY}
        focusTypeValue={focusTypeValue}
        keyboardVisibleValue={keyboardVisibleValue}
        focusType={focusType}
        key={id}
        isFocused={focusedBlockId === id}
        focusedBlockId={focusedBlockId}
        onTap={onTapNode}
        onPan={handlePan(id)}
        format={format}
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
      minY,
      paddingTop,
      onChangePhoto,
      onTapBlock,
      onBlur,
      onOpenImagePicker,
      focusTypeValue,
      contentViewRef,
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

    // React.useLayoutEffect(() => {
    //   scrollRef.current.getScrollResponder().scrollTo({
    //     x: 0,
    //     y: paddingTop * -1,
    //     animated: false
    //   });
    // }, [scrollRef.current, paddingTop]);

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
        defaultPosition={{
          x: 0,
          y: paddingTop * -1
        }}
        contentOffset={{
          x: 0,
          y: paddingTop * -1
        }}
        scrollEnabled={!swipeOnly}
        onScroll={onScroll}
        onLayout={onLayout}
        keyboardShouldPersistTaps="always"
        contentInsetAdjustmentBehavior="never"
        keyboardOpeningTime={0}
        extraScrollHeight={paddingTop}
        ref={scrollRef}
        paddingTop={paddingTop}
        // enableResetScrollToCoords={false}
        // resetScrollToCoords={{
        //   x: 0,
        //   y: paddingTop * -1
        // }}
        contentInset={{
          top: paddingTop,
          bottom: 0
        }}
        style={{
          maxHeight,
          width: bounds.width,
          flex: 1,
          // overflow: "visible",
          backgroundColor
        }}
        contentContainerStyle={[
          {
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
          <Animated.View
            ref={contentViewRef}
            style={{ minHeight: layout.height - paddingTop }}
          >
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
              focusedBlockId={focusedBlockId}
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
