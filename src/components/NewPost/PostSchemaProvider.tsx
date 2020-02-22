import * as React from "react";
import { PostSchemaValue } from "../../lib/PostEditor/EVENT_TYPES";
import { buildPost } from "../../lib/buildPost";
import produce, { immerable, produceWithPatches, Draft } from "immer";
import { toPairs } from "lodash";

const maxUndoHistory = 100;

export function useImmer<S = any>(
  initialValue: S | (() => S)
): [S, (f: (draft: Draft<S>) => void | S) => void];
export function useImmer(initialValue: any) {
  const [val, updateValue] = React.useState(initialValue);
  const currentVersion = React.useRef(-1);
  const changes = React.useRef({});

  const bumpVersion = React.useCallback(() => {
    currentVersion.current += 1;
  }, [currentVersion]);

  return [
    val,
    React.useCallback(
      updater => {
        updateValue(val => {
          return produce(val, updater);
        });
      },
      [bumpVersion]
    )
  ];
}

type PostSchemaContextType = {
  schema: PostSchemaValue;
  incrementVersion: void;
  undo: () => void;
  canUndo: Boolean;
  updateSchema: (value: any) => void;
};

export const PostSchemaContext = React.createContext<PostSchemaContextType>(
  null
);

export const PostSchemaProvider = ({
  backgroundColor,
  width,
  height,
  blocks,
  positions,
  format,
  layout,
  defaultInlineNodes,
  children
}) => {
  const [schema, setSchema] = useImmer<PostSchemaValue>(() => {
    const post = buildPost({
      layout,
      width,
      height,
      blocks: new Map(toPairs(blocks)),
      positions,
      backgroundColor,
      format
    });

    post.positions[immerable] = true;
    const inlineNodes = new Map(toPairs(defaultInlineNodes));
    return {
      inlineNodes,
      post,
      transactions: []
    };
  });

  const updateSchema = React.useCallback(
    args => {
      return setSchema(args);
    },
    [setSchema]
  );

  const contextValue = React.useMemo<PostSchemaContextType>(
    () => ({
      schema,
      updateSchema
    }),
    [schema, updateSchema]
  );

  return (
    <PostSchemaContext.Provider value={contextValue}>
      {children}
    </PostSchemaContext.Provider>
  );
};
