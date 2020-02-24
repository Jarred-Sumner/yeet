import * as React from "react";
import { FocusType } from "../../lib/buildPost";
import { dismissKeyboard } from "../../lib/Yeet";
import { PostSchemaContext } from "./PostSchemaProvider";

type SetFocusFunction = (
  focusType: FocusType | null,
  focusedBlockId: string | null
) => void;
export type EditorFocusContextType = {
  focusType: FocusType;
  focusedBlockId: string;
  clearFocus: () => void;
  setFocus: SetFocusFunction;
};

export const EditorFocusContext = React.createContext<EditorFocusContextType>(
  null
);

export const EditorFocusProvider = ({ children }) => {
  const {
    setUndoGroup,
    schema: {
      post: { blocks },
      inlineNodes
    }
  } = React.useContext(PostSchemaContext);

  const [focusType, setFocusType] = React.useState<FocusType>(null);
  const [focusedBlockId, setFocusedBlockId] = React.useState<string>(null);
  const clearFocus = React.useCallback(() => {
    setFocusType(null);
    setFocusedBlockId(null);
    dismissKeyboard();
  }, [setFocusType, setFocusedBlockId, dismissKeyboard, setUndoGroup]);

  const setFocus: SetFocusFunction = React.useCallback(
    (focusType, focusedBlockId) => {
      if (focusType !== null) {
        setUndoGroup(true);
      }

      setFocusType(focusType);
      setFocusedBlockId(focusedBlockId);
      dismissKeyboard();
    },
    [setFocusType, setFocusedBlockId, setUndoGroup, dismissKeyboard]
  );

  React.useEffect(() => {
    if (focusType === null) {
      setUndoGroup(false);
    }
  }, [setUndoGroup, focusType]);

  const contextValue = React.useMemo<EditorFocusContextType>(
    () => ({
      clearFocus,
      focusType,
      setFocus,
      focusedBlockId
    }),
    [clearFocus, focusType, setFocus, focusedBlockId]
  );

  return (
    <EditorFocusContext.Provider value={contextValue}>
      {children}
    </EditorFocusContext.Provider>
  );
};
