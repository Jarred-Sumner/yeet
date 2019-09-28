import { filter } from "graphql-anywhere";
import * as React from "react";
import { View, StyleSheet } from "react-native";
import { IconHeart } from "../Icon";
import CountButton from "./CountButton";
import PostFragment from "../../lib/PostFragment.graphql";
import { useQuery } from "@apollo/react-hooks";
import POST_QUERY from "../../lib/ViewPostQuery.graphql";
import { ViewPost } from "../../lib/graphql/ViewPost";
import { UserContext } from "../UserContext";
import { QueryResult } from "react-apollo";

const LikeCountButtonComponent = ({ count, onPress, isLiked }) => (
  <CountButton
    Icon={IconHeart}
    color={isLiked ? "rgb(246, 52, 104)" : "white"}
    type="shadow"
    onPress={onPress}
    size={32}
    count={count}
  />
);

export const LikeCountButton = ({ id, onPress }) => {
  const query: QueryResult<ViewPost> = useQuery(POST_QUERY, {
    variables: { id },
    fetchPolicy: "cache-only"
  });
  const {
    currentUser: { id: userId = null }
  } = React.useContext(UserContext);

  const post = (query.data || {}).post;

  return (
    <LikeCountButtonComponent
      count={post ? post.likesCount : 0}
      isLiked={userId ? post.likes.profileIDs.includes(userId) : false}
      onPress={onPress}
    />
  );
};
