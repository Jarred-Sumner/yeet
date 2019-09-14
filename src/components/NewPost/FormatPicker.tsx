import * as React from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import Carousel from "react-native-snap-carousel";
import { MediumText } from "../Text";
import { CAROUSEL_HEIGHT, PostFormat } from "./NewPostFormat";

const SCREEN_WIDTH = Dimensions.get("screen").width;

const styles = StyleSheet.create({
  container: {
    height: CAROUSEL_HEIGHT,
    backgroundColor: "black",
    alignItems: "center"
  },
  item: {
    justifyContent: "center",
    alignItems: "center",
    height: CAROUSEL_HEIGHT,
    width: 100
  },
  label: {
    color: "white",
    fontSize: 18
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

const FormatPickerListItem = ({ item: format, contentOffsetY }) => {
  return (
    <Animated.View style={styles.item}>
      <MediumText style={[styles.label]}>{format.label}</MediumText>
    </Animated.View>
  );
};

export class FormatPicker extends React.PureComponent {
  xOffsetValue = new Animated.Value(0);

  constructor(props) {
    super(props);
  }

  renderItem = ({ item }) => {
    return (
      <FormatPickerListItem item={item} contentOffsetY={this.xOffsetValue} />
    );
  };

  handleSnap = index => {
    this.props.onChangeFormat(FORMATS[index].value);
  };
  keyExtractor = item => item.value;
  getFirstItem = FORMATS.findIndex(
    ({ value }) => this.props.defaultFormat === value
  );

  render() {
    return (
      <Carousel
        data={FORMATS}
        renderItem={this.renderItem}
        sliderWidth={SCREEN_WIDTH}
        itemWidth={100}
        itemHeight={CAROUSEL_HEIGHT}
        horizontal
        sliderHeight={CAROUSEL_HEIGHT}
        enableSnap
        firstItem={this.getFirstItem}
        useScrollView
        layout="default"
        style={styles.container}
        onSnapToItem={this.handleSnap}
      />
    );
  }
}

export default FormatPicker;
