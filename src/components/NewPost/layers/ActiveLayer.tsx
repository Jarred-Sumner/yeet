import * as React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { EditorFooter, EditorHeader } from "../EditorFooter";
import { DeleteFooter } from "../DeleteFooter";
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
        {header}
        {footer}
      </>
    );
  }
}

const Toolbar = ({
  type,
  onPress,
  onBack,
  opacity,
  exampleCount,
  hasExamples,
  onPressExample
}) => {
  if (type === ToolbarType.default || type === ToolbarType.text) {
    return (
      <DefaultToolbar
        exampleCount={exampleCount}
        hasExamples={hasExamples}
        onPressExample={onPressExample}
        onPress={onPress}
        onBack={onBack}
        type={type}
      />
    );
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
  layout,
  onChangeLayout,
  toolbar,
  panY
}) => {
  if (type === ToolbarType.default || type === ToolbarType.text) {
    return (
      <>
        {type !== ToolbarType.panning && (
          <EditorFooter
            onPressDownload={onPressDownload}
            waitFor={waitFor}
            panX={panX}
            panY={panY}
            toolbar={toolbar}
            hasExamples={hasExamples}
            layout={layout}
            onChangeLayout={onChangeLayout}
            exampleIndex={exampleIndex}
            exampleCount={exampleCount}
            onPressExample={onPressExample}
            onPressSend={onSend}
          />
        )}
      </>
    );
  } else if (type === ToolbarType.panning) {
    return <DeleteFooter opacity={1} />;
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
  onChangeLayout,
  onBack,
  keyboardVisibleOpacity,
  layout,
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
          onSend={onSend}
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
          onSend={onSend}
          onChangeLayout={onChangeLayout}
          layout={layout}
          toolbar={
            <Toolbar
              type={toolbarType}
              opacity={controlsOpacity}
              key={`toolbar-${toolbarType}`}
              isModal={isPageModal}
              panX={panX}
              hasExamples={exampleCount > 0}
              exampleCount={exampleCount}
              exampleIndex={exampleIndex}
              onPressExample={onPressExample}
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
