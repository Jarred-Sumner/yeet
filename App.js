/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Fragment } from "react";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar
} from "react-native";
import { createStackNavigator, createAppContainer } from "react-navigation";
import { useScreens } from "react-native-screens";
import FeedPage from "./src/screens/Feed";
import ViewPostPage from "./src/screens/ViewPost";
import { COLORS } from "./src/lib/styles";
import { ApolloProvider } from "./src/containers/ApolloProvider";

const Routes = createAppContainer(
  createStackNavigator(
    {
      Feed: {
        screen: FeedPage
      },
      ViewPost: {
        screen: ViewPostPage
      }
    },
    {
      cardStyle: {
        backgroundColor: COLORS.primary
      },
      defaultNavigationOptions: {
        headerTintColor: "white",
        headerStyle: {
          backgroundColor: COLORS.primaryDark
        }
      }
    }
  )
);

export class App extends React.Component {
  constructor(props) {
    super(props);

    useScreens();
  }

  render() {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <ApolloProvider>
          <Routes />
        </ApolloProvider>
      </>
    );
  }
}

export default App;
