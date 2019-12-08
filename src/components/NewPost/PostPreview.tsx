import * as React from "react";
import { View, StyleSheet } from "react-native";
import {
  LongPressGestureHandler,
  TapGestureHandler
} from "react-native-gesture-handler";
import { useLayout } from "react-native-hooks";
import { KeyboardAwareScrollView } from "../KeyboardAwareScrollView";
import Animated from "react-native-reanimated";
import { useFocusState } from "react-navigation-hooks";
import {
  FocusType,
  PostBlockType,
  CAROUSEL_HEIGHT,
  PostLayout
} from "./NewPostFormat";
import { BaseNode, EditableNode, EditableNodeMap } from "./Node/BaseNode";
import { Block } from "./Node/Block";
import { getInset } from "react-native-safe-area-view";
export const ScrollView = KeyboardAwareScrollView;

const styles = StyleSheet.create({
  horizontalList: { flexDirection: "row", flex: 1 },
  verticalList: { flexDirection: "column", flex: 1 }
});

const BlockLayoutContainer = ({ layout, children }: { layout: PostLayout }) => {
  if (
    [
      PostLayout.horizontalMediaMedia,
      PostLayout.horizontalMediaText,
      PostLayout.horizontalTextMedia
    ].includes(layout)
  ) {
    return <View style={styles.horizontalList}>{children}</View>;
  } else {
    return <View style={styles.verticalList}>{children}</View>;
  }
};

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
  layout,
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

  const renderBlock = React.useCallback(
    (block: PostBlockType, index: number) => {
      return (
        <Block
          onLayout={onLayout}
          block={block}
          onFocus={onFocus}
          focusedBlockValue={focusedBlockValue}
          scrollRef={scrollRef}
          isFocused={focusedBlockId === block.id}
          disabled={focusedBlockId ? focusedBlockId !== block.id : false}
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
    },
    [
      onFocus,
      onLayout,
      focusedBlockValue,
      onOpenImagePicker,
      focusType,
      onChangePhoto,
      onTap,
      onBlur,
      focusTypeValue,
      handleSetBlockInputRef,
      handleChangeBlock
    ]
  );

  return (
    <BlockLayoutContainer layout={layout}>
      {blocks.map(renderBlock)}
    </BlockLayoutContainer>
  );
};

type EditableNodeListProps = {
  inlineNodes: EditableNodeMap;
  inlineNodeRefs: Map<string, React.Ref<View>>;
  maxY: number;
  panX: Animated.Value<number>;
  scrollY: Animated.Value<number>;
  panY: Animated.Value<number>;
  maxX: number;
  topInsetValue: Animated.Value<number>;
  onTapNode: (node: EditableNode) => void;
  onChangeNode: (node: EditableNode) => void;
};
export const EditableNodeList = ({
  inlineNodes,
  onChangeNode,
  onTapNode,
  maxX,
  keyboardHeightValue,
  focusType,
  topInsetValue,
  keyboardVisibleValue,
  onFocus,
  waitFor,
  maxY,
  focusedBlockValue,
  scrollY,
  focusTypeValue,
  minY,
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
        minY={minY}
        maxY={maxY}
        scrollY={scrollY}
        topInsetValue={topInsetValue}
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
        keyboardHeightValue={keyboardHeightValue}
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
      layout: postLayout,
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
      scrollY,
      children,
      maxHeight,
      minY,
      paddingTop,
      onChangePhoto,
      onTapBlock,
      onBlur,
      onOpenImagePicker,
      focusTypeValue,
      topInsetValue,
      contentViewRef,
      simultaneousHandlers,
      swipeOnly,
      paddingBottom,
      onScroll,
      onSwipe,
      bounces,
      waitFor
    },
    ref
  ) => {
    const scrollRef = React.useRef();

    React.useImperativeHandle(ref, () => scrollRef.current);
    const { onLayout, ...layout } = useLayout();

    const initialOffset = React.useMemo(
      () => ({
        x: 0,
        y: paddingTop * -1
      }),
      [paddingTop]
    );

    const contentInset = React.useMemo(
      () => ({
        top: paddingTop,
        bottom: paddingBottom
      }),
      []
    );

    const scrollViewStyle = React.useMemo(
      () => ({
        maxHeight,
        width: bounds.width,
        flex: 1,
        // overflow: "visible",
        backgroundColor
      }),
      [maxHeight, bounds.width, backgroundColor]
    );

    const contentContainerStyle = React.useMemo(
      () => [
        {
          position: "relative",
          backgroundColor
        }
      ],
      [backgroundColor]
    );

    const contenViewStyle = React.useMemo(
      () => ({
        minHeight:
          layout && typeof layout.height === "number"
            ? layout.height - paddingTop
            : undefined
      }),
      [layout, paddingTop]
    );

    // React.useLayoutEffect(() => {
    //   scrollRef.current.getScrollResponder().scrollTo({
    //     x: 0,
    //     y: paddingTop * -1,
    //     animated: false
    //   });
    // }, [scrollRef.current, paddingTop]);

    const GestureHandler = focusedBlockValue
      ? TapGestureHandler
      : LongPressGestureHandler;
    return (
      <ScrollView
        directionalLockEnabled
        horizontal={false}
        vertical
        bounces={bounces}
        alwaysBounceVertical={bounces}
        overScrollMode="always"
        defaultPosition={initialOffset}
        contentOffset={initialOffset}
        scrollEnabled={!swipeOnly}
        onScroll={onScroll}
        onLayout={onLayout}
        scrollY={scrollY}
        topInsetValue={topInsetValue}
        keyboardShouldPersistTaps="always"
        contentInsetAdjustmentBehavior="never"
        keyboardOpeningTime={0}
        extraScrollHeight={0}
        ref={scrollRef}
        paddingTop={paddingTop}
        enableResetScrollToCoords={false}
        resetScrollToCoords={initialOffset}
        contentInset={contentInset}
        paddingBottom={paddingBottom}
        style={scrollViewStyle}
        contentContainerStyle={contentContainerStyle}
      >
        <GestureHandler
          onHandlerStateChange={onTapBackground}
          onGestureEvent={onTapBackground}
          waitFor={waitFor}
          minDurationMs={150}
          maxDist={9999}
        >
          <Animated.View ref={contentViewRef} style={contenViewStyle}>
            <BlockList
              setBlockInputRef={setBlockInputRef}
              blocks={blocks}
              layout={postLayout}
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
        </GestureHandler>
      </ScrollView>
    );
  }
);
