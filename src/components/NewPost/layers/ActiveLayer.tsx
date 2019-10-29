import * as React from "react";
import { View, StyleSheet, Keyboard, KeyboardAvoidingView } from "react-native";
import { Transition, Transitioning } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { TapGestureHandler } from "react-native-gesture-handler";
import DefaultToolbar, {
  ToolbarType,
  TextToolbarButton,
  ToolbarButton
} from "../Toolbar";
import { EditorFooter, DeleteFooter } from "../EditorFooter";

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "visible",
    flex: 1
  },
  toolbar: {
    position: "absolute",
    right: 0,
    left: 0,
    overflow: "visible",
    top: 0
  },
  footer: {
    position: "absolute",
    bottom: 0,
    overflow: "visible",
    left: 0,
    right: 0,
    zIndex: 10
  },
  layer: {
    position: "absolute",
    top: 0,
    overflow: "visible",
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

class ActiveLayerComponent extends React.Component<Props> {
  toolbarContainer = React.createRef();
  footerContainer = React.createRef();
  childrenContainer = React.createRef();

  componentDidUpdate(prevProps: Props) {
    if (prevProps.toolbarType !== this.props.toolbarType) {
      this.footerContainer.current.animateNextTransition();
    }
  }

  onLayoutFooter = ({
    nativeEvent: {
      layout: { x, y, width, height }
    }
  }) => {
    this.props.onChangeFooterHeight && this.props.onChangeFooterHeight(height);
  };

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
              ref={this.footerContainer}
              pointerEvents="box-none"
              onLayout={this.onLayoutFooter}
              transition={
                <Transition.Sequence>
                  <Transition.Out type="fade" delayMs={0} durationMs={100} />
                  <Transition.In
                    type="fade"
                    durationMs={100}
                    delayMs={0}
                    interpolation="easeIn"
                  />
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

const Toolbar = ({ type, onPress, onBack, opacity }) => {
  if (type === ToolbarType.default) {
    return <DefaultToolbar onPress={onPress} onBack={onBack} type={type} />;
  } else if (type === ToolbarType.text) {
    return (
      <DefaultToolbar onPress={onPress} onBack={onBack} type={type}>
        <TextToolbarButton isActive onPress={onPress} />
      </DefaultToolbar>
    );
  } else if (type === ToolbarType.panning) {
    return <Animated.View pointerEvents="none" />;
  }
};

const Footer = ({
  type,
  onPressDownload,
  onSend,
  onDelete,
  opacity,
  waitFor,
  panX,
  toolbar,
  panY
}) => {
  if (type === ToolbarType.default || type === ToolbarType.text) {
    return (
      <EditorFooter
        onPressDownload={onPressDownload}
        waitFor={waitFor}
        panX={panX}
        panY={panY}
        toolbar={toolbar}
        onPressSend={onSend}
      />
    );
  } else if (type === ToolbarType.panning) {
    return (
      <DeleteFooter
        panX={panX}
        panY={panY}
        onDelete={onDelete}
        waitFor={waitFor}
      />
    );
  } else {
    return <Animated.View />;
  }
};

export const ActiveLayer = ({
  toolbarType,
  onPressToolbarButton,
  controlsOpacity,
  onPressDownload,
  onSend,
  isPageModal,
  onDelete,
  activeButton,
  focusType,
  onBack,
  panX,
  panY,
  ...otherProps
}) => {
  return (
    <ActiveLayerComponent
      {...otherProps}
      toolbarType={toolbarType}
      controlsOpacity={controlsOpacity}
      focusType={focusType}
      footer={
        <Footer
          type={toolbarType}
          opacity={controlsOpacity}
          onDelete={onDelete}
          panX={panX}
          panY={panY}
          onSend={onSend}
          toolbar={
            <Toolbar
              type={toolbarType}
              opacity={controlsOpacity}
              key={`toolbar-${toolbarType}`}
              isModal={isPageModal}
              panX={panX}
              panY={panY}
              onPress={onPressToolbarButton}
              onBack={onBack}
            />
          }
          key={`footer-${
            [ToolbarType.default, ToolbarType.text].includes(toolbarType)
              ? ToolbarType.default
              : toolbarType
          }`}
          onPressDownload={onPressDownload}
        />
      }
    />
  );
};
