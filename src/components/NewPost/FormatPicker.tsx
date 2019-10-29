import * as React from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import Carousel from "react-native-snap-carousel";
import { BoldText, BlackText, ExtraBoldText } from "../Text";
import { CAROUSEL_HEIGHT, PostFormat } from "./NewPostFormat";
import { TOP_Y } from "../../../config";
import { SPACING } from "../../lib/styles";
import { BorderlessButton } from "react-native-gesture-handler";
import { sendLightFeedback } from "../../lib/Vibration";

const ITEM_WIDTH = 120;
const SCREEN_WIDTH = Dimensions.get("screen").width;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    alignItems: "center",
    width: "100%",
    height: CAROUSEL_HEIGHT
  },
  item: {
    paddingTop: TOP_Y + SPACING.half,
    paddingBottom: SPACING.half,
    justifyContent: "center",
    height: CAROUSEL_HEIGHT,
    alignItems: "center",
    width: ITEM_WIDTH
  },
  label: {
    color: "white",
    fontSize: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    flexWrap: "nowrap"
  }
});

type PostFormatData = {
  value: PostFormat;
  width: number;
  label: string;
};

const FORMATS: Array<PostFormatData> = [
  {
    value: PostFormat.canvas,
    width: 100,
    label: "Canvas"
  },
  {
    value: PostFormat.screenshot,
    width: 100,
    label: "Screenshot"
  },
  {
    value: PostFormat.caption,
    width: 100,
    label: "Caption"
  }
  // {
  //   value: PostFormat.vent,
  //   width: 100,
  //   label: "Vent"
  // },
  // {
  //   value: PostFormat.comic,
  //   width: 100,
  //   label: "Comic"
  // },
  // {
  //   value: PostFormat.blargh,
  //   width: 100,
  //   label: "blargh"
  // }
];

const offsets = FORMATS.map(({ width }, index) => width * index);

const FormatPickerListItem = ({ item: format, contentOffsetY, onPress }) => {
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
        <ExtraBoldText
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[styles.label]}
        >
          {format.label}
        </ExtraBoldText>
      </Animated.View>
    </BorderlessButton>
  );
};

export class FormatPicker extends React.PureComponent {
  xOffsetValue = new Animated.Value(0);

  constructor(props) {
    super(props);
  }

  renderItem = ({ item }) => {
    return (
      <FormatPickerListItem
        onPress={this.onPressItem}
        item={item}
        contentOffsetY={this.xOffsetValue}
      />
    );
  };

  onPressItem = (format: Object) => {
    const index = FORMATS.indexOf(format);
    this.carouselRef.current.snapToItem(index);
  };

  goNext = () => {
    this.carouselRef.current.snapToNext();
  };

  goPrevious = () => {
    this.carouselRef.current.snapToPrev();
  };

  handleSnap = index => {
    sendLightFeedback();
    this.props.onChangeFormat(FORMATS[index].value);
  };
  keyExtractor = item => item.value;
  getFirstItem = FORMATS.findIndex(
    ({ value }) => this.props.defaultFormat === value
  );
  carouselRef = React.createRef<Carousel>();

  render() {
    return (
      <Carousel
        data={FORMATS}
        renderItem={this.renderItem}
        sliderWidth={SCREEN_WIDTH}
        itemWidth={ITEM_WIDTH}
        itemHeight={CAROUSEL_HEIGHT}
        horizontal
        ref={this.carouselRef}
        sliderHeight={CAROUSEL_HEIGHT}
        enableSnap
        firstItem={this.getFirstItem}
        useScrollView
        layoutCardOffset={0}
        inactiveSlideScale={1}
        layout="default"
        style={styles.container}
        onSnapToItem={this.handleSnap}
      />
    );
  }
}

export default FormatPicker;
