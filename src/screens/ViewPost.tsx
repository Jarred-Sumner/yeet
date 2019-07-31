import * as React from "react";
import { View, StyleSheet, Text } from "react-native";
import { BoldText } from "../components/Text";

const styles = StyleSheet.create({});

export class ViewPostPage extends React.Component {
  render() {
    return (
      <View>
        <BoldText>View post</BoldText>
      </View>
    );
  }
}

export default ViewPostPage;
