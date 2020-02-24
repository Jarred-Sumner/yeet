import * as React from "react";
import { PostSchemaValue, PostSchema } from "../../lib/PostEditor/EVENT_TYPES";
import { buildPost } from "../../lib/buildPost";
import produce, {
  immerable,
  produceWithPatches,
  Draft,
  Patch,
  original
} from "immer";
import { toPairs } from "lodash";
import { applyPatches } from "immer";

const MAX_UNDO_HISTORY = 100;

type Commit = {
  patches: Array<Patch>;
  version: number;
  action: PostSchema.Action;
};

const IGNOREABLE_UNDOS = [PostSchema.Action.updateNodeFrame];

const groupCommits = (
  _commits: Array<Commit>,
  fromVersion: number
): Array<Commit> => {
  let startIndex = _commits.findIndex(commit => commit.version >= fromVersion);

  if (startIndex === -1 || typeof fromVersion !== "number") {
    return _commits;
  }

  console.log({ startIndex });

  startIndex = Math.max(startIndex, 0);
  const patches = _commits.slice(startIndex).reduce((patches, commit) => {
    return commit.patches.concat(patches);
  }, []);

  const commits = _commits.slice(0, startIndex);
  if (patches.length > 0) {
    commits.push({
      patches: patches,
      action: _commits[startIndex].action,
      version: fromVersion
    });
  }
  return commits;
};

export function useImmer<S = any>(
  initialValue: S | (() => S)
): [S, (f: (draft: Draft<S>) => void | S) => void];
export function useImmer(initialValue: any) {
  const [val, updateValue] = React.useState<PostSchemaValue>(initialValue);
  const [commits, setCommits] = React.useState<Array<Commit>>([]);
  const groupFromVersion = React.useRef<number | null>(null);

  const currentVersion = React.useRef(-1);

  const setGroupCommit = React.useCallback(
    shouldGroup => {
      const isGrouping = groupFromVersion.current !== null;

      if (shouldGroup && shouldGroup !== isGrouping) {
        let lastVersion = Math.max(currentVersion.current - 1, 0);
        console.log("Setting group version to", lastVersion);
        groupFromVersion.current = lastVersion;
      } else if (!shouldGroup && isGrouping) {
        groupFromVersion.current = null;
      }
    },
    [currentVersion, groupFromVersion, commits, commits.length]
  );

  const undo = React.useCallback(() => {
    setCommits(commits => {
      let _commits = [...commits];

      const undoCommit = _commits.pop();

      if (undoCommit) {
        updateValue(val => applyPatches(val, undoCommit.patches));
      }

      return _commits;
    });
    groupFromVersion.current = null;
  }, [updateValue, setCommits, applyPatches, currentVersion]);

  return [
    val,
    React.useCallback(
      ([action, updater]) => {
        updateValue(val => {
          return produce(val, updater, (_, patches) => {
            currentVersion.current += 1;
            const version = currentVersion.current;
            const groupVersion = groupFromVersion.current;

            setCommits(commits => {
              let newCommits = [...commits];

              console.log("Grouping commits from version", groupVersion);
              console.log("Current version:", version);

              newCommits.push({
                patches,
                action,
                version
              });

              if (typeof groupVersion === "number") {
                newCommits = groupCommits(newCommits, groupVersion);
              }

              return newCommits;
            });
          });
        });
      },
      [currentVersion, groupFromVersion, setCommits, updateValue, groupCommits]
    ),
    commits.length > 0,
    undo,
    setGroupCommit
  ];
}

type PostSchemaContextType = {
  schema: PostSchemaValue;
  undo: () => void;
  canUndo: Boolean;
  updateSchema: (value: any) => void;
  setUndoGroup: (on: Boolean) => void;
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
  const [schema, setSchema, canUndo, undo, setUndoGroup] = useImmer<
    PostSchemaValue
  >(() => {
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
      updateSchema,
      canUndo,
      undo,

      setUndoGroup
    }),
    [schema, updateSchema, canUndo, undo, setUndoGroup]
  );

  return (
    <PostSchemaContext.Provider value={contextValue}>
      {children}
    </PostSchemaContext.Provider>
  );
};
