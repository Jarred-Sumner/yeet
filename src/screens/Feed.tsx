// @flow
import {
  ActionSheetOptions,
  connectActionSheet,
  useActionSheet
} from "@expo/react-native-action-sheet";
import * as React from "react";
import { StyleSheet, View, InteractionManager } from "react-native";
import { NavigationState, withNavigation } from "react-navigation";
import {
  BottomTabBar,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET
} from "../components/BottomTabBar";
import { FeedList } from "../components/Feed/FeedList";
import {
  ViewThreads_postThreads_data,
  ViewThreads_postThreads_data_posts_data
} from "../lib/graphql/ViewThreads";
import { useNavigation } from "react-navigation-hooks";
import { NavigationProp } from "react-navigation";
import { NavigationStackProp } from "react-navigation-stack";
import { postElementId } from "../lib/ElementTransition";
import {
  MediaPlayerPauser,
  MediaPlayerContext
} from "../components/MediaPlayer";
import { TOP_Y, BOTTOM_Y } from "../../config";
import { UserContext } from "../components/UserContext";
import { ModalContext } from "../components/ModalContext";
import Alert from "../lib/Alert";
import { sendToast, ToastType } from "../components/Toast";
import DELETE_POST_THREAD_MUTATION from "../lib/DeletePostThreadMutation.graphql";
import { useMutation } from "react-apollo";
import {
  DeletePostThreadMutation,
  DeletePostThreadMutationVariables
} from "../lib/graphql/DeletePostThreadMutation";
import * as Sentry from "@sentry/react-native";
import { IconButton } from "../components/Button";
import {
  IconCircleAddAlt,
  IconCircleAdd,
  IconAdd,
  IconPlus
} from "../components/Icon";
import { COLORS, SPACING } from "../lib/styles";
import { NewThreadButton } from "../components/ThreadList/NewThreadButton";

const styles = StyleSheet.create({
  postList: {},
  floatingPlus: {
    position: "absolute",
    bottom: BOTTOM_Y + TAB_BAR_HEIGHT,
    right: SPACING.double,
    marginBottom: SPACING.double
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0
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

type Props = {
  navigation: NavigationProp<NavigationStackProp>;
  showActionSheetWithOptions: (
    opts: ActionSheetOptions,
    cb: (i: number) => void
  ) => void;
};

class FeedPageComponent extends React.Component<Props> {
  handlePressPost = (
    thread: ViewThreads_postThreads_data,
    post: ViewThreads_postThreads_data_posts_data
  ) => {
    this.props.navigation.navigate("ViewThread", {
      threadId: thread.id,
      thread: thread,
      post: post,
      postId: post.id,
      elementId: postElementId(post)
    });

    InteractionManager.runAfterInteractions(() => {
      this.props.pausePlayers();
    });
  };
  handlePressThread = (thread: ViewThreads_postThreads_data) => {
    this.props.navigation.navigate("ViewThread", {
      threadId: thread.id,
      thread: thread
    });
  };
  handleNewPost = (thread: ViewThreads_postThreads_data) => {
    this.props.navigation.navigate("ReplyToPost", {
      thread,
      threadId: thread.id,
      fromFeed: true
    });
  };
  handleLongPressThread = (thread: ViewThreads_postThreads_data) => {
    const options = ["Cancel"];
    let destructiveButtonIndex = -1;

    const { userId } = this.props;

    if (thread.profile.id === userId) {
      options.push("Delete");
      destructiveButtonIndex = options.length - 1;
    } else {
      options.push("Report");
    }

    let cancelButtonIndex = options.indexOf("Cancel");

    this.props.showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex,
        cancelButtonIndex
      },
      index => {
        if (options[index] === "Report") {
          if (!userId) {
            sendToast("Please sign in first.", ToastType.error);
            return;
          }

          this.props.openReportModal(thread.id, "PostThread");
        } else if (options[index] === "Delete") {
          this.props
            .deletePostThread({
              variables: {
                threadId: thread.id
              }
            })
            .then(
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
        }
      }
    );
  };

  contentOffset = {
    y: TOP_Y * -1,
    x: 0
  };

  contentInset = {
    bottom: TAB_BAR_OFFSET,
    top: 0,
    left: 0,
    right: 0
  };

  feedListRef = React.createRef();
  handleScrollTop = () => this.feedListRef.current.scrollToTop();

  render() {
    return (
      <View ref={this.props.pageRef} style={styles.page}>
        <FeedList
          onPressPost={this.handlePressPost}
          onPressThread={this.handlePressThread}
          onPressNewPost={this.handleNewPost}
          onLongPressThread={this.handleLongPressThread}
          contentOffset={this.contentOffset}
          contentInset={this.contentInset}
          ref={this.feedListRef}
        />

        <View style={styles.floatingPlus}>
          <NewThreadButton />
        </View>

        <BottomTabBar
          onPressCurrentRoute={this.handleScrollTop}
          currentRoute="FeedTab"
          style={styles.tabBar}
        />
      </View>
    );
  }
}

const FeedPageWrapper = React.forwardRef((props, ref) => {
  const navigation = useNavigation();
  const actionSheet = useActionSheet();
  const { pausePlayers, unpausePlayers } = React.useContext(MediaPlayerContext);
  const { userId } = React.useContext(UserContext);
  const { openReportModal } = React.useContext(ModalContext);
  const [deletePostThread] = useMutation<
    DeletePostThreadMutation,
    DeletePostThreadMutationVariables
  >(DELETE_POST_THREAD_MUTATION);

  return (
    <FeedPageComponent
      pageRef={ref}
      pausePlayers={pausePlayers}
      unpausePlayers={unpausePlayers}
      userId={userId}
      navigation={navigation}
      deletePostThread={deletePostThread}
      openReportModal={openReportModal}
      showActionSheetWithOptions={actionSheet.showActionSheetWithOptions}
    />
  );
});

export const FeedPage = () => {
  const ref = React.useRef();

  return (
    <MediaPlayerPauser nodeRef={ref}>
      <FeedPageWrapper ref={ref} />
    </MediaPlayerPauser>
  );
};

export default FeedPage;
