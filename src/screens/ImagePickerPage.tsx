import * as React from "react";
import { ImagePicker } from "../components/NewPost/ImagePicker";
import { Dimensions, View, StyleSheet, InteractionManager } from "react-native";
import { SharedElement } from "react-navigation-sharedelement";
import { SafeAreaView, StackGestureContext } from "react-navigation";
import {
  IconClose,
  IconChevronLeft,
  IconChevronUp,
  IconBack
} from "../components/Icon";
import { SPACING, COLORS } from "../lib/styles";
import LinearGradient from "react-native-linear-gradient";
import { SemiBoldText } from "../components/Text";
import { FlatList, PanGestureHandler } from "react-native-gesture-handler";
import Animated, { Easing } from "react-native-reanimated";
import { IconButton } from "../components/Button";

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
          height: SCREEN_DIMENSIONS.height
        }}
      >
        <Animated.Code
          exec={Animated.block([
            Animated.cond(Animated.lessThan(this.animatedYOffset, -16), [
              Animated.call([], this.pressBack)
            ])
          ])}
        />
        <SharedElement
          id={sharedElementId}
          style={{
            width: SCREEN_DIMENSIONS.width,
            height: SCREEN_DIMENSIONS.height
          }}
        >
          <ImagePicker
            width={SCREEN_DIMENSIONS.width}
            scrollEnabled
            animatedYOffset={this.animatedYOffset}
            height={SCREEN_DIMENSIONS.height}
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

export default ImagePickerPage;
