import { Cancelable, fromPairs, orderBy, sum } from "lodash";
import * as React from "react";
import {
  FlatList as RNFlatList,
  StyleSheet,
  View,
  ViewabilityConfig,
  InteractionManager
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
import { MediaPlayerPauser } from "../MediaPlayer";
import {
  ViewThread_postThread_posts_data_profile,
  ViewThread_postThread_posts_data
} from "../../lib/graphql/ViewThread";
import { runDelay } from "react-native-redash";
import { throttle, debounce, invert, memoize } from "lodash";
import { runTiming } from "../../lib/animations";

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

type State = {
  hasScrolledToInitialPost: boolean;
  visibleIDs: {
    [key: string]: true;
  };
};

type Props = {
  initialPostId: string | null;
  topInset: number;
  bottomInset: number;
  posts: Array<PostFragment>;
  onPressLike: Function;
  composingPostId: string | null;
  keyboardVisibleValue: Animated.Node<number>;
  onPressProfile: Function;
  onPressPostEllipsis: Function;
};

export class PostFlatList extends React.Component<Props, State> {
  static defaultProps = {
    initialPostId: null,
    topInset: 0,
    bottomInset: 0
  };

  constructor(props: Props) {
    super(props);

    this.state = { visibleIDs: {}, hasScrolledToInitialPost: false };

    this.topInset = props.topInset;
    this.bottomInset = BOTTOM_Y + props.bottomInset;

    this.contentInset = {
      top: this.topInset,
      left: 0,
      right: 0,
      bottom: this.bottomInset
    };

    this.contentOffset = {
      y: props.topInset * -1,
      x: 0
    };

    if (props.posts.length > 0) {
      const initialPostIndex = 0;

      const initialPost = props.posts[initialPostIndex];

      if (initialPost) {
        this.initialPostIndex = initialPostIndex;
        this.visiblePostIDValue = new Animated.Value(initialPost.id.hashCode());

        this.state = {
          visibleIDs: { [initialPost.id]: true },
          hasScrolledToInitialPost: false
        };
      }
    }

    if (!this.visiblePostIDValue) {
      this.visiblePostIDValue = new Animated.Value(-1);
    }

    this.updateSnapOffsets();
  }

  initialPostIndex = 0;

  flatListRef = React.createRef<RNFlatList<PostFragment>>();

  snapOffset = new Animated.Value<number>(0);

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
  invertedSnapOffsets: { [id: number]: string } = {};
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
    this.invertedSnapOffsets = invert(this.snapOffsets);
    this.snapToOffsets = Object.values(this.snapOffsets);
  };

  componentDidUpdate(prevProps) {
    if (
      prevProps.posts !== this.props.posts ||
      this.props.posts.length !== prevProps.posts.length
    ) {
      this.updateSnapOffsets();

      const lastIndex = this.props.posts.length - 1;

      // if (lastIndex > -1) {
      //   const post = this.props.posts[lastIndex];
      //   const lastOffset = this.snapOffsets[post.id];
      //   this.bottomInset =
      //     BOTTOM_Y +
      //     this.props.bottomInset +
      //     (lastOffset % SCREEN_DIMENSIONS.height);
      //   this.updateContentInset();
      //   this.flatListRef.current.setNative ({
      //     contentInset: this.contentInset
      //   });
      // }

      if (
        this.props.posts.length > 0 &&
        !this.state.hasScrolledToInitialPost &&
        this.props.initialPostId
      ) {
        this.snapToInitialPost();
      }
    }
  }

  componentDidMount() {
    if (
      this.props.posts.length > 0 &&
      !this.state.hasScrolledToInitialPost &&
      this.props.initialPostId
    ) {
      this.snapToInitialPost();
      this.interactionTask = null;
    }
  }

  snapToInitialPost = () => {
    const { initialPostId, posts } = this.props;
    const { hasScrolledToInitialPost } = this.state;

    if (hasScrolledToInitialPost) {
      return;
    }

    if (initialPostId) {
      const index = posts.findIndex(post => post.id === initialPostId);
      const post = posts[index];

      if (post) {
        this.snapToIndex(post, index, false, {
          hasScrolledToInitialPost: true
        });
      }
    }
  };

  onScrollEndCallback: Function | null = null;

  renderItem = ({ item, index }) => {
    const height = calculatePostHeight(item);

    const paused =
      this.props.posts.length === 1 ? false : !this.state.visibleIDs[item.id];
    const prevOffset =
      this.snapOffsets[this.props.posts[Math.max(index - 1, 0)]?.id] ?? 0;

    return (
      <PostCard
        width={SCREEN_DIMENSIONS.width}
        paused={paused || this.props.showComposer}
        height={height}
        isComposing={this.props.composingPostId === item.id}
        autoPlay={this.props.initialPostIndex === index}
        contentHeight={this.contentHeight}
        keyboardVisibleValue={this.props.keyboardVisibleValue}
        index={index}
        openComposer={this.props.openComposer}
        onPressLike={this.props.onPressLike}
        isScrolling={this.isScrollingValue}
        snapOffset={this.snapOffsets[item.id]}
        prevOffset={prevOffset}
        snapOffsetValue={this.snapOffset}
        scrollY={this.scrollY}
        onPress={this.snapToIndex}
        visiblePostID={item.id.hashCode()}
        visiblePostIDValue={this.visiblePostIDValue}
        onPressProfile={this.props.onPressProfile}
        onPressEllipsis={this.props.onPressPostEllipsis}
        post={item}
      />
    );
  };

  // viewabilityConfig: ViewabilityConfig = {
  //   itemVisiblePercentThreshold: 65,
  //   waitForInteraction: false
  // };

  handleSnap = (snapY, scrollY) => {
    // if (!this.isScrollTrackingEnabled) {
    //   typeof this.onScrollEndCallback === "function" &&
    //     this.onScrollEndCallback();
    //   return;
    // }

    let id = this.invertedSnapOffsets[scrollY];

    if (!id) {
      const visibleRect = new Rectangle(
        0,
        snapY,
        SCREEN_DIMENSIONS.width,
        this.height
      );

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

      let [_id, rect] = viewableItems[0] ?? [null];
      id = _id;
    }

    if (id && !this.state.visibleIDs[id]) {
      this.setVisibleID(id);
    }

    this._scrollEnded();
  };

  handleThrottledSnap = throttle(this.handleSnap, 12);
  // handleThrottledSnap = this.handleSnap;

  _scrollEnded = debounce(
    () => {
      window.requestAnimationFrame(() => {
        this.isScrollingValue.setValue(0);
      });
    },
    60,
    { trailing: true }
  );

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

  handleEndDrag = ([snapOffset, scrollY]) => {
    if (this.skipNextScrollEndDrag > -1) {
      this.scrollY.setValue(this.skipNextScrollEndDrag);
      this.snapOffset.setValue(this.skipNextScrollEndDrag);
      this.skipNextScrollEndDrag = -1;
      return;
    }
    this.handleThrottledSnap(snapOffset, scrollY);
  };

  handleMomentumScrollEnd = ([snapOffset, scrollY]) => {
    console.log("SCROLL END", snapOffset, scrollY);
    this.handleSnap(snapOffset, scrollY);

    if (typeof this.handleThrottledSnap.cancel === "function") {
      this.handleThrottledSnap.cancel();
    }
  };

  contentOffset = {
    x: 0,
    y: 0
  };
  scrollY = new Animated.Value<number>(0);
  isScrollTrackingEnabled = true;

  onScroll = Animated.event(
    [
      {
        nativeEvent: ({
          contentOffset: { y: scrollY },
          layoutMeasurement: { height: contentHeight }
        }) =>
          Animated.block([
            // Animated.set(this.snapOffset, scrollY),
            Animated.set(this.scrollY, scrollY),
            Animated.set(this.isScrollingValue, 1),
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
            Animated.set(this.isScrollingValue, 1),
            Animated.call([this.snapOffset, this.scrollY], this.handleEndDrag)
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
      // Animated.set(this.isScrollingValue, 0),
      Animated.call(
        [this.snapOffset, this.scrollY],
        this.handleMomentumScrollEnd
      )
    ]);

  onMomentumScrollBegin = ({
    nativeEvent: {
      contentOffset: { y }
    }
  }) => Animated.block([Animated.set(this.isScrollingValue, 1)]);

  visiblePostIDValue: Animated.Value<number>;

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

  visiblePostClock = new Animated.Clock();

  _setVisibleID = (id: string, additionalState: Partial<State> = {}) => {
    console.log("SET", id);
    this.visiblePostIDValue.setValue(id.hashCode());

    this.setState({
      ...additionalState,
      visibleIDs: {
        [id]: true
      }
    });
  };
  setVisibleID = debounce(this._setVisibleID, 16);

  topInset = TOP_Y;
  bottomInset = SPACING.double;

  contentInset = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  };

  interactionTask: Partial<Cancelable> | null = null;

  scrollToId = (id: string) => {
    const index = this.props.posts.findIndex(post => post.id === id);
    this.snapToIndex(this.props.posts[index], index, true);
  };

  skipNextScrollEndDrag: number = -1;

  snapToIndex = (
    post: PostFragment,
    index: number,
    animated: boolean = true,
    additionalState: Partial<State> = {}
  ) => {
    const { id } = post;
    const offset = this.snapOffsets[id];

    this.skipNextScrollEndDrag = offset;
    this.flatListRef.current.scrollToOffset({
      animated,
      offset
    });

    this.setVisibleID(id, additionalState);

    // window.requestAnimationFrame(() => {
    //   // this.isScrollingValue.setValue(1);

    //   this.setVisibleID(id, additionalState);
    //   this.scrollY.setValue(offset);
    //   this.snapOffset.setValue(offset);
    // });
  };

  componentWillUnmount() {
    if (this.interactionTask) {
      this.interactionTask.cancel();
    }

    this._scrollEnded.cancel();
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

  // handlePan = Animated.event(
  //   [
  //     {
  //       nativeEvent: {
  //         state: state =>
  //           Animated.set(this.isScrollingValue, state === State.ACTIVE ? 1 : 0)
  //       }
  //     }
  //   ],
  //   { useNativeDriver: true }
  // );

  listStyle = [
    listStyles.list,
    {
      marginTop: this.topInset,
      paddingBottom: this.bottomInset,
      height: this.height
    }
  ];

  simultaneousListHandlers = [this.panRef];

  renderFooterComponent = () => {
    if (this.props.posts.length < 2) {
      return null;
    }

    const { offset, length } = this.getItemLayout(
      this.props.posts,
      this.props.posts.length - 1
    );

    const bottom = offset + length;

    let height;

    if (bottom > SCREEN_DIMENSIONS.height) {
      height = Math.abs(
        (bottom % SCREEN_DIMENSIONS.height) -
          length -
          this.contentInset.top +
          ITEM_SEPARATOR_HEIGHT
      );
    } else {
      height = Math.abs(
        SCREEN_DIMENSIONS.height +
          bottom -
          length -
          this.contentInset.top +
          ITEM_SEPARATOR_HEIGHT
      );
    }

    // if (offset > SCREEN_DIMENSIONS.height) {
    //   height = Math.abs(
    //     SCREEN_DIMENSIONS.height -
    //       length -
    //       (offset % SCREEN_DIMENSIONS.height) -
    //       this.contentInset.bottom -
    //       this.contentInset.top
    //   );
    // } else {
    //   height = Math.abs(
    //     SCREEN_DIMENSIONS.height -
    //       length -
    //       this.contentInset.top -
    //       this.contentInset.bottom -
    //       ITEM_SEPARATOR_HEIGHT -
    //       (offset + length - SCREEN_DIMENSIONS.height)
    //   );
    // }

    console.log({ height });
    return (
      <View
        style={{
          height,
          width: 1
        }}
      />
    );
  };

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
        enabled={scrollEnabled}
        simultaneousHandlers={[this.flatListRef]}
      >
        <Animated.View style={listStyles.wrapper}>
          <MediaPlayerPauser nodeRef={this.flatListRef}>
            <FlatList
              renderItem={this.renderItem}
              data={posts}
              refreshing={refreshing}
              ref={this.flatListRef}
              contentOffset={this.contentOffset}
              contentInset={this.contentInset}
              simultaneousHandlers={this.simultaneousListHandlers}
              contentInsetAdjustmentBehavior="never"
              viewabilityConfig={this.viewabilityConfig}
              removeClippedSubviews={false}
              scrollEventThrottle={1}
              scrollEnabled={scrollEnabled}
              onScroll={this.onScroll}
              onScrollEndDrag={this.onScrollEndDrag}
              onScrollBeginDrag={this.onMomentumScrollBegin}
              onMomentumScrollEnd={this.onMomentumScrollEnd}
              onMomentumScrollBegin={this.onMomentumScrollBegin}
              onScrollToTop={this.handleScrollToTop}
              scrollToOverflowEnabled
              directionalLockEnabled
              style={this.listStyle}
              extraData={this.props.extraData}
              vertical
              keyboardDismissMode="interactive"
              keyExtractor={this.keyExtractor}
              ListFooterComponent={this.renderFooterComponent}
              keyboardShouldPersistTaps="always"
              getItemLayout={this.getItemLayout}
              ItemSeparatorComponent={ItemSeparatorComponent}
              onEndReached={this.handleEndReached}
            />
          </MediaPlayerPauser>
        </Animated.View>
      </PanGestureHandler>
    );
  }
}
