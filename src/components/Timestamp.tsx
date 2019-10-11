import React from "react";
import {
  format,
  formatDistanceStrict,
  isSameDay,
  isSameHour,
  isSameMinute,
  isSameWeek,
  differenceInMinutes,
  differenceInDays,
  isSameMonth
} from "date-fns/esm";
import { Text } from "./Text";
import { differenceInHours, differenceInWeeks } from "date-fns";

export type TimestampType = string | Date;

const normalizeTimestamp = (time: TimestampType) => {
  if (typeof time === "string") {
    return new Date(time);
  } else {
    return time;
  }
};

export const shortFormat = (time: TimestampType): string => {
  const date = normalizeTimestamp(time);
  const now = new Date();

  const hourDiff = Math.abs(differenceInHours(date, now));
  const dayDiff = Math.abs(differenceInDays(date, now));
  const minDiff = Math.abs(differenceInMinutes(date, now));

  if (isSameMinute(date, now)) {
    return "just now";
  } else if (minDiff < 60) {
    return `${minDiff}m`;
  } else if (hourDiff < 36) {
    return `${hourDiff}h`;
  } else if (dayDiff < 14) {
    return `${dayDiff}d`;
  } else if (isSameMonth(date, now)) {
    return `${Math.abs(differenceInWeeks(date, now))}d`;
  } else {
    return format(date, "MMM Do");
  }
};

export const Timestamp = ({
  TextComponent = Text,
  time,
  style,
  ...otherProps
}) => {
  const formattedTime = shortFormat(time);

  return (
    <TextComponent {...otherProps} style={style}>
      {formattedTime}
    </TextComponent>
  );
};
