import * as React from "react";
import { View, StyleSheet, Text } from "react-native";
import { BoldText } from "../components/Text";
import { openImagePicker } from "../lib/ImagePickerContext";
import { globalUserContext } from "../components/UserContext";
import { navigate } from "../lib/NavigationService";

const styles = StyleSheet.create({});

const openUploadPostPage = navigation => {
  openImagePicker();

  const { body, id } = CreatePostPage.lastPrompt;

  window.setTimeout(() => {
    navigate("UploadPost", {
      promptId: id,
      promptBody: body
    });
  }, 300);
};

export class CreatePostPage extends React.Component {
  static navigationOptions = {
    tabBarOnPress: async ({ navigation, defaultHandler }) => {
      if (globalUserContext.requireAuthentication(openUploadPostPage)) {
        return;
      }

      openUploadPostPage(navigation);
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
