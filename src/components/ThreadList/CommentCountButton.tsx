import { useQuery } from "@apollo/react-hooks";
import * as React from "react";
import { QueryResult } from "react-apollo";
import { ViewPost } from "../../lib/graphql/ViewPost";
import POST_QUERY from "../../lib/ViewPostQuery.graphql";
import { IconComment } from "../Icon";
import { UserContext } from "../UserContext";
import CountButton from "./CountButton";

const CommentCountButtonComponent = ({
  count,
  onPress,
  isCommented,
  size = 32,
  disabled
}) => (
  <CountButton
    Icon={IconComment}
    color={isCommented ? "rgb(246, 52, 104)" : "white"}
    type="shadow"
    onPress={onPress}
    size={size}
    disabled={disabled}
    count={count}
  />
);

export const CommentCountButton = ({ id, onPress, size = 32, disabled }) => {
  const query: QueryResult<ViewPost> = useQuery(POST_QUERY, {
    variables: { id },
    fetchPolicy: "cache-only"
  });
  const { userId } = React.useContext(UserContext);

  const post = (query.data || {}).post;

  return (
    <CommentCountButtonComponent
      count={post ? post.commentsCount : 0}
      isCommented={false}
      onPress={onPress}
      size={size}
      disabled={disabled}
    />
  );
};
