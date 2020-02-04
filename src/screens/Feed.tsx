// @flow
import {
  ActionSheetOptions,
  useActionSheet
} from "@expo/react-native-action-sheet";
import * as Sentry from "@sentry/react-native";
import * as React from "react";
import { useMutation } from "react-apollo";
import { StyleSheet, View } from "react-native";
import { NavigationProp } from "react-navigation";
import { useNavigation } from "react-navigation-hooks";
import { NavigationStackProp } from "react-navigation-stack";
import { BOTTOM_Y, TOP_Y, SCREEN_DIMENSIONS } from "../../config";
import {
  BottomTabBar,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET
} from "../components/BottomTabBar";
import { FeedList } from "../components/Feed/FeedList";
import { ModalContext } from "../components/ModalContext";
import { NewThreadButton } from "../components/ThreadList/NewThreadButton";
import { sendToast, ToastType } from "../components/Toast";
import { UserContext } from "../components/UserContext";
import DELETE_POST_THREAD_MUTATION from "../lib/DeletePostThreadMutation.graphql";
import { postElementId } from "../lib/ElementTransition";
import {
  DeletePostThreadMutation,
  DeletePostThreadMutationVariables
} from "../lib/graphql/DeletePostThreadMutation";
import {
  ViewThreads_postThreads_data,
  ViewThreads_postThreads_data_posts_data
} from "../lib/graphql/ViewThreads";
import { SPACING } from "../lib/styles";

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
    backgroundColor: "red",
    flex: 1,
    height: "100%",
    width: "100%"
  },
  page: {
    flex: 1,
    height: "100%",
    width: "100%",
    backgroundColor: "black"
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

  handlePressProfile = (profileId: string) => {
    this.props.navigation.navigate("ViewProfile", {
      profileId,
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
    top: TOP_Y,
    left: 0,
    right: 0
  };

  feedListRef = React.createRef();
  handleScrollTop = () => this.feedListRef.current.scrollToTop();

  render() {
    return (
      <View style={styles.page}>
        <FeedList
          onPressPost={this.handlePressPost}
          onPressThread={this.handlePressThread}
          onPressNewPost={this.handleNewPost}
          onPressProfile={this.handlePressProfile}
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

export const FeedPage = React.forwardRef((props, ref) => {
  const navigation = useNavigation();
  const actionSheet = useActionSheet();
  const { userId } = React.useContext(UserContext);
  const { openReportModal } = React.useContext(ModalContext);
  const [deletePostThread] = useMutation<
    DeletePostThreadMutation,
    DeletePostThreadMutationVariables
  >(DELETE_POST_THREAD_MUTATION);

  return (
    <FeedPageComponent
      pageRef={ref}
      userId={userId}
      navigation={navigation}
      deletePostThread={deletePostThread}
      openReportModal={openReportModal}
      showActionSheetWithOptions={actionSheet.showActionSheetWithOptions}
    />
  );
});

export default FeedPage;
