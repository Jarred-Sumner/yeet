import * as React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS } from "../../../config";
import {
  BlockMap,
  BlockPositionList,
  getRowKey,
  PostBlockID
} from "../../lib/buildPost";
// import { KeyboardAwareScrollView } from "../KeyboardAwareScrollView";
// import { ScrollView } from "react-native-gesture-handler";
import { YeetScrollView } from "./YeetScrollView";
import { FocusType, PostBlockType, PostLayout } from "./NewPostFormat";
import { BaseNode, EditableNode, EditableNodeMap } from "./Node/BaseNode";
import { Block } from "./Node/Block";
import { PostLayoutContext } from "./PostLayoutContext";
import {
  SnapContainerView,
  AnimatedSnapContainerView
} from "./SnapContainerView";
import { currentlyFocusedField } from "./Text/TextInputState";
import { PostSchemaProvider, PostSchemaContext } from "./PostSchemaProvider";

// export const ScrollView = KeyboardAwareScrollView;

const isTextBlock = (block: PostBlockType) => block.type === "text";

const styles = StyleSheet.create({
  horizontalList: {
    flexDirection: "row",
    flex: 0,
    zIndex: 1,
    justifyContent: "center"
  },
  horizontalMultiList: {
    flexDirection: "row",
    flex: 1,
    zIndex: 1,
    justifyContent: "center"
  },
  verticalList: { flexDirection: "column", flex: 0, zIndex: 1 },
  contentWrapper: {
    alignSelf: "center",
    marginHorizontal: 12,
    position: "relative",
    flexGrow: 1,
    overflow: "visible",
    width: SCREEN_DIMENSIONS.width - 24
  },
  overlay: {
    position: "relative"
  },
  content: {
    borderRadius: 16,
    overflow: "hidden",
    width: SCREEN_DIMENSIONS.width - 24
  }
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

  const blockId = block.id;
  const layoutChange = React.useCallback(() => {
    onLayout(blockId, _ref.current);
  }, [blockId, _ref, onLayout]);

  React.useEffect(() => {
    onLayout(blockId, _ref.current);
  }, [onLayout, blockId]);

  return (
    <View
      pointerEvents="box-none"
      style={{ flex: 1 }}
      onLayout={layoutChange}
      ref={_ref}
    >
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
      />
    </View>
  );
});

export const BlockList = ({
  setBlockAtIndex,
  setBlockInputRef,
  focusType,
  paused,
  muted,
  onAction,
  disabled,
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
  const {
    schema: {
      post: { blocks, positions, layout }
    }
  } = React.useContext(PostSchemaContext);

  const handleSetBlockInputRef = React.useCallback(
    block => {
      return setBlockInputRef && setBlockInputRef(block.id);
    },
    [setBlockInputRef]
  );

  const renderBlock = React.useCallback(
    (blockId: string, index: number) => {
      const block = blocks.get(blockId);
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
      handleSetBlockInputRef
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
  onChangeNode,
  offsetY,
  onTapNode,
  velocityX,
  height,
  keyboardHeight,
  currentScale,
  velocityY,
  onTransform,
  maxX,
  bottomY: bottom,
  focusType,
  topInsetValue,
  onFocus,
  waitFor,
  maxY,
  scrollY,
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
  focusedBlockId,
  onMoveStart
}: EditableNodeListProps) => {
  const {
    schema: { inlineNodes }
  } = React.useContext(PostSchemaContext);
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
          disabled={focusedBlockId && focusedBlockId !== id}
          waitFor={waitFor}
          inputRef={handleSetBlockInputRef(id)}
          onFocus={onFocus}
          absoluteX={absoluteX}
          panX={panX}
          height={height}
          enableAutomaticScroll
          absoluteY={absoluteY}
          panY={panY}
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
      containerRef,
      handleSetBlockInputRef,
      handlePan,
      waitFor,
      velocityX,
      velocityY,
      onTransform,
      onFocus,
      panX,
      panY,
      focusType,
      focusedBlockId,
      onTapNode,
      format,
      onChangeNode
    ]
  );

  const inlineNodesList = React.useMemo(() => {
    return [...inlineNodes.values()];
  }, [inlineNodes]);

  return inlineNodesList.map(renderNode);
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
      onAction,
      contentTranslate,
      focusType,
      onBlurNode,
      offsetY,
      scrollY,
      children,
      maxHeight,
      onLayoutBlock,
      isFocused,
      minY,
      paddingTop,
      keyboardHeight,
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
      onShowSnapPreview,
      onHideSnapPreview,
      onDelete,
      onTapBackground,
      onMoveStart,
      onMoveEnd,
      onSnap,
      postTopY,
      postBottomY,
      snapPoints
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

    const contentInset = React.useMemo(
      () => ({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }),
      [paddingTop, paddingBottom]
    );

    const scrollHeight = SCREEN_DIMENSIONS.height - paddingTop - paddingBottom;

    const scrollViewStyle = React.useMemo(
      () => ({
        width: SCREEN_DIMENSIONS.width,
        height: SCREEN_DIMENSIONS.height,

        backgroundColor: "#000"
      }),
      [maxHeight, bounds.width, backgroundColor, paddingBottom]
    );

    const contenViewStyle = React.useMemo(
      () => ({
        // position: "relative",
        // backgroundColor: "red",
        overflow: "visible",

        width: SCREEN_DIMENSIONS.width,
        flex: 0,
        position: "absolute"
        // backgroundColor: "pink"

        // flexDirection: "row",

        // flexShrink: 1,

        // alignItems: "center",
        // justifyContent: keyboardHeight > 0 ? "flex-start" : "center"
        // paddingTop: keyboardHeight > 0 ? paddingTop : 0,
        // paddingBottom: keyboardHeight > 0 ? paddingBottom : 0,
      }),
      [paddingTop, bottomY, paddingBottom, backgroundColor, keyboardHeight]
    );

    const _true = React.useCallback(() => true, []);

    // React.useLayoutEffect(() => {
    //   scrollRef.current.getScrollResponder().scrollTo({
    //     x: 0,
    //     y: paddingTop * -1,
    //     animated: false
    //   });
    // }, [scrollRef.current, paddingTop]);

    const isCentered = !willContentScroll(bounds.height, paddingTop);

    return (
      <YeetScrollView
        width={SCREEN_DIMENSIONS.width}
        pointerEvents="auto"
        height={SCREEN_DIMENSIONS.height}
        // directionalLockEnabled
        // horizontal={false}
        // bounces={bounces}
        // alwaysBounceVertical={false}
        // overScrollMode="always"
        // defaultPosition={initialOffset}
        // contentOffset={initialOffset}
        // contentInset={contentInset}
        // scrollEnabled
        // getFocusedField={currentlyFocusedField}
        // scrollToOverflowEnabled
        // canCancelContentTouches={false}
        // onScroll={onScroll}
        // onScrollBeginDrag={onScroll}
        // onMomentumScrollBegin={onScroll}
        // nestedScrollEnabled
        // scrollY={scrollY}
        // topInsetValue={topInsetValue}
        // keyboardShouldPersistTaps="always"
        // contentInsetAdjustmentBehavior="never"
        // automaticallyAdjustContentInsets={false}
        ref={scrollRef}
        headerHeight={paddingTop}
        footerHeight={paddingBottom}
        // centerContent={false}
        // paddingTop={0}
        // enableResetScrollToCoords
        // resetScrollToCoords={null}
        // pinchGestureEnabled
        // // bouncesZoom
        // minimumZoomScale={1}
        // maximumZoomScale={4}
        // paddingBottom={0}
        style={scrollViewStyle}
      >
        <SnapContainerView
          nativeID="content-container"
          ref={contentViewRef}
          onShowSnapPreview={onShowSnapPreview}
          onHideSnapPreview={onHideSnapPreview}
          onDelete={onDelete}
          onTapBackground={onTapBackground}
          onMoveStart={onMoveStart}
          onMoveEnd={onMoveEnd}
          onSnap={onSnap}
          snapPoints={snapPoints}
          onLayout={onLayout}
          // onMoveShouldSetResponder={_true}
          // onStartShouldSetResponder={_true}

          style={contenViewStyle}
        >
          <View style={styles.contentWrapper}>
            <View pointerEvents="box-none" style={styles.content}>
              <BlockList
                setBlockInputRef={setBlockInputRef}
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
                onBlur={onBlur}
                setBlockAtIndex={setBlockAtIndex}
              />
            </View>
            <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
              <View pointerEvents="box-none" style={styles.overlay}>
                {children}
              </View>
            </View>
          </View>
        </SnapContainerView>
      </YeetScrollView>
    );
  }
);
