import * as React from "react";
import {
  requireNativeComponent,
  NativeSyntheticEvent,
  findNodeHandle,
  View,
  StyleSheet,
  ScrollView as ScrollViewType
} from "react-native";
import FastList from "../FastList";
import {
  presentPanSheetView,
  PanSheetViewSize,
  transitionPanSheetView
} from "../../lib/Yeet";
const ScrollView = require("react-native/Libraries/Components/ScrollView/ScrollView");
// const AppContainer = require("react-native/AppContainer");

type Props = {
  screenOffset: number;
  screenMinY: number;
  panScrollTag: number | null;
  longHeight: number;

  shortHeight: number;

  onDismiss: (event: NativeSyntheticEvent<any>) => void;
  onWillDismiss: (event: NativeSyntheticEvent<any>) => void;
};
const NativePanSheetView = requireNativeComponent(
  "PanView"
) as React.ComponentType<Props>;

type PanSheetContextValue = {
  setActiveScrollView: (ref) => void;
  setSize: (size: PanSheetViewSize) => void;
  panScrollTag: number | null;
};
export const PanSheetContext = React.createContext<PanSheetContextValue>({
  setActiveScrollView: ref => null,
  setSize: (size: PanSheetViewSize) => null,
  panScrollTag: 0
});

export class PanSheetView extends React.Component<
  Props,
  { panSheetValue: PanSheetContextValue }
> {
  setActiveScrollView = ref => {
    if (ref === null) {
      this.setState({
        panSheetValue: {
          ...this.state.panSheetValue,
          panScrollTag: null
        }
      });
    } else if (ref?.current instanceof FastList) {
      this.setActiveScrollView(ref.current.getScrollView());
    } else if (typeof ref?.current?.getNode === "function") {
      this.setActiveScrollView(ref.current.getNode());
    } else if (typeof ref?.current !== "undefined") {
      console.log(
        "GOT",
        (ref.current as ScrollViewType)?.scrollResponderGetScrollableNode()
      );
      this.setState({
        panSheetValue: {
          ...this.state.panSheetValue,
          panScrollTag: (ref.current as ScrollViewType)?.scrollResponderGetScrollableNode()
        }
      });
    } else if ((ref as ScrollViewType)?.scrollResponderGetScrollableNode()) {
      console.log(
        "GOT IT!",
        (ref as ScrollViewType)?.scrollResponderGetScrollableNode()
      );
      this.setState({
        panSheetValue: {
          ...this.state.panSheetValue,
          panScrollTag: (ref as ScrollViewType)?.scrollResponderGetScrollableNode()
        }
      });
    } else {
      this.setState({
        panSheetValue: {
          ...this.state.panSheetValue,

          panScrollTag: null
        }
      });
    }
  };

  static defaultProps = {
    defaultPresentationState: PanSheetViewSize.short
  };

  constructor(props) {
    super(props);

    this.state = {
      panSheetValue: {
        setActiveScrollView: this.setActiveScrollView,
        panScrollTag: null,
        setSize: this.setSize
      }
    };
  }

  containerRef = React.createRef();
  containerTag: number;
  nativePanSheetView = React.createRef<View>();

  _shouldSetResponder = () => false;

  componentDidMount() {}

  setSize = (size: PanSheetViewSize) => {
    transitionPanSheetView(
      findNodeHandle(this.nativePanSheetView.current),
      size
    );
  };

  render() {
    return (
      <NativePanSheetView
        screenOffset={this.props.screenOffset}
        screenMinY={this.props.screenMinY}
        ref={this.nativePanSheetView}
        longHeight={this.props.longHeight}
        shortHeight={this.props.shortHeight}
        onStartShouldSetResponder={this._shouldSetResponder}
        defaultPresentationState={this.props.defaultPresentationState}
        onDismiss={this.props.onDismiss}
        style={styles.modal}
        onWillDismiss={this.props.onWillDismiss}
        panScrollTag={this.state.panSheetValue.panScrollTag}
      >
        <PanSheetContext.Provider value={this.state.panSheetValue}>
          <ScrollView.Context.Provider value={null}>
            <View style={styles.container}>{this.props.children}</View>
          </ScrollView.Context.Provider>
        </PanSheetContext.Provider>
      </NativePanSheetView>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    position: "absolute"
  },
  container: {
    /* $FlowFixMe(>=0.111.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.111 was deployed. To see the error, delete this
     * comment and run Flow. */
    left: 0,
    top: 0,
    overflow: "visible",
    width: "100%",
    height: "100%"
  }
});
