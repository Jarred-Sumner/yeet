import * as React from "react";
import { View, StyleSheet, LayoutAnimation } from "react-native";
import { Interactable } from "./Interactable";
import { PostBlock } from "../NewPostFormat";
import Animated from "react-native-reanimated";
import { Block } from "./Block";
import { MovableNode } from "./MovableNode";
import { KeyboardAvoidingView } from "../../KeyboardAvoidingView";

export type EditableNodePosition = {
  x: number;
  animatedX?: Animated.Value<number>;
  animatedY?: Animated.Value<number>;
  y: number;
  scale: number;
  rotate: number;
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

export type EditableNodeMap = Map<string, EditableNode>;

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

  blockRef = React.createRef();

  componentDidUpdate(prevProps) {
    if (prevProps.isFocused !== this.props.isFocused) {
      if (this.props.isFocused) {
        this.blockRef.current.focus();
      }
    }
  }

  componentDidMount() {
    if (this.props.isFocused) {
      this.blockRef.current.focus();
    }
  }

  handleBlur = block => {
    this.props.onBlur({
      ...this.props.node,
      block
    });
  };

  handleChangeBlock = block =>
    this.props.onChange({
      ...this.props.node,
      block
    });

  handleChangePosition = ({ x, y, scale, rotate }) => {
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

  render() {
    const { block, position } = this.props.node;
    const {
      isDragEnabled = true,
      isHidden = false,
      isFocused,
      onTap,
      onChange,
      maxX,
      maxY,
      minX,
      minY,
      containerRef,
      onFocus,
      waitFor,
      onLayout
    } = this.props;

    if (isHidden) {
      return null;
    }

    const EXTRA_PADDING = 15;

    return (
      <MovableNode
        isDragEnabled={isDragEnabled}
        x={position.animatedX}
        y={position.animatedY}
        xLiteral={position.x}
        containerRef={containerRef}
        onChangePosition={this.handleChangePosition}
        yLiteral={position.y}
        rLiteral={position.rotate}
        waitFor={waitFor}
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
            ref={this.blockRef}
            block={block}
            onChange={this.handleChangeBlock}
            onFocus={onFocus}
            onBlur={this.handleBlur}
            disabled={isDragEnabled}
          />
        </View>
      </MovableNode>
    );
  }
}

export default BaseNode;
