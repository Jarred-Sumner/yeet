import * as React from "react";
import { findNodeHandle, View } from "react-native";
import { PostFormat } from "../../lib/buildPost";
import { TextPostBlock as TextPostBlockType } from "./NewPostFormat";
import { TextInput, getHighlightInset } from "./Text/TextInput";

type Props = {
  block: TextPostBlockType;
};

export class TextPostBlock extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    this.state = {
      text: props.block.value || ""
    };
  }

  stickerRef = React.createRef<View>();
  containerRef = React.createRef<View>();

  get boundsHandle() {
    if (this.props.block.format === PostFormat.post) {
      return findNodeHandle(this.containerRef.current);
    } else {
      return findNodeHandle(this.stickerRef.current);
    }
  }

  handleChange = text => {
    this.setState({ text });
    // this.props.onChange({ ...this.props.block, value: text });
  };

  handleFocus = () => this.props.onFocus(this.props.block);

  handleBlur = ({ nativeEvent: { text } }) => {
    this.setState({ text });
    this.props.onBlur({ ...this.props.block, value: text });
  };

  get input() {
    return this.textInput.current;
  }

  focus = () => {
    this.input.focus();
  };

  handleFinishEditing = ({
    nativeEvent: { text: value, startSize, endSize }
  }) => {
    this.props.onFinishEditing &&
      this.props.onFinishEditing({
        block: { ...this.props.block, value },
        startSize,
        endSize
      });
  };

  blur = () => {
    console.trace();
    if (this.input.isFocused()) {
      this.input.blur();
    }
  };

  get textInputHandle() {
    return findNodeHandle(this.input);
  }

  setNativeProps = props => this.input.setNativeProps(props);

  textInput = React.createRef<TextInput>();

  get isTextPostBlock() {
    return true;
  }

  get isImagePostBlock() {
    return false;
  }

  render() {
    const {
      block,
      onLayout,
      inputRef,
      disabled,
      maxX,
      gestureRef,
      focusTypeValue,
      focusType,
      isFocused,
      paddingTop,
      focusedBlockValue
    } = this.props;

    const isSticker =
      block.format === PostFormat.sticker ||
      block.format === PostFormat.comment ||
      this.props.isSticker;

    return (
      <TextInput
        editable={!disabled}
        paddingTop={paddingTop}
        block={block}
        maxX={maxX}
        stickerRef={this.stickerRef}
        isBlockFocused={isFocused}
        blockRef={this.containerRef}
        isSticker={isSticker}
        inputRef={this.textInput}
        focusedBlockValue={focusedBlockValue}
        focusTypeValue={focusTypeValue}
        onFinishEditing={this.handleFinishEditing}
        focusType={focusType}
        gestureRef={gestureRef}
        text={this.state.text}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onChangeValue={this.handleChange}
      />
    );
  }
}

export default TextPostBlock;
