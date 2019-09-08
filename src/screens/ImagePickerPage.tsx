import * as React from "react";
import { Dimensions, InteractionManager, StyleSheet, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Animated, { Easing } from "react-native-reanimated";
import {
  SafeAreaView,
  withNavigationFocus,
  NavigationProp
} from "react-navigation";
import { SharedElement } from "react-navigation-shared-element";
import { IconButton } from "../components/Button";
import { IconClose } from "../components/Icon";
import {
  ImagePicker,
  ImagePickerRoute
} from "../components/NewPost/ImagePicker";
import { COLORS, SPACING } from "../lib/styles";
import { AnimatedKeyboardTracker } from "../components/AnimatedKeyboardTracker";

const SCREEN_DIMENSIONS = Dimensions.get("screen");

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: SPACING.normal,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.normal
  }
});

export class ImagePickerPage extends React.Component {
  static sharedElements = (navigation, otherNavigation, showing) => {
    // Transition element `item.${item.id}.photo` when either
    // showing or hiding this screen (coming from any route)
    const blockId = navigation.getParam("blockId");
    const shouldAnimate = navigation.getParam("shouldAnimate") || false;

    if (!shouldAnimate) {
      return [];
    }

    const id = `block.imagePicker.${blockId}`;

    return [
      {
        id,
        animation: showing ? "move" : "fade-out",
        resize: showing ? "stretch" : "clip",
        align: showing ? "bottom-left" : "top-left"
      }
    ];
  };
  static navigationOptions = ({ navigation }) => ({
    header: null,
    gestureEnabled: false,
    gestureDirection: "vertical",
    cardTransparent: false
  });
  state = { photo: null };
  controlsOpacityValue = new Animated.Value(0);

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      Animated.timing(this.controlsOpacityValue, {
        toValue: 1,
        duration: 500,
        easing: Easing.linear
      }).start();
    });
  }

  keyboardVisibleValue = new Animated.Value(0);
  pullToDismissValue = new Animated.Value(1);
  pullToDismissInterval = -1;
  keyboardHeightValue = new Animated.Value(0);
  contentStartOffsetY = new Animated.Value(0);

  handleScrollBeginDrag = Animated.event([
    {
      nativeEvent: {
        contentOffset: {
          y: this.contentStartOffsetY
        }
      }
    }
  ]);

  enablePullToDismiss = () => {
    if (this.pullToDismissInterval > -1) {
      window.clearTimeout(this.pullToDismissInterval);
      this.pullToDismissInterval = -1;
    }
    this.pullToDismissInterval = window.setTimeout(() => {
      this.pullToDismissValue.setValue(1);
      this.pullToDismissInterval = -1;
    }, 200);
  };
  disablePullToDismiss = () => {
    if (this.pullToDismissInterval > -1) {
      window.clearTimeout(this.pullToDismissInterval);
      this.pullToDismissInterval = -1;
    }

    this.pullToDismissValue.setValue(0);
  };
  componentWillUnmount() {
    if (this.pullToDismissInterval > -1) {
      window.clearTimeout(this.pullToDismissInterval);
      this.pullToDismissInterval = -1;
    }
  }

  handlePickPhoto = photo => {
    const onChange = this.props.navigation.getParam("onChange");

    onChange(this.props.navigation.getParam("blockId"), photo);
    this.goBack(true);
  };

  pressBack = () => this.goBack(false);
  animatedYOffset = new Animated.Value(0);

  goBack = (isDone: boolean = false) => {
    this.controlsOpacityValue.setValue(0);
    if (!isDone) {
      this.flatListRef && this.flatListRef.scrollToIndex(0);
    }
    this.props.navigation.pop();
  };
  flatListRef: FlatList | null = null;
  updateFlatListRef = scrollRef => flatListRef => {
    this.flatListRef = flatListRef;

    this.scrollRef = flatListRef.getNode().getScrollableNode();
  };

  render() {
    const blockId = this.props.navigation.getParam("blockId");
    const sharedElementId = `block.imagePicker.${blockId}`;

    return (
      <View
        style={{
          width: SCREEN_DIMENSIONS.width,
          flex: 1
        }}
      >
        <AnimatedKeyboardTracker
          keyboardVisibleValue={this.keyboardVisibleValue}
          keyboardHeightValue={this.keyboardHeightValue}
          onKeyboardHide={this.enablePullToDismiss}
          onKeyboardShow={this.disablePullToDismiss}
          enabled={this.props.isFocused}
        />

        {/* <Animated.Code
          exec={Animated.block([
            Animated.cond(
              Animated.and(
                Animated.lessThan(this.animatedYOffset, -16),
                Animated.eq(this.contentStartOffsetY, 0),
                Animated.eq(this.pullToDismissValue, 1)
              ),
              [Animated.call([], this.pressBack)]
            )
          ])}
        /> */}
        <SharedElement
          id={sharedElementId}
          style={{
            width: SCREEN_DIMENSIONS.width,
            flex: 1
          }}
        >
          <ImagePicker
            width={SCREEN_DIMENSIONS.width}
            scrollEnabled
            animatedYOffset={this.animatedYOffset}
            keyboardVisibleValue={this.keyboardVisibleValue}
            keyboardHeightValue={this.keyboardHeightValue}
            initialRoute={
              this.props.navigation.getParam("initialRoute") ||
              ImagePickerRoute.camera
            }
            height={SCREEN_DIMENSIONS.height}
            onScrollBeginDrag={this.handleScrollBeginDrag}
            onChange={this.handlePickPhoto}
            onPressBack={this.pressBack}
            controlsOpacityValue={this.controlsOpacityValue}
          />
        </SharedElement>
        <SafeAreaView
          forceInset={{
            bottom: "always",
            top: "never",
            left: "never",
            right: "never"
          }}
          style={styles.footer}
        >
          <Animated.View style={{ opacity: this.controlsOpacityValue }}>
            <IconButton
              Icon={IconClose}
              onPress={this.goBack}
              color="#fff"
              backgroundColor={COLORS.primaryDark}
              type="fill"
              size={22}
            />
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }
}

export default withNavigationFocus(ImagePickerPage);
