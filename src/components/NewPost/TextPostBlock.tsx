import * as React from "react";
import { TextPostBlock as TextPostBlockType } from "./NewPostFormat";
import { TextInput } from "./Text/TextInput";
import { View, findNodeHandle } from "react-native";
import { PostFormat } from "../../lib/buildPost";

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

  componentDidMount() {
    if (this.props.autoFocus) {
      this.focus();
    }
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
  };

  handleFocus = () => this.props.onFocus(this.props.block);

  handleBlur = () => {
    this.props.onBlur({ ...this.props.block, value: this.state.text });
  };

  focus = () => {
    if (!this.textInput.current.isFocused()) {
      this.textInput.current.focus();
    }
  };

  blur = () => {
    if (this.textInput.current.isFocused()) {
      this.textInput.current.blur();
    }
  };

  setNativeProps = (...args) =>
    this.textInput.current.setNativeProps.call(this.textInput.current, args);

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
      focusedBlockValue
    } = this.props;

    return (
      <TextInput
        editable={!disabled}
        block={block}
        maxX={maxX}
        stickerRef={this.stickerRef}
        blockRef={this.containerRef}
        inputRef={this.textInput}
        focusedBlockValue={focusedBlockValue}
        focusTypeValue={focusTypeValue}
        focusType={focusType}
        gestureRef={gestureRef}
        onLayout={onLayout}
        text={this.state.text}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onChangeValue={this.handleChange}
      />
    );
  }
}

export default TextPostBlock;
