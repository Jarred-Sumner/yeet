import { View, findNodeHandle } from "react-native";
import * as React from "react";
import { BOTTOM_Y, SCREEN_DIMENSIONS } from "../../../config";
import { IconButton } from "../Button";
import { IconTrash } from "../Icon";
import { styles } from "./EditorFooter";

export const DELETE_SIZE = 36;
export const MID_Y_DELETE_BUTTON =
  SCREEN_DIMENSIONS.height - BOTTOM_Y - (DELETE_SIZE * 1.25) / 2;
export const MID_X_DELETE_BUTTON = SCREEN_DIMENSIONS.width / 2;

export const DeleteButtonContext = React.createContext({
  setDeleteTag: (tag: number) => {},
  deleteTag: null
});

export const DeleteButtonProvider = ({ children }) => {
  const [deleteTag, setDeleteTag] = React.useState(null);

  const contextValue = React.useMemo(() => ({ deleteTag, setDeleteTag }), [
    deleteTag,
    setDeleteTag
  ]);

  return (
    <DeleteButtonContext.Provider value={contextValue}>
      {children}
    </DeleteButtonContext.Provider>
  );
};

export const DeleteFooter = ({}) => {
  const { setDeleteTag } = React.useContext(DeleteButtonContext);
  const ref = React.useRef();

  const setTag = React.useCallback(() => {
    setDeleteTag(findNodeHandle(ref.current));
  }, [setDeleteTag, ref]);

  return (
    <View pointerEvents="none" style={styles.deleteFooter}>
      <View
        pointerEvents="none"
        onLayout={setTag}
        style={styles.deleteFooterContent}
      >
        <IconButton
          Icon={IconTrash}
          color="#fff"
          type="shadow"
          ref={ref}
          size={DELETE_SIZE * 0.75}
        />
      </View>
    </View>
  );
};
