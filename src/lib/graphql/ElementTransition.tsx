import { PostListItemFragment } from "./PostListItemFragment";

export const postElementId = (post: PostListItemFragment) => {
  return `post__${post.id}`;
};
