import * as React from "react";
import { View, StyleSheet, Text } from "react-native";
import { BoldText } from "../components/Text";

const styles = StyleSheet.create({});

export class LeaderboardPage extends React.Component {
  render() {
    return (
      <View>
        <BoldText>Leaderboard</BoldText>
      </View>
    );
  }
}

export default LeaderboardPage;
