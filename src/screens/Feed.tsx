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
import { FeedList } from "../components/Feed/FeedList";
import {
  ViewThreads_postThreads_data,
  ViewThreads_postThreads_data_posts_data
} from "../lib/graphql/ViewThreads";
import { useNavigation } from "react-navigation-hooks";
import { NavigationProp } from "react-navigation";
import { NavigationStackProp } from "react-navigation-stack";
import { postElementId } from "../lib/graphql/ElementTransition";

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
    this.props.navigation.push("ViewThread", {
      threadId: thread.id,
      thread: thread,
      post: post,
      postId: post.id,
      elementId: postElementId(post)
    });
  };
  handlePressThread = (thread: ViewThreads_postThreads_data) => {
    this.props.navigation.push("ViewThread", {
      threadId: thread.id,
      thread: thread
    });
  };
  handleNewPost = (thread: ViewThreads_postThreads_data) => {
    this.props.navigation.navigate("ReplyToPost", {
      thread
    });
  };
  handleLongPressThread = (thread: ViewThreads_postThreads_data) => {};

  render() {
    return (
      <View style={styles.page}>
        <FeedList
          onPressPost={this.handlePressPost}
          onPressThread={this.handlePressThread}
          onPressNewPost={this.handleNewPost}
          onLongPressThread={this.handleLongPressThread}
          contentInset={{
            bottom: TAB_BAR_HEIGHT,
            top: 0,
            left: 0,
            right: 0
          }}
        />
        <BottomTabBar currentRoute="FeedTab" style={styles.tabBar} />
      </View>
    );
  }
}

const RawFeedPage = () => {
  const navigation = useNavigation();
  const actionSheet = useActionSheet();

  return (
    <FeedPageComponent
      navigation={navigation}
      showActionSheetWithOptions={actionSheet.showActionSheetWithOptions}
    />
  );
};

export class FeedPage extends React.Component {
  static sharedElements = (navigation, otherNavigation, showing) => {
    console.log("SHARED");
    // Transition element `item.${item.id}.photo` when either
    // showing or hiding this screen (coming from any route)
    const id = navigation.getParam("elementId");
    const shouldAnimate = true;

    if (!shouldAnimate || !id) {
      return [];
    }

    return [
      {
        id,
        animation: showing ? "move" : "fade-out",
        resize: showing ? "stretch" : "clip",
        align: showing ? "bottom-left" : "top-left"
      }
    ];
  };

  render() {
    return <RawFeedPage />;
  }
}

export default FeedPage;
