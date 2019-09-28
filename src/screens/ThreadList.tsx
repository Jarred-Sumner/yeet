// @flow
import hoistNonReactStatics from "hoist-non-react-statics";
import * as React from "react";
import { Query } from "react-apollo";
import { StyleSheet, View, LayoutChangeEvent } from "react-native";
import {
  BaseButton,
  FlatList as GestureFlatList
} from "react-native-gesture-handler";
import Animated, { Easing } from "react-native-reanimated";
import { onScroll, runTiming } from "react-native-redash";
import { SafeAreaView, withNavigation } from "react-navigation";
import { SharedElement } from "react-navigation-shared-element";
import { BOTTOM_Y, SCREEN_DIMENSIONS, TOP_Y } from "../../config";
import { ProgressAvatar } from "../components/Avatar";
import { IconButton } from "../components/Button";
import {
  IconHeart,
  IconPlus,
  IconProfile,
  IconRemix,
  IconComment
} from "../components/Icon";
import { OverlayGradient } from "../components/PostList/Post";
import Media from "../components/PostList/ViewMedia";
import { SemiBoldText } from "../components/Text";
import {
  VerticalIconButton,
  VerticalIconButtonSize
} from "../components/VerticalIconButton";
import {
  ViewThreads,
  ViewThreads_postThreads
} from "../lib/graphql/ViewThreads";
import { BoundsRect, pxBoundsToPoint, scaleToWidth } from "../lib/Rect";
import { SPACING } from "../lib/styles";
import VIEW_THREADS_QUERY from "../lib/ViewThreads.graphql";
import LinearGradient from "react-native-linear-gradient";
import { ViewThread } from "../components/ThreadList/ViewThread";
import {
  TAB_BAR_OFFSET,
  BottomTabBar,
  TAB_BAR_HEIGHT
} from "../components/BottomTabBar";

const LAYOUT_DIRECTION = "column-reverse";
const LAYOUT_DIRECTION_OFFSET = {
  column: BOTTOM_Y + 80 + TOP_Y,
  "column-reverse": TOP_Y + 60.5
}[LAYOUT_DIRECTION];

const HEADER_HEIGHT = 50;

const FlatList = Animated.createAnimatedComponent(GestureFlatList);

const Footer = ({ onPressPlus }) => (
  <SafeAreaView
    forceInset={{
      bottom: LAYOUT_DIRECTION === "column-reverse" ? "never" : "always",
      left: "never",
      right: "never",
      top: LAYOUT_DIRECTION === "column" ? "never" : "always"
    }}
  >
    <View
      style={{
        justifyContent: "space-between",
        paddingHorizontal: SPACING.double,
        paddingVertical: SPACING.normal,
        flexDirection: "row"
      }}
    >
      <IconButton type="shadow" color="#ccc" Icon={IconProfile} />
      <IconButton
        type="shadow"
        color="#ccc"
        Icon={IconPlus}
        onPress={onPressPlus}
      />
    </View>
  </SafeAreaView>
);

type Props = ViewThreads & {};

enum SectionOrientationType {
  "vertical",
  "horizontal",
  "square"
}

type ThreadSectionOrientation = {
  count: number;
  spacing: number;
  maxHeight: number;
  width: number;
  type: SectionOrientationType;
};

const VERTICAL_SECTION_COLUMN_COUNT = 1;
const VERTICAL_SECTION_SPACING = SPACING.half;

const VerticalSectionOrientation: ThreadSectionOrientation = {
  count: VERTICAL_SECTION_COLUMN_COUNT,
  spacing: VERTICAL_SECTION_SPACING,
  maxHeight: SCREEN_DIMENSIONS.height,
  width: SCREEN_DIMENSIONS.width,
  type: SectionOrientationType.vertical
};

const HORIZONTAL_SECTION_COLUMN_COUNT = 1;
const HORIZONTAL_SECTION_SPACING = SPACING.half;

const HorizontalSectionOrientation: ThreadSectionOrientation = {
  count: HORIZONTAL_SECTION_COLUMN_COUNT,
  spacing: HORIZONTAL_SECTION_SPACING,
  maxHeight: SCREEN_DIMENSIONS.height,
  width: SCREEN_DIMENSIONS.width,
  type: SectionOrientationType.horizontal
};

const SquareSectionOrientation: ThreadSectionOrientation = {
  count: 1,
  spacing: HORIZONTAL_SECTION_SPACING,
  maxHeight: SCREEN_DIMENSIONS.width,
  width: SCREEN_DIMENSIONS.width,
  type: SectionOrientationType.square
};

const ThreadSectionCell = ({
  section,
  index,
  visibleIndex,
  scrollYOffset,
  onPressReply,
  height,
  width
}) => {
  const renderCell = React.useCallback(
    thread => {
      return (
        <ViewThread
          maxHeight={height}
          height={height}
          width={width}
          isLeftSide={index % 2 === 0}
          onPressReply={onPressReply}
          thread={thread}
          scrollYOffset={scrollYOffset}
          index={index}
          isVisible={visibleIndex === index}
          isNextVisible={visibleIndex + 1 === index}
          isPreviousVisible={visibleIndex - 1 === index}
          offset={section.offset}
          spacing={section.orientation.spacing / section.data.length}
          key={thread.id}
        />
      );
    },
    [section, visibleIndex, index, onPressReply]
  );

  return (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-evenly"
      }}
    >
      {section.data.map(renderCell)}
    </View>
  );
};

const getSectionOrientation = (bounds: BoundsRect) => {
  const ratio = bounds.width / bounds.height;

  if (ratio < 0.8) {
    return VerticalSectionOrientation;
  } else if (ratio > 1.2) {
    return HorizontalSectionOrientation;
  } else {
    return SquareSectionOrientation;
  }
};

type ThreadSection = {
  data: Array<ViewThreads_postThreads>;
  height: number;
  index: number;
  offset: number;
  width: number;
  type: SectionOrientationType;
  orientation: ThreadSectionOrientation;
};

const createThreadSections = (
  postThreads: Array<ViewThreads_postThreads>
): Array<ThreadSection> => {
  const threadSections: Array<ThreadSection> = [];
  let offset = 0;
  for (let index = 0; index < postThreads.length; index++) {
    const thread = postThreads[index];
    const post = thread.firstPost;
    const bounds = pxBoundsToPoint(post.media, post.media.pixelRatio);
    const sectionOrientation = getSectionOrientation(bounds);

    // if the aspect ratio is different
    // and the aspect ratio supports showing multiple columns
    // we try and see if we can fit two similarly-shaped cells in the same section
    if (sectionOrientation.count > 1) {
      const nextThread = postThreads[index + 1];

      if (nextThread) {
        const nextPost = nextThread.firstPost;
        const nextBounds = pxBoundsToPoint(
          nextPost.media,
          nextPost.media.pixelRatio
        );
        const nextSectionOrientation = getSectionOrientation(nextBounds);

        if (nextSectionOrientation.type === sectionOrientation.type) {
          const data = [thread, nextThread];
          const size = calculateSectionSize(data, sectionOrientation);
          threadSections.push({
            data,
            height: size.height,
            width: size.width,
            index,
            type: sectionOrientation.type,
            orientation: sectionOrientation,
            offset
          });
          offset = size.height + offset;
          index = index + 1;
          continue;
        }
      }
    }

    const data = [thread];
    const size = calculateSectionSize(data, sectionOrientation);
    threadSections.push({
      data,
      height: size.height,
      width: size.width,
      index,
      type: sectionOrientation.type,
      orientation: sectionOrientation,
      offset
    });

    offset = size.height + offset;
  }

  return threadSections;
};

const calculateSectionSize = (
  postThreads: Array<ViewThreads_postThreads>,
  sectionOrientation: ThreadSectionOrientation
): BoundsRect => {
  const postBounds = postThreads.map(({ firstPost: post }) =>
    scaleToWidth(
      sectionOrientation.width / postThreads.length -
        sectionOrientation.spacing * postThreads.length,
      pxBoundsToPoint(post.media, post.media.pixelRatio)
    )
  );

  // const height = Math.min(
  //   sectionOrientation.maxHeight,
  //   min(postBounds.map(bounds => bounds.height))
  // );
  const height = SCREEN_DIMENSIONS.height;

  // const width = Math.min(
  //   sectionOrientation.width,
  //   min(postBounds.map(bounds => bounds.width))
  // );
  const width = sectionOrientation.width;
  return { width, height, x: 0, y: 0 };
};

type State = {
  sections: Array<ThreadSection>;
  postThreads: Array<ViewThreads_postThreads>;
};

class ThreadList extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      sections: [],
      layout: {
        height: SCREEN_DIMENSIONS.height - TAB_BAR_OFFSET,
        width: SCREEN_DIMENSIONS.width
      },
      snapToOffsets: [],
      postThreads: props.postThreads
    };
  }

  scrollYOffset = new Animated.Value<number>(-1 * TOP_Y);

  getItemLayout = (data: Array<ThreadSection>, index: number) => {
    // return {
    //   // length: data[index].height + SPACING.normal,
    //   length: data[index].height,
    //   offset: data[index].offset,
    //   index
    // };

    return {
      length: this.state.layout.height,
      offset: this.state.layout.height * index,
      index
    };
  };

  static getDerivedStateFromProps(props: Props, state: State) {
    const newState: Partial<State> = {};

    if (props.postThreads.length !== state.postThreads.length) {
      newState.postThreads = props.postThreads;

      newState.sections = createThreadSections(props.postThreads);
      newState.snapToOffsets = newState.sections.map(
        ({ offset, height }, index) => index * state.layout.height
      );
    }

    return newState;
  }

  openPlus = () => this.props.navigation.navigate("NewPostStack");

  handlePressReply = props => {
    this.props.navigation.push("ReplyToPost", props);
  };

  handlePressDownload = () => {};

  keyExtractor = (item: ThreadSection, _index: number) =>
    item.data.map(thread => thread.id).join("-");

  handleRenderItem = ({
    item: section,
    index
  }: {
    index: number;
    item: ThreadSection;
  }) => {
    return (
      <ThreadSectionCell
        visibleIndex={this.state.visibleIndex}
        scrollYOffset={this.scrollYOffset}
        section={section}
        height={this.state.layout.height}
        width={this.state.layout.width}
        onPressReply={this.handlePressReply}
        index={index}
      />
    );
  };

  scrollVelocity = new Animated.Value(0);
  translateCells = new Animated.Value(0);
  translateClock = new Animated.Clock();

  renderScrollView = scorllProps => <Animated.ScrollView {...scorllProps} />;
  onScroll = onScroll({
    y: this.scrollYOffset
  });

  handleLayout = ({
    nativeEvent: {
      layout: { height, width }
    }
  }: LayoutChangeEvent) => {
    this.setState({ layout: { height: height - TAB_BAR_OFFSET, width } });
  };

  onViewableItemsChanged = ({ viewableItems = [], changed } = {}) => {
    const [{ index: visibleIndex = -1 }] = viewableItems;
    this.setState({ visibleIndex });
  };
  render() {
    const { postThreads = [] } = this.state;

    return (
      <Animated.View style={[styles.page]}>
        {/* <Animated.Code
          exec={Animated.block([
            // Animated.onChange(
            //   this.scrollYOffset,
            //   Animated.block([
            Animated.set(
              this.scrollVelocity,
              Animated.diffClamp(this.scrollYOffset, -50, 50)
            )
            // Animated.onChange(
            //   this.scrollVelocity,
            //   Animated.block([
            //     Animated.set(
            //       this.translateCells,

            //     )
            //   ])
            // )
            // decay(this.translateClock, this.scrollVelocity, {})
            // Animated.cond(Animated.eq(Animated.diff(this.scrollYOffset), 0), [
            //   Animated.set(this.scrollVelocity, 0)
            // ])
            // ])
            // )
          ])}
        /> */}
        <FlatList
          data={this.state.sections}
          renderItem={this.handleRenderItem}
          keyExtractor={this.keyExtractor}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="always"
          snapToAlignment="bottom"
          pagingEnabled
          decelerationRate="fast"
          initialNumToRender={1}
          windowSize={4}
          snapToOffsets={this.state.snapToOffsets}
          onScroll={this.onScroll}
          onViewableItemsChanged={this.onViewableItemsChanged}
          extraData={[
            this.state.visibleIndex,
            Object.values(this.state.layout).join("-")
          ].join("-")}
          scrollEventThrottle={1}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          directionalLockEnabled
          renderScrollView={this.renderScrollView}
          // ItemSeparatorComponent={SeparatorComponent}
          // contentInset={{
          //   top: TOP_Y
          // }}
          // contentOffset={{
          //   y: TOP_Y * -1,
          //   x: 0
          // }}
          contentInsetAdjustmentBehavior="never"
          removeClippedSubviews
          getItemLayout={this.getItemLayout}
        />
        <BottomTabBar style={styles.tabBar} currentRoute="FeedTab" />
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  postList: {},
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0
  },
  postListItem: {
    borderRadius: 12,
    backgroundColor: "#000",
    shadowRadius: 5,
    shadowOpacity: 0.25,
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 0
    }
  },
  wrapper: {
    backgroundColor: "#000",
    flex: 1
  },
  page: {
    flex: 1,
    backgroundColor: "#000"
  }
});

const ThreadListScreen = withNavigation(ThreadList);

export default hoistNonReactStatics(
  props => (
    <Query notifyOnNetworkStatusChange query={VIEW_THREADS_QUERY}>
      {({ data: { postThreads = [] } = {}, ...otherProps }) => {
        return <ThreadListScreen postThreads={postThreads} {...otherProps} />;
      }}
    </Query>
  ),
  ThreadList
);
