import * as React from "react";
import { View, StyleSheet, TextInput, Image } from "react-native";
import {
  ImagePostBlock as ImagePostBlockType,
  ChangeBlockFunction
} from "./NewPostFormat";
import { SPACING } from "../../lib/styles";
import { fontStyleSheets } from "../Text";
import RNTextDetector from "react-native-text-detector";

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
    const { block, onLayout } = this.props;

    return (
      <View
        onLayout={onLayout}
        style={[
          styles.container,
          {
            height: block.value.height,
            backgroundColor: "transparent",
            position: "absolute"
          }
        ]}
      >
        <Image
          source={block.value.src}
          resizeMode="stretch"
          style={{
            width: block.value.width,
            height: block.value.height
          }}
        />

        {this.props.children}
      </View>
    );
  }
}
