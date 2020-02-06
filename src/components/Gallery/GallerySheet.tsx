import chroma from "chroma-js";
import { cloneDeep } from "lodash";
import * as React from "react";
import {
  BackHandler,
  LayoutAnimation,
  Modal,
  StatusBar,
  StyleSheet,
  View
} from "react-native";
import {
  Directions,
  FlingGestureHandler,
  FlingGestureHandlerStateChangeEvent,
  State
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS, TOP_Y as _TOP_Y } from "../../../config";
import { YeetImageContainer } from "../../lib/imageSearch";
import Storage from "../../lib/Storage";
import { COLORS } from "../../lib/styles";
import { getSelectedIDs } from "../../screens/ImagePickerPage";
import { BlurView } from "../BlurView";
import FilterBar from "../NewPost/ImagePicker/FilterBar";
import {
  FILTERS,
  GallerySectionItem
} from "../NewPost/ImagePicker/GallerySectionItem";
import { CAROUSEL_HEIGHT } from "../NewPost/NewPostFormat";
import { GallerySheetHeader } from "./GallerySheet/Header";
import GalleryTabView, { ROUTE_LIST } from "./GalleryTabView";

const TOP_Y = _TOP_Y + 1;
const FOCUSED_HEIGHT = SCREEN_DIMENSIONS.height - TOP_Y;
const DEFAULT_HEIGHT = SCREEN_DIMENSIONS.height - TOP_Y;
const BORDER_RADIUS = 20;
const styles = StyleSheet.create({
  blurWrapper: {
    flex: 1,
    width: SCREEN_DIMENSIONS.width,
    paddingTop: 0,
    borderRadius: BORDER_RADIUS,

    overflow: "visible",
    backgroundColor: chroma
      .blend(chroma(COLORS.primaryDark).alpha(0.75), "#222", "dodge")
      .alpha(0.25)
      .css()
  },
  filterContainer: {
    paddingHorizontal: BORDER_RADIUS,
    position: "relative"
  },
  content: {
    marginTop: 0,
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",

    backgroundColor: chroma(COLORS.primaryDark)
      .alpha(0.25)
      .css()
  },
  focusedContent: {
    marginTop: 0,
    borderRadius: 0,
    overflow: "visible",

    backgroundColor: chroma(COLORS.primaryDark)
      .alpha(0.25)
      .css()
  },
  header: {
    position: "relative",
    height: 107,
    zIndex: 9999,
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
    overflow: "visible"
  },
  focusedHeader: {
    position: "relative",
    zIndex: 9999,
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
    overflow: "hidden",
    backgroundColor: chroma(COLORS.primaryDark).css()
  },
  focusedBlurWrapper: {
    flex: 1,
    width: SCREEN_DIMENSIONS.width,
    paddingTop: 0,
    borderRadius: BORDER_RADIUS,

    overflow: "visible",
    backgroundColor: chroma
      .blend(chroma(COLORS.primaryDark).alpha(0.75), "#222", "dodge")
      .alpha(0.25)
      .css()
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
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
    backgroundColor: chroma(COLORS.primaryDark)
      .alpha(0.75)
      .css()
  },
  modal: {
    width: SCREEN_DIMENSIONS.width,
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,

    position: "relative",
    overflow: "hidden",
    height: DEFAULT_HEIGHT
  },
  modalShadow: {
    paddingTop: TOP_Y,
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

const SHEET_ROUTE_KEYS = [
  GallerySectionItem.all,
  GallerySectionItem.recent,
  GallerySectionItem.cameraRoll,
  GallerySectionItem.sticker,
  GallerySectionItem.gifs
];

export const SHEET_ROUTES_LIST = FILTERS.filter(({ value }) =>
  SHEET_ROUTE_KEYS.includes(value)
).map(filter => {
  return {
    key: filter.value || "all",
    title: filter.label
  };
});

export class GallerySheet extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isInputFocused: false,
      selectedImages: [],
      filter: "all",
      navigationState: {
        index: Math.max(
          SHEET_ROUTES_LIST.findIndex(({ key }) => key === props.initialRoute),
          0
        ),
        routes: cloneDeep(SHEET_ROUTES_LIST)
      }
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

  handleChangeNavigationState = navigationState =>
    this.setState({ navigationState });
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

  handleChangeFilter = filter =>
    this.setState({
      navigationState: {
        routes: this.state.navigationState.routes,
        index: this.state.navigationState.routes.findIndex(
          route => route.key === filter
        )
      }
    });

  position = new Animated.Value(0);

  render() {
    const { onDismiss, isKeyboardVisible, keyboardHeight } = this.props;

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
                {this.props.show && (
                  <StatusBar
                    animated
                    showHideTransition="slide"
                    hidden={isInputFocused}
                  />
                )}
                <View
                  style={isInputFocused ? styles.focusedModal : styles.modal}
                >
                  <BlurView
                    blurType="dark"
                    blurAmount={5}
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
                      <View
                        style={
                          this.state.isInputFocused
                            ? styles.focusedHeader
                            : styles.header
                        }
                      >
                        <GallerySheetHeader
                          isInputFocused={this.state.isInputFocused}
                          onChangeInputFocus={this.onChangeInputFocus}
                          onPressClose={this.props.onDismiss}
                          autoFocusSearch={this.props.autoFocus}
                        />

                        <View style={styles.filterContainer}>
                          <FilterBar
                            tabs={SHEET_ROUTE_KEYS}
                            position={this.position}
                            icons
                            light
                            containerWidth={
                              SCREEN_DIMENSIONS.width - BORDER_RADIUS * 2
                            }
                            hidden={this.state.isInputFocused}
                            tabBarPosition="top"
                            inset={0}
                            rightInset={0}
                            indicatorWidth={BORDER_RADIUS * 2}
                            value={
                              this.state.navigationState.routes[
                                this.state.navigationState.index
                              ].key
                            }
                            onChange={this.handleChangeFilter}
                          />
                        </View>
                      </View>

                      <View
                        style={
                          isInputFocused
                            ? styles.focusedContent
                            : styles.content
                        }
                      >
                        <GalleryTabView
                          width={SCREEN_DIMENSIONS.width}
                          navigationState={this.state.navigationState}
                          isFocused={this.props.show}
                          onChangeNavigationState={
                            this.handleChangeNavigationState
                          }
                          isKeyboardVisible={isInputFocused}
                          height={
                            isInputFocused
                              ? FOCUSED_HEIGHT - keyboardHeight
                              : DEFAULT_HEIGHT - 107
                          }
                          keyboardVisibleValue={this.keyboardVisibleValue}
                          onPress={this.handlePress}
                          show={this.props.show}
                          position={this.position}
                          renderTabBar={null}
                          inset={0}
                          isModal
                          offset={0}
                          routes={SHEET_ROUTES_LIST}
                          selectedIDs={getSelectedIDs(
                            this.state.selectedImages
                          )}
                          tabBarPosition="top"
                          showHeader
                          light
                          isModal
                          scrollY={this.scrollY}
                          initialRoute={"all"}
                        />
                      </View>
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
                  top: _TOP_Y + 6,
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
