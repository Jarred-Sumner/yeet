import { Cancelable, fromPairs, orderBy, sum } from "lodash";
import * as React from "react";
import {
  FlatList as RNFlatList,
  StyleSheet,
  View,
  ViewabilityConfig
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { BOTTOM_Y, SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import { PostFragment } from "../../lib/graphql/PostFragment";
import { Rectangle } from "../../lib/Rectangle";
import { SPACING } from "../../lib/styles";
import FlatList from "../FlatList";
import { calculatePostHeight, PostCard } from "../Posts/PostCard";
import { AnimatedKeyboardTracker } from "../AnimatedKeyboardTracker";

const ITEM_SEPARATOR_HEIGHT = 8;

const listStyles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    overflow: "visible"
  },
  wrapper: { flex: 1 },
  separator: {
    height: ITEM_SEPARATOR_HEIGHT,
    width: 1
  }
});

const ItemSeparatorComponent = () => <View style={listStyles.separator} />;

export class PostFlatList extends React.Component {
  static defaultProps = {
    initialPostIndex: 0,
    topInset: 0,
    bottomInset: 0
  };

  constructor(props) {
    super(props);
    this.state = { visibleIDs: {} };

    this.topInset = TOP_Y + props.topInset;
    this.bottomInset = BOTTOM_Y + props.bottomInset;

    this.contentInset = {
      top: props.topInset,
      left: 0,
      right: 0,
      bottom: props.bottomInset
    };

    this.contentOffset = {
      y: props.topInset * -1,
      x: 0
    };

    this.updateSnapOffsets();

    if (props.posts.length > 0) {
      const initialPost = props.posts[props.initialPostIndex];
      if (initialPost) {
        this.visiblePostIDValue = new Animated.Value(initialPost.id.hashCode());

        this.state = {
          visibleIDs: { [initialPost.id]: true }
        };
      }
    }
  }

  flatListRef = React.createRef<RNFlatList<PostFragment>>();

  snapOffset = new Animated.Value(0);

  getItemLayout = (_data, index) => {
    const offset = sum(
      _data.slice(0, index).map(row => calculatePostHeight(row))
    );

    const post = _data[index];

    const length = calculatePostHeight(post);

    return {
      length,
      offset: offset + ITEM_SEPARATOR_HEIGHT * index,
      index
    };
  };

  snapOffsets: { [id: string]: number } = {};
  isScrollingValue = new Animated.Value(0);
  snapToOffsets: Array<number> = [];
  contentHeight = new Animated.Value(0);
  snapBounds: { [key: string]: Rectangle };

  updateSnapOffsets = () => {
    let pairs = this.props.posts.map((post, index) => [
      post.id,
      this.getItemLayout(this.props.posts, index).offset - this.contentInset.top
    ]);

    this.snapBounds = fromPairs(
      this.props.posts.map((post, index) => {
        const { length: height, offset } = this.getItemLayout(
          this.props.posts,
          index
        );
        return [
          post.id,
          new Rectangle(0, offset, SCREEN_DIMENSIONS.width, height)
        ];
      })
    );

    this.snapOffsets = fromPairs(pairs);
    this.snapToOffsets = Object.values(this.snapOffsets);
  };

  componentDidUpdate(prevProps) {
    if (
      prevProps.posts !== this.props.posts ||
      this.props.posts.length !== prevProps.posts.length
    ) {
      this.updateSnapOffsets();

      if (
        Object.keys(this.state.visibleIDs).length === 0 &&
        this.props.posts.length > 0
      ) {
        this.snapToInitialPost();
      }
    }
  }

  snapToInitialPost = () => {
    const { initialPostIndex: index = 0 } = this.props;
    const post = this.props.posts[index];
    this.snapToIndex(post, index);
  };

  renderItem = ({ item, index }) => {
    const height = calculatePostHeight(item);

    const paused = !this.state.visibleIDs[item.id];
    const prevOffset =
      this.snapOffsets[this.props.posts[Math.max(index - 1, 0)]?.id] ?? 0;
    return (
      <PostCard
        width={SCREEN_DIMENSIONS.width}
        paused={paused}
        height={height}
        contentHeight={this.contentHeight}
        keyboardVisibleValue={this.props.keyboardVisibleValue}
        index={index}
        openComposer={this.props.openComposer}
        isScrolling={this.isScrollingValue}
        snapOffset={this.snapOffsets[item.id]}
        prevOffset={prevOffset}
        snapOffsetValue={this.snapOffset}
        scrollY={this.scrollY}
        onPress={this.snapToIndex}
        visiblePostID={item.id.hashCode()}
        visiblePostIDValue={this.visiblePostIDValue}
        post={item}
      />
    );
  };

  viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 65,
    waitForInteraction: false
  };

  handleSnap = ([snapY, scrollY]) => {
    const visibleRect = new Rectangle(
      0,
      snapY,
      SCREEN_DIMENSIONS.width,
      this.height
    );

    const shouldScrollToCompletion = snapY === scrollY;

    const viewableItems = orderBy(
      Object.entries(this.snapBounds)
        .filter(([id, rectangle]) => visibleRect.intersects(rectangle))
        .map(([id, rectangle]) => {
          return [
            id,
            rectangle,
            visibleRect.intersect(rectangle).height / rectangle.height
          ];
        }),
      ["[2]"],
      ["desc"]
    );

    let [id, rect] = viewableItems[0] ?? [null];

    if (id) {
      this.setVisibleID(id);
    }
  };

  autoSnapToOffset = ([offset]) => {
    const [id] =
      Object.entries(this.snapOffsets).find(
        ([id, _offset]) => offset === _offset
      ) ?? [];

    if (id) {
      this.flatListRef.current.scrollToOffset({
        animated: true,
        offset: offset + this.topInset
      });

      this.setVisibleID(id);
    }
  };

  contentOffset = {
    x: 0,
    y: 0
  };
  scrollY = new Animated.Value(0);

  onScroll = Animated.event(
    [
      {
        nativeEvent: ({
          contentOffset: { y: scrollY },
          layoutMeasurement: { height: contentHeight }
        }) =>
          Animated.block([
            Animated.set(this.isScrollingValue, 1),
            Animated.set(this.scrollY, scrollY),
            Animated.set(this.contentHeight, contentHeight)
          ])
      }
    ],
    { useNativeDriver: true }
  );

  onScrollEndDrag = Animated.event(
    [
      {
        nativeEvent: ({ targetContentOffset: { y: snapOffset } }) =>
          Animated.block([
            Animated.set(this.snapOffset, snapOffset),
            Animated.call([this.snapOffset, this.scrollY], this.handleSnap)
          ])
      }
    ],
    { useNativeDriver: true }
  );

  onMomentumScrollEnd = ({
    nativeEvent: {
      contentOffset: { y }
    }
  }) =>
    Animated.block([
      Animated.set(this.scrollY, y),
      Animated.set(this.snapOffset, y),
      Animated.set(this.isScrollingValue, 0),
      Animated.call([this.snapOffset, this.scrollY], this.handleSnap)
    ]);

  onMomentumScrollBegin = ({
    nativeEvent: {
      contentOffset: { y }
    }
  }) => Animated.block([Animated.set(this.isScrollingValue, 1)]);

  visiblePostIDValue = new Animated.Value(-1);

  keyExtractor = item => item.id;

  handleEndReached = () => {
    if (this.props.loading) {
      return;
    }

    // this.props.fetchMore({
    //   variables: {
    //     offset: this.props.offset
    //   },
    //   updateQuery: (
    //     previousResult: ViewThreads,
    //     { fetchMoreResult }: { fetchMoreResult: ViewThreads }
    //   ) => {
    //     const data = uniqBy(
    //       [
    //         ...previousResult.postThreads.data,
    //         ...fetchMoreResult.postThreads.data
    //       ],
    //       "id"
    //     );

    //     return {
    //       ...fetchMoreResult,
    //       postThreads: {
    //         ...fetchMoreResult.postThreads,
    //         data
    //       }
    //     };
    //   }
    // });
  };

  setVisibleID = (id: string) => {
    const entry = this.snapOffsets[id];
    this.visiblePostIDValue.setValue(id.hashCode());

    this.setState({
      visibleIDs: {
        [id]: true
      }
    });
  };

  topInset = TOP_Y;
  bottomInset = SPACING.double;

  contentInset = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  };

  interactionTask: Cancelable | null = null;

  scrollToId = (id: string) => {
    const index = this.props.posts.findIndex(post => post.id === id);
    this.snapToIndex(this.props.posts[index], index);
  };

  snapToIndex = (post: PostFragment, index: number) => {
    this.flatListRef.current.scrollToOffset({
      animated: true,
      offset: this.snapOffsets[post.id]
      // viewPosition: 0,
      // viewOffset: 0
    });

    this.setVisibleID(post.id);

    this.scrollY.setValue(this.snapOffsets[post.id]);
    this.snapOffset.setValue(this.snapOffsets[post.id]);
    this.isScrollingValue.setValue(0);
  };

  componentWillUnmount() {
    if (this.interactionTask) {
      this.interactionTask.cancel();
    }
  }

  scrollDirectionValue = new Animated.Value(1);

  handleScrollToTop = () => {
    const post = this.props.posts[0];
    if (post) {
      this.snapToIndex(post, 0);
    } else {
      this.flatListRef.current.scrollToOffset({
        offset: this.topInset * -1,
        animated: true
      });
    }
  };

  viewableIDs = [];

  get height() {
    return SCREEN_DIMENSIONS.height - this.bottomInset - this.topInset;
  }

  panRef = React.createRef<PanGestureHandler>();

  handlePan = Animated.event(
    [
      {
        nativeEvent: {
          state: state =>
            Animated.set(this.isScrollingValue, state === State.ACTIVE ? 1 : 0)
        }
      }
    ],
    { useNativeDriver: true }
  );

  listStyle = [
    listStyles.list,
    {
      marginTop: this.topInset,
      paddingBottom: this.bottomInset,
      height: this.height
    }
  ];

  simultaneousListHandlers = [this.panRef];

  render() {
    const {
      posts,
      refreshing,
      topInset = 0,
      renderHeader,
      scrollEnabled = true
    } = this.props;

    return (
      <PanGestureHandler
        onHandlerStateChange={this.handlePan}
        ref={this.panRef}
        simultaneousHandlers={[this.flatListRef]}
      >
        <Animated.View style={listStyles.wrapper}>
          <FlatList
            renderItem={this.renderItem}
            data={posts}
            refreshing={refreshing}
            ref={this.flatListRef}
            contentOffset={this.contentOffset}
            contentInset={this.contentInset}
            simultaneousHandlers={this.simultaneousListHandlers}
            contentInsetAdjustmentBehavior="never"
            initialScrollIndex={this.props.initialPostIndex || 0}
            viewabilityConfig={this.viewabilityConfig}
            removeClippedSubviews={false}
            scrollEventThrottle={1}
            scrollEnabled={scrollEnabled}
            onScroll={this.onScroll}
            onScrollEndDrag={this.onScrollEndDrag}
            onScrollBeginDrag={this.onScrollBeginDrag}
            onMomentumScrollEnd={this.onMomentumScrollEnd}
            onMomentumScrollBegin={this.onMomentumScrollBegin}
            onScrollToTop={this.handleScrollToTop}
            scrollToOverflowEnabled
            directionalLockEnabled
            style={this.listStyle}
            extraData={this.state}
            vertical
            keyboardDismissMode="interactive"
            keyExtractor={this.keyExtractor}
            keyboardShouldPersistTaps="always"
            getItemLayout={this.getItemLayout}
            ItemSeparatorComponent={ItemSeparatorComponent}
            onEndReached={this.handleEndReached}
          />
        </Animated.View>
      </PanGestureHandler>
    );
  }
}
