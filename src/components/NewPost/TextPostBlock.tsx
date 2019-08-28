import * as React from "react";
import { View, StyleSheet, TextInput as RNTextInput } from "react-native";
import { TextPostBlock as TextPostBlockType } from "./NewPostFormat";
import { TextInput } from "./Text/TextInput";

type Props = {
  block: TextPostBlockType;
  onChange: ChangeBlockFunction;
};

export class TextPostBlock extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    this.state = {
      text: props.block.value
    };
  }

  handleChange = text => {
    this.setState({ text });
  };

  focus = () => {
    // this.inputRef.current.setNativeProps({
    //   editable: true
    // });
    this.inputRef.current.focus();
  };

  blur = () => {
    // this.inputRef.current.setNativeProps({
    //   editable: false
    // });
    this.inputRef.current.blur();
  };

  inputRef = React.createRef<RNTextInput>();
  handleFocus = () => this.props.onFocus(this.props.block);

  handleBlur = () => {
    this.props.onBlur({ ...this.props.block, value: this.state.text });
  };

  render() {
    const { block, onLayout, disabled } = this.props;

    return (
      <TextInput
        editable={!disabled}
        inputRef={this.inputRef}
        block={block}
        onLayout={onLayout}
        text={this.state.text}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onChangeValue={this.handleChange}
      />
    );
  }
}
