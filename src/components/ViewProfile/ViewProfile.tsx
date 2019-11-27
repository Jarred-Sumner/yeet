import * as React from "react";
import {
  View,
  StyleSheet,
  VirtualizedListProperties,
  ViewabilityConfig,
  InteractionManager,
  SimpleTask,
  PromiseTask,
  RefreshControl
} from "react-native";
import { State } from "react-native-gesture-handler";
import { FlatList, ScrollView } from "../FlatList";

import { uniqBy } from "lodash";
import CURRENT_USER_QUERY from "../../lib/currentUserQuery.graphql";
import VIEW_PROFILE_QUERY from "../../lib/ViewProfileQuery.graphql";
import LIST_PROFILE_POSTS_QUERY from "../../lib/ListProfilePostsQuery.graphql";
import LIST_REMIXES_QUERY from "../../lib/ListRemixesQuery.graphql";
import LIST_FOLLOWERS_QUERY from "../../lib/ListFollowersQuery.graphql";
import FOLLOW_PROFILE_MUTATION from "../../lib/FollowProfileMutation.graphql";
import UNFOLLOW_PROFILE_MUTATION from "../../lib/UnfollowProfileMutation.graphql";
import UPDATE_AVATAR_MUTATION from "../../lib/UpdateAvatarMutation.graphql";
import BLOCK_USER_MUTATION from "../../lib/BlockUserMutation.graphql";

import {
  useQuery,
  useMutation,
  MutationHookOptions,
  MutationResult,
  MutationFunction,
  useLazyQuery
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
  PostListItem,
  POST_LIST_ITEM_WIDTH
} from "./PostListItem";
import createNativeWrapper from "react-native-gesture-handler/createNativeWrapper";
import Animated from "react-native-reanimated";
import { TOP_Y } from "../../../config";
import { SPACING, COLORS } from "../../lib/styles";
import { FetchMoreOptions, NetworkStatus } from "apollo-client";
import {
  FOLLOWER_LIST_ITEM_HEIGHT,
  FollowerListItem
} from "./FollowerListItem";
import {
  UpdateAvatar,
  UpdateAvatarVariables
} from "../../lib/graphql/UpdateAvatar";
import {
  UnfollowProfileMutation,
  UnfollowProfileMutationVariables
} from "../../lib/graphql/UnfollowProfileMutation";
import {
  FollowProfileMutation,
  FollowProfileMutationVariables
} from "../../lib/graphql/FollowProfileMutation";
import { BackButtonBehavior } from "../Button";
import { useNavigation, useIsFocused } from "react-navigation-hooks";
import { NavigationProp } from "react-navigation";
import {
  ListRemixesQuery,
  ListRemixesQueryVariables
} from "../../lib/graphql/ListRemixesQuery";
import FollowerSeparatorComponent from "../ItemSeparatorComponent";
import { PostListItemFragment } from "../../lib/graphql/PostListItemFragment";
import {
  BlockUserMutation,
  BlockUserMutationVariables
} from "../../lib/graphql/BlockUserMutation";
import Alert from "../../lib/Alert";
import { useActionSheet } from "@expo/react-native-action-sheet";

type ListItemType = ListFollowers | ListProfilePosts | ListRemixes;
type ListItemVariables =
  | ListFollowersVariables
  | ListProfilePostsVariables
  | ListRemixesVariables;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  separator: {
    height: 3,
    width: 1
  }
});

const PostSeparatorComponent = () => <View style={styles.separator} />;

type ListItem = PostListItem | FollowerListItemFragment;

type Props = {
  profile: ViewProfile_profile | null;
  followProfile: MutationFunction<
    FollowProfileMutation,
    FollowProfileMutationVariables
  >;
  unfollowProfile: MutationFunction<
    UnfollowProfileMutation,
    UnfollowProfileMutationVariables
  >;
  loadingProfile: Boolean;
  loadingSection: Boolean;
  following: Boolean | null;
  isCurrentUser: Boolean;
  section: ViewProfileSection;
  data: Array<ListItem>;
  contentOffset?: {
    x: number;
    y: number;
  };
  contentInset?: {
    top: number;
    bottom: number;
  };
  profileId: string;
  updateAvatar: MutationFunction<UpdateAvatar, UpdateAvatarVariables>;

  navigation: NavigationProp;
  backButtonBehavior?: BackButtonBehavior;
  fetchMore: (opts: FetchMoreOptions<ListItemType, ListItemVariables>) => void;
  setSection: (section: ViewProfileSection) => void;
};

const DRAG_END_INITIAL = 10000000;
const COLLAPSE_OFFSET = HEADER_HEIGHT - TOP_Y - COUNTER_HEIGHT;

class RawViewProfile extends React.Component<Props> {
  static defaultProps = {
    contentOffset: {
      y: COLLAPSE_OFFSET,
      x: 0
    },
    backButtonBehavior: BackButtonBehavior.back
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

  onMomentumScrollEnd = Animated.event(
    [
      {
        nativeEvent: () =>
          Animated.block([Animated.set(this.scrollGestureState, State.END)])
      }
    ],
    { useNativeDriver: true }
  );

  state = {
    visibleIDs: []
  };

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.isFocused && this.props.isFocused) {
      this.handleRefresh();
    }
  }

  handleChangeSection = (section: ViewProfileSection) => {
    if (this.props.data.length > 0) {
      this.flatListRef.current.scrollToIndex({
        index: 0,
        animated: true,
        viewPosition: 0,
        viewOffset: 0
      });
    }

    this.scrollY.setValue(0);

    this.props.setSection(section);
  };

  renderListHeader = () => {
    const { profile, onBlock } = this.props;

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
            isFollowing={this.props.profile.isFollowing}
            isCurrentUser={this.props.isCurrentUser}
            updateAvatar={this.props.updateAvatar}
            translateY={this.translateY}
            backButtonBehavior={this.props.backButtonBehavior}
            section={this.props.section}
            onChangeSection={this.handleChangeSection}
            onFollow={this.handleFollow}
            onUnfollow={this.handleUnfollow}
            onBlock={onBlock}
          />
        )}
      </View>
    );
  };

  openPost = (post: PostListItemFragment) => {
    this.props.navigation.navigate("ViewThread", {
      threadId: post.threadId,
      post: post
    });
  };

  getItemLayout = (data, index) => {
    const { section } = this.props;

    if (section === ViewProfileSection.followers) {
      return {
        index: index,
        offset:
          index * FOLLOWER_LIST_ITEM_HEIGHT +
          StyleSheet.hairlineWidth * FOLLOWER_LIST_ITEM_HEIGHT,
        length: FOLLOWER_LIST_ITEM_HEIGHT
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

  openProfile = (profileId: string) => {
    this.props.navigation.push("ViewProfile", {
      profileId
    });
  };
  renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    if (item.__typename === "Post") {
      let extraSpacing = 0;

      if (index > this.props.data.length - POST_LIST_ITEM_COLUMN_COUNT) {
        const remainingItems =
          POST_LIST_ITEM_COLUMN_COUNT - (index % POST_LIST_ITEM_COLUMN_COUNT);
        if (index === this.props.data.length - 1) {
          let offsetCount = remainingItems - 1;
          extraSpacing =
            offsetCount * POST_LIST_ITEM_WIDTH + offsetCount * SPACING.half;
        }
      }

      return (
        <View
          style={
            extraSpacing && {
              marginRight: extraSpacing
            }
          }
        >
          <PostListItem
            post={item}
            onPress={this.openPost}
            isVisible={this.state.visibleIDs.includes(item.id)}
            showProfile={item.profile.id !== this.props.profileId}
          />
        </View>
      );
    } else {
      return <FollowerListItem profile={item} onPress={this.openProfile} />;
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

  loadMoreData = () => {
    if (this.props.loadingSection) {
      return;
    }

    if (!this.props.hasMore) {
      return;
    }

    this.props.fetchMore({
      variables: {
        offset: this.props.data.length,
        limit: 20,
        profileId: this.props.profileId
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        const { section } = this.props;

        let result: ListItemType = {};

        if (section === ViewProfileSection.followers) {
          const _previous = previousResult as ListFollowers;
          const _new = fetchMoreResult as ListFollowers;
          const data = _previous.profile.followers.data.concat(
            _new.profile.followers.data
          );

          result = {
            ...fetchMoreResult,
            profile: {
              ...fetchMoreResult.profile,
              followers: {
                ...fetchMoreResult.profile.followers,
                data: uniqBy(data, "id")
              }
            }
          };
        } else if (
          section === ViewProfileSection.posts ||
          section === ViewProfileSection.remixes
        ) {
          const _previous = previousResult as ListProfilePosts;
          const _new = fetchMoreResult as ListProfilePosts;
          const data = _previous.profile.posts.data.concat(
            _new.profile.posts.data
          );

          result = {
            ..._new,
            profile: {
              ..._new.profile,
              posts: {
                ..._new.profile.posts,
                data: uniqBy(data, "id")
              }
            }
          };
        }

        return result;
      }
    });
  };

  viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 0.15,
    waitForInteraction: false
  };

  flatListRef = React.createRef<FlatList>();

  onViewableItemsChanged = ({ viewableItems = [], changed } = {}) => {
    this.setState({ visibleIDs: viewableItems.map(item => item.id) });
  };

  handleRefresh = () => {
    if (this.props.refreshing || this.props.loadingSection) {
      return;
    }

    return this.props.refetch && this.props.refetch();
  };
  render() {
    const {
      data,
      section,
      contentInset,
      contentOffset,
      refreshing
    } = this.props;

    const ItemSeparatorComponent =
      section === ViewProfileSection.followers
        ? FollowerSeparatorComponent
        : PostSeparatorComponent;

    return (
      <FlatList
        style={styles.container}
        renderScrollComponent={this.renderScrollView}
        ListHeaderComponent={this.renderListHeader()}
        contentOffset={contentOffset}
        stickyHeaderIndices={[0]}
        contentInsetAdjustmentBehavior="never"
        refreshing={refreshing}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={this.handleRefresh}
            tintColor="white"
          />
        }
        extraData={this.state}
        contentInset={contentInset}
        ref={this.flatListRef}
        ItemSeparatorComponent={ItemSeparatorComponent}
        columnWrapperStyle={
          section !== ViewProfileSection.followers && {
            justifyContent: "space-evenly",
            backgroundColor: "#111"
          }
        }
        data={this.props.data}
        onScroll={this.onScroll}
        onScrollBeginDrag={this.onScrollBeginDrag}
        onScrollEndDrag={this.onScrollEndDrag}
        scrollEventThrottle={1}
        onEndReached={this.loadMoreData}
        key={section}
        viewabilityConfig={this.viewabilityConfig}
        numColumns={
          section === ViewProfileSection.followers
            ? 1
            : POST_LIST_ITEM_COLUMN_COUNT
        }
        getItemLayout={this.getItemLayout}
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
        onViewableItemsChanged={this.onViewableItemsChanged}
      />
    );
  }
}

const QUERY_TO_SECTION_MAPPING = {
  [ViewProfileSection.followers]: LIST_FOLLOWERS_QUERY,
  [ViewProfileSection.posts]: LIST_PROFILE_POSTS_QUERY,
  [ViewProfileSection.remixes]: LIST_REMIXES_QUERY
};

export const ViewProfile = ({
  profileId,
  contentInset,
  contentOffset,
  backButtonBehavior
}) => {
  const [section, setSection] = React.useState(ViewProfileSection.posts);

  const navigation = useNavigation();

  const { userId } = React.useContext(UserContext);
  const isFocused = useIsFocused();

  const viewProfileQuery = useQuery<ViewProfileQuery, ViewProfileVariables>(
    VIEW_PROFILE_QUERY,
    {
      variables: { profileId },

      notifyOnNetworkStatusChange: true
    }
  );

  const {
    loading,
    data: { profile = null, following = false } = {}
  } = viewProfileQuery;

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

  const [updateAvatar] = useMutation(UPDATE_AVATAR_MUTATION, {
    awaitRefetchQueries: true,
    refetchQueries: [
      { query: VIEW_PROFILE_QUERY, variables: { profileId } },
      { query: CURRENT_USER_QUERY }
    ]
  });

  const [blockUser] = useMutation<
    BlockUserMutation,
    BlockUserMutationVariables
  >(BLOCK_USER_MUTATION);

  const variables = React.useMemo(
    () => ({
      profileId,
      offset: 0,
      limit: 20
    }),
    [profileId]
  );

  const [loadPosts, postsQuery] = useLazyQuery<
    ListProfilePosts,
    ListProfilePostsVariables
  >(LIST_PROFILE_POSTS_QUERY, {
    variables,
    notifyOnNetworkStatusChange: true
  });

  const {
    loading: loadingPostsSection,
    data: postsData,
    fetchMore: fetchMorePosts,
    networkStatus: postsNetworkStatus
  } = postsQuery || {};

  const [loadRemixes, remixesQuery] = useLazyQuery<
    ListRemixesQuery,
    ListRemixesQueryVariables
  >(LIST_REMIXES_QUERY, {
    variables,
    notifyOnNetworkStatusChange: true
  });

  const {
    loading: loadingRemixesSection,
    data: remixesData,
    networkStatus: remixNetworkStatus,
    fetchMore: fetchMoreRemixes
  } = remixesQuery || {};

  const [loadFollowers, followersQuery] = useLazyQuery<
    ListFollowers,
    ListFollowersVariables
  >(LIST_FOLLOWERS_QUERY, {
    variables,
    notifyOnNetworkStatusChange: true
  });

  const {
    loading: loadingFollowersSection,
    data: followersData,
    networkStatus: followersNetworkStatus,
    fetchMore: fetchMoreFollowers
  } = followersQuery || {};

  let listData = [];
  let hasMore = false;
  let fetchMore;
  let loadingSection = true;
  let refetch;
  let refreshing = false;

  if (section === ViewProfileSection.followers) {
    const _data = (followersData || {
      profile: {
        followers: {
          data: [],
          hasMore: false
        }
      }
    }) as ListFollowers;

    refetch = followersQuery?.refetch;

    if (
      typeof _data.profile.followers === "object" &&
      followersNetworkStatus !== NetworkStatus.setVariables
    ) {
      listData = _data.profile.followers.data;
      hasMore = _data.profile.followers.hasMore;
    } else {
      listData = [];
      hasMore = false;
    }

    fetchMore = fetchMoreFollowers;
    loadingSection = loadingFollowersSection;
    refreshing = followersNetworkStatus === NetworkStatus.refetch;
  } else if (section === ViewProfileSection.posts) {
    const _data = (postsData || {
      profile: {
        posts: {
          data: [],
          hasMore: false
        }
      }
    }) as ListProfilePosts;

    refetch = postsQuery?.refetch;
    refreshing = postsNetworkStatus === NetworkStatus.refetch;

    if (
      typeof _data.profile.posts === "object" &&
      postsNetworkStatus !== NetworkStatus.setVariables
    ) {
      listData = _data.profile.posts.data;
      hasMore = _data.profile.posts.hasMore;
    } else {
      listData = [];
      hasMore = false;
    }

    fetchMore = fetchMorePosts;
    loadingSection = loadingPostsSection;
  } else if (
    section === ViewProfileSection.remixes &&
    remixNetworkStatus !== NetworkStatus.setVariables
  ) {
    const _data = (remixesData || {
      profile: {
        posts: {
          data: [],
          hasMore: false
        }
      }
    }) as ListRemixes;

    if (typeof _data.profile.posts === "object") {
      listData = _data.profile.posts.data;
      hasMore = _data.profile.posts.hasMore;
    } else {
      listData = [];
      hasMore = false;
    }

    fetchMore = fetchMoreRemixes;
    loadingSection = loadingRemixesSection;
    refetch = remixesQuery?.refetch;
    refreshing = remixNetworkStatus === NetworkStatus.refetch;
  }

  React.useEffect(() => {
    if (section === ViewProfileSection.followers) {
      loadFollowers();
    } else if (section == ViewProfileSection.posts) {
      loadPosts();
    } else if (section === ViewProfileSection.remixes) {
      loadRemixes();
    }
  }, [section, loadFollowers, loadPosts, loadRemixes]);

  const handleBlockUser = React.useCallback(async () => {
    const shouldContinue = await Alert.prompt({
      title: "Are you sure?",
      message:
        "This will prevent them from seeing any of your posts or comments in yeet.",
      confirm: "Yes",
      cancel: "Cancel"
    });

    if (!shouldContinue) {
      return;
    }

    blockUser({
      variables: {
        userId: profileId
      }
    }).then(() => {
      navigation.goBack();
    });
  }, [navigation, blockUser, profileId]);

  const refetchAll = React.useCallback(() => {
    return Promise.all(
      [
        typeof refetch === "function" && refetch(),
        typeof viewProfileQuery.refetch === "function" &&
          viewProfileQuery.refetch()
      ].filter(Boolean)
    );
  }, [refetch, viewProfileQuery]);

  const isCurrentUser = userId === profileId;

  return (
    <RawViewProfile
      profile={profile}
      profileId={profileId}
      loadingProfile={loading}
      following={following}
      followProfile={followProfile}
      isFocused={isFocused}
      navigation={navigation}
      unfollowProfile={unfollowProfile}
      contentInset={contentInset}
      section={section}
      loadingSection={loadingSection}
      fetchMore={fetchMore}
      data={listData}
      setSection={setSection}
      backButtonBehavior={backButtonBehavior}
      hasMore={hasMore}
      refetch={refetchAll}
      refreshing={refreshing}
      contentOffset={contentOffset}
      isCurrentUser={isCurrentUser}
      onBlock={handleBlockUser}
      updateAvatar={updateAvatar}
    />
  );
};

export default ViewProfile;
