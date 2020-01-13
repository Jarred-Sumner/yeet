import * as React from "react";
import { View, LayoutChangeEvent } from "react-native";
import Animated from "react-native-reanimated";
import { FocusType, presetsByFormat } from "../NewPostFormat";
import { Block } from "./Block";
import { MovableNode } from "./MovableNode";
import { getTextBlockAlign } from "../Text/TextInput";
import { PostBlockType } from "../../../lib/buildPost";
import { DimensionsRect } from "../../../lib/Rect";

export type EditableNodeStaticPosition = {
  y: number;
  scale: number;
  rotate: number;
  x: number;
};

export type EditableNodePosition = EditableNodeStaticPosition & {
  animatedX?: Animated.Value<number>;
  animatedY?: Animated.Value<number>;
  animatedRotate: Animated.Value<number>;
  animatedScale: Animated.Value<number>;
};

export interface EditableNode {
  block: PostBlockType;
  position: EditableNodePosition;
}

type Props = {
  node: EditableNode;
  isDragEnabled: boolean;
  isHidden: boolean;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  onChangePosition: (
    editableNode: EditableNode,
    position: EditableNodePosition
  ) => void;
  onTap: (editableNode: EditableNode) => void;
};

export type EditableNodeMap = { [key: string]: EditableNode };

export const buildEditableNode = ({
  block,
  x = 0,
  y = 0,
  scale = 1.0,
  rotate = 0
}): EditableNode => {
  return {
    block,
    position: {
      x,
      y,
      animatedX: new Animated.Value(x),
      animatedY: new Animated.Value(y),
      scale,
      rotate,
      animatedScale: new Animated.Value(scale),
      animatedRotate: new Animated.Value(rotate)
    }
  };
};

export class BaseNode extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  static defaultProps = {
    minX: 0,
    minY: 0
  };

  handleTap = () => this.props.onTap(this.props.node);

  autoFocus = () => {
    this.props.focusType === FocusType.absolute &&
      this.props.inputRef.current.focus &&
      this.props.inputRef.current.focus();
  };

  componentDidMount() {
    if (this.props.isFocused) {
      this.autoFocus();
    }
  }

  handleBlur = block => {
    this.props.onBlur({
      ...this.props.node,
      block
    });
  };

  handleChangeBlock = block => {
    this.props.onChange({
      ...this.props.node,
      block
    });
  };

  handlePan = ({ isPanning, absoluteX, absoluteY }) =>
    this.props.onPan({ isPanning, x: absoluteX, y: absoluteY });

  handleChangePosition = ({ x, y, scale, rotate }) => {
    this.props.onChange({
      ...this.props.node,
      position: {
        ...this.props.node.position,
        x,
        y,
        scale,
        rotate
      }
    });
  };

  handleFinishEditing = ({ startSize, endSize, block }) => {};

  gestureRef = React.createRef();
  blockLayout: DimensionsRect | null = null;
  onContentSizeChangeRef = React.createRef();

  render() {
    const { block, position } = this.props.node;
    const {
      isHidden = false,
      isFocused,
      onTap,
      onChange,
      maxX,
      maxY,
      minX,
      minY,
      onTransform,
      containerRef,
      disabled,
      focusedBlockValue,
      keyboardVisibleValue,
      onFocus,
      inputRef,
      waitFor = [],
      absoluteX,
      autoFocus,
      absoluteY,
      focusType,
      focusedBlockId,
      focusTypeValue,
      onLayout,
      format,
      topInsetValue,
      maxScale,
      currentX,
      currentY,
      keyboardHeight,
      currentWidth,
      velocityX,
      velocityY,
      currentScale,
      currentRotate,
      currentHeight,
      animatedKeyboardVisibleValue,
      scrollY,
      inputAccessoryView,
      keyboardHeightValue
    } = this.props;

    const isDragEnabled =
      !disabled &&
      ((isFocused && focusType === FocusType.panning) || !focusedBlockId);

    // if (isHidden) {
    //   return null;
    // }

    const width =
      typeof block.config?.overrides?.maxWidth === "number"
        ? block.config?.overrides?.maxWidth
        : undefined;

    const paddingTop = Number(
      this.props.paddingTop || presetsByFormat[format].textTop
    );

    const isFixedSize = typeof block?.config?.overrides?.maxWidth === "number";
    return (
      <MovableNode
        isDragEnabled={isDragEnabled}
        disabled={disabled}
        focusedBlockValue={focusedBlockValue}
        isFixedSize={isFixedSize}
        blockId={block.id}
        x={position.animatedX}
        y={position.animatedY}
        r={position.animatedRotate}
        velocityX={velocityX}
        isPanning={isFocused && focusType === FocusType.panning}
        velocityY={velocityY}
        onTransform={onTransform}
        scaleLiteral={position.scale}
        animatedKeyboardVisibleValue={animatedKeyboardVisibleValue}
        isHidden={!!isHidden}
        isOtherNodeFocused={!isFocused && focusType === FocusType.panning}
        isEditing={isFocused && focusType === FocusType.absolute}
        maxScale={maxScale}
        absoluteX={absoluteX}
        onContentSizeChange={this.onContentSizeChangeRef}
        absoluteY={absoluteY}
        focusTypeValue={focusTypeValue}
        containerRef={containerRef}
        topInsetValue={topInsetValue}
        inputRef={inputRef}
        maxWidth={block.config?.overrides?.maxWidth || -1}
        scrollY={scrollY}
        isTextBlock={block.type === "text"}
        hasValue={block.type === "text" ? block.value.length > 0 : false}
        onChangePosition={this.handleChangePosition}
        onPan={this.handlePan}
        textAlign={block.type === "text" ? getTextBlockAlign(block) : "left"}
        yLiteral={position.y}
        xLiteral={position.x}
        rLiteral={position.rotate}
        keyboardHeight={keyboardHeight}
        keyboardVisibleValue={keyboardVisibleValue}
        keyboardHeightValue={keyboardHeightValue}
        waitFor={[...waitFor, this.gestureRef]}
        isFocused={isFocused}
        scale={position.animatedScale}
        minX={minX}
        maxX={maxX}
        paddingTop={paddingTop}
        minY={minY}
        maxY={maxY}
        onTap={this.handleTap}
        extraPadding={0}
      >
        <Block
          ref={inputRef}
          block={block}
          onChange={this.handleChangeBlock}
          onFinishEditing={this.handleFinishEditing}
          focusTypeValue={focusTypeValue}
          focusType={focusType}
          isSticker
          paddingTop={paddingTop}
          onContentSizeChange={this.onContentSizeChangeRef.current}
          gestureRef={this.gestureRef}
          isFocused={isFocused}
          autoFocus={autoFocus}
          maxX={maxX}
          focusedBlockValue={focusedBlockValue}
          onFocus={onFocus}
          waitFor={waitFor}
          onBlur={this.handleBlur}
          disabled={isDragEnabled || disabled}
        />
      </MovableNode>
    );
  }
}

export default BaseNode;
