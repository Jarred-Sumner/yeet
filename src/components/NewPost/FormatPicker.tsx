import * as React from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import SafeAreaView from "react-native-safe-area-view";
import Carousel from "react-native-snap-carousel";
import { SPACING } from "../../lib/styles";
import { MediumText } from "../Text";
import { PostFormat, CAROUSEL_HEIGHT } from "./NewPostFormat";

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
    value: PostFormat.caption,
    width: 100,
    label: "Caption"
  },
  {
    value: PostFormat.screenshot,
    width: 100,
    label: "Screenshot"
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

  render() {
    return (
      <SafeAreaView
        forceInset={{
          bottom: "always",
          left: "never",
          right: "never",
          top: "never"
        }}
        style={{ width: "100%" }}
      >
        <Carousel
          data={FORMATS}
          renderItem={this.renderItem}
          sliderWidth={SCREEN_WIDTH}
          itemWidth={100}
          itemHeight={CAROUSEL_HEIGHT}
          horizontal
          sliderHeight={CAROUSEL_HEIGHT}
          enableSnap
          firstItem={FORMATS.findIndex(
            ({ value }) => this.props.defaultFormat === value
          )}
          useScrollView
          layout="default"
          style={styles.container}
          onSnapToItem={this.handleSnap}
        />
      </SafeAreaView>
    );
  }
}

export default FormatPicker;
