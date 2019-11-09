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
import { postElementId } from "../lib/graphql/ElementTransition";
import {
  MediaPlayerPauser,
  MediaPlayerContext
} from "../components/MediaPlayer";
import { TOP_Y } from "../../config";

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
      threadId: thread.id
    });
  };
  handleLongPressThread = (thread: ViewThreads_postThreads_data) => {};

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
        />
        <BottomTabBar currentRoute="FeedTab" style={styles.tabBar} />
      </View>
    );
  }
}

const FeedPageWrapper = React.forwardRef((props, ref) => {
  const navigation = useNavigation();
  const actionSheet = useActionSheet();
  const { pausePlayers, unpausePlayers } = React.useContext(MediaPlayerContext);

  return (
    <FeedPageComponent
      pageRef={ref}
      pausePlayers={pausePlayers}
      unpausePlayers={unpausePlayers}
      navigation={navigation}
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
