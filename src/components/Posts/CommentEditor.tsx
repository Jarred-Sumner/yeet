import * as React from "react";
import BaseNode, {
  EditableNode,
  buildEditableNode
} from "../NewPost/Node/BaseNode";
import Animated, {
  TransitioningView,
  Transitioning,
  Transition
} from "react-native-reanimated";
import {
  buildTextBlock,
  PostFormat,
  FocusType
} from "../NewPost/NewPostFormat";
import TextInput from "../NewPost/Text/TextInput";
import {
  View,
  InputAccessoryView,
  StyleSheet,
  Keyboard,
  SegmentedControlIOSComponent
} from "react-native";
import { THREAD_HEADER_HEIGHT } from "../ThreadList/ThreadHeader";
import { SCREEN_DIMENSIONS, TOP_Y, BOTTOM_Y } from "../../../config";
import {
  ScrollView,
  BorderlessButton,
  TapGestureHandler,
  State as GestureState
} from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import { IconButton } from "../Button";
import {
  IconChevronRight,
  IconStopwatch,
  IconHourglass,
  IconCircleCheckmark,
  IconCheckmark,
  IconCheck,
  IconClose
} from "../Icon";
import { COLORS, SPACING } from "../../lib/styles";
import {
  ColorSwatch,
  SelectableColorSwatch,
  COMMENT_COLORS,
  colorSwatchKey
} from "../NewPost/ColorSwatch";
import { sample } from "lodash";
import tinycolor from "tinycolor2";
import { BoldText, Text } from "../Text";
import { DurationPicker } from "../DurationPicker";
import CREATE_COMMENT_MUTATION from "../../lib/createCommentMutation.graphql";
import { useMutation } from "react-apollo";
import {
  createCommentMutation as CreateCommentMutation,
  createCommentMutationVariables as CreateCommentMutationVariables
} from "../../lib/graphql/createCommentMutation";
import { sendSuccessNotification } from "../../lib/Vibration";
import Alert from "../../lib/Alert";
import { sendToast, ToastType } from "../Toast";

const NEXT_BUTTON_WIDTH = 60;
const TOOLBAR_HEIGHT = 64;

const SCROLLBAR_WIDTH =
  SCREEN_DIMENSIONS.width - NEXT_BUTTON_WIDTH - SPACING.normal;

const styles = StyleSheet.create({
  submitBar: {
    flexDirection: "row",
    paddingBottom: BOTTOM_Y,
    justifyContent: "flex-end",
    paddingHorizontal: SPACING.normal
  },
  submitButton: {
    paddingBottom: SPACING.normal
  },
  toolbar: {
    height: TOOLBAR_HEIGHT,
    width: SCROLLBAR_WIDTH,
    overflow: "hidden"
  },
  hidden: {
    opacity: 0.2
  },
  footerControl: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    bottom: 0
  },
  sidebar: {
    position: "absolute",
    top: 0,
    right: 0
  },
  closeButton: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    padding: SPACING.normal
  },
  inputAccessoryView: {
    height: TOOLBAR_HEIGHT,
    width: SCREEN_DIMENSIONS.width
  },
  nextButton: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderLeftColor: "rgba(255, 255, 255, 0.25)",
    borderLeftWidth: 2,
    paddingHorizontal: SPACING.normal,
    right: 0,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  toolbarContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    width: SCREEN_DIMENSIONS.width
  },
  durationPicker: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    color: "white"
  },
  toolbarBackground: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0
  }
});

const countIconStyles = StyleSheet.create({
  container: {
    position: "relative",
    paddingHorizontal: SPACING.normal,
    paddingVertical: SPACING.normal,
    overflow: "visible",
    color: "white"
  },
  selectedContainer: {
    position: "relative",
    paddingHorizontal: SPACING.normal,
    color: COLORS.secondary,
    paddingVertical: SPACING.normal,
    overflow: "visible"
  },
  selectedValue: {
    color: COLORS.secondary
  },
  value: {
    fontSize: 28
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end"
  },
  icon: {
    alignSelf: "center",
    justifyContent: "center",
    marginRight: SPACING.half
  },
  label: {
    fontSize: 14,
    color: "#ccc",
    textTransform: "uppercase"
  },
  unit: {
    color: "#666",
    fontSize: 28
  }
});

const CountIcon = ({ value, onPress, label, Icon, selected }) => {
  return (
    <BorderlessButton onPress={onPress}>
      <View style={countIconStyles.container}>
        <View style={countIconStyles.row}>
          <Text style={countIconStyles.label}>{label}</Text>
        </View>

        <View style={countIconStyles.row}>
          <View style={countIconStyles.icon}>
            <Icon size={24} color="rgba(255, 255, 255, 0.15)" />
          </View>

          <BoldText
            style={[
              countIconStyles.value,
              selected && countIconStyles.selectedValue
            ].filter(Boolean)}
          >
            {value}
            <BoldText style={countIconStyles.unit}>s</BoldText>
          </BoldText>
        </View>
      </View>
    </BorderlessButton>
  );
};

type Props = {
  x: number;
  y: number;
  height: number;
  width: number;
  keyboardVisibleValue: Animated.Value<number>;
  node: EditableNode | null;
  onSave: () => void;
};

enum FocusControlType {
  none = "none",
  input = "input",
  duration = "duration",
  timeOffset = "timeOffset"
}

type State = {
  node: EditableNode;
  focusType: FocusType;
  duration: number;
  isSaving: boolean;
  control: FocusControlType;
  timeOffset: number;
};

class CommentEditorContainer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const node: EditableNode =
      props.node ??
      buildEditableNode({
        x: props.x,
        y: props.y,
        scale: props.scale || 1.0,
        rotate: props.rotate || 0,
        block: buildTextBlock({
          value: "",
          id: null,
          autoInserted: false,
          placeholder: "",
          format: PostFormat.comment,
          overrides: {
            ...sample(COMMENT_COLORS)
          }
        })
      });

    this.focusedBlockValue = new Animated.Value(-1);

    this.state = {
      node,
      isSaving: false,
      control: FocusControlType.none,
      duration: 5,
      timeOffset: props.timeOffset || 0,
      focusType: null
    };

    this.focusTypeValue = new Animated.Value(-1);
  }

  componentDidMount() {
    this.handleFocus(() => {
      this.inputRef.current.focus();
    });
  }

  containerRef = React.createRef<View>();
  inputRef = React.createRef<TextInput>();

  handleChangeNode = node => {
    console.log("HANLDE CHANGE");
    this.setState({ node });
  };

  handlePan = ({ isPanning, x, y }) => {
    // if (this.state.focusType !== FocusType.panning && isPanning) {
    //   this.setState({ focusType: FocusType.panning });
    //   this.focusTypeValue.setValue(FocusType.panning);
    //   this.focusedBlockValue.setValue(this.state.node.block.id.hashCode());
    // }
  };

  handlePickColor = ({ backgroundColor, color }: ColorSwatch) => {
    this.handleChangeNode({
      ...this.state.node,
      block: {
        ...this.state.node.block,
        config: {
          ...this.state.node.block.config,
          overrides: {
            ...this.state.node.block.config.overrides,
            backgroundColor,
            color
          }
        }
      }
    });
  };

  handleBlur = _node => {
    let node = this.state.node;
    if (_node && typeof _node === "object" && typeof _node.block === "object") {
      node = _node;
    }

    this.focusTypeValue.setValue(-1);
    this.focusedBlockValue.setValue(-1);
    this.setState({
      focusType: null,
      control: FocusControlType.none,
      node
    });
    this.focusTypeValue.setValue(-1);
  };
  handleFocus = cb => {
    this.focusedBlockValue.setValue(this.state.node.block.id.hashCode());
    this.setState(
      {
        focusType: FocusType.absolute,
        control: FocusControlType.input
      },
      () => {
        this.focusTypeValue.setValue(FocusType.absolute);
        typeof cb === "function" && cb();
      }
    );
  };

  focusedBlockValue: Animated.Value<number>;
  focusTypeValue: Animated.Value<number>;
  panX = new Animated.Value(0);
  panY = new Animated.Value(0);
  scrollRef = React.createRef<ScrollView>();
  handleTap = () => {
    if (this.state.control === FocusControlType.input) {
      this.blurInput();
    } else if (this.state.control === FocusControlType.none) {
      this.handleFocus(() => {
        this.inputRef.current.focus();
      });
    }
  };
  blurInput = () => {
    this.setState({ control: FocusControlType.none, focusType: null }, () => {
      Keyboard.dismiss();
      this.focusTypeValue.setValue(-1);
      this.focusedBlockValue.setValue(-1);
    });
  };
  handleEditDuration = () => {
    Keyboard.dismiss();
    this.setState({ control: FocusControlType.duration, focusType: null });
    this.footerControlRef.current.animateNextTransition();
    this.focusTypeValue.setValue(-1);
  };
  handleEditTimeOffset = () => {
    this.setState({ control: FocusControlType.timeOffset, focusType: null });
    this.footerControlRef.current.animateNextTransition();
    this.focusTypeValue.setValue(-1);
  };

  handleChangeTimeOffset = timeOffset => {
    this.setState({
      timeOffset,
      control: FocusControlType.none,
      focusType: null
    });
    this.footerControlRef.current.animateNextTransition();
  };
  handleChangeDuration = duration => {
    this.setState({ duration, control: FocusControlType.none });
    this.footerControlRef.current.animateNextTransition();
  };

  handleBackgroundTap = ({ nativeEvent: { state: gestureState } }) => {
    if (gestureState === GestureState.END) {
      const { control } = this.state;

      if (control === FocusControlType.input) {
        this.blurInput();
      } else if (
        control === FocusControlType.duration ||
        control === FocusControlType.timeOffset
      ) {
        this.handleBlur();
        this.footerControlRef.current.animateNextTransition();
      }
    }
  };

  footerControlRef = React.createRef<TransitioningView>();
  tapRef = React.createRef();
  renderColor = (color: ColorSwatch) => (
    <SelectableColorSwatch
      size={36}
      height={TOOLBAR_HEIGHT}
      waitFor={this.scrollRef}
      selected={
        colorSwatchKey(color) ===
        colorSwatchKey(this.state.node.block.config.overrides)
      }
      key={colorSwatchKey(color)}
      onPress={this.handlePickColor}
      {...color}
    />
  );

  handleSubmit = () => {
    if (this.state.isSaving) {
      return;
    }

    this.setState({ isSaving: true });
    const { x, y, rotate, scale } = this.state.node.position;
    const {
      color: textColor,
      backgroundColor
    } = this.state.node.block.config.overrides;
    const { timeOffset, duration } = this.state;
    const body = this.state.node.block.value;

    return this.props
      .onSave({
        x,
        y,
        body,
        rotate,
        color: textColor,
        backgroundColor,
        timeOffset,
        duration,
        scale
      })
      .then(
        success => {
          if (success) {
            this.props.onClose();
          } else {
            this.setState({ isSaving: false });
          }
        },
        err => {
          this.setState({ isSaving: false });
        }
      );
  };

  render() {
    const {
      width,
      height,
      keyboardVisibleValue,
      topInset,
      keyboardHeightValue
    } = this.props;

    const { duration, timeOffset, control } = this.state;

    const blockID = this.state.node.block.id;

    return (
      <TapGestureHandler
        enabled={
          this.state.control === FocusControlType.input ||
          this.state.control === FocusControlType.timeOffset ||
          this.state.control === FocusControlType.duration
        }
        onHandlerStateChange={this.handleBackgroundTap}
        ref={this.tapRef}
      >
        <Animated.View
          style={{
            width,
            height: SCREEN_DIMENSIONS.height - TOP_Y - topInset,
            position: "relative",
            backgroundColor: "rgba(0, 0, 0, 0.65)"
          }}
        >
          <View style={styles.closeButton}>
            <IconButton
              type="shadow"
              color="white"
              size={24}
              Icon={IconClose}
              onPress={this.props.onClose}
            />
          </View>
          <View style={styles.sidebar}>
            <View
              style={control === FocusControlType.duration ? styles.hidden : []}
            >
              <CountIcon
                Icon={IconHourglass}
                value={timeOffset}
                selected={control === FocusControlType.timeOffset}
                label="Show at"
                onPress={this.handleEditTimeOffset}
              />
            </View>

            <View
              style={[
                control === FocusControlType.timeOffset && styles.hidden
              ].filter(Boolean)}
            >
              <CountIcon
                Icon={IconStopwatch}
                value={duration}
                selected={control === FocusControlType.duration}
                label="Hide"
                onPress={this.handleEditDuration}
              />
            </View>
          </View>

          <BaseNode
            maxX={width}
            maxY={height}
            minY={TOP_Y + topInset}
            paddingTop={-14}
            containerRef={this.containerRef}
            onBlur={this.handleBlur}
            focusedBlockValue={this.focusedBlockValue}
            waitFor={[]}
            inputRef={this.inputRef}
            onFocus={this.handleFocus}
            absoluteX={this.panX}
            maxScale={1.5}
            isDragEnabled={this.state.control === FocusControlType.none}
            disabled={
              this.state.control === FocusControlType.timeOffset ||
              this.state.control === FocusControlType.duration
            }
            enableAutomaticScroll
            absoluteY={this.panY}
            focusTypeValue={this.focusTypeValue}
            keyboardVisibleValue={keyboardVisibleValue}
            keyboardHeightValue={keyboardHeightValue}
            focusType={this.state.focusType}
            isFocused={this.state.control === FocusControlType.input}
            focusedBlockId={
              this.state.control === FocusControlType.none ? null : blockID
            }
            onTap={this.handleTap}
            onPan={this.handlePan}
            format={this.state.node.block.format}
            isHidden={false}
            node={this.state.node}
            onChange={this.handleChangeNode}
          />

          <InputAccessoryView
            style={styles.inputAccessoryView}
            nativeID={`new-post-input`}
          >
            <LinearGradient
              colors={["rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 0.4)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              pointerEvents="none"
              locations={[0, 1]}
              width={SCREEN_DIMENSIONS.width}
              height={TOOLBAR_HEIGHT}
              style={styles.toolbarBackground}
            />

            <View style={styles.toolbarContainer}>
              <ScrollView
                contentContainerStyle={{ alignItems: "center" }}
                horizontal
                keyboardShouldPersistTaps="always"
                ref={this.scrollRef}
                pagingEnabled
                snapToAlignment="start"
                snapToInterval={SCREEN_DIMENSIONS.width - NEXT_BUTTON_WIDTH}
                style={styles.toolbar}
              >
                {COMMENT_COLORS.map(this.renderColor)}
              </ScrollView>

              <View pointerEvents="box-none" style={styles.nextButton}>
                <IconButton
                  containerSize={44}
                  size={24}
                  Icon={IconChevronRight}
                  color="white"
                  type="fill"
                  onPress={this.blurInput}
                  backgroundColor={COLORS.secondary}
                />
              </View>
            </View>
          </InputAccessoryView>

          <Transitioning.View
            ref={this.footerControlRef}
            transition={
              <Transition.Together>
                <Transition.In type="slide-bottom" interpolation="easeInOut" />
                <Transition.Change interpolation="easeInOut" />
                <Transition.Out type="slide-bottom" interpolation="easeInOut" />
              </Transition.Together>
            }
            style={styles.footerControl}
          >
            {this.state.control === FocusControlType.duration && (
              <DurationPicker
                start={1}
                key="duration"
                end={10}
                value={this.state.duration}
                onChange={this.handleChangeDuration}
                color="white"
                style={styles.durationPicker}
              />
            )}

            {this.state.control === FocusControlType.timeOffset && (
              <DurationPicker
                start={1}
                end={10}
                key="time-offset"
                value={this.state.timeOffset}
                onChange={this.handleChangeTimeOffset}
                color="white"
                style={styles.durationPicker}
              />
            )}

            {this.state.control === FocusControlType.none && (
              <Animated.View style={styles.submitBar}>
                <View style={styles.submitButton}>
                  <IconButton
                    Icon={IconCheck}
                    color={COLORS.secondary}
                    type="fill"
                    backgroundColor="white"
                    size={32}
                    onPress={this.handleSubmit}
                    containerSize={64}
                  />
                </View>
              </Animated.View>
            )}
          </Transitioning.View>
        </Animated.View>
      </TapGestureHandler>
    );
  }
}

export const CommentEditor = ({ postId, onClose, ...otherProps }) => {
  const [createComment] = useMutation<
    CreateCommentMutation,
    CreateCommentMutationVariables
  >(CREATE_COMMENT_MUTATION);

  const onCreateComment = React.useCallback(
    ({
      x,
      y,
      body,
      rotate,
      color: textColor,
      backgroundColor,
      timeOffset,
      duration: autoplaySeconds,
      scale
    }) => {
      return createComment({
        variables: {
          postId,
          x,
          y,
          rotate,
          mediaId: null,
          scale,
          body,
          backgroundColor,
          textColor,
          timeOffset,
          autoplaySeconds
        }
      }).then(
        resp => {
          const isSuccessful = resp?.data?.createComment;

          if (isSuccessful) {
            sendSuccessNotification();
            sendToast("Posted comment successfully", ToastType.success);
          } else {
            sendToast(
              "Something went wrong. Please try again.",
              ToastType.error
            );
            return null;
          }

          return resp;
        },
        err => {
          sendToast("Something went wrong. Please try again.", ToastType.error);
          console.error(err);
        }
      );
    },
    [createComment, onClose, postId, sendSuccessNotification, sendToast]
  );

  return (
    <CommentEditorContainer
      {...otherProps}
      postId={postId}
      onClose={onClose}
      onSave={onCreateComment}
    />
  );
};
