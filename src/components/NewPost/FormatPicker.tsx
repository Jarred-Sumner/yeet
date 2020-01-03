import * as React from "react";
import {
  Dimensions,
  ImageProps,
  StyleSheet,
  View,
  PixelRatio
} from "react-native";
import { BorderlessButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import Carousel from "react-native-snap-carousel";
import { TOP_Y, SCREEN_DIMENSIONS } from "../../../config";
import { SPACING, COLORS } from "../../lib/styles";
import { sendLightFeedback } from "../../lib/Vibration";
import {
  BitmapIconFormatHorizontalMediaMedia,
  BitmapIconFormatHorizontalMediaText,
  BitmapIconFormatHorizontalTextMedia,
  BitmapIconFormatMedia,
  BitmapIconFormatVerticalMediaMedia,
  BitmapIconFormatVerticalMediaText,
  BitmapIconFormatVerticalTextMedia
} from "../BitmapIcon";
import { CAROUSEL_HEIGHT, PostLayout } from "./NewPostFormat";
import MediaPlayer from "../MediaPlayer/MediaPlayer";
import Image from "../Image";

const LIST_ITEM_HEIGHT = 46;
const LIST_ITEM_WIDTH = 60;
const SCREEN_WIDTH = Dimensions.get("screen").width;

const BORDER_RADIUS = 4;
const ICON_WIDTH = 39;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    alignItems: "center",
    width: "100%",
    flexDirection: "row",
    overflow: "visible",
    height: CAROUSEL_HEIGHT
  },
  list: {
    height: CAROUSEL_HEIGHT,
    width: "100%",
    flexDirection: "row",
    alignItems: "center"
  },

  unselectedBorder: {
    borderWidth: BORDER_RADIUS / 2,
    borderRadius: BORDER_RADIUS,
    borderColor: "transparent",
    overflow: "hidden",
    width: ICON_WIDTH - BORDER_RADIUS / 2,
    height: ICON_WIDTH,
    margin: 1,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
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
    ...StyleSheet.absoluteFillObject
  },
  icon: {
    width: ICON_WIDTH,
    height: ICON_WIDTH,
    position: "relative"
  },

  mediaIcon: {
    flex: 1,
    margin: BORDER_RADIUS
  },
  item: {
    marginTop: TOP_Y,
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

const offsets = FORMATS.map(({ width }, index) => width * index);

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
            <Icon />
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
    sendLightFeedback();
    this.props.onChangeLayout(FORMATS[index].value);
  };
  keyExtractor = item => item.value;

  carouselRef = React.createRef<Carousel>();

  translateX = Animated.multiply(
    Animated.multiply(this.props.position, LIST_ITEM_WIDTH),
    -1
  );

  render() {
    return (
      <Animated.View style={styles.container}>
        <Animated.View
          style={[
            styles.list,
            {
              transform: [
                {
                  translateX: SCREEN_DIMENSIONS.width / 2 - LIST_ITEM_WIDTH / 2
                },
                { translateX: this.translateX }
              ]
            }
          ]}
        >
          {FORMATS.map(this.renderItem)}
        </Animated.View>
      </Animated.View>
    );
  }
}

export default FormatPicker;
