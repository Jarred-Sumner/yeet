// @flow
import * as React from "react";
import { SafeAreaView, StyleSheet, View, Dimensions } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { Post } from "../components/PostList/Post";
import { ViewThreads } from "../lib/graphql/ViewThreads";
import VIEW_THREADS_QUERY from "../lib/ViewThreads.graphql";
import { Query } from "react-apollo";
import hoistNonReactStatics from "hoist-non-react-statics";
import { IconHome, IconProfile, IconPlus } from "../components/Icon";
import { getInset } from "react-native-safe-area-view";
import { IconButton } from "../components/Button";
import { SPACING } from "../lib/styles";
import { withNavigation } from "react-navigation";
import { TOP_Y, BOTTOM_Y } from "../../config";

const LAYOUT_DIRECTION = "column-reverse";
const LAYOUT_DIRECTION_OFFSET = {
  column: BOTTOM_Y + 80 + TOP_Y,
  "column-reverse": TOP_Y + 60.5
}[LAYOUT_DIRECTION];

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

function runSpring(clock, value, dest) {
  const state = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0)
  };

  const config = {
    damping: 20,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restSpeedThreshold: 1,
    restDisplacementThreshold: 0.5,
    toValue: new Value(0)
  };

  return [
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.velocity, 0),
      set(state.position, value),
      set(config.toValue, dest),
      startClock(clock)
    ]),
    spring(clock, state, config),
    cond(state.finished, stopClock(clock)),
    state.position
  ];
}

const { width, height } = Dimensions.get("window");

const POST_WIDTH = width - 2;

const toRadians = angle => angle * (Math.PI / 180);
const rotatedWidth =
  width * Math.sin(toRadians(90 - 15)) + height * Math.sin(toRadians(15));
const {
  add,
  multiply,
  neq,
  spring,
  cond,
  eq,
  event,
  lessThan,
  greaterThan,
  and,
  call,
  set,
  clockRunning,
  startClock,
  stopClock,
  Clock,
  Value,
  concat,
  interpolate,
  Extrapolate
} = Animated;

type Props = ViewThreads & {};

class ThreadList extends React.PureComponent<Props, {}> {
  constructor(props: Props) {
    super(props);

    this.translationX = new Value(0);
    this.translationY = new Value(0);
    this.velocityX = new Value(0);
    this.offsetY = new Value(0);
    this.offsetX = new Value(0);
    this.gestureState = new Value(State.UNDETERMINED);
    this.onGestureEvent = event(
      [
        {
          nativeEvent: {
            translationX: this.translationX,
            translationY: this.translationY,
            velocityX: this.velocityX,
            state: this.gestureState
          }
        }
      ],
      { useNativeDriver: true }
    );
    this.init();
    this.state = {
      height: height - LAYOUT_DIRECTION_OFFSET,
      threadOffset: 0,
      hasLoaded: false
    };
  }

  static sharedElements = (navigation, otherNavigation, showing) => {
    const thread = navigation.getParam("thread");

    const id = `post.${thread.firstPost.id}.media`;

    console.log(id);
    return [
      {
        id,
        animation: "resize",
        resize: "clip",
        align: "left-bottom"
      }
    ];
  };

  handleLoad = () => this.setState({ hasLoaded: true });

  init = () => {
    const clockX = new Clock();
    const clockY = new Clock();
    const {
      translationX,
      translationY,
      velocityX,
      gestureState,
      offsetY,
      offsetX
    } = this;
    gestureState.setValue(State.UNDETERMINED);
    translationX.setValue(0);
    translationY.setValue(0);
    velocityX.setValue(0);
    offsetY.setValue(0);
    offsetX.setValue(0);

    const finalTranslateX = add(translationX, multiply(0.2, velocityX));
    const translationThreshold = width / 4;
    const snapPoint = cond(
      lessThan(finalTranslateX, -translationThreshold),
      -rotatedWidth,
      cond(greaterThan(finalTranslateX, translationThreshold), rotatedWidth, 0)
    );
    // TODO: handle case where the user drags the card again before the spring animation finished
    this.translateY = cond(
      eq(gestureState, State.END),
      [
        set(translationY, runSpring(clockY, translationY, 0)),
        set(offsetY, translationY),
        translationY
      ],
      cond(
        eq(gestureState, State.BEGAN),
        [stopClock(clockY), translationY],
        translationY
      )
    );
    this.translateX = cond(
      eq(gestureState, State.END),
      [
        set(translationX, runSpring(clockX, translationX, snapPoint)),
        set(offsetX, translationX),
        cond(and(eq(clockRunning(clockX), 0), neq(translationX, 0)), [
          call([translationX], this.swipped)
        ]),
        translationX
      ],
      cond(
        eq(gestureState, State.BEGAN),
        [stopClock(clockX), translationX],
        translationX
      )
    );
  };

  swipped = ([translationX]) => {
    this.setState({
      threadOffset: this.state.threadOffset + 1,
      hasLoaded: false
    });
    this.init();
  };

  openPlus = () => this.props.navigation.navigate("NewPostStack");

  handlePressSend = post => {
    const thread = this.props.postThreads[this.state.threadOffset];

    this.props.navigation.push("ReplyStack", {
      threadId: thread.id,
      thread: thread,
      post
    });
  };
  handlePressDownload = () => {};

  render() {
    const currentThread = this.props.navigation.getParam("thread");

    return (
      <Animated.View style={styles.page}>
        <Animated.View style={styles.wrapper}>
          <SafeAreaView
            onLayout={this.onLayout}
            style={[
              styles.container,
              { width: POST_WIDTH, height: this.state.height }
            ]}
          >
            <Animated.View
              style={[
                styles.postListItem,
                { width: POST_WIDTH, height: this.state.height }
              ]}
            >
              <Post
                post={currentThread.firstPost}
                thread={currentThread}
                delay={false}
                width={POST_WIDTH}
                key={currentThread.id}
                height={this.state.height}
                isFocused
                hideContent={false}
                layoutDirection={LAYOUT_DIRECTION}
                onLoad={this.handleLoad}
                onPressSend={this.handlePressSend}
                onPressDownload={this.handlePressDownload}
              />
            </Animated.View>
          </SafeAreaView>
        </Animated.View>
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
    flexDirection: LAYOUT_DIRECTION
  }
});

const ThreadListScreen = hoistNonReactStatics(
  withNavigation(ThreadList),
  ThreadList
);

// export default hoistNonReactStatics(
//   props => (
//     <Query query={VIEW_THREADS_QUERY}>
//       {({ data: { postThreads = [] } = {}, ...otherProps }) => {
//         return <ThreadListScreen postThreads={postThreads} {...otherProps} />;
//       }}
//     </Query>
//   ),
//   ThreadList
// );

export default ThreadListScreen;
