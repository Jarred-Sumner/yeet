import * as React from "react";
import {
  BackHandler,
  Modal,
  StyleSheet,
  View,
  StatusBar,
  LayoutAnimation
} from "react-native";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS, TOP_Y as _TOP_Y } from "../../../config";
import { YeetImageContainer } from "../../lib/imageSearch";
import Storage from "../../lib/Storage";
import { getSelectedIDs } from "../../screens/ImagePickerPage";
import { BlurView } from "../BlurView";
import { MediaPlayerPauser } from "../MediaPlayer";
import GalleryTabView, { SHEET_ROUTES_LIST } from "./GalleryTabView";
import { GallerySheetHeader } from "./GallerySheet/Header";
import { COLORS } from "../../lib/styles";
import chroma from "chroma-js";
import { CAROUSEL_HEIGHT } from "../NewPost/NewPostFormat";
import {
  FlingGestureHandler,
  Directions,
  FlingGestureHandlerEventExtra,
  FlingGestureHandlerStateChangeEvent,
  State
} from "react-native-gesture-handler";
import { GallerySectionList } from "./GallerySectionList";
import FilterBar, {
  GallerySectionItem
} from "../NewPost/ImagePicker/FilterBar";

const TOP_Y = _TOP_Y + 1;
const FOCUSED_HEIGHT = SCREEN_DIMENSIONS.height - CAROUSEL_HEIGHT;
const DEFAULT_HEIGHT = SCREEN_DIMENSIONS.height - TOP_Y;
const styles = StyleSheet.create({
  blurWrapper: {
    flex: 1,
    width: SCREEN_DIMENSIONS.width,
    paddingTop: 8
  },
  focusedBlurWrapper: {
    flex: 1,
    width: SCREEN_DIMENSIONS.width,
    paddingTop: 0
  },

  backdrop: {
    backgroundColor: "black",
    position: "absolute",
    top: 0,
    opacity: 0.5,
    bottom: 0,
    overflow: "hidden",
    left: 0,
    right: 0,
    zIndex: 99999,
    height: SCREEN_DIMENSIONS.height,
    width: SCREEN_DIMENSIONS.width
  },
  hint: {
    position: "absolute",
    width: 80,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 100,
    left: (SCREEN_DIMENSIONS.width - 100) / 2,
    overflow: "hidden",
    alignSelf: "center",
    zIndex: 9999
  },

  focusedModal: {
    height: FOCUSED_HEIGHT,
    width: SCREEN_DIMENSIONS.width,
    overflow: "hidden",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: chroma(COLORS.primaryDark)
      .alpha(0.75)
      .css()
  },
  modal: {
    width: SCREEN_DIMENSIONS.width,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,

    position: "relative",
    overflow: "hidden",
    height: DEFAULT_HEIGHT,
    backgroundColor: chroma(COLORS.primaryDark)
      .alpha(0.75)
      .css()
  },
  modalShadow: {
    paddingTop: CAROUSEL_HEIGHT,
    height: FOCUSED_HEIGHT,
    width: SCREEN_DIMENSIONS.width,
    overflow: "visible",
    shadowOffset: {
      width: 1,
      height: 1
    },
    shadowRadius: 2,
    shadowColor: "black",
    shadowOpacity: 0
  },
  focusedModalShadow: {
    paddingTop: TOP_Y,
    height: FOCUSED_HEIGHT,
    overflow: "visible",
    width: SCREEN_DIMENSIONS.width,
    shadowOffset: {
      width: 1,
      height: 1
    },
    shadowRadius: 2,
    shadowColor: "black",
    shadowOpacity: 1
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
      isInputFocused: false,
      selectedImages: [],
      filter: "all"
    };
  }

  onChangeInputFocus = isInputFocused => this.setState({ isInputFocused });

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
      LayoutAnimation.configureNext({
        duration: 200,
        create: {
          ...LayoutAnimation.Presets.easeInEaseOut.create,
          property: "opacity"
        },
        delete: {
          ...LayoutAnimation.Presets.easeInEaseOut.delete,
          property: "opacity"
        }
      });

      // if (!this.props.show) {
      //   this.handleDismiss();
      // } else if (this.props.show) {
      //   this.handleShow();
      // }
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
    flex: 1,
    paddingTop: 0
  };

  handleFling = (event: FlingGestureHandlerStateChangeEvent) => {
    if (
      event.nativeEvent.state === State.END &&
      event.nativeEvent.oldState === State.ACTIVE
    ) {
      this.props.onDismiss();
    }
  };
  galleryTabView = React.createRef<View>();

  filterPosition = new Animated.Value(0);

  handleChangeFilter = filter => this.setState({ filter });

  render() {
    const { onDismiss, isKeyboardVisible } = this.props;

    const { height } = this;
    const { isInputFocused } = this.state;

    return (
      <>
        {this.props.show && (
          <View pointerEvents="none" style={styles.backdrop} />
        )}

        <Modal
          visible={this.props.show}
          presentationStyle="overFullScreen"
          transparent
          onDismiss={this.props.onDismiss}
          onRequestClose={this.handleDismiss}
          animationType="slide"
        >
          <>
            <FlingGestureHandler
              enabled={this.props.show}
              onHandlerStateChange={this.handleFling}
              onGestureEvent={this.handleFling}
              direction={Directions.DOWN}
            >
              <Animated.View
                style={
                  isInputFocused
                    ? styles.focusedModalShadow
                    : styles.modalShadow
                }
              >
                <View
                  style={isInputFocused ? styles.focusedModal : styles.modal}
                >
                  <BlurView
                    blurType="dark"
                    blurAmount={25}
                    viewRef={this.galleryTabView}
                    style={this.blurStyle}
                  >
                    <View
                      style={
                        isInputFocused
                          ? styles.focusedBlurWrapper
                          : styles.blurWrapper
                      }
                    >
                      <GallerySheetHeader
                        isInputFocused={this.state.isInputFocused}
                        onChangeInputFocus={this.onChangeInputFocus}
                        onPressClose={this.props.onDismiss}
                        autoFocusSearch={this.props.autoFocus}
                      />

                      <FilterBar
                        tabs={[
                          "all",
                          GallerySectionItem.cameraRoll,
                          GallerySectionItem.gifs
                        ]}
                        position={this.filterPosition}
                        icons
                        light
                        inset={0}
                        value={this.state.filter}
                        onChange={this.handleChangeFilter}
                      />

                      {this.props.show && (
                        <GallerySectionList
                          onPress={this.handlePress}
                          isModal
                          isFocused
                        />
                      )}
                    </View>
                  </BlurView>
                </View>
              </Animated.View>
            </FlingGestureHandler>
            <View
              pointerEvents="none"
              style={[
                styles.hint,
                {
                  top: !isInputFocused ? CAROUSEL_HEIGHT + 8 : _TOP_Y,
                  opacity: isInputFocused ? 0 : 0.5
                }
              ]}
            />
          </>
        </Modal>
      </>
    );
  }
}
