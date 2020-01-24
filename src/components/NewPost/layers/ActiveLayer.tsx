import * as React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { DeleteFooter, EditorFooter, EditorHeader } from "../EditorFooter";
import DefaultToolbar, { ToolbarType } from "../Toolbar";

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
  header: {
    position: "absolute",
    top: 0,
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
  headerContainer = React.createRef();
  childrenContainer = React.createRef();

  componentDidUpdate(prevProps: Props) {
    if (prevProps.toolbarType !== this.props.toolbarType) {
      // this.footerContainer.current.animateNextTransition();
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
      header,
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
            <View style={styles.header}>{header}</View>

            <View style={styles.footer}>{footer}</View>
          </View>
        </View>
      </>
    );
  }
}

const Toolbar = ({ type, onPress, onBack, opacity }) => {
  if (type === ToolbarType.default || type === ToolbarType.text) {
    return <DefaultToolbar onPress={onPress} onBack={onBack} type={type} />;
  } else if (type === ToolbarType.panning) {
    return <Animated.View pointerEvents="none" />;
  } else {
    return null;
  }
};

const Footer = ({
  type,
  onPressDownload,
  onSend,
  onDelete,
  opacity,
  hasExamples,
  exampleCount,
  onPressExample,
  currentScale,
  exampleIndex,
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
        hasExamples={hasExamples}
        exampleIndex={exampleIndex}
        exampleCount={exampleCount}
        onPressExample={onPressExample}
        onPressSend={onSend}
      />
    );
  } else if (type === ToolbarType.panning) {
    return (
      <DeleteFooter
        panX={panX}
        currentScale={currentScale}
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
  onChangeBorderType,
  onChangeOverrides,
  onSend,
  inputRef,
  relativeHeight,
  onPressExample,
  isPageModal,
  focusedBlock,
  onDelete,
  activeButton,
  exampleCount = 0,
  exampleIndex = -1,
  focusType,
  currentScale,
  onBack,
  keyboardVisibleOpacity,
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
      header={
        <EditorHeader
          type={toolbarType}
          opacity={keyboardVisibleOpacity}
          key={`toolbar-${toolbarType}`}
          inputRef={inputRef}
          focusType={focusType}
          focusedBlock={focusedBlock}
          onChangeOverrides={onChangeOverrides}
          onChangeBorderType={onChangeBorderType}
          height={relativeHeight}
          isModal={isPageModal}
          panX={panX}
          panY={panY}
          onPress={onPressToolbarButton}
          onBack={onBack}
        />
      }
      footer={
        <Footer
          type={toolbarType}
          opacity={controlsOpacity}
          onDelete={onDelete}
          currentScale={currentScale}
          panX={panX}
          panY={panY}
          hasExamples={exampleCount > 0}
          exampleCount={exampleCount}
          exampleIndex={exampleIndex}
          onPressExample={onPressExample}
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
