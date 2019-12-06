import hoistNonReactStatics from "hoist-non-react-statics";
import * as React from "react";
import { InteractionManager, StyleSheet, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Animated, { Easing } from "react-native-reanimated";
import { withNavigationFocus } from "react-navigation";
import { SCREEN_DIMENSIONS } from "../../config";
import { generateBlockId } from "../components/NewPost/NewPostFormat";
import { GalleryTabView } from "../components/Gallery/GalleryTabView";
import { AnimatedKeyboardTracker } from "../components/AnimatedKeyboardTracker";
import { MediaPlayerPauser } from "../components/MediaPlayer";
import {
  useNavigationState,
  useFocusState,
  useNavigation
} from "react-navigation-hooks";
import { SafeAreaContext } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  }
});

class RawImagePickerPage extends React.Component {
  static sharedElements = (navigation, otherNavigation, showing) => {
    // Transition element `item.${item.id}.photo` when either
    // showing or hiding this screen (coming from any route)
    const blockId = navigation.getParam("blockId");
    const shouldAnimate = navigation.getParam("shouldAnimate") || true;

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
    gestureEnabled: true,
    gestureDirection: "vertical",
    cardTransparent: false
  });
  state = { photo: null };
  controlsOpacityValue = new Animated.Value(0);

  constructor(props) {
    super(props);

    this.state = {
      blockId: props.navigation.getParam("blockId"),
      isKeyboardVisible: false
    };
  }

  componentDidMount() {}

  keyboardVisibleValue = new Animated.Value(0);
  handleKeyboardShow = () => this.setState({ isKeyboardVisible: true });
  handleKeyboardHide = () => this.setState({ isKeyboardVisible: false });

  handlePickPhoto = photo => {
    const onChange = this.props.navigation.getParam("onChange");

    if (onChange) {
      onChange(this.props.navigation.getParam("blockId"), photo);
      this.goBack(true);
    } else {
      this.props.navigation.navigate("NewPost", {
        image: photo,
        blockId: this.state.blockId
      });
    }
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
  updateFlatListRef = flatListRef => {
    this.flatListRef = flatListRef;

    this.scrollRef = flatListRef?.getScrollableNode();
  };

  render() {
    return (
      <View style={styles.container}>
        {/* <AnimatedKeyboardTracker
          onKeyboardShow={this.handleKeyboardShow}
          onKeyboardHide={this.handleKeyboardHide}
          keyboardVisibleValue={this.keyboardVisibleValue}
        /> */}
        <GalleryTabView
          width={this.props.width}
          isKeyboardVisible={this.state.isKeyboardVisible}
          height={this.props.height}
          onPress={this.handlePickPhoto}
          showHeader
          initialRoute={this.props.navigation.getParam("initialRoute") || "all"}
        />
      </View>
    );
  }
}

export const ImagePickerPage = props => {
  const navigation = useNavigation();
  const { top, left, right } = React.useContext(SafeAreaContext);

  return (
    <RawImagePickerPage
      navigation={navigation}
      height={SCREEN_DIMENSIONS.height - top}
      width={SCREEN_DIMENSIONS.width - left - right}
      {...props}
    />
  );
};

export default ImagePickerPage;
