import * as React from "react";
import { View, StyleSheet, ImageSourcePropType } from "react-native";
import Animated, {
  Transitioning,
  TransitioningView,
  Transition,
  Extrapolate
} from "react-native-reanimated";
import {
  PostFragment,
  PostFragment_profile
} from "../../lib/graphql/PostFragment";
import { SCREEN_DIMENSIONS } from "../../../config";
import { sumBy, last, memoize, range } from "lodash";
import { Avatar } from "../Avatar";
import { SPACING } from "../../lib/styles";
import { get } from "react-native-redash";

const MAX_WIDTH = SCREEN_DIMENSIONS.width - SPACING.double * 2;

const KNOB_SIZE = 12;
const AVATAR_WIDTH = 24;

type SeekbarSegment = {
  width: number;
  duration: number;
  offset: number;
  id: string;
  index: number;
  profile: PostFragment_profile;
};

const _getSegment = (
  post: PostFragment,
  offset: number,
  index: number,
  widthPerSecond: number
): [number, SeekbarSegment] => {
  const width = widthPerSecond * post.autoplaySeconds;
  const segment: SeekbarSegment = {
    offset,
    width,
    index,
    duration: post.autoplaySeconds,
    id: post.id,
    profile: post.profile
  };
  offset = offset + width;
  return [offset, segment];
};

const getSegment = memoize(_getSegment);

const getSegments = (posts: Array<PostFragment>) => {
  let offset = 0;
  const totalDuration = sumBy(posts, "autoplaySeconds");
  // let widthPerSecond =
  //   totalDuration < SECONDS_PER_SCREEN
  //     ? SCREEN_DIMENSIONS.width / totalDuration
  //     : ;

  let widthPerSecond = MAX_WIDTH / totalDuration;

  if (posts.length === 1) {
    const post = last(posts);
    return [_getSegment(post, 0, 0, widthPerSecond)[1]];
  } else if (posts.length === 0) {
    return [];
  }

  const segments = posts.map((post, index) => {
    const [_newOffset, segment] = _getSegment(
      post,
      offset,
      index,
      widthPerSecond
    );
    offset = _newOffset;
    return segment;
  });

  const totalWidth = totalDuration * widthPerSecond;

  const post = last(posts);
  const segment = last(segments);

  segment.width = MAX_WIDTH + segment.offset / MAX_WIDTH;
  console.log({ width: segment.width });
  return segments;
};

const seekbarStyles = StyleSheet.create({
  wrapper: {
    width: MAX_WIDTH,
    justifyContent: "center",
    flex: 0
  },
  container: {
    flexDirection: "row",
    position: "relative",
    flex: 0,
    borderRadius: 6
  },
  progressBarBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    position: "absolute",
    top: 0,
    left: 0,
    height: 6,
    borderRadius: 6
    // overflow: "hidden"
  },
  avatar: {
    width: AVATAR_WIDTH,
    height: AVATAR_WIDTH,
    position: "absolute",
    top: (AVATAR_WIDTH - 6) / -2,
    opacity: 0.8
  },
  progressBar: {
    position: "absolute",
    overflow: "hidden",
    top: 0,
    bottom: 0,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center"
  },
  knobContainer: {
    height: 6,
    flexDirection: "row",
    alignItems: "center"
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: "#ccc"
  }
});

const AvatarSegment = React.forwardRef(
  (
    { segment, translateXValue, negativeOffset, indexValue, segmentRefs },
    ref
  ) => {
    return (
      <Animated.View
        key={segment.id}
        style={[
          seekbarStyles.avatar,
          {
            opacity: Animated.block([
              Animated.cond(
                Animated.greaterThan(indexValue, segment.index - 1),
                0,
                1
              )
            ]),
            transform: [
              {
                translateX: negativeOffset
              },
              {
                translateX: segment.offset - AVATAR_WIDTH / 2
              }
            ]
          }
        ]}
      >
        <Avatar
          size={AVATAR_WIDTH}
          url={segment.profile.photoURL}
          ref={segmentRefs[segment.id]}
          label={segment.profile.username}
        />
      </Animated.View>
    );
  }
);

const SeekbarComponent = ({
  segments,
  position,
  offsetValue: translateXValue,
  offset: translateX,
  currentIndex,
  indexValue,
  segmentRefs,
  changingPostValue
}: {
  segments: Array<SeekbarSegment>;
  position: Animated.Value<number>;
  offset: number;
  offsetValue: Animated.Value<number>;
}) => {
  const { width: _width = 0, offset = 0 } = last(segments) || {};

  const negativeOffset = React.useRef(Animated.multiply(translateXValue, -1));

  const totalWidth = _width + offset;

  return (
    <View style={seekbarStyles.wrapper}>
      {/* <Animated.Code
        exec={Animated.block([
          Animated.set(
            moveBackWhileTransitioningPost.current,
            Animated.cond(
              Animated.lessThan(changingPostValue, 1),
              changingPostValue.interpolate({
                inputRange: [0, 1],
                outputRange: [Animated.multiply(position, -1), 0],
                extrapolate: Animated.Extrapolate.CLAMP
              }),
              0
            )
          )
        ])}
      /> */}
      <Animated.View
        style={[
          seekbarStyles.container,
          { width: totalWidth },
          {
            transform: [
              { translateX: SPACING.normal },
              { translateX: negativeOffset.current }
            ]
          }
        ]}
      >
        <Animated.View
          style={[
            seekbarStyles.progressBarBackground,
            {
              width: _width,
              overflow: "hidden",
              transform: [
                {
                  translateX: translateXValue
                }
              ]
            }
          ]}
        >
          <Animated.View
            style={[
              seekbarStyles.progressBar,
              {
                width: totalWidth,
                transform: [
                  {
                    translateX: totalWidth * -1
                  },

                  {
                    translateX: position
                  }
                ]
              }
            ]}
          ></Animated.View>
        </Animated.View>

        <Animated.View
          style={[
            seekbarStyles.knob,
            {
              position: "absolute",
              top: KNOB_SIZE / -2 + 3,
              transform: [
                {
                  translateX: translateXValue
                },
                {
                  translateX: position
                },

                {
                  translateX: KNOB_SIZE / -2
                }
              ]
            }
          ]}
        />
      </Animated.View>

      {segments.map(segment => (
        <AvatarSegment
          segment={segment}
          segmentRefs={segmentRefs}
          negativeOffset={negativeOffset.current}
          key={segment.id}
          indexValue={indexValue}
          translateXValue={translateXValue}
        />
      ))}
    </View>
  );
};

type Props = {
  posts: Array<PostFragment>;
  postId: string;
  percentage: Animated.Value<number>;
  onSeek: (duration: number, postId: string) => void;
  onEnd: (postId: string) => void;
};

type State = {
  segments: Array<SeekbarSegment>;
  posts: Array<PostFragment>;
  postId: string;
  segmentIndex: number;
};

export class Seekbar extends React.Component<Props, State> {
  duration = new Animated.Value(0);
  constructor(props: Props) {
    super(props);

    const segments = getSegments(props.posts);

    this.state = {
      segments,
      posts: props.posts,
      postId: props.postId,
      segmentIndex:
        segments.findIndex(segment => props.postId === segment.id) || 0
    };
    this.segmentWidth = new Animated.Value(
      segments[this.state.segmentIndex].width
    );
  }

  offsetValue = new Animated.Value(0);
  segmentWidth: Animated.Value<number>;
  position: Animated.Value<number>;

  static getDerivedStateFromProps(props, state) {
    const changes = {};

    if (
      props.posts !== state.posts ||
      props.posts.length !== state.posts.length
    ) {
      changes.segments = getSegments(props.posts);
      changes.segmentIndex =
        changes.segments.findIndex(segment => props.postId === segment.id) || 0;

      changes.posts = props.posts;
    }

    if (props.postId !== state.postId) {
      changes.segmentIndex =
        (changes.segments || state.segments).findIndex(
          segment => props.postId === segment.id
        ) || 0;

      changes.postId = props.postId;
    }

    return changes;
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.segments !== this.state.segments ||
      prevState.segmentIndex !== this.state.segmentIndex
    ) {
      this.segmentWidth.setValue(
        this.state.segments[this.state.segmentIndex].width
      );
    }
  }

  render() {
    const { segments, segmentIndex, posts, postId } = this.state;
    const segment = segments[segmentIndex];

    return (
      <SeekbarComponent
        segments={segments}
        offset={segment.offset}
        currentIndex={segment.index}
        indexValue={this.props.indexValue}
        offsetValue={Animated.interpolate(this.props.indexValue, {
          inputRange: segments.map((segment, index) => index),
          outputRange: segments.map(segment => segment.offset),
          extrapolate: Animated.Extrapolate.CLAMP
        })}
        segmentRefs={this.props.segmentRefs}
        changingPostValue={this.props.changingPostValue}
        position={Animated.multiply(this.props.percentage, this.segmentWidth)}
      />
    );
  }
}
