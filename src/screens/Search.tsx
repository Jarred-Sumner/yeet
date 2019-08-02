import * as React from "react";
import { View, StyleSheet, Text } from "react-native";
import { BoldText } from "../components/Text";

const styles = StyleSheet.create({});

export class SearchPage extends React.Component {
  render() {
    return (
      <View>
        <BoldText>Search</BoldText>
      </View>
    );
  }
}

export default SearchPage;
