import * as React from "react";
import { BoundsRect } from "../../../lib/Rect";

const DEFAULT_BOUNDS = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

export const ClipContext = React.createContext({
  bounds: DEFAULT_BOUNDS,
  setBounds: (bounds: BoundsRect) => null
});

export const ClipProvider = ({ children }) => {
  const [bounds, setBounds] = React.useState(DEFAULT_BOUNDS);

  const contextValue = React.useMemo(
    () => ({
      bounds,
      setBounds
    }),
    [bounds, setBounds]
  );

  return (
    <ClipContext.Provider value={contextValue}>{children}</ClipContext.Provider>
  );
};
