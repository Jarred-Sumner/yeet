// @flow
import {
  ActionSheetOptions,
  useActionSheet
} from "@expo/react-native-action-sheet";
import hoistNonReactStatics from "hoist-non-react-statics";
import * as React from "react";
import { useQuery } from "react-apollo";
import { StyleSheet, View } from "react-native";
import Animated, {
  Transitioning,
  Transition,
  TransitioningView
} from "react-native-reanimated";
import { NavigationProp } from "react-navigation";
import { useNavigation, useNavigationParam } from "react-navigation-hooks";
import { NavigationStackProp } from "react-navigation-stack";
import { postElementId } from "../lib/ElementTransition";
import {
  ViewThread as ViewThreadQuery,
  ViewThreadVariables
} from "../lib/graphql/ViewThread";
import VIEW_THREAD_QUERY from "../lib/ViewThread.graphql";
import { PostFlatList } from "../components/ThreadList/ViewThread";
import { SCREEN_DIMENSIONS, BOTTOM_Y, TOP_Y } from "../../config";
import {
  ThreadHeader,
  THREAD_HEADER_HEIGHT,
  CommentEditorHeader
} from "../components/ThreadList/ThreadHeader";
import { RectButton } from "react-native-gesture-handler";
import { IconCamera } from "../components/Icon";
import { SemiBoldText } from "../components/Text";
import { SPACING } from "../lib/styles";
import { BlurView, VibrancyView } from "@react-native-community/blur";
import { CommentComposer } from "../components/Posts/CommentComposer";
import { CommentEditor } from "../components/Posts/CommentEditor";
import { AnimatedKeyboardTracker } from "../components/AnimatedKeyboardTracker";
import { number } from "yup";

const styles = StyleSheet.create({
  postList: {},
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0
  },
  wrapper: {
    backgroundColor: "#0A0A0A",
    flex: 1
  },
  page: {
    flex: 1,
    height: SCREEN_DIMENSIONS.height,
    width: SCREEN_DIMENSIONS.width,
    backgroundColor: "#0A0A0A"
  },
  footer: {
    position: "absolute",
    bottom: BOTTOM_Y,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center"
  },
  buttonLabel: {
    fontSize: 17,
    color: "white",
    marginLeft: SPACING.half
  },
  buttonShadow: {
    height: 48,
    width: 180,
    borderRadius: 100,
    shadowOffset: {
      width: 0,
      height: 7
    },
    shadowRadius: 18,
    shadowColor: "black",
    shadowOpacity: 0.15
  },

  buttonBorder: {
    height: 48,
    // backgroundColor: "rgba(0,0,0,0.4)",
    width: 180,
    borderRadius: 206 / 2,
    overflow: "hidden",
    position: "relative"
  },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0
  },
  buttonContainer: {
    flexDirection: "row",
    height: 48,
    paddingHorizontal: SPACING.normal,
    backgroundColor: "rgba(255,255,255,0.05)",
    width: 180,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.2)",
    // backgroundColor: "rgba(0, 0, 0, 0.4)",

    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "space-between"
    // position: "absolute",
    // zIndex: 1
  },

  buttonWrapper: {}
});

const ThreadReplyButton = React.memo(({ onPress }) => {
  const buttonContainerRef = React.useRef();

  return (
    <View shouldRasterizeIOS style={styles.buttonShadow}>
      <RectButton underlayColor="transparent" borderless onPress={onPress}>
        <View style={styles.buttonBorder}>
          <BlurView
            viewRef={buttonContainerRef}
            blurType="dark"
            blurAmount={100}
          >
            <View
              needsOffscreenAlphaCompositing
              ref={buttonContainerRef}
              style={styles.buttonContainer}
            >
              <IconCamera size={18} color="white" />
              <SemiBoldText style={styles.buttonLabel}>
                Post in thread
              </SemiBoldText>
            </View>
          </BlurView>
        </View>
      </RectButton>
    </View>
  );
});

type Props = {
  navigation: NavigationProp<NavigationStackProp>;
  showActionSheetWithOptions: (opts: ActionSheetOptions) => void;
};

class ThreadPageComponent extends React.Component<Props, State> {
  state = {
    showComposer: false,
    composerProps: {}
  };
  // static sharedElements = (navigation, otherNavigation, showing) => {
  //   // Transition element `item.${item.id}.photo` when either
  //   // showing or hiding this screen (coming from any route)
  //   const post = navigation.getParam("post");

  //   const sharedElements = [];
  //   if (post) {
  //     sharedElements.push(postElementId(post));
  //   }

  //   console.log("SHARED ELEMENTS", sharedElements);
  //   return sharedElements;
  // };

  handlePressPost = (
    thread: ViewThreads_postThreads_data,
    post: ViewThreads_postThreads_data_posts_data
  ) => {};
  handlePressThread = (thread: ViewThreads_postThreads_data) => {};
  handleNewPost = (thread: ViewThreads_postThreads_data) => {
    this.props.navigation.navigate("ReplyToPost", thread);
  };
  handleLongPressThread = (thread: ViewThreads_postThreads_data) => {};
  handlePressReply = () => {};
  handleShowComposer = composerProps => {
    this.postListRef.current.scrollToId(composerProps.postId);
    this.setState({ showComposer: true, composerProps });
    this.transitionFooterRef.current.animateNextTransition();
    this.transitionHeaderRef.current.animateNextTransition();
  };

  handleCloseComposer = () => {
    this.setState({ showComposer: false, composerProps: {} });
    this.transitionFooterRef.current.animateNextTransition();
    this.transitionHeaderRef.current.animateNextTransition();
  };

  transitionHeaderRef = React.createRef<TransitioningView>();
  transitionFooterRef = React.createRef<TransitioningView>();
  postListRef = React.createRef<PostFlatList>();
  keyboardHeightValue = new Animated.Value<number>(0);
  keyboardVisibleValue = new Animated.Value<number>(0);

  render() {
    const { thread, defaultPost, refreshing } = this.props;
    const { showComposer, composerProps } = this.state;

    return (
      <Animated.View style={styles.page}>
        <AnimatedKeyboardTracker
          keyboardVisibleValue={this.keyboardVisibleValue}
          keyboardHeightValue={this.keyboardHeightValue}
        />

        <PostFlatList
          posts={thread?.posts?.data ?? []}
          topInset={THREAD_HEADER_HEIGHT + 4}
          keyboardVisibleValue={this.keyboardVisibleValue}
          scrollEnabled={this.state.showComposer === false}
          openComposer={this.handleShowComposer}
          ref={this.postListRef}
          refreshing={refreshing}
        />

        <Transitioning.View
          ref={this.transitionHeaderRef}
          style={styles.top}
          transition={
            <Transition.Together>
              <Transition.In interpolation="easeIn" type="fade"></Transition.In>
              <Transition.Out
                interpolation="easeOut"
                type="fade"
              ></Transition.Out>
            </Transition.Together>
          }
        >
          {showComposer === false && (
            <ThreadHeader thread={thread} key={thread.id} />
          )}

          {showComposer && <CommentEditorHeader />}
        </Transitioning.View>

        <Transitioning.View
          ref={this.transitionFooterRef}
          pointerEvents="box-none"
          transition={
            <Transition.Sequence>
              <Transition.In interpolation="easeIn" type="fade"></Transition.In>
              <Transition.Out
                interpolation="easeOut"
                type="fade"
              ></Transition.Out>
            </Transition.Sequence>
          }
        >
          {showComposer === false && (
            <Animated.View key="default-footer" style={styles.footer}>
              <ThreadReplyButton onPress={this.handlePressReply} />
            </Animated.View>
          )}

          {showComposer && composerProps && (
            <CommentEditor
              topInset={THREAD_HEADER_HEIGHT + 4}
              key="comment-editor"
              keyboardHeightValue={this.keyboardHeightValue}
              keyboardVisibleValue={this.keyboardVisibleValue}
              onClose={this.handleCloseComposer}
              {...composerProps}
            />
          )}
        </Transitioning.View>
      </Animated.View>
    );
  }
}

const _ThreadPage = () => {
  const navigation = useNavigation();
  const actionSheet = useActionSheet();
  const threadId = useNavigationParam("threadId");
  const defaultThread = useNavigationParam("thread");
  const viewThreadQuery = useQuery<ViewThreadQuery, ViewThreadVariables>(
    VIEW_THREAD_QUERY,
    {
      notifyOnNetworkStatusChange: true,
      returnPartialData: true,
      variables: {
        threadId,
        postOffset: 0,
        postsCount: 10
      }
    }
  );

  return (
    <ThreadPageComponent
      navigation={navigation}
      thread={viewThreadQuery?.data?.postThread ?? defaultThread}
      defaultPost={useNavigationParam("post")}
      loading={viewThreadQuery.loading}
      showActionSheetWithOptions={actionSheet.showActionSheetWithOptions}
    />
  );
};

export const ThreadPage = hoistNonReactStatics(
  _ThreadPage,
  ThreadPageComponent
);

ThreadPage.sharedElements = ThreadPageComponent.sharedElements;

export default ThreadPage;
