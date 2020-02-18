import * as React from "react";

export const ContentContainerContext = React.createContext({
  contentContainerTag: null,
  movableViewTags: [],
  addMovableViewTag: (tag: number) => {},
  removeMovableViewTag: (tag: number) => {}
});
