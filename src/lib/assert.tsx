import { IS_PRODUCTION, IS_DEVELOPMENT } from "../../config";
import invariant from "invariant";

type DevelopmentLogFunction = (...args: [any]) => void;

export let log: DevelopmentLogFunction;

if (IS_DEVELOPMENT) {
  log = (...args) => console.log.apply(console, args);
} else {
  log = () => {};
}

export const softAssert = (condition: any | Object, message: string) => {
  if (IS_PRODUCTION) {
    return;
  }

  if (!condition) {
    console.warn(message, "\nSoft Assertion");
  }
};
export { invariant as hardAssert };
