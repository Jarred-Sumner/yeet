import { PostListItemFragment } from "./graphql/PostListItemFragment";

export const postElementId = (post: PostListItemFragment) => {
  return `post__${post.id}`;
};
