import * as React from "react";
import { View, StyleSheet, Text } from "react-native";
import { BoldText } from "../components/Text";

const styles = StyleSheet.create({});

export class ViewProfilePage extends React.Component {
  render() {
    return (
      <View>
        <BoldText>ViewProfile</BoldText>
      </View>
    );
  }
}

export default ViewProfilePage;
