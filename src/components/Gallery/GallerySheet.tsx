import BottomSheet from "reanimated-bottom-sheet";
import { View, StyleSheet, InteractionManager, Keyboard } from "react-native";
import * as React from "react";

import GalleryTabView from "./GalleryTabView";
import Animated, {
  Transitioning,
  Transition,
  TransitioningView,
  Easing
} from "react-native-reanimated";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import { SPACING } from "../../lib/styles";
import { BaseButton } from "react-native-gesture-handler";
import { throttle } from "lodash";
import { sheetOpacity } from "../../lib/animations";
import { getSelectedIDs } from "../../screens/ImagePickerPage";
import { LIST_HEADER_HEIGHT } from "../NewPost/ImagePicker/FilterBar";
import { MediaPlayerPauser } from "../MediaPlayer";
import { YeetImageContainer } from "../../lib/imageSearch";
import Storage from "../../lib/Storage";
import { BlurView } from "../BlurView";
import { BackHandler } from "react-native";

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
    const handle = InteractionManager.createInteractionHandle();
    Keyboard.dismiss();
    Animated.timing(this.dismissY, {
      toValue: 0,
      duration: 500,
      easing: Easing.elastic(0.8)
    }).start(() => {
      this.isDismissingValue.setValue(0);

      this.setState({ show: false }, () => {
        this.scrollY.setValue(0);
        InteractionManager.clearInteractionHandle(handle);
      });
    });
  };

  handleShow = () => {
    const handle = InteractionManager.createInteractionHandle();

    this.scrollY.setValue(0);
    this.setState({ show: true }, () => {
      Animated.timing(this.dismissY, {
        toValue: SCREEN_DIMENSIONS.height * -1,
        duration: 500,
        easing: Easing.elastic(0.8)
      }).start(() => {
        this.isDismissingValue.setValue(0);
        InteractionManager.clearInteractionHandle(handle);
      });
    });
  };

  componentDidUpdate(prevProps) {
    if (this.props.show !== prevProps.show) {
      if (!this.props.show) {
        this.handleDismiss();
      } else if (this.props.show) {
        this.handleShow();
      }
    }
  }

  dismissY = new Animated.Value(0);
  isDismissingValue = new Animated.Value(0);
  static TOP_OFFSET = 100;
  static CONTENT_INSET = 1;
  scrollY = new Animated.Value(0);
  insetValue = new Animated.Value(GallerySheet.CONTENT_INSET);

  dismissThreshold = Animated.multiply(Animated.add(this.insetValue, 30), -1);

  translateY = Animated.interpolate(this.scrollY, {
    inputRange: [
      Animated.multiply(
        -1,
        Animated.add(GallerySheet.TOP_OFFSET, this.insetValue)
      ),
      0
    ],
    outputRange: [
      Animated.add(GallerySheet.TOP_OFFSET, this.insetValue),
      TOP_Y
    ],
    extrapolate: Animated.Extrapolate.CLAMP
  });

  handlePress = (photo: YeetImageContainer) => {
    this.props.onPress(photo);

    window.requestIdleCallback(() => {
      Storage.insertRecentlyUsed(photo);
    });
  };

  blurWrapperStyles = [
    styles.blurWrapper,
    {
      height: SCREEN_DIMENSIONS.height,
      width: SCREEN_DIMENSIONS.width
    },
    {
      transform: [
        {
          translateY: this.translateY
        }
      ]
    }
  ];

  midTransitionStyles = {
    opacity: Animated.cond(Animated.eq(this.dismissY, 0), 0, 1),
    transform: [
      {
        translateY: SCREEN_DIMENSIONS.height
      },
      {
        translateY: this.dismissY
      },
      {
        translateY: this.translateY
      }
    ]
  };

  transitionStyles = [styles.transition, this.midTransitionStyles];

  disabledTransitionStyles = [
    styles.transition,
    this.midTransitionStyles,
    { display: "none" }
  ];

  height =
    SCREEN_DIMENSIONS.height -
    GallerySheet.TOP_OFFSET -
    GallerySheet.CONTENT_INSET +
    TOP_Y;

  blurStyle = {
    height: this.height
  };

  galleryTabView = React.createRef<View>();

  sheetStyles = [
    styles.sheet,
    {
      opacity: sheetOpacity(
        this.dismissY,
        this.scrollY,
        SCREEN_DIMENSIONS.height,
        GallerySheet.TOP_OFFSET
      )
    }
  ];
  render() {
    const { onDismiss, isKeyboardVisible } = this.props;

    const { show } = this.state;
    const { height } = this;

    return (
      <>
        <Animated.View
          pointerEvents={show ? "auto" : "none"}
          style={this.transitionStyles}
        >
          <BaseButton enabled={show} onPress={onDismiss}>
            <Animated.View style={this.sheetStyles} />
          </BaseButton>
        </Animated.View>

        <Animated.Code
          exec={Animated.block([
            Animated.onChange(
              this.scrollY,
              Animated.cond(
                Animated.and(
                  Animated.lessThan(this.scrollY, this.dismissThreshold),
                  Animated.eq(this.isDismissingValue, 0)
                ),
                Animated.block([
                  Animated.set(this.isDismissingValue, 1),
                  Animated.call([], this.props.onDismiss)
                ])
              )
            )
          ])}
        />

        <Animated.View
          pointerEvents={show ? "auto" : "none"}
          style={this.transitionStyles}
        >
          <Animated.View style={this.blurWrapperStyles}>
            <MediaPlayerPauser isHidden={!this.props.show}>
              <BlurView
                blurType="dark"
                blurAmount={25}
                viewRef={this.galleryTabView}
                style={this.blurStyle}
              >
                <GalleryTabView
                  width={SCREEN_DIMENSIONS.width}
                  height={height}
                  inset={GallerySheet.CONTENT_INSET}
                  bottomInset={GallerySheet.TOP_OFFSET}
                  insetValue={this.insetValue}
                  autoFocusSearch={this.props.autoFocus}
                  transparentSearch={this.props.transparentSearch}
                  onPress={this.handlePress}
                  isModal
                  ref={this.galleryTabView}
                  keyboardVisibleValue={this.props.keyboardVisibleValue}
                  selectedIDs={getSelectedIDs(this.state.selectedImages)}
                  initialRoute={this.props.initialRoute}
                  show={this.props.show}
                  scrollY={this.scrollY}
                />
              </BlurView>
            </MediaPlayerPauser>
          </Animated.View>
        </Animated.View>
      </>
    );
  }
}
