import * as React from "react";
import { BackHandler, Modal, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS } from "../../../config";
import { YeetImageContainer } from "../../lib/imageSearch";
import Storage from "../../lib/Storage";
import { getSelectedIDs } from "../../screens/ImagePickerPage";
import { BlurView } from "../BlurView";
import { MediaPlayerPauser } from "../MediaPlayer";
import GalleryTabView, { SHEET_ROUTES_LIST } from "./GalleryTabView";

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "black",
    height: SCREEN_DIMENSIONS.height,
    width: SCREEN_DIMENSIONS.width
  },
  blurWrapper: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden"
  },

  transition: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999
  },
  sheetTransition: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998
  }
});

export class GallerySheet extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      selectedImages: []
    };
  }

  componentDidMount() {
    BackHandler.addEventListener(
      "hardwareBackPress",
      this.handleBackButtonPressAndroid
    );
  }

  handleBackButtonPressAndroid = () => {
    if (this.state.show && this.props.show) {
      this.props.onDismiss();
      return true;
    } else {
      return false;
    }
  };

  componentWillUnmount() {
    BackHandler.removeEventListener(
      "hardwareBackPress",
      this.handleBackButtonPressAndroid
    );
  }

  handleDismiss = () => {
    this.setState({ show: false });
  };

  handleShow = () => {
    this.setState({ show: true });
  };

  showHandle: number | null = null;
  hideHandle: number | null = null;

  componentDidUpdate(prevProps) {
    if (this.props.show !== prevProps.show) {
      if (!this.props.show) {
        this.handleDismiss();
      } else if (this.props.show) {
        this.handleShow();
      }
    }
  }

  static CONTENT_INSET = 0;
  scrollY = new Animated.Value(0);
  insetValue = new Animated.Value(0);

  handlePress = (photo: YeetImageContainer) => {
    let _photo = photo;
    this.props.onPress(_photo);

    this.handleDismiss();

    window.requestIdleCallback(() => {
      Storage.insertRecentlyUsed(_photo, null);
      _photo = null;
    });
  };

  transitionStyles = [styles.transition];

  disabledTransitionStyles = [styles.transition];

  height = SCREEN_DIMENSIONS.height;

  blurStyle = {
    height: SCREEN_DIMENSIONS.height,
    width: SCREEN_DIMENSIONS.width
  };

  galleryTabView = React.createRef<View>();

  render() {
    const { onDismiss, isKeyboardVisible } = this.props;

    const { height } = this;

    return (
      <BlurView
        blurType="dark"
        blurAmount={25}
        viewRef={this.galleryTabView}
        style={this.blurStyle}
      >
        <Modal
          visible={this.props.show}
          presentationStyle="overFullScreen"
          animated
          transparent
          onDismiss={this.props.onDismiss}
          onRequestClose={this.handleDismiss}
          animationType="slide"
        >
          <MediaPlayerPauser isHidden={!this.props.show}>
            <View style={{ width: "100%", height: "100%" }}>
              <GalleryTabView
                width={SCREEN_DIMENSIONS.width}
                height={height}
                routes={SHEET_ROUTES_LIST}
                inset={GallerySheet.CONTENT_INSET}
                bottomInset={0}
                insetValue={this.insetValue}
                autoFocusSearch={this.props.autoFocus}
                transparentSearch={this.props.transparentSearch}
                onPress={this.handlePress}
                isModal
                ref={this.galleryTabView}
                keyboardVisibleValue={this.props.keyboardVisibleValue}
                selectedIDs={getSelectedIDs(this.state.selectedImages)}
                initialRoute={this.props.initialRoute}
                show
                scrollY={this.scrollY}
              />
            </View>
          </MediaPlayerPauser>
        </Modal>
      </BlurView>
    );
  }
}
