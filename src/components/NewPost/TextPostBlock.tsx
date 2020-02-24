import * as React from "react";
import { findNodeHandle, View } from "react-native";
import { PostFormat } from "../../lib/enums";
import { TextPostBlock as TextPostBlockType } from "./NewPostFormat";
import { TextInput } from "./Text/TextInput";
import { onChangeBlockText } from "../../lib/PostEditor/actions";
import Actions from "../../lib/PostEditor/AllActions";
import ReactNative from "react-native/Libraries/Renderer/shims/ReactNative";

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
      return this.containerTag;
    } else {
      return this.stickerTag;
    }
  }

  stickerTag: number | null = null;

  handleChange = text => {
    this.setState({ text });
  };

  get isFocused() {
    return this.input.isFocused();
  }

  handleFocus = () => this.props.onFocus(this.props.block);

  handleBlur = ({ nativeEvent: { text } }) => {
    this.setState({ text });

    const blockId = this.props.block.id;

    this.updateText(text, blockId);
    this.props.onBlur(this.props.block);
  };

  updateText = (text: string, blockId: string) => {
    this.props.updateSchema(Actions.onChangeBlockText({ blockId, text }));
  };

  get input() {
    return this.textInput.current;
  }

  focus = () => {
    this.input.focus();
  };

  handleFinishEditing = ({ nativeEvent: { value, startSize, endSize } }) => {
    // this.updateText(value);
  };

  blur = () => {
    if (this.input.isFocused()) {
      this.input.blur();
    }
  };

  componentDidMount() {
    if (this.stickerRef.current) {
      this.stickerTag = findNodeHandle(this.stickerRef.current);
    }

    if (this.containerRef.current) {
      this.containerTag = findNodeHandle(this.containerRef.current);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.text === this.state.text &&
      prevProps.block.value !== this.props.block.value
    ) {
      this.setState({ text: this.props.block.value });
      this.setNativeProps({ text: this.props.block.value });
    }
  }

  get textInputHandle() {
    return findNodeHandle(this.input);
  }

  setNativeProps = props => this.input.setNativeProps(props);

  textInput = React.createRef<TextInput>();
  containerTag: number | null = null;

  get isTextPostBlock() {
    return true;
  }

  get isImagePostBlock() {
    return false;
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const {
      block,
      inputRef,
      disabled,
      maxX,
      onContentSizeChange,
      gestureRef,
      focusTypeValue,
      focusType,
      isFocused,
      isSticker,
      updateSchema,
      paddingTop,
      focusedBlockValue
    } = this.props;

    return (
      block !== nextProps.block ||
      block.value !== nextProps.block.value ||
      inputRef !== nextProps.inputRef ||
      disabled !== nextProps.disabled ||
      maxX !== nextProps.maxX ||
      isSticker !== nextProps.isSticker ||
      isFocused !== nextProps.isFocused ||
      focusType !== nextProps.focusType ||
      paddingTop !== nextProps.paddingTop ||
      updateSchema !== nextProps.updateSchema ||
      nextState.text !== this.state.text
    );
  }

  render() {
    const {
      block,
      onLayout,
      inputRef,
      disabled,
      maxX,
      onContentSizeChange,
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
        containerTag={this.containerTag}
        onRequestFocus={this.handleFocus}
        isSticker={isSticker}
        stickerTag={this.stickerTag}
        ref={this.textInput}
        focusedBlockValue={focusedBlockValue}
        focusTypeValue={focusTypeValue}
        onFinishEditing={this.handleFinishEditing}
        focusType={focusType}
        onContentSizeChange={onContentSizeChange}
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
