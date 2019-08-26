import * as React from "react";
import { View, StyleSheet, TextInput, Image } from "react-native";
import {
  ImagePostBlock as ImagePostBlockType,
  ChangeBlockFunction
} from "./NewPostFormat";
import { SPACING } from "../../lib/styles";
import { fontStyleSheets } from "../Text";

type Props = {
  block: ImagePostBlockType;
  onChange: ChangeBlockFunction;
};

const styles = StyleSheet.create({
  container: {
    width: "100%"
  }
});

export class ImagePostBlock extends React.Component<Props> {
  handleChange = text => {
    this.props.onChange({
      ...this.props.block,
      value: text
    });
  };

  render() {
    const { block } = this.props;

    return (
      <View
        style={[
          styles.container,
          { height: block.value.height, backgroundColor: "transparent" }
        ]}
      >
        <Image
          source={block.value.src}
          resizeMode="contain"
          style={{
            width: block.value.width,
            height: block.value.height
          }}
        />
      </View>
    );
  }
}
