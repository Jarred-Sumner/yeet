import * as React from "react";
import { View, StyleSheet, Text } from "react-native";
import { BoldText } from "../components/Text";

const styles = StyleSheet.create({});

export class NotificationsPage extends React.Component {
  render() {
    return (
      <View>
        <BoldText>Notifications</BoldText>
      </View>
    );
  }
}

export default NotificationsPage;
