import { sample } from "lodash";

export const getPlaceholderUsername = () =>
  sample([
    "tom",
    "kevin",
    "spez",
    "jack",
    "dhof",
    "moot",
    "rhoover",
    "davidslog"
  ]);
