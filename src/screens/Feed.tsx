// @flow
import hoistNonReactStatics from "hoist-non-react-statics";
import * as React from "react";
import { Query } from "react-apollo";
import { LayoutChangeEvent, StatusBar, StyleSheet, View } from "react-native";
import { FlatList as GestureFlatList } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { onScroll } from "react-native-redash";
import { SafeAreaView, withNavigation } from "react-navigation";
import { BOTTOM_Y, SCREEN_DIMENSIONS, TOP_Y } from "../../config";
import {
  BottomTabBar,
  TAB_BAR_OFFSET,
  TAB_BAR_HEIGHT
} from "../components/BottomTabBar";
import { IconButton } from "../components/Button";
import { IconPlus, IconProfile } from "../components/Icon";
import { ViewThread } from "../components/ThreadList/ViewThread";
import {
  ViewThreads,
  ViewThreads_postThreads
} from "../lib/graphql/ViewThreads";
import { BoundsRect, pxBoundsToPoint, scaleToWidth } from "../lib/Rect";
import { SPACING } from "../lib/styles";
import VIEW_THREADS_QUERY from "../lib/ViewThreads.graphql";
import { FeedList } from "../components/Feed/FeedList";

const styles = StyleSheet.create({
  postList: {},
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

export const FeedPage = () => {
  return (
    <View style={styles.page}>
      <FeedList
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
};
