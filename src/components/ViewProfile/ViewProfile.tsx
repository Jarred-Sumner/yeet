import * as React from "react";
import { View, StyleSheet, VirtualizedListProperties } from "react-native";
import {
  FlatList as GestureFlatList,
  State
} from "react-native-gesture-handler";
import VIEW_PROFILE_QUERY from "../../lib/ViewProfileQuery.graphql";
import LIST_PROFILE_POSTS_QUERY from "../../lib/ListProfilePostsQuery.graphql";
import LIST_REMIXES_QUERY from "../../lib/ListRemixesQuery.graphql";
import LIST_FOLLOWERS_QUERY from "../../lib/ListFollowersQuery.graphql";
import FOLLOW_PROFILE_MUTATION from "../../lib/FollowProfileMutation.graphql";
import UNFOLLOW_PROFILE_MUTATION from "../../lib/UnfollowProfileMutation.graphql";

import {
  useQuery,
  useMutation,
  MutationHookOptions,
  MutationResult
} from "react-apollo";
import {
  ViewProfile as ViewProfileQuery,
  ViewProfile_profile,
  ViewProfileVariables
} from "../../lib/graphql/ViewProfile";
import { UserContext } from "../UserContext";
import {
  ViewProfileSection,
  ViewProfileHeader,
  COUNTER_HEIGHT,
  HEADER_HEIGHT
} from "./ViewProfileHeader";
import { FollowerListItemFragment } from "../../lib/graphql/FollowerListItemFragment";
import {
  ListFollowers,
  ListFollowersVariables
} from "../../lib/graphql/ListFollowers";
import {
  ListProfilePosts,
  ListProfilePostsVariables
} from "../../lib/graphql/ListProfilePosts";
import {
  ListRemixes,
  ListRemixesVariables
} from "../../lib/graphql/ListRemixes";
import {
  POST_LIST_ITEM_HEIGHT,
  POST_LIST_ITEM_COLUMN_COUNT,
  PostListItem
} from "./PostListItem";
import createNativeWrapper from "react-native-gesture-handler/createNativeWrapper";
import { ScrollView as NavigationScrollView } from "react-navigation";
import Animated from "react-native-reanimated";
import { TOP_Y } from "../../../config";
import { SPACING } from "../../lib/styles";

const ScrollView = createNativeWrapper(
  Animated.createAnimatedComponent(NavigationScrollView),
  {
    disallowInterruption: true
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  separator: {
    height: SPACING.half,
    width: 1
  }
});

const ItemSeparatorComponent = () => <View style={styles.separator} />;

const FlatList = Animated.createAnimatedComponent(GestureFlatList);

type ListItem = PostListItem | FollowerListItemFragment;

type Props = {
  profile: ViewProfile_profile | null;
  followProfile: (
    opts: MutationHookOptions
  ) => Promise<MutationResult<Boolean>>;
  unfollowProfile: (
    opts: MutationHookOptions
  ) => Promise<MutationResult<Boolean>>;
  loadingProfile: Boolean;
  loadingSection: Boolean;
  following: Boolean | null;
  isCurrentUser: Boolean;
  section: ViewProfileSection;
  data: Array<ListItem>;
  setSection: (section: ViewProfileSection) => void;
};

const {
  event,
  Value,
  diffClamp,
  multiply,
  interpolate,
  cond,
  set,
  add,
  startClock,
  clockRunning,
  stopClock,
  Clock,
  sub,
  lessThan,
  spring,
  neq,
  eq
} = Animated;

const DRAG_END_INITIAL = 10000000;
const COLLAPSE_OFFSET = HEADER_HEIGHT - TOP_Y - COUNTER_HEIGHT;

class RawViewProfile extends React.Component<Props> {
  static defaultProps = {
    contentOffset: {
      y: COLLAPSE_OFFSET,
      x: 0
    }
  };

  scrollY = new Animated.Value(this.props.contentOffset.y);

  scrollEndDragVelocity = new Animated.Value(DRAG_END_INITIAL);
  scrollGestureState = new Animated.Value(State.UNDETERMINED);

  clampedNavbar = Animated.cond(
    Animated.greaterThan(this.scrollY, -1),
    Animated.diffClamp(this.scrollY, 0, COLLAPSE_OFFSET),
    0
  );

  navBarOffset = this.clampedNavbar;

  translateY = Animated.interpolate(this.scrollY, {
    inputRange: [COLLAPSE_OFFSET, COLLAPSE_OFFSET + 1],
    outputRange: [
      Animated.interpolate(this.navBarOffset, {
        inputRange: [0, COLLAPSE_OFFSET],
        outputRange: [0, COLLAPSE_OFFSET * -1],
        extrapolate: Animated.Extrapolate.CLAMP
      }),
      COLLAPSE_OFFSET * -1
    ],
    extrapolate: Animated.Extrapolate.CLAMP
  });

  snapPoint = cond(
    lessThan(this.navBarOffset, COLLAPSE_OFFSET / 2),
    0,
    COLLAPSE_OFFSET * -1
  );

  snapOffset = new Animated.Value(COLLAPSE_OFFSET);

  onMomentumScrollEnd = Animated.event(
    [
      {
        nativeEvent: () =>
          Animated.block([Animated.set(this.scrollGestureState, State.END)])
      }
    ],
    { useNativeDriver: true }
  );

  renderListHeader = () => {
    const { profile } = this.props;

    return (
      <View
        pointerEvents="box-none"
        style={{
          height: HEADER_HEIGHT
        }}
      >
        {profile && (
          <ViewProfileHeader
            profile={this.props.profile}
            isFollowing={this.props.following}
            isCurrentUser={this.props.isCurrentUser}
            translateY={this.translateY}
            section={this.props.section}
            onChangeSection={this.props.setSection}
            onFollow={this.handleFollow}
            onUnfollow={this.handleUnfollow}
          />
        )}
      </View>
    );
  };

  openPost = (id: string) => {};

  getItemLayout = (data, index) => {
    const { section } = this.props;

    if (section === ViewProfileSection.followers) {
      return {
        index: index,
        offset: index * 44,
        length: 44
      };
    } else {
      const separatorOffset = Math.ceil(index / 2) * SPACING.half;
      return {
        index: index,
        offset: index * POST_LIST_ITEM_HEIGHT + separatorOffset,
        length: POST_LIST_ITEM_HEIGHT
      };
    }
  };

  keyExtractor = item => item.id;

  handleFollow = () => {
    return this.props.followProfile({
      variables: { profileId: this.props.profileId },
      optimisticResponse: {
        followProfile: true
      }
    });
  };
  handleUnfollow = () => {
    return this.props.unfollowProfile({
      variables: { profileId: this.props.profileId },
      optimisticResponse: {
        unfollowProfile: false
      }
    });
  };
  renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    if (item.__typename === "Post") {
      return <PostListItem post={item} onPress={this.openPost} />;
    } else {
      return null;
    }
  };

  onScrollBeginDrag = Animated.event([
    {
      nativeEvent: () =>
        Animated.block([Animated.set(this.scrollGestureState, State.BEGAN)])
    }
  ]);

  onScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            y: this.scrollY
          }
        }
      }
    ],
    { useNativeDriver: true }
  );

  onScrollEndDrag = Animated.event(
    [
      {
        nativeEvent: ({ velocity: { y } }) =>
          Animated.block([Animated.set(this.scrollEndDragVelocity, y)])
      }
    ],
    { useNativeDriver: true }
  );

  renderScrollView = props => <ScrollView {...props} />;
  render() {
    const { data, section, contentInset, contentOffset } = this.props;

    return (
      <>
        <FlatList
          style={styles.container}
          renderScrollComponent={this.renderScrollView}
          ListHeaderComponent={this.renderListHeader()}
          contentOffset={contentOffset}
          stickyHeaderIndices={[0]}
          contentInsetAdjustmentBehavior="never"
          contentInset={contentInset}
          ItemSeparatorComponent={ItemSeparatorComponent}
          columnWrapperStyle={{
            justifyContent: "space-evenly",
            backgroundColor: "#111"
          }}
          data={this.props.data}
          onScroll={this.onScroll}
          onScrollBeginDrag={this.onScrollBeginDrag}
          onScrollEndDrag={this.onScrollEndDrag}
          scrollEventThrottle={1}
          numColumns={
            section === ViewProfileSection.followers
              ? 1
              : POST_LIST_ITEM_COLUMN_COUNT
          }
          getItemLayout={this.getItemLayout}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
        />
      </>
    );
  }
}

const QUERY_TO_SECTION_MAPPING = {
  [ViewProfileSection.followers]: LIST_FOLLOWERS_QUERY,
  [ViewProfileSection.posts]: LIST_PROFILE_POSTS_QUERY,
  [ViewProfileSection.remixes]: LIST_REMIXES_QUERY
};

export const ViewProfile = ({ profileId, contentInset, contentOffset }) => {
  const [section, setSection] = React.useState(ViewProfileSection.posts);

  const {
    loading,
    data: { profile = null, following = false } = {},
    ...otherProps
  } = useQuery<ViewProfileQuery, ViewProfileVariables>(VIEW_PROFILE_QUERY, {
    variables: { profileId },
    notifyOnNetworkStatusChange: true
  });

  const [followProfile] = useMutation(FOLLOW_PROFILE_MUTATION, {
    variables: { profileId },
    awaitRefetchQueries: true,
    refetchQueries: [{ query: VIEW_PROFILE_QUERY, variables: { profileId } }]
  });

  const [unfollowProfile] = useMutation(UNFOLLOW_PROFILE_MUTATION, {
    variables: { profileId },
    awaitRefetchQueries: true,
    refetchQueries: [{ query: VIEW_PROFILE_QUERY, variables: { profileId } }]
  });

  const query = QUERY_TO_SECTION_MAPPING[section];
  const { loading: loadingSection, data, fetchMore } = useQuery<
    ListFollowers | ListProfilePosts | ListRemixes,
    ListFollowersVariables | ListProfilePostsVariables | ListRemixesVariables
  >(query, {
    variables: {
      profileId,
      offset: 0,
      limit: 20
    }
  });

  let listData = [];

  if (section == ViewProfileSection.followers) {
    const _data = (data || { profile: { followers: [] } }) as ListFollowers;
    listData = _data.profile.followers;
  } else if (section == ViewProfileSection.posts) {
    const _data = (data || { profile: { posts: [] } }) as ListProfilePosts;
    listData = _data.profile.posts;
  } else if (section == ViewProfileSection.remixes) {
    const _data = (data || { profile: { posts: [] } }) as ListRemixes;
    listData = _data.profile.posts;
  }

  const { userId } = React.useContext(UserContext);

  return (
    <RawViewProfile
      profile={profile}
      profileId={profileId}
      loadingProfile={loading}
      following={following}
      followProfile={followProfile}
      unfollowProfile={unfollowProfile}
      contentInset={contentInset}
      section={section}
      loadingSection={loadingSection}
      fetchMore={fetchMore}
      data={listData}
      setSection={setSection}
      contentOffset={contentOffset}
      // isCurrentUser={userId === profileId}
    />
  );
};

export default ViewProfile;
