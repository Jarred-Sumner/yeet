import * as React from "react";
import { DatePickerIOS } from "react-native";
import { range } from "lodash";

export const DatePicker = ({ value, max, min, onChange }) => {
  const handleChange = React.useCallback(
    itemValue => {
      onChange(itemValue);
    },
    [onChange]
  );

  return (
    <DatePickerIOS
      maximumDate={max}
      minimumDate={min}
      mode="date"
      onDateChange={handleChange}
      date={value}
    />
  );
};
