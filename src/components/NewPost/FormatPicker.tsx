import * as React from "react";
import {
  Dimensions,
  ImageProps,
  StyleSheet,
  View,
  PixelRatio,
  LayoutAnimation
} from "react-native";
import { BorderlessButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { TOP_Y, SCREEN_DIMENSIONS } from "../../../config";
import { SPACING, COLORS } from "../../lib/styles";
import { sendLightFeedback, sendSelectionFeedback } from "../../lib/Vibration";
import {
  BitmapIconFormatHorizontalMediaMedia,
  BitmapIconFormatHorizontalMediaText,
  BitmapIconFormatHorizontalTextMedia,
  BitmapIconFormatMedia,
  BitmapIconFormatVerticalMediaMedia,
  BitmapIconFormatVerticalMediaText,
  BitmapIconFormatVerticalTextMedia
} from "../BitmapIcon";
import { PostLayout } from "./NewPostFormat";
import MediaPlayer from "../MediaPlayer/MediaPlayer";
import Image from "../Image";
import { ScrollView } from "../ScrollView";

const LIST_ITEM_HEIGHT = 35;
const LIST_ITEM_WIDTH = 45;
const SCREEN_WIDTH = Dimensions.get("screen").width;

const BORDER_RADIUS = 4;
const ICON_WIDTH = 35;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
    flexDirection: "row",
    overflow: "visible",
    height: LIST_ITEM_HEIGHT
  },
  content: {
    justifyContent: "center",
    minWidth: "100%"
  },
  list: {
    height: LIST_ITEM_HEIGHT,
    width: "100%",
    flexDirection: "row"
    // alignItems: "center"
  },

  unselectedBorder: {
    borderWidth: BORDER_RADIUS / 2,
    borderRadius: BORDER_RADIUS,
    borderColor: "transparent",
    overflow: "hidden",
    width: ICON_WIDTH - BORDER_RADIUS,
    margin: BORDER_RADIUS / 2,
    height: ICON_WIDTH - BORDER_RADIUS,

    backgroundColor: "black",
    opacity: 0.25,
    ...StyleSheet.absoluteFillObject
  },
  selectedBorder: {
    borderWidth: BORDER_RADIUS / 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS,
    overflow: "visible",
    width: ICON_WIDTH - BORDER_RADIUS,
    margin: BORDER_RADIUS / 2,
    height: ICON_WIDTH - BORDER_RADIUS,
    backgroundColor: "transparent",
    opacity: 1.0,
    ...StyleSheet.absoluteFillObject
  },
  icon: {
    width: ICON_WIDTH,
    height: ICON_WIDTH,
    position: "relative"
  },
  selectedIcon: {
    width: ICON_WIDTH,
    height: ICON_WIDTH,
    opacity: 1
  },
  unselectedIcon: {
    width: ICON_WIDTH,
    height: ICON_WIDTH,
    opacity: 0.5
  },

  mediaIcon: {
    flex: 1,
    margin: BORDER_RADIUS
  },
  item: {
    justifyContent: "center",
    alignItems: "center",
    width: LIST_ITEM_WIDTH,
    height: LIST_ITEM_HEIGHT
  },
  label: {
    color: "white",
    fontSize: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    flexWrap: "nowrap"
  }
});

type PostLayoutData = {
  value: PostLayout;
  Icon: React.ComponentType<ImageProps>;
};

export const FORMATS: Array<PostLayoutData> = [
  {
    value: PostLayout.horizontalTextMedia,
    Icon: BitmapIconFormatHorizontalTextMedia
  },

  {
    value: PostLayout.verticalMediaText,
    Icon: BitmapIconFormatVerticalMediaText
  },
  {
    value: PostLayout.horizontalMediaText,
    Icon: BitmapIconFormatHorizontalMediaText
  },
  {
    value: PostLayout.media,
    Icon: BitmapIconFormatMedia
  },
  {
    value: PostLayout.verticalTextMedia,
    Icon: BitmapIconFormatVerticalTextMedia
  },
  // {
  //   value: PostLayout.text,
  //   Icon: BitmapIconFormatText,
  // },
  {
    value: PostLayout.verticalMediaMedia,
    Icon: BitmapIconFormatVerticalMediaMedia
  },
  {
    value: PostLayout.horizontalMediaMedia,
    Icon: BitmapIconFormatHorizontalMediaMedia
  }
];

const offsets = FORMATS.map((_, index) => LIST_ITEM_WIDTH * index);

const FormatPickerListItem = ({
  item: format,
  onPress,
  isSelected,
  thumbnail
}) => {
  const { Icon } = format;

  const handlePress = React.useCallback(() => {
    onPress(format);
  }, [format, onPress]);
  return (
    <BorderlessButton
      activeOpacity={1}
      disallowInterruption
      onPress={handlePress}
    >
      <Animated.View style={styles.item}>
        <View style={styles.icon}>
          {thumbnail ? (
            <Image
              resizeMode="aspectFill"
              source={{
                uri: thumbnail,
                width: ICON_WIDTH * PixelRatio.get(),
                height: ICON_WIDTH * PixelRatio.get()
              }}
              style={styles.mediaIcon}
              borderRadius={2}
            />
          ) : (
            <Icon
              style={isSelected ? styles.selectedIcon : styles.unselectedIcon}
            />
          )}

          <View
            style={isSelected ? styles.selectedBorder : styles.unselectedBorder}
          />
        </View>
      </Animated.View>
    </BorderlessButton>
  );
};

export class FormatPicker extends React.PureComponent {
  xOffsetValue = new Animated.Value(0);

  constructor(props) {
    super(props);
  }

  renderItem = item => {
    return (
      <FormatPickerListItem
        key={item.value}
        thumbnail={
          item.value === this.props.defaultLayout ? this.props.thumbnail : null
        }
        onPress={this.onPressItem}
        isSelected={this.props.value === item.value}
        item={item}
        contentOffsetY={this.xOffsetValue}
      />
    );
  };

  onPressItem = (format: Object) => {
    const index = FORMATS.indexOf(format);
    this.handleSnap(index);
  };

  goNext = () => {
    // this.carouselRef.current.snapToNext();
  };

  goPrevious = () => {
    // this.carouselRef.current.snapToPrev();
  };

  handleSnap = index => {
    sendSelectionFeedback();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const maxX = FORMATS.length * LIST_ITEM_WIDTH;

    this.scrollRef.current.getNode().scrollTo({
      x: index * LIST_ITEM_WIDTH,
      animated: true,
      y: 0
    });
    this.props.onChangeLayout(FORMATS[index].value);
  };
  keyExtractor = item => item.value;
  scrollRef = React.createRef<ScrollView>();

  render() {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          decelerationRate="fast"
          scrollToOverflowEnabled
          contentContainerStyle={styles.content}
          centerContent
          // disableScrollViewPanResponder
          overScrollMode="auto"
          ref={this.scrollRef}
          showsHorizontalScrollIndicator={false}
          directionalLockEnabled
          style={styles.list}
        >
          {FORMATS.map(this.renderItem)}
        </ScrollView>
      </View>
    );
  }
}

export default FormatPicker;
