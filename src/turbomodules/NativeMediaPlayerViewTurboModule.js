// @flow

import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";
import * as TurboModuleRegistry from "react-native/Libraries/TurboModule/TurboModuleRegistry";

export interface Spec extends TurboModule {
  // Exported methods.
  +greeting: () => string;
  +getRandomNumber: () => number;
  +addItBy30: (num: number) => number;
  +isBiggerThan100: (num: number) => boolean;
  +nativeReverse: (array: Array<any>) => Array<any>;
  +simulateCallback: (
    waitingSeconds: number,
    callback: (value: string) => void
  ) => void;
  +simulatePromise: (error: boolean, waitingSeconds: number) => Promise<string>;
  +getDeviceInfo: () => Object;
}

export default (TurboModuleRegistry.getEnforcing <
  Spec >
  "MediaPlayerViewTurboModule": Spec);
