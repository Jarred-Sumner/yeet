import * as React from "react";
import { View, StyleSheet, Text } from "react-native";
import { BoldText } from "../components/Text";
import { openImagePicker } from "../lib/ImagePickerContext";

const styles = StyleSheet.create({});

export class CreatePostPage extends React.Component {
  static navigationOptions = {
    tabBarOnPress: async ({ navigation, defaultHandler }) => {
      openImagePicker();

      const { body, id } = CreatePostPage.lastPrompt;

      window.setTimeout(() => {
        navigation.navigate("UploadPost", {
          promptId: id,
          promptBody: body
        });
      }, 300);
    }
  };

  render() {
    return (
      <View>
        <BoldText>CreatePost</BoldText>
      </View>
    );
  }
}

export default CreatePostPage;
