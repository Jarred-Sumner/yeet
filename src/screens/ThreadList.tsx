// @flow
import hoistNonReactStatics from "hoist-non-react-statics";
import * as React from "react";
import { Query } from "react-apollo";
import {
  Dimensions,
  StyleSheet,
  View,
  SectionList as RNSectionList
} from "react-native";
import { SafeAreaView } from "react-navigation";
import Animated, { Extrapolate } from "react-native-reanimated";
import { withNavigation } from "react-navigation";
import { BOTTOM_Y, TOP_Y, SCREEN_DIMENSIONS } from "../../config";
import { IconButton } from "../components/Button";
import {
  IconPlus,
  IconProfile,
  IconHeart,
  IconRemix
} from "../components/Icon";
import {
  ViewThreads,
  ViewThreads_postThreads
} from "../lib/graphql/ViewThreads";
import { SPACING, COLORS } from "../lib/styles";
import VIEW_THREADS_QUERY from "../lib/ViewThreads.graphql";
import {
  createNativeWrapper,
  BaseButton,
  FlatList as GestureFlatList
} from "react-native-gesture-handler";
import Media from "../components/PostList/ViewMedia";
import { range, max, min } from "lodash";
import { pxBoundsToPoint, scaleToWidth, BoundsRect } from "../lib/Rect";
import { SemiBoldText } from "../components/Text";
import { Avatar } from "../components/Avatar";
import { ProgressBarList, OverlayGradient } from "../components/PostList/Post";
import { SharedElement } from "react-navigation-shared-element";
import sectionListGetItemLayout from "react-native-section-list-get-item-layout";
import { clamp, onScroll, decay, runSpring } from "react-native-redash";
const LAYOUT_DIRECTION = "column-reverse";
const LAYOUT_DIRECTION_OFFSET = {
  column: BOTTOM_Y + 80 + TOP_Y,
  "column-reverse": TOP_Y + 60.5
}[LAYOUT_DIRECTION];

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

const threadStyles = StyleSheet.create({
  container: {
    position: "relative"
  },
  counts: {
    flexDirection: "row",
    alignItems: "center"
  },
  layer: {
    ...StyleSheet.absoluteFillObject
  },
  overlayLayer: {
    justifyContent: "space-between",
    zIndex: 2
  },
  profile: {
    flexDirection: "row",
    alignItems: "center"
  },
  footer: {
    flexDirection: "row",
    padding: SPACING.normal,
    justifyContent: "space-between"
  },
  header: {
    opacity: 1.0
  },
  progressBars: {
    height: 3
  },
  username: {
    fontSize: 20,
    marginLeft: SPACING.normal
  },
  likesCount: {
    color: "white",
    flexDirection: "row",
    alignItems: "center"
  },
  mediaLayer: {
    zIndex: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  gradientLayer: {
    zIndex: 1
  },
  remixCount: {
    color: "white",
    flexDirection: "row",
    justifyContent: "center",

    alignItems: "center",
    marginLeft: SPACING.normal
  },
  remixCountText: {
    marginLeft: SPACING.normal,

    fontSize: 20
  },
  likesCountText: {
    marginLeft: SPACING.normal,
    fontSize: 20
  }
});

const SeparatorComponent = () => (
  <View style={{ width: "100%", height: SPACING.normal }} collapsable={false} />
);

function runDecay(clock, value, velocity) {
  const state = {
    finished: new Animated.Value(0),
    velocity: new Animated.Value(0),
    position: new Animated.Value(0),
    time: new Animated.Value(0)
  };

  const config = { deceleration: 0.99 };

  return [
    Animated.cond(Animated.clockRunning(clock), 0, [
      Animated.set(state.finished, 0),
      Animated.set(state.velocity, velocity),
      Animated.set(state.position, value),
      Animated.set(state.time, 0),
      Animated.startClock(clock)
    ]),
    Animated.set(state.position, value),
    Animated.decay(clock, state, config),
    Animated.cond(state.finished, Animated.stopClock(clock)),
    state.position
  ];
}

const ThreadCell = ({
  thread,
  onPress,
  width: _width,
  spacing,
  isLonelyCell = false,
  height,
  paused,
  isLeftSide,
  scrollVelocity,
  backgroundColor,
  scrollYOffset,
  offset,
  isVisible,
  isNextVisible,
  isPreviousVisible
}: {
  thread: ViewThreads_postThreads;
  onPress: Function;
  scrollYOffset: Animated.Value<number>;
  offset: number;
  width: number;
  height: number;
}) => {
  const [hasLoaded, setLoaded] = React.useState(false);
  const width = _width;
  console.time(
    `Loaded ${thread.firstPost.media.id} ${thread.firstPost.media.mimeType}`
  );
  const handleLoad = React.useCallback(() => {
    setLoaded(true);
    console.timeEnd(
      `Loaded ${thread.firstPost.media.id} ${thread.firstPost.media.mimeType}`
    );
  }, [setLoaded]);

  const handlePress = React.useCallback(() => {
    onPress(thread);
  }, [thread, onPress]);

  const profile = thread.firstPost.profile;

  const handleFinish = React.useCallback(() => {}, []);

  const minScrollOffset = offset;
  const maxScrollOffset = offset + height;

  const mightBeVisible = isVisible || isNextVisible || isPreviousVisible;

  const { height: trueHeight } = scaleToWidth(
    width,
    pxBoundsToPoint(thread.firstPost.media, thread.firstPost.media.pixelRatio)
  );

  return (
    <BaseButton exclusive={false} onPress={handlePress}>
      <Animated.View
        style={[
          threadStyles.container,
          {
            width: _width,
            height,
            backgroundColor
          }
        ]}
      >
        <Animated.View style={[threadStyles.layer, threadStyles.mediaLayer]}>
          <SharedElement
            style={{ width, height: trueHeight }}
            id={`post.${thread.firstPost.id}.media`}
          >
            <Media
              containerWidth={_width}
              containerHeight={trueHeight}
              // translateY={translateYValue.current}
              width={width}
              height={trueHeight}
              onLoad={handleLoad}
              size="full"
              hideContent={!mightBeVisible}
              paused={paused || !isVisible}
              media={thread.firstPost.media}
            />
          </SharedElement>
        </Animated.View>

        <View style={[threadStyles.layer, threadStyles.gradientLayer]}>
          <OverlayGradient
            width={width}
            height={height}
            layoutDirection="column-reverse"
          />
        </View>

        <View style={[threadStyles.layer, threadStyles.overlayLayer]}>
          <SafeAreaView
            forceInset={{
              top: "always",
              bottom: "never",
              left: "never",
              right: "never"
            }}
          >
            <View style={[threadStyles.header, { width }]}>
              <View style={threadStyles.progressBars}>
                {(isNextVisible || isPreviousVisible || isVisible) &&
                  thread.postsCount > 1 && (
                    <ProgressBarList
                      postsCount={thread.postsCount}
                      currentPostIndex={0}
                      loopIndex={0}
                      stopped={!isVisible}
                      size="large"
                      onFinish={handleFinish}
                      width={width - SPACING.normal * 2}
                    />
                  )}
              </View>
            </View>
          </SafeAreaView>

          <SafeAreaView
            forceInset={{
              bottom: "always",
              top: "never",
              left: "never",
              right: "never"
            }}
            style={threadStyles.footer}
          >
            <View style={threadStyles.profile}>
              <Avatar
                label={profile.username}
                size={32}
                url={profile.photoURL}
              />
              <SemiBoldText style={threadStyles.username}>
                {profile.username}
              </SemiBoldText>
            </View>

            <View style={threadStyles.counts}>
              <View style={threadStyles.likesCount}>
                <IconHeart size={20} color="#fff" />

                <SemiBoldText style={threadStyles.likesCountText}>
                  {thread.firstPost.likesCount}
                </SemiBoldText>
              </View>
              <View style={threadStyles.remixCount}>
                <IconRemix size={28} color="#fff" />

                <SemiBoldText style={threadStyles.remixCountText}>
                  {thread.postsCount - 1}
                </SemiBoldText>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Animated.View>
    </BaseButton>
  );
};

const ThreadSectionCell = ({
  section,
  index,
  visibleIndex,
  scrollYOffset,
  onPress
}) => {
  const renderCell = React.useCallback(
    thread => {
      return (
        <ThreadCell
          maxHeight={section.height}
          height={section.height}
          width={section.width}
          isLeftSide={index % 2 === 0}
          onPress={onPress}
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
    [section, visibleIndex, index, onPress]
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
      snapToOffsets: [],
      postThreads: props.postThreads
    };
  }

  scrollYOffset = new Animated.Value<number>(-1 * TOP_Y);

  getItemLayout = (data: Array<ThreadSection>, index: number) => {
    return {
      // length: data[index].height + SPACING.normal,
      length: data[index].height,
      offset: data[index].offset,
      index
    };
  };

  static getDerivedStateFromProps(props: Props, state: State) {
    const newState: Partial<State> = {};

    if (props.postThreads.length !== state.postThreads.length) {
      newState.postThreads = props.postThreads;

      newState.sections = createThreadSections(props.postThreads);
      newState.snapToOffsets = newState.sections.map(
        ({ offset, height }, index) => offset + height
      );
    }

    return newState;
  }

  openPlus = () => this.props.navigation.navigate("NewPostStack");

  handlePressSend = post => {
    const thread = this.state.postThreads[this.state.threadOffset];

    this.props.navigation.push("ReplyStack", {
      threadId: thread.id,
      thread: thread,
      post
    });
  };
  handlePressDownload = () => {};

  keyExtractor = (item: ThreadSection, _index: number) =>
    item.data.map(thread => thread.id).join("-");

  handleOpenThread = (thread: ViewThreads_postThreads) => {
    this.props.navigation.navigate("ViewThread", {
      thread,
      threadId: thread.id
    });
  };

  handleRenderItem = ({
    item: section,
    index
  }: {
    index: number;
    item: ThreadSection;
  }) => {
    return (
      <ThreadSectionCell
        onPress={this.handleOpenThread}
        visibleIndex={this.state.visibleIndex}
        scrollYOffset={this.scrollYOffset}
        section={section}
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
          snapToOffsets={this.state.snapToOffsets}
          onScroll={this.onScroll}
          onViewableItemsChanged={this.onViewableItemsChanged}
          extraData={this.state.visibleIndex}
          scrollEventThrottle={0}
          style={{ flex: 1 }}
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
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  postList: {},
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
    backgroundColor: COLORS.primary,
    flexDirection: LAYOUT_DIRECTION
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
