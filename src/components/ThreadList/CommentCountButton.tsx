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

export const CommentCountButton = ({
  onPress,
  size = 32,
  disabled,
  count = 0
}) => {
  return (
    <CommentCountButtonComponent
      count={count}
      isCommented={false}
      onPress={onPress}
      size={size}
      disabled={disabled}
    />
  );
};
