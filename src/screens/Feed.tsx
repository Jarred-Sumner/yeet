import * as React from "react";
import { View, StyleSheet } from "react-native";
import { BoldText } from "../components/Text";
import { COLORS } from "../lib/styles";
import { PromptListViewContainer } from "../containers/PromptListViewContainer";

const styles = StyleSheet.create({});

export class FeedPage extends React.Component {
  static navigationOptions = {
    title: "yeet"
  };
  render() {
    return <PromptListViewContainer />;
  }
}

export default FeedPage;
