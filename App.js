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
import {
  createStackNavigator,
  createAppContainer,
  createBottomTabNavigator
} from "react-navigation";
import { useScreens } from "react-native-screens";
import FeedPage from "./src/screens/Feed";
import ViewPostPage from "./src/screens/ViewPost";
import CreatePostPage from "./src/screens/CreatePostPage";
import SearchPage from "./src/screens/Search";
import CurrentProfilePage from "./src/screens/CurrentProfile";
import LeaderboardPage from "./src/screens/LeaderboardPage";
import { COLORS } from "./src/lib/styles";
import { ApolloProvider } from "./src/containers/ApolloProvider";
import { IconName, Icon } from "./src/components/Icon";

const Routes = createAppContainer(
  createBottomTabNavigator(
    {
      ViewPostTab: createStackNavigator(
        {
          ViewPost: {
            screen: ViewPostPage
          }
        },
        {
          cardStyle: {
            backgroundColor: "#111"
          },
          defaultNavigationOptions: {
            header: () => null
          }
        }
      ),
      Search: {
        screen: SearchPage
      },

      CreatePost: {
        screen: CreatePostPage
      },

      Leaderboard: {
        screen: LeaderboardPage
      },
      CurrentProfile: {
        screen: CurrentProfilePage
      }
    },
    {
      defaultNavigationOptions: ({ navigation }) => ({
        tabBarIcon: ({ focused, horizontal, tintColor }) => {
          const { routeName } = navigation.state;
          let IconComponent = Icon;

          if (routeName === "ViewPostTab") {
            return <Icon name={IconName.home} size={25} color={tintColor} />;
          } else if (routeName === "Leaderboard") {
            return <Icon name={IconName.trophy} size={25} color={tintColor} />;
          } else if (routeName === "CreatePost") {
            return <Icon name={IconName.plus} size={25} color={tintColor} />;
          } else if (routeName === "Search") {
            return <Icon name={IconName.search} size={25} color={tintColor} />;
          } else if (routeName === "CurrentProfile") {
            return <Icon name={IconName.profile} size={25} color={tintColor} />;
          } else {
            return null;
          }
        }
      }),
      tabBarOptions: {
        showLabel: false,
        activeTintColor: "#fff",
        inactiveTintColor: "#666",
        style: {
          backgroundColor: "#101010"
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
