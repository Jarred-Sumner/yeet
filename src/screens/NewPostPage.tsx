import * as React from "react";
import { View, StyleSheet } from "react-native";
import { NewPost } from "../components/NewPost/NewPost";

const styles = StyleSheet.create({
  container: {}
});

export class NewPostPage extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <NewPost />
      </View>
    );
  }
}

export default NewPostPage;
