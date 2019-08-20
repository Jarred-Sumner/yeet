import * as React from "react";
import { View, StyleSheet, TextInput } from "react-native";
import {
  TextPostBlock as TextPostBlockType,
  ChangeBlockFunction
} from "./NewPostFormat";
import { SPACING } from "../../lib/styles";
import { fontStyleSheets } from "../Text";

type Props = {
  block: TextPostBlockType;
  onChange: ChangeBlockFunction;
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 0
  },
  input: {
    fontSize: 18,
    paddingHorizontal: SPACING.half,
    paddingTop: SPACING.normal,
    paddingBottom: SPACING.normal,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    margin: 0,
    width: "100%",
    flex: 0
  }
});

export class TextPostBlock extends React.Component<Props> {
  handleChange = text => {
    this.props.onChange({
      ...this.props.block,
      value: text
    });
  };

  render() {
    const { block } = this.props;

    return (
      <View style={styles.container}>
        <TextInput
          value={block.value}
          multiline
          onChangeText={this.handleChange}
          placeholderTextColor="rgba(255, 255, 255, 0.25)"
          placeholder="Tap to type"
          keyboardAppearance="dark"
          style={[
            fontStyleSheets.semiBoldFont,
            styles.input,
            {
              backgroundColor: block.config.backgroundColor,
              color: block.config.color
            }
          ]}
        />
      </View>
    );
  }
}
