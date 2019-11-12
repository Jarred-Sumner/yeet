import * as React from "react";
import { View, StyleSheet } from "react-native";
import {
  TouchableOpacity,
  BorderlessButton
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { IconCheck } from "./Icon";
import { MediumText } from "./Text";
import { SPACING, COLORS } from "../lib/styles";
import { uniq, compact } from "lodash";

const SELECTED_COLOR = COLORS.secondary;
const UNSELECTED_COLOR = COLORS.muted;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.normal,
    alignItems: "center",
    flexDirection: "row"
  },
  selectedIcon: {
    color: SELECTED_COLOR
  },
  unselectedIcon: {
    color: UNSELECTED_COLOR,
    opacity: 0.5
  },
  selectedLabel: {
    color: SELECTED_COLOR
  },
  unselectedLabel: {
    color: UNSELECTED_COLOR
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center"
  },
  icon: {
    fontSize: 18
  },
  label: {
    fontSize: 16,
    marginLeft: SPACING.normal,
    flex: 1,
    paddingVertical: SPACING.half
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
    marginBottom: SPACING.half
  }
});

export type CheckboxValue = string | number | Boolean;

export type CheckboxOption = {
  label: string;
  value: CheckboxValue;
};

export type CheckboxOptions = Array<CheckboxOption>;

const ItemSeparatorComponent = () => (
  <View pointerEvents="none" style={styles.separator} />
);

export const Checkbox = React.memo(
  ({
    label,
    value,
    isSelected,
    onPress
  }: CheckboxOption & {
    onPress: (id: CheckboxValue, value: CheckboxValue | null) => void;
    isSelected: boolean;
  }) => {
    const handlePress = React.useCallback(() => {
      onPress(value, isSelected ? null : value);
    }, [isSelected, value, onPress]);

    return (
      <BorderlessButton shouldActivateOnStart={false} onPress={handlePress}>
        <Animated.View style={styles.container}>
          <View style={styles.iconContainer}>
            <IconCheck
              style={[
                styles.icon,
                isSelected ? styles.selectedIcon : styles.unselectedIcon
              ]}
            />
          </View>

          <MediumText
            adjustsFontSizeToFit
            style={[
              styles.label,
              isSelected ? styles.selectedLabel : styles.unselectedLabel
            ]}
          >
            {label}
          </MediumText>
        </Animated.View>
      </BorderlessButton>
    );
  }
);

export const CheckboxGroup = ({
  options,
  onChange,
  values
}: {
  options: CheckboxOptions;
  onChange: (values: Array<CheckboxValue>) => void;
  values: Array<CheckboxValue>;
}): React.ReactNodeArray => {
  const handleChange = React.useCallback(
    (value: CheckboxValue, selected: boolean) => {
      const _values = [...values];
      if (selected) {
        _values.push(value);
      } else if (!selected && values.includes(value)) {
        _values.splice(_values.indexOf(value), 1);
      }

      onChange(uniq(compact(_values)));
    },
    [values, onChange]
  );

  const renderCheckbox = React.useCallback(
    (checkbox: CheckboxOption) => {
      return (
        <React.Fragment key={`${checkbox.value.toString()}`}>
          <Checkbox
            label={checkbox.label}
            value={checkbox.value}
            isSelected={values.includes(checkbox.value)}
            onPress={handleChange}
          />
          <ItemSeparatorComponent />
        </React.Fragment>
      );
    },
    [values, onChange]
  );

  return options.map(renderCheckbox);
};
