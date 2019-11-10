import * as React from "react";
import { Picker } from "react-native";
import { range } from "lodash";

export const DurationPicker = ({
  value,
  start,
  end,
  onChange,
  style,
  color
}) => {
  const values = React.useMemo(() => {
    return range(start, end).map(sec => {
      return {
        label: String(sec) + "sec",
        value: sec
      };
    });
  }, [start, end]);

  const handleChange = React.useCallback(
    itemValue => {
      onChange(itemValue);
    },
    [onChange]
  );

  const renderItem = React.useCallback(
    item => {
      return (
        <Picker.Item
          color={color}
          label={item.label}
          value={item.value}
          key={item.value}
        />
      );
    },
    [color]
  );

  return (
    <Picker onValueChange={handleChange} style={style} selectedValue={value}>
      {values.map(renderItem)}
    </Picker>
  );
};
