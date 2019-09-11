import * as React from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { PostBlock, FocusType } from "../NewPostFormat";
import { Block } from "./Block";
import { MovableNode } from "./MovableNode";

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
  block: PostBlock;
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

export const buildEditableNode = ({ block, x, y }) => {
  return {
    block,
    position: {
      x,
      y,
      animatedX: new Animated.Value(x),
      animatedY: new Animated.Value(y),
      scale: 1.0,
      rotate: 0,
      animatedScale: new Animated.Value(1.0),
      animatedRotate: new Animated.Value(0)
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

  handleDrag = ({ nativeEvent }) => {
    console.log(nativeEvent);
  };
  handleDragStop = ({ nativeEvent }) => {
    console.log(nativeEvent);
  };

  handleSnap = ({ nativeEvent }) => {
    console.log(nativeEvent);
  };

  handleTap = () => this.props.onTap(this.props.node);

  componentDidUpdate(prevProps) {
    if (prevProps.isFocused !== this.props.isFocused) {
      this.autoFocus();
    }
  }

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

  handleChangePosition = ({
    x,
    y,
    scale,
    rotate,
    isPanning,
    absoluteX,
    absoluteY
  }) => {
    this.props.onPan({ isPanning, x: absoluteX, y: absoluteY });
    console.log({ isPanning });

    if (this.props.isFocused) {
      return;
    }

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

  bottomOffsetValue = new Animated.Value(0);
  gestureRef = React.createRef();

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
      containerRef,
      disabled,
      focusedBlockValue,
      keyboardVisibleValue,
      onFocus,
      inputRef,
      waitFor,
      absoluteX,
      absoluteY,
      focusType,
      focusedBlockId,
      focusTypeValue,
      onLayout
    } = this.props;

    const isDragEnabled =
      !disabled &&
      ((isFocused && focusType === FocusType.panning) || !focusedBlockId);

    // if (isHidden) {
    //   return null;
    // }

    const EXTRA_PADDING = 15;

    return (
      <MovableNode
        isDragEnabled={isDragEnabled}
        disabled={disabled}
        focusedBlockValue={focusedBlockValue}
        blockId={block.id}
        x={position.animatedX}
        y={position.animatedY}
        xLiteral={position.x}
        isHidden={!!isHidden}
        absoluteX={absoluteX}
        absoluteY={absoluteY}
        containerRef={containerRef}
        onChangePosition={this.handleChangePosition}
        yLiteral={position.y}
        rLiteral={position.rotate}
        keyboardVisibleValue={keyboardVisibleValue}
        waitFor={[...waitFor, this.gestureRef]}
        isFocused={isFocused}
        scaleLiteral={position.scale}
        scale={position.animatedScale}
        r={position.animatedRotate}
        minX={minX}
        maxX={maxX}
        minY={minY}
        maxY={maxY}
        onTap={this.handleTap}
        extraPadding={EXTRA_PADDING}
      >
        <View
          style={{
            flex: 0,
            padding: EXTRA_PADDING,
            margin: -1 * EXTRA_PADDING,
            maxWidth: maxX - EXTRA_PADDING * 2
          }}
        >
          <Block
            ref={inputRef}
            block={block}
            onChange={this.handleChangeBlock}
            focusTypeValue={focusTypeValue}
            focusType={FocusType.absolute}
            gestureRef={this.gestureRef}
            focusedBlockValue={focusedBlockValue}
            onFocus={onFocus}
            onBlur={this.handleBlur}
            disabled={isDragEnabled || disabled}
          />
        </View>
      </MovableNode>
    );
  }
}

export default BaseNode;