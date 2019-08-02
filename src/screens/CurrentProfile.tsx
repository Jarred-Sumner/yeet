import * as React from "react";
import { View, StyleSheet, Text } from "react-native";
import { BoldText } from "../components/Text";

const styles = StyleSheet.create({});

export class CurrentProfilePage extends React.Component {
  render() {
    return (
      <View>
        <BoldText>CurrentProfile</BoldText>
      </View>
    );
  }
}

export default CurrentProfilePage;
