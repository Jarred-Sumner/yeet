// @flow
import {
  ActionSheetOptions,
  useActionSheet
} from "@expo/react-native-action-sheet";
import hoistNonReactStatics from "hoist-non-react-statics";
import * as React from "react";
import { useQuery } from "react-apollo";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
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
import { SCREEN_DIMENSIONS, BOTTOM_Y } from "../../config";
import {
  ThreadHeader,
  THREAD_HEADER_HEIGHT
} from "../components/ThreadList/ThreadHeader";
import { RectButton } from "react-native-gesture-handler";
import { IconCamera } from "../components/Icon";
import { SemiBoldText } from "../components/Text";
import { SPACING } from "../lib/styles";
import { BlurView, VibrancyView } from "@react-native-community/blur";

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

class ThreadPageComponent extends React.Component<Props> {
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

  render() {
    const { thread, defaultPost, refreshing } = this.props;
    return (
      <Animated.View style={styles.page}>
        <PostFlatList
          posts={thread?.posts?.data ?? []}
          topInset={THREAD_HEADER_HEIGHT + 4}
          refreshing={refreshing}
        />

        <ThreadHeader thread={thread} />

        <View style={styles.footer}>
          <ThreadReplyButton onPress={this.handlePressReply} />
        </View>
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
