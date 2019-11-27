import { filter } from "graphql-anywhere";
import * as React from "react";
import { View, StyleSheet } from "react-native";
import { IconHeart, IconLike, IconLikeAlt } from "../Icon";
import CountButton from "./CountButton";
import PostFragment from "../../lib/PostFragment.graphql";
import { useQuery } from "@apollo/react-hooks";
import POST_QUERY from "../../lib/ViewPostQuery.graphql";
import { ViewPost } from "../../lib/graphql/ViewPost";
import { UserContext } from "../UserContext";
import { QueryResult } from "react-apollo";
import { COLORS } from "../../lib/styles";

const LikeCountButtonComponent = ({
  count,
  onPress,
  isLiked,
  size = 32,
  buttonRef,
  disabled
}) => (
  <CountButton
    buttonRef={buttonRef}
    Icon={isLiked ? IconLike : IconLikeAlt}
    color={isLiked ? "rgb(246, 52, 104)" : "white"}
    type="shadow"
    onPress={onPress}
    size={size}
    disabled={disabled}
    count={count}
  />
);

export const LikeCountButton = ({
  id,
  onPress,
  size = 32,
  disabled,
  buttonRef
}) => {
  const query: QueryResult<ViewPost> = useQuery(POST_QUERY, {
    variables: { id },
    fetchPolicy: "cache-only"
  });
  const { userId } = React.useContext(UserContext);

  const post = (query.data || {}).post;

  return (
    <LikeCountButtonComponent
      count={post ? post.likesCount : 0}
      buttonRef={buttonRef}
      isLiked={userId ? post?.likes?.profileIDs?.includes(userId) : false}
      onPress={onPress}
      size={size}
      disabled={disabled}
    />
  );
};
