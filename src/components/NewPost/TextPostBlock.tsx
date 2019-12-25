import * as React from "react";
import { View, StyleSheet, TextInput as RNTextInput } from "react-native";
import { TextPostBlock as TextPostBlockType } from "./NewPostFormat";
import { TextInput } from "./Text/TextInput";
import { throttle } from "lodash";

type Props = {
  block: TextPostBlockType;
  onChange: ChangeBlockFunction;
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
