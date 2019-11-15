// @flow
import {
  ActionSheetOptions,
  useActionSheet
} from "@expo/react-native-action-sheet";
import hoistNonReactStatics from "hoist-non-react-statics";
import * as React from "react";
import { useQuery, useMutation } from "react-apollo";
import { StyleSheet, View, InteractionManager } from "react-native";
import Animated, {
  Transitioning,
  Transition,
  TransitioningView
} from "react-native-reanimated";
import { NavigationProp } from "react-navigation";
import {
  useNavigation,
  useNavigationParam,
  useFocusEffect,
  useIsFocused
} from "react-navigation-hooks";
import { NavigationStackProp } from "react-navigation-stack";
import { postElementId } from "../lib/ElementTransition";
import {
  ViewThread as ViewThreadQuery,
  ViewThreadVariables,
  ViewThread_postThread_posts_data_profile,
  ViewThread_postThread_posts_data
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
import { LikePost, LikePostVariables } from "../lib/graphql/LikePost";
import LIME_POST_QUERY from "../lib/LikePost.graphql";
import * as Sentry from "@sentry/react-native";
import { MediaPlayerComponent } from "../components/MediaPlayer";
import DELETE_POST_MUTATION from "../lib/DeletePostMutation.graphql";
import {
  DeletePostMutation,
  DeletePostMutationVariables
} from "../lib/graphql/DeletePostMutation";
import DELETE_COMMENT_MUTATION from "../lib/DeleteCommentMutation.graphql";
import {
  DeleteCommentMutation,
  DeleteCommentMutationVariables
} from "../lib/graphql/DeleteCommentMutation";
import { CommentFragment } from "../lib/graphql/CommentFragment";
import { partition } from "lodash";
import {
  UserContext,
  RequireAuthenticationFunction
} from "../components/UserContext";
import ActionSheet from "@expo/react-native-action-sheet/lib/typescript/ActionSheet";
import { Context } from "@expo/react-native-action-sheet/lib/typescript/context";
import { ToastType, sendToast } from "../components/Toast";
import { ModalContext } from "../components/ModalContext";
import { shouldShowPushNotificationModal } from "../components/PushNotificationModal";
import { NetworkStatus } from "apollo-client";

const THREAD_REPLY_BUTTON_HEIGHT = 48;

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
    height: THREAD_REPLY_BUTTON_HEIGHT,
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

type Props = Pick<Context, "showActionSheetWithOptions"> & {
  navigation: NavigationProp<NavigationStackProp>;
  requireAuthentication: RequireAuthenticationFunction;
  hasScrolledToInitialPost: boolean;
};

class ThreadPageComponent extends React.Component<Props, State> {
  state = {
    showComposer: false,
    hasScrolledToInitialPost: false,
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
  handleNewPost = async (thread: ViewThreads_postThreads_data) => {
    this.navigateToReplyPage();
  };

  navigateToReplyPage = async () => {
    const authed = await this.props.requireAuthentication();
    if (!authed) {
      return;
    }

    const { thread, threadId } = this.props;

    this.props.navigation.navigate("ReplyToPost", {
      thread,
      threadId
    });
  };

  handleLongPressThread = (thread: ViewThreads_postThreads_data) => {};
  handlePressReply = async () => {
    this.navigateToReplyPage();
  };
  handleShowComposer = async composerProps => {
    const authed = await this.props.requireAuthentication();
    if (!authed) {
      return;
    }

    this.postListRef.current.scrollToId(composerProps.postId);
    this.setState({ showComposer: true, composerProps });
    this.transitionFooterRef.current.animateNextTransition();
    this.transitionHeaderRef.current.animateNextTransition();
  };

  handleCloseComposer = () => {
    this.setState({ showComposer: false, composerProps: {} });
    this.transitionFooterRef.current.animateNextTransition();
    this.transitionHeaderRef.current.animateNextTransition();

    return this.autoRequestPush();
  };

  transitionHeaderRef = React.createRef<TransitioningView>();
  transitionFooterRef = React.createRef<TransitioningView>();
  postListRef = React.createRef<PostFlatList>();
  keyboardHeightValue = new Animated.Value<number>(0);
  keyboardVisibleValue = new Animated.Value<number>(0);

  handlePressLike = async (postId: string) => {
    const authed = await this.props.requireAuthentication();
    if (!authed) {
      return;
    }

    await this.props.onLikePost({ variables: { postId } });
    return this.autoRequestPush();
  };

  autoRequestPush = async () => {
    const shouldRequestPush = await shouldShowPushNotificationModal();
    if (shouldRequestPush) {
      this.props.openPushNotificationModal();
    }
  };

  handlePressProfile = (profile: ViewThread_postThread_posts_data_profile) => {
    this.props.navigation.navigate("ViewProfile", {
      profile,
      profileId: profile.id
    });
  };
  handlePressPostEllipsis = async (
    post: ViewThread_postThread_posts_data,
    mediaPlayer: MediaPlayerComponent,
    comments: Array<CommentFragment> = []
  ) => {
    const authed = await this.props.requireAuthentication();
    if (!authed) {
      return;
    }

    const options = ["Save", "Remix"];
    const {
      userId,
      showActionSheetWithOptions,
      deletePost,
      deleteComment,
      deleteComent
    } = this.props;
    let destructiveButtonIndex = -1;

    if (userId === post.profile.id) {
      options.push("Delete post");
      destructiveButtonIndex = options.length - 1;
    } else {
      options.push("Report post");
    }

    const [userSubmittedComments, nonUserSubmittedComments] = partition(
      comments,
      comment => comment.profile.id === userId
    );

    if (nonUserSubmittedComments.length > 0) {
      options.push("Report comment");
    }

    if (userSubmittedComments.length > 1) {
      options.push("Delete comment");
      if (destructiveButtonIndex === -1) {
        destructiveButtonIndex = options.length - 1;
      }
    }

    options.push("Cancel");
    const cancelButtonIndex = options.length - 1;

    this.props.showActionSheetWithOptions(
      {
        destructiveButtonIndex,
        cancelButtonIndex,
        options
      },
      (index: number) => {
        const option = options[index];
        if (option === "Save") {
          return mediaPlayer.save().catch(err => {
            Sentry.captureException(err);
          });
        } else if (option === "Delete post") {
          return deletePost({
            variables: {
              postId: post.id
            }
          }).then(
            () => {
              sendToast("Queued for deletion", ToastType.success);
            },
            err => {
              Sentry.captureException(err);
              sendToast("Something broke – try again please.", ToastType.error);
            }
          );
        } else if (option === "Report comment") {
          if (!this.props.userId) {
            sendToast("Please sign in first.", ToastType.error);
            return;
          }

          this.showCommentPicker(nonUserSubmittedComments).then(comment => {
            if (!comment) {
              return;
            }

            this.props.openReportModal(comment.id, "Comment");
          });
        } else if (option === "Report post") {
          if (!this.props.userId) {
            sendToast("Please sign in first.", ToastType.error);
            return;
          }

          this.props.openReportModal(post.id, "Post");
        } else if (option === "Delete comment") {
          if (!this.props.userId) {
            sendToast("Please sign in first.", ToastType.error);
            return;
          }

          this.showCommentPicker(userSubmittedComments).then(comment => {
            if (!comment) {
              return;
            }

            return deleteComment({
              variables: {
                commentId: comment.id
              }
            }).then(
              () => {
                sendToast("Queued for deletion", ToastType.success);
              },
              err => {
                Sentry.captureException(err);
                sendToast(
                  "Something broke – try again please.",
                  ToastType.error
                );
              }
            );
          });
        }
      }
    );
  };

  showCommentPicker = (
    comments: Array<CommentFragment>
  ): Promise<CommentFragment | null> => {
    return new Promise((resolve, reject) => {
      const options = comments.map(comment => {
        return `${comment.profile.username}: ${comment.body}`;
      });

      options.push("Cancel");

      this.props.showActionSheetWithOptions(
        {
          options,
          title: "Which comment?",
          cancelButtonIndex: options.length - 1
        },
        (index: number) => {
          const comment = index < comments.length ? comments[index] : null;
          resolve(comment);
        }
      );
    });
  };

  render() {
    const { thread, defaultPost, refreshing, posts } = this.props;
    const { showComposer, composerProps } = this.state;

    return (
      <Animated.View style={styles.page}>
        <AnimatedKeyboardTracker
          keyboardVisibleValue={this.keyboardVisibleValue}
          keyboardHeightValue={this.keyboardHeightValue}
        />

        <PostFlatList
          posts={posts}
          topInset={THREAD_HEADER_HEIGHT + 4}
          bottomInset={THREAD_REPLY_BUTTON_HEIGHT}
          composingPostId={this.state.composerProps?.postId}
          onPressLike={this.handlePressLike}
          onPressProfile={this.handlePressProfile}
          onPressPostEllipsis={this.handlePressPostEllipsis}
          initialPostId={defaultPost?.id ?? posts[0]?.id}
          extraData={this.state}
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
            <ThreadHeader thread={thread} key="thread-header" />
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
      fetchPolicy: "cache-and-network",
      variables: {
        threadId,
        postOffset: 0,
        postsCount: 10
      }
    }
  );
  const [onLikePost] = useMutation<LikePost, LikePostVariables>(
    LIME_POST_QUERY
  );
  const { userId, requireAuthentication } = React.useContext(UserContext);
  const { openReportModal, openPushNotificationModal } = React.useContext(
    ModalContext
  );

  const isInitialFocus = React.useRef(true);

  const focusEffect = React.useCallback(() => {
    const _isInitialFocus = isInitialFocus.current;
    if (
      !_isInitialFocus &&
      viewThreadQuery.networkStatus === NetworkStatus.ready
    ) {
      typeof viewThreadQuery.refetch === "function" &&
        viewThreadQuery.refetch();
    }

    isInitialFocus.current = false;
  }, []);

  useFocusEffect(focusEffect);

  const [deletePost] = useMutation<
    DeletePostMutation,
    DeletePostMutationVariables
  >(DELETE_POST_MUTATION);
  const [deleteComment] = useMutation<
    DeleteCommentMutation,
    DeleteCommentMutationVariables
  >(DELETE_COMMENT_MUTATION);

  const defaultPost = useNavigationParam("post");
  const thread = viewThreadQuery?.data?.postThread ?? defaultThread;

  return (
    <ThreadPageComponent
      navigation={navigation}
      onLikePost={onLikePost}
      openReportModal={openReportModal}
      openPushNotificationModal={openPushNotificationModal}
      userId={userId}
      deletePost={deletePost}
      requireAuthentication={requireAuthentication}
      deleteComment={deleteComment}
      posts={thread?.posts?.data ?? []}
      thread={thread}
      threadId={threadId}
      defaultPost={defaultPost}
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
