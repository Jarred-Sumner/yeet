import { fromPairs, sum, Cancelable } from "lodash";
import * as React from "react";
import {
  FlatList as RNFlatList,
  StyleSheet,
  View,
  ViewabilityConfig,
  InteractionManager
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, { Easing } from "react-native-reanimated";
import { SCREEN_DIMENSIONS, TOP_Y, BOTTOM_Y } from "../../../config";
import { PostFragment } from "../../lib/graphql/PostFragment";
import { scaleToWidth, isTapInside } from "../../lib/Rect";
import { SPACING } from "../../lib/styles";
import { Avatar } from "../Avatar";
import FlatList, { ScrollView } from "../FlatList";
import MediaPlayer from "../MediaPlayer";
import { SemiBoldText } from "../Text";
import { LikeCountButton } from "./LikeCountButton";
import { runTiming } from "../../lib/animations";
import {
  debounce,
  invert,
  orderBy,
  sortBy,
  toPairs,
  first,
  chain,
  filter
} from "lodash";
import {
  BaseButton,
  PanGestureHandler,
  TouchableHighlight,
  State
} from "react-native-gesture-handler";
import { boxBox as intersects } from "intersects";
import { Rectangle } from "../../lib/Rectangle";
import { IconButtonEllipsis } from "../Button";

const BORDER_RADIUS = 24;
const AVATAR_SIZE = 24;

enum LayerZ {
  player = 0,
  gradient = 1,
  metadata = 2,
  paused = 3
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    position: "relative"
  },
  wrapper: { flex: 1 },
  player: {
    borderRadius: BORDER_RADIUS,
    zIndex: 0
  },
  gradient: {
    position: "absolute",
    zIndex: LayerZ.gradient
  },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    zIndex: LayerZ.metadata
  },
  profile: {
    flexDirection: "row",
    padding: SPACING.normal
  },
  topGradient: {
    top: 0,
    left: 0,
    right: 0
  },
  bottomGradient: {
    bottom: 0,
    left: 0,
    right: 0
  },
  topRight: {
    justifyContent: "flex-end",

    flexDirection: "row"
  },
  username: {
    marginLeft: SPACING.half,
    alignSelf: "center",
    color: "white",
    // opacity: 0.7,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowRadius: 3,
    textShadowOffset: {
      width: 0,
      height: 2
    }
  },

  avatarContainer: {
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowRadius: 18,
    shadowColor: "black",
    shadowOpacity: 0.25,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE
  },
  count: {
    position: "absolute",
    bottom: 24,
    zIndex: LayerZ.metadata,
    right: 0,
    paddingHorizontal: 20,
    justifyContent: "flex-end",
    alignItems: "flex-end"
  },
  ellipsis: {
    width: AVATAR_SIZE + SPACING.normal * 2,
    height: AVATAR_SIZE + SPACING.normal * 2,
    alignItems: "center",
    justifyContent: "center"
  },
  pausedOverlay: {
    position: "absolute",
    zIndex: LayerZ.paused,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1F1F1F"
  }
});

const ITEM_SEPARATOR_HEIGHT = 8;

const OverlayGradient = ({ width, height = 84, style, flipped }) => {
  const COLORS = ["rgba(31, 31, 31, 0.65)", "rgba(35, 35, 35, 0)"];
  const colors = flipped ? COLORS.reverse() : COLORS;
  return (
    <LinearGradient
      style={style}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0.2, 1.0]}
      pointerEvents="none"
      width={width}
      height={height}
      colors={colors}
    />
  );
};

const FADE_OVERLAY = 0.6;

const scrollOpacityAnimation = Animated.proc(
  (
    prevOffset,
    snapOffset,
    height,
    scrollY,
    isScrolling,
    visiblePostIDValue,
    visibleID
  ) =>
    Animated.cond(
      Animated.eq(isScrolling, 1),
      Animated.interpolate(scrollY, {
        inputRange: [prevOffset, snapOffset, Animated.add(snapOffset, height)],
        outputRange: [
          Animated.cond(Animated.greaterThan(prevOffset, 0), FADE_OVERLAY, 0),
          0,
          FADE_OVERLAY
        ],
        extrapolate: Animated.Extrapolate.CLAMP
      }),
      Animated.cond(Animated.eq(visiblePostIDValue, visibleID), 0, FADE_OVERLAY)
    )
);

const calculatePostHeight = (post: PostFragment) =>
  scaleToWidth(SCREEN_DIMENSIONS.width, post.media).height;

const PostCard = ({
  post,
  paused,
  snapOffset,
  snapOffsetValue,
  height,
  topInset,
  prevOffset,
  index,
  onPress,
  scrollY,
  contentHeight,
  width,
  onPressLike,
  visiblePostIDValue,
  onPressProfile,
  isScrolling,
  onPressEllipsis
}: {
  post: PostFragment;
  paused: boolean;
  width: number;
  height: number;
}) => {
  const [manuallyPaused, setManuallyPased] = React.useState(false);
  const mediaPlayerRef = React.useRef();
  const handlePress = React.useCallback(() => {
    onPress(post, index);
  }, [onPress, post, index]);

  const handlePressProfile = React.useCallback(() => {
    onPressProfile(post.profile);
  }, [post.profile]);

  const handlePressLike = React.useCallback(() => {
    onPressLike(post.id);
  }, [post.id]);

  const handlePressEllipsis = React.useCallback(() => {
    onPressEllipsis(post, mediaPlayerRef);
  }, [post.id, mediaPlayerRef]);

  const mediaPlayerStyles = React.useMemo(
    () => [StyleSheet.absoluteFill, styles.player, { width, height }],
    [width, height, styles]
  );

  const sheetStyles = React.useMemo(() => {
    return [
      styles.pausedOverlay,
      { width, height },
      {
        opacity: scrollOpacityAnimation(
          prevOffset,
          snapOffset,
          height,
          scrollY,
          isScrolling,
          visiblePostIDValue,
          post.id.hashCode()
        )
      }
    ];
  }, [
    prevOffset,
    snapOffset,
    height,
    scrollY,
    isScrolling,
    visiblePostIDValue,
    post.id
  ]);

  const sources = React.useMemo(() => [post.media], [post.media]);

  return (
    <TouchableHighlight disabled={!paused} onPress={handlePress}>
      <Animated.View style={[styles.container, { width, height }]}>
        <MediaPlayer
          sources={sources}
          paused={manuallyPaused || paused}
          id={`${post.id}-player`}
          autoPlay={false}
          ref={mediaPlayerRef}
          // sharedId={postElementId(post)}
          borderRadius={BORDER_RADIUS}
          style={mediaPlayerStyles}
        />

        <OverlayGradient
          width={width}
          height={84}
          style={[
            styles.gradient,
            styles.topGradient,
            {
              width,
              height: 84
            }
          ]}
        />

        <OverlayGradient
          width={width}
          height={84}
          flipped
          style={[
            styles.gradient,
            styles.bottomGradient,
            {
              width,
              height: 84
            }
          ]}
        />

        <View style={styles.top}>
          <TouchableHighlight disabled={paused} onPress={handlePressProfile}>
            <View style={styles.profile}>
              <View style={styles.avatarContainer}>
                <Avatar
                  url={post.profile.photoURL}
                  label={post.profile.username}
                  size={AVATAR_SIZE}
                />
              </View>

              <SemiBoldText style={styles.username}>
                {post.profile.username}
              </SemiBoldText>
            </View>
          </TouchableHighlight>

          <View style={styles.topRight}>
            <IconButtonEllipsis
              onPress={handlePressEllipsis}
              style={styles.ellipsis}
              vertical
              size={18}
            />
          </View>
        </View>

        <Animated.View
          style={[
            styles.count
            // {
            //   transform: [
            //     {
            //       translateY: scrollY.interpolate({
            //         inputRange: [offset - topInset, offset + height - topInset],
            //         outputRange: [, -10],
            //         extrapolate: Animated.Extrapolate.CLAMP
            //       })
            //     }
            //   ]
            // }
          ]}
        >
          <LikeCountButton size={28} id={post.id} onPress={handlePressLike} />
        </Animated.View>

        <Animated.View pointerEvents="none" style={sheetStyles}></Animated.View>
      </Animated.View>
    </TouchableHighlight>
  );
};

const listStyles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    overflow: "visible"
  },
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
      this.getItemLayout(this.props.posts, index).offset
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
        index={index}
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
    const { posts, refreshing, topInset = 0, renderHeader } = this.props;

    return (
      <PanGestureHandler
        onHandlerStateChange={this.handlePan}
        ref={this.panRef}
        simultaneousHandlers={[this.flatListRef]}
      >
        <Animated.View style={styles.wrapper}>
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
