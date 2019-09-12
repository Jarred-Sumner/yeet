import * as React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  Transitioning,
  Transition,
  TransitioningView
} from "react-native-reanimated";
import SafeAreaView, { getInset } from "react-native-safe-area-view";
import { IconClose, IconCheck } from "./Icon";
import { SemiBoldText } from "./Text";
import { SPACING, COLORS } from "../lib/styles";
import { BaseButton } from "react-native-gesture-handler";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999
  },
  successToast: {
    backgroundColor: COLORS.success
  },
  errorToast: {
    backgroundColor: COLORS.warn
  },
  iconContainer: {
    marginRight: SPACING.normal,
    justifyContent: "center",
    alignItems: "center"
  },
  transitioner: {},
  toast: {
    flexDirection: "row",

    width: "100%",
    paddingHorizontal: SPACING.normal,
    paddingVertical: SPACING.normal,
    alignItems: "flex-start",
    paddingTop: getInset("top") + SPACING.normal
  },
  text: {
    fontSize: 16,
    color: "white"
  }
});

export enum ToastType {
  success = "success",
  error = "error",
  hidden = "hidden"
}

const ICON_COMPONENT_BY_TYPE = {
  [ToastType.error]: IconClose,
  [ToastType.success]: IconCheck
};

type State = {
  message: string | null;
  type: ToastType;
};

const AUTO_DISMISS_TIME = 5000;

export let sendToast = (message: string, type: ToastType) => {};

export let dismissToast = (message: string, type: ToastType) => {};

export class Toast extends React.Component<{}, State> {
  state = {
    type: ToastType.hidden,
    message: null
  };

  hide = () => this.reset();

  reset = () => {
    this.transitioner.current.animateNextTransition();
    this.setState({
      type: ToastType.hidden,
      message: null
    });
  };

  componentDidMount() {
    dismissToast = this.hide;
    sendToast = this.changeToast;
  }

  autoHideTimeout = -1;
  autoHide = () => {
    if (this.autoHideTimeout > -1) {
      clearTimeout(this.autoHideTimeout);
    }
    this.autoHideTimeout = window.setTimeout(this.reset, AUTO_DISMISS_TIME);
  };

  componentWillUnmount() {
    if (this.autoHideTimeout > -1) {
      clearTimeout(this.autoHideTimeout);
    }
  }

  changeToast = (message: string, type: ToastType) => {
    this.transitioner.current.animateNextTransition();
    this.setState({
      message,
      type
    });
    this.autoHide();
  };

  transitioner = React.createRef<TransitioningView>();

  render() {
    const { type, message } = this.state;
    const IconComponent = ICON_COMPONENT_BY_TYPE[type];
    return (
      <View
        pointerEvents={type !== ToastType.hidden ? "auto" : "none"}
        style={[
          styles.container,
          { opacity: type === ToastType.hidden ? 0 : 1 }
        ]}
      >
        <BaseButton
          enabled={type !== ToastType.hidden}
          shouldActivateOnStart
          disallowInterruption
          onPress={this.hide}
        >
          <Transitioning.View
            transition={
              <Transition.Sequence>
                <Transition.Together>
                  <Transition.In
                    type="slide-top"
                    delayMs={0}
                    durationMs={300}
                  />
                  <Transition.In type="fade" delayMs={0} durationMs={300} />
                </Transition.Together>

                <Transition.Change
                  interpolation="linear"
                  delayMs={0}
                  durationMs={200}
                />

                <Transition.Together>
                  <Transition.Out type="fade" delayMs={0} durationMs={300} />
                  <Transition.Out
                    type="slide-bottom"
                    delayMs={0}
                    durationMs={300}
                  />
                </Transition.Together>
              </Transition.Sequence>
            }
            ref={this.transitioner}
            style={styles.transitioner}
          >
            {type !== ToastType.hidden && (
              <Animated.View
                style={[
                  styles.toast,
                  {
                    [ToastType.success]: styles.successToast,
                    [ToastType.error]: styles.errorToast
                  }[type]
                ]}
                key={`${this.state.type}-${this.state.message}`}
              >
                <View style={styles.iconContainer}>
                  <IconComponent size={24} color="white" />
                </View>
                <SemiBoldText style={styles.text}>{message}</SemiBoldText>
              </Animated.View>
            )}
          </Transitioning.View>
        </BaseButton>
      </View>
    );
  }
}
