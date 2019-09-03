import * as React from "react";
import { ImagePicker } from "../components/NewPost/ImagePicker";
import { Dimensions, View, StyleSheet, InteractionManager } from "react-native";
import { SharedElement } from "react-navigation-sharedelement";
import { SafeAreaView, StackGestureContext } from "react-navigation";
import { IconButton } from "react-native-paper";
import { IconClose } from "../components/Icon";
import { SPACING } from "../lib/styles";
import LinearGradient from "react-native-linear-gradient";
import { SemiBoldText } from "../components/Text";
import { FlatList, PanGestureHandler } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

const SCREEN_DIMENSIONS = Dimensions.get("screen");

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    right: 0,
    paddingHorizontal: SPACING.double
  }
});

// export const LIST_HEADER_HEIGHT = 40 + TOP_Y;

const DefaultListHeaderComponent = () => {
  return (
    <SafeAreaView
      forceInset={{
        top: "always",
        left: "never",
        right: "never",
        bottom: "never"
      }}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        height: 60,
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: SPACING.normal
      }}
    >
      <SemiBoldText style={styles.headerText}>CAMERA ROLL</SemiBoldText>
    </SafeAreaView>
  );
};

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
    gestureEnabled: true,
    gestureDirection: "vertical",
    cardTransparent: false
  });
  state = { photo: null };

  handlePickPhoto = photo => {
    const onChange = this.props.navigation.getParam("onChange");

    onChange(this.props.navigation.getParam("blockId"), photo);
    this.goBack();
  };
  animatedYOffset = new Animated.Value(0);

  goBack = () => this.props.navigation.pop();
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
              Animated.call([], this.goBack)
            ])
          ])}
        />
        <SharedElement id={sharedElementId}>
          <ImagePicker
            width={SCREEN_DIMENSIONS.width}
            scrollEnabled
            animatedYOffset={this.animatedYOffset}
            height={SCREEN_DIMENSIONS.height}
            onChange={this.handlePickPhoto}
            onPressBack={this.goBack}
          />
        </SharedElement>
      </View>
    );
  }
}

export default ImagePickerPage;
