// @flow
import {
  ActionSheetOptions,
  connectActionSheet,
  useActionSheet
} from "@expo/react-native-action-sheet";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { NavigationState, withNavigation } from "react-navigation";
import { BottomTabBar, TAB_BAR_HEIGHT } from "../components/BottomTabBar";
import { useNavigation, useNavigationParam } from "react-navigation-hooks";
import { NavigationProp } from "react-navigation";
import { NavigationStackProp } from "react-navigation-stack";
import { useQuery } from "react-apollo";
import VIEW_THREAD_QUERY from "../lib/ViewThread.graphql";
import {
  ViewThreadVariables,
  ViewThread as ViewThreadQuery
} from "../lib/graphql/ViewThread";
import { ViewThread } from "../components/ThreadList/ViewThread";
import { SCREEN_DIMENSIONS } from "../../config";
import hoistNonReactStatics from "hoist-non-react-statics";
import { postElementId } from "../lib/graphql/ElementTransition";
import { uniqBy } from "lodash";
import Animated from "react-native-reanimated";

const styles = StyleSheet.create({
  postList: {},
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0
  },
  wrapper: {
    backgroundColor: "#111",
    flex: 1
  },
  page: {
    flex: 1,
    backgroundColor: "#111"
  }
});

type Props = {
  navigation: NavigationProp<NavigationStackProp>;
  showActionSheetWithOptions: (opts: ActionSheetOptions) => void;
};

class ThreadPageComponent extends React.Component<Props> {
  static sharedElements = (navigation, otherNavigation, showing) => {
    // Transition element `item.${item.id}.photo` when either
    // showing or hiding this screen (coming from any route)
    const post = navigation.getParam("post");

    const sharedElements = [];
    if (post) {
      sharedElements.push(postElementId(post));
    }

    console.log("SHARED ELEMENTS", sharedElements);
    return sharedElements;
  };

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

  render() {
    const { thread, defaultPost } = this.props;

    return (
      <Animated.View style={styles.page}>
        <ViewThread
          thread={thread}
          posts={uniqBy(
            [defaultPost, ...thread.posts.data].filter(Boolean),
            "id"
          )}
          isVisible
          width={SCREEN_DIMENSIONS.width}
          height={SCREEN_DIMENSIONS.height}
          maxHeight={SCREEN_DIMENSIONS.height}
          isNextVisible={false}
          isPreviousVisible={false}
        />
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
