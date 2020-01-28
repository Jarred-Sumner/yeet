import * as React from "react";
import { StyleSheet, View } from "react-native";
import { TapGestureHandler } from "react-native-gesture-handler";
import { useLayout } from "react-native-hooks";
import Animated from "react-native-reanimated";
import {
  BlockMap,
  BlockPositionList,
  PostBlockID,
  getPositionsKey,
  getRowKey,
  MAX_POST_HEIGHT
} from "../../lib/buildPost";
import { KeyboardAwareScrollView } from "../KeyboardAwareScrollView";
import {
  FocusType,
  PostBlockType,
  PostLayout,
  CAROUSEL_HEIGHT
} from "./NewPostFormat";
import { BaseNode, EditableNode, EditableNodeMap } from "./Node/BaseNode";
import { Block } from "./Node/Block";
import { currentlyFocusedField } from "./Text/TextInputState";
import { PostLayoutContext } from "./PostLayoutContext";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import { getEstimatedBounds } from "../../lib/Exporter";

export const ScrollView = KeyboardAwareScrollView;

const isTextBlock = (block: PostBlockType) => block.type === "text";

const styles = StyleSheet.create({
  horizontalList: { flexDirection: "row", flex: 0, zIndex: 1 },
  horizontalMultiList: { flexDirection: "row", flex: 1, zIndex: 1 },
  verticalList: { flexDirection: "column", flex: 0, zIndex: 1 }
});

const BlockLayoutContainer = ({
  layout,
  multiList = false,
  children,
  columnCount = 1
}: {
  layout: PostLayout;
}) => {
  const contextValue = React.useMemo(() => ({ columnCount: columnCount }), [
    columnCount
  ]);

  return (
    <PostLayoutContext.Provider value={contextValue}>
      <View
        pointerEvents="box-none"
        style={multiList ? styles.horizontalMultiList : styles.horizontalList}
      >
        {children}
      </View>
    </PostLayoutContext.Provider>
  );
};

type BlockListProps = {
  blocks: BlockMap;
  positions: BlockPositionList;
  setBlockAtIndex: (block: PostBlockType, index: number) => void;
};

const BlockCell = React.forwardRef((props, ref) => {
  const {
    block,
    onChange,
    focusedBlockId,
    onOpenImagePicker,
    focusType,
    onChangePhoto,
    onTap,
    onFocus,
    onBlur,
    focusTypeValue,
    focusedBlockValue,
    onAction,
    onLayout,
    scrollRef,
    paused,
    muted,
    disabled
  } = props;

  const _ref = React.useRef();

  const layoutChange = React.useCallback(() => {
    onLayout(block, _ref.current);
  }, [block, _ref, onLayout]);

  React.useEffect(() => {
    onLayout(block, _ref.current);
  }, [onLayout]);

  return (
    <View style={{ flex: 1 }} onLayout={layoutChange} ref={_ref}>
      <Block
        block={block}
        onFocus={onFocus}
        containerRef={_ref}
        paused={paused}
        muted={muted}
        focusedBlockValue={focusedBlockValue}
        scrollRef={scrollRef}
        isFocused={focusedBlockId === block.id}
        onAction={onAction}
        disabled={
          disabled || focusedBlockId ? focusedBlockId !== block.id : false
        }
        onOpenImagePicker={onOpenImagePicker}
        focusType={focusType}
        onChangePhoto={onChangePhoto}
        onTap={onTap}
        onBlur={onBlur}
        focusTypeValue={focusTypeValue}
        ref={ref}
        onChange={onChange}
      />
    </View>
  );
});

export const BlockList = ({
  blocks,
  setBlockAtIndex,
  setBlockInputRef,
  focusType,
  paused,
  muted,
  onAction,
  positions,
  disabled,
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
    index => block => setBlockAtIndex && setBlockAtIndex(block, index),
    [setBlockAtIndex, blocks]
  );

  const handleSetBlockInputRef = React.useCallback(
    block => {
      return setBlockInputRef && setBlockInputRef(block.id);
    },
    [setBlockInputRef]
  );

  const renderBlock = React.useCallback(
    (blockId: string, index: number) => {
      const block = blocks[blockId];
      return (
        <BlockCell
          onFocus={onFocus}
          onLayout={onLayout}
          focusedBlockValue={focusedBlockValue}
          onOpenImagePicker={onOpenImagePicker}
          positions={positions}
          block={block}
          paused={paused}
          muted={muted}
          focusType={focusType}
          onAction={onAction}
          key={block.id}
          onChangePhoto={onChangePhoto}
          onTap={onTap}
          onBlur={onBlur}
          focusTypeValue={focusTypeValue}
          ref={handleSetBlockInputRef(block)}
          onChange={handleChangeBlock(index)}
        />
      );
    },
    [
      onFocus,
      onLayout,
      focusedBlockValue,
      paused,
      muted,
      onOpenImagePicker,
      positions,
      blocks,
      onLayout,
      onAction,
      focusType,
      onChangePhoto,
      onTap,
      onBlur,
      focusTypeValue,
      handleSetBlockInputRef,
      handleChangeBlock
    ]
  );

  const renderRow = React.useCallback(
    (row: Array<PostBlockID>, index: number) => {
      const rowKey = React.useMemo(() => getRowKey(row), [row]);

      return (
        <BlockLayoutContainer
          multiList={row.length > 1}
          key={rowKey}
          layout={layout}
          columnCount={row.length}
        >
          {row.map(renderBlock)}
        </BlockLayoutContainer>
      );
    },
    [renderBlock]
  );

  return positions.map(renderRow);
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
  offsetY,
  onTapNode,
  velocityX,
  height,
  keyboardHeight,
  currentScale,
  animatedKeyboardVisibleValue,
  velocityY,
  onTransform,
  maxX,
  bottomY: bottom,
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
  midY,
  midX,
  absoluteX,
  absoluteY,
  onBlur: onBlurNode,
  setNodeRef,
  setBlockInputRef,
  panX,
  onAction,
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

  const renderNode = React.useCallback(
    (node: EditableNode) => {
      const { id } = node.block;
      return (
        <BaseNode
          maxX={maxX}
          minY={minY}
          maxY={maxY}
          scrollY={scrollY}
          topInsetValue={topInsetValue}
          containerRef={containerRef(id)}
          velocityX={velocityX}
          currentScale={currentScale}
          velocityY={velocityY}
          onAction={onAction}
          onTransform={onTransform}
          bottom={bottom}
          onBlur={onBlurNode}
          focusedBlockValue={focusedBlockValue}
          disabled={focusedBlockId && focusedBlockId !== id}
          waitFor={waitFor}
          inputRef={handleSetBlockInputRef(id)}
          onFocus={onFocus}
          absoluteX={absoluteX}
          panX={panX}
          height={height}
          animatedKeyboardVisibleValue={animatedKeyboardVisibleValue}
          enableAutomaticScroll
          absoluteY={absoluteY}
          panY={panY}
          focusTypeValue={focusTypeValue}
          keyboardVisibleValue={keyboardVisibleValue}
          keyboardHeightValue={keyboardHeightValue}
          offsetY={offsetY}
          keyboardHeight={keyboardHeight}
          focusType={focusType}
          key={id}
          isFocused={focusedBlockId === id}
          focusedBlockId={focusedBlockId}
          onTap={onTapNode}
          onPan={handlePan(id)}
          format={node.block.format}
          isHidden={
            focusedBlockId &&
            focusedBlockId !== id &&
            focusType !== FocusType.panning
          }
          node={node}
          onChange={onChangeNode}
        />
      );
    },
    [
      maxX,
      minY,
      absoluteX,
      height,
      absoluteY,
      onAction,
      currentScale,
      bottom,
      maxY,
      scrollY,
      offsetY,
      keyboardHeight,
      topInsetValue,
      onBlurNode,
      focusedBlockValue,
      containerRef,
      handleSetBlockInputRef,
      handlePan,
      waitFor,
      animatedKeyboardVisibleValue,
      velocityX,
      velocityY,
      onTransform,
      onFocus,
      panX,
      panY,
      focusTypeValue,
      keyboardVisibleValue,
      keyboardHeightValue,
      focusType,
      focusedBlockId,
      onTapNode,
      format,
      onChangeNode
    ]
  );

  return Object.values(inlineNodes).map(renderNode);
};

export const CENTER_PREVIEW = true;

export const willContentScroll = (bounds: BoundsRect, paddingTop: number) => {
  return bounds.height < SCREEN_DIMENSIONS.height - paddingTop;
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
      onTouchStart,
      setBlockInputRef,
      onChangeBlock,
      onlyShow,
      focusedBlockId,
      inlineNodes,
      onTapNode,
      onChangeNode,
      onTapBackground,
      onAction,
      contentTranslate,
      focusType,
      focusedBlockValue,
      onBlurNode,
      offsetY,
      scrollY,
      children,
      maxHeight,
      onLayoutBlock,
      minY,
      paddingTop,
      onChangePhoto,
      onTapBlock,
      scrollEnabled,
      onBlur,
      onTouchMove,
      onOpenImagePicker,
      positions,
      focusTypeValue,
      onLayout,
      topInsetValue,
      contentViewRef,
      simultaneousHandlers,
      swipeOnly,
      bottomY,
      paddingBottom,
      onScroll,
      onSwipe,
      bounces,
      positionsKey,
      waitFor,
      setPostBottom
    },
    ref
  ) => {
    const scrollRef = React.useRef();
    const blockContainerRef = React.useRef(null);

    React.useImperativeHandle(ref, () => scrollRef.current);

    const initialOffset = React.useMemo(
      () => ({
        x: 0,
        y: 0
      }),
      [paddingTop]
    );

    const scrollHeight = SCREEN_DIMENSIONS.height - paddingTop - paddingBottom;

    const scrollViewStyle = React.useMemo(
      () => ({
        width: bounds.width,
        flex: 1,
        // overflow: "visible",
        backgroundColor: "#111"
      }),
      [maxHeight, bounds.width, backgroundColor, paddingBottom]
    );

    const contentContainerStyle = React.useMemo(
      () => [
        {
          // backgroundColor: "pink",
          // maxHeight,
          justifyContent: "center",
          alignSelf: "center",
          flexGrow: 1,
          width: bounds.width
        }
      ],
      [backgroundColor, maxHeight, scrollHeight]
    );

    const contenViewStyle = React.useMemo(
      () => ({
        position: "relative",
        // backgroundColor: "red",
        overflow: "visible",
        marginTop: paddingTop,
        marginBottom: paddingBottom
      }),
      [paddingTop, bottomY, paddingBottom, backgroundColor]
    );

    // React.useLayoutEffect(() => {
    //   scrollRef.current.getScrollResponder().scrollTo({
    //     x: 0,
    //     y: paddingTop * -1,
    //     animated: false
    //   });
    // }, [scrollRef.current, paddingTop]);

    const isCentered = !willContentScroll(bounds.height, paddingTop);
    return (
      <TapGestureHandler
        onHandlerStateChange={onTapBackground}
        onGestureEvent={onTapBackground}
        shouldCancelWhenOutside={false}
        waitFor={waitFor}
        maxDeltaX={10}
        maxDeltaY={10}
        maxDist={10}
      >
        <ScrollView
          directionalLockEnabled
          horizontal={false}
          bounces={bounces}
          alwaysBounceVertical={false}
          overScrollMode="always"
          defaultPosition={initialOffset}
          contentOffset={initialOffset}
          scrollEnabled
          getFocusedField={currentlyFocusedField}
          scrollToOverflowEnabled
          onScroll={onScroll}
          onScrollBeginDrag={onScroll}
          onMomentumScrollBegin={onScroll}
          nestedScrollEnabled
          scrollY={scrollY}
          topInsetValue={topInsetValue}
          keyboardShouldPersistTaps="always"
          contentInsetAdjustmentBehavior="never"
          keyboardOpeningTime={0}
          extraScrollHeight={0}
          ref={scrollRef}
          centerContent={false}
          paddingTop={0}
          enableResetScrollToCoords
          resetScrollToCoords={null}
          pinchGestureEnabled
          bouncesZoom
          minimumZoomScale={1}
          maximumZoomScale={4}
          paddingBottom={0}
          style={scrollViewStyle}
          contentContainerStyle={contentContainerStyle}
        >
          <Animated.View
            nativeID="content-container"
            ref={contentViewRef}
            onLayout={onLayout}
            style={contenViewStyle}
          >
            <BlockList
              setBlockInputRef={setBlockInputRef}
              blocks={blocks}
              positions={positions}
              layout={postLayout}
              key={positionsKey}
              onFocus={onFocus}
              onAction={onAction}
              focusTypeValue={focusTypeValue}
              onOpenImagePicker={onOpenImagePicker}
              onChangePhoto={onChangePhoto}
              focusType={focusType}
              onTap={onTapBlock}
              disabled={!scrollEnabled}
              scrollRef={scrollRef}
              onLayout={onLayoutBlock}
              focusedBlockId={focusedBlockId}
              focusedBlockValue={focusedBlockValue}
              onBlur={onBlur}
              setBlockAtIndex={setBlockAtIndex}
            />

            {children}
          </Animated.View>
        </ScrollView>
      </TapGestureHandler>
    );
  }
);
