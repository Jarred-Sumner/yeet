import * as React from "react";
import { View, StyleSheet, Keyboard, KeyboardAvoidingView } from "react-native";
import { Transition, Transitioning } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { TapGestureHandler } from "react-native-gesture-handler";

const styles = StyleSheet.create({
  container: {
    position: "relative",
    flex: 1
  },
  toolbar: {
    position: "absolute",
    right: 0,
    left: 0,
    top: 0
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10
  },
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 3
  },
  children: {}
});

type Props = {
  toolbar: React.ReactElement;
  footer: React.ReactElement;
  children: React.ReactChildren;
  isFocused: boolean;
};

export class ActiveLayer extends React.Component<Props> {
  toolbarContainer = React.createRef();
  footerContainer = React.createRef();
  childrenContainer = React.createRef();

  componentDidUpdate(prevProps: Props) {
    if (prevProps.isFocused !== this.props.isFocused) {
      this.toolbarContainer.current.animateNextTransition();
      this.footerContainer.current.animateNextTransition();
      this.childrenContainer.current.animateNextTransition();
    }
  }

  render() {
    const {
      children,
      toolbar,
      footer,
      width,
      height,
      controlsOpacity,
      waitFor,
      toggleActive,
      isTappingEnabled
    } = this.props;

    return (
      <>
        <View
          pointerEvents="box-none"
          style={[styles.layer, { width, height }]}
        >
          <View pointerEvents="box-none" style={styles.container}>
            <Transitioning.View
              ref={this.childrenContainer}
              pointerEvents="box-none"
              transition={
                <Transition.Sequence>
                  <Transition.Out
                    type="fade"
                    durationMs={400}
                    interpolation="easeIn"
                  />
                  <Transition.Change />
                  <Transition.In type="fade" durationMs={200} delayMs={200} />
                </Transition.Sequence>
              }
              style={[styles.children, { width, height }]}
            >
              {children}
            </Transitioning.View>

            <Transitioning.View
              ref={this.toolbarContainer}
              transition={
                <Transition.Sequence>
                  <Transition.In
                    type="fade"
                    durationMs={400}
                    interpolation="easeIn"
                  />
                  <Transition.Change />
                  <Transition.Together>
                    <Transition.Out
                      type="slide-bottom"
                      durationMs={400}
                      interpolation="easeOut"
                      propagation="bottom"
                    />
                    <Transition.Out
                      type="fade"
                      durationMs={200}
                      delayMs={200}
                    />
                  </Transition.Together>
                </Transition.Sequence>
              }
              style={[styles.toolbar]}
            >
              {toolbar}
            </Transitioning.View>

            <Transitioning.View
              ref={this.footerContainer}
              transition={
                <Transition.Sequence>
                  <Transition.Out
                    type="fade"
                    durationMs={400}
                    interpolation="easeIn"
                  />
                  <Transition.Change />
                  <Transition.Together>
                    <Transition.Out
                      type="slide-bottom"
                      durationMs={400}
                      interpolation="easeOut"
                      propagation="bottom"
                    />
                    <Transition.Out
                      type="fade"
                      durationMs={200}
                      delayMs={200}
                    />
                  </Transition.Together>
                </Transition.Sequence>
              }
              style={styles.footer}
            >
              {footer}
            </Transitioning.View>
          </View>
        </View>
      </>
    );
  }
}

export default ActiveLayer;
