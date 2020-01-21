import * as React from "react";
import { BoundsRect } from "../../../lib/Rect";

const DEFAULT_BOUNDS = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

export const ClipContext = React.createContext({
  bounds: DEFAULT_BOUNDS
});

export const ClipProvider = ({ value: bounds, children }) => {
  const contextValue = React.useMemo(
    () => ({
      bounds: bounds ?? { x: 0, y: 0, width: 0, height: 0 }
    }),
    [bounds]
  );

  return (
    <ClipContext.Provider value={contextValue}>{children}</ClipContext.Provider>
  );
};
