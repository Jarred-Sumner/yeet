/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from "react";
import { StatusBar } from "react-native";
import { PortalProvider, WhitePortal } from "react-native-portal";
import { useScreens } from "react-native-screens";
import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { MaterialThemeProvider } from "./src/components/MaterialThemeProvider";
import { UserContextProvider } from "./src/components/UserContext";
import { ApolloProvider } from "./src/containers/ApolloProvider";
import { ImagePickerProvider } from "./src/lib/ImagePickerContext";
import NavigationService from "./src/lib/NavigationService";
import { COLORS } from "./src/lib/styles";
import LoginScreen from "./src/screens/LoginScreen";
import NewPostPage from "./src/screens/NewPostPage";
import SignUpScreen from "./src/screens/SignUpScreen";
import UploadPostPage from "./src/screens/UploadPostPage";
import ImagePickerPage from "./src/screens/ImagePickerPage";
import { createSharedElementStackNavigator } from "react-navigation-shared-element";
import { Toast } from "./src/components/Toast";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { createMaterialTopTabNavigator } from "react-navigation-tabs";
import ThreadListPage from "./src/screens/ThreadList";
import ReplyPage from "./src/screens/ReplyPage";
import { createBottomTabNavigator } from "react-navigation-tabs";
import CurrentProfilePage from "./src/screens/CurrentProfile";
import SearchPage from "./src/screens/Search";
import NotificationsPage from "./src/screens/Notifications";
import { Icon, IconName } from "./src/components/Icon";
import { BottomTabBar } from "./src/components/BottomTabBar";
import ViewProfilePage from "./src/screens/ViewProfilePage";
import GlobalViewProfilePage from "./src/screens/ViewProfilePage";
import { IS_SIMULATOR } from "./config";
import { FeedPage } from "./src/screens/Feed";
import ThreadPage from "./src/screens/ViewThreadPage";

const TAB_ICON_SIZE = 18;

GlobalViewProfilePage.navigationOptions = {
  header: null
};

const SHARED_GLOBAL_SCREENS = {
  ViewProfile: {
    screen: GlobalViewProfilePage
  }
};

const Routes = createAppContainer(
  createStackNavigator(
    {
      Home: createSharedElementStackNavigator(
        createStackNavigator,
        {
          RootScreens: createBottomTabNavigator(
            {
              FeedTab: createSharedElementStackNavigator(
                createStackNavigator,
                {
                  ThreadList: FeedPage,

                  ReplyToPost: ReplyPage,
                  EditBlockPhotoInReply: ImagePickerPage,
                  ...SHARED_GLOBAL_SCREENS
                },
                {
                  cardStyle: {
                    backgroundColor: "#000"
                  },
                  headerMode: "none"
                  // defaultNavigationOptions: ({ navigation }) => ({
                  //   header: () => null
                  // })
                },
                {
                  cardStyle: {
                    backgroundColor: "#000"
                  },

                  headerMode: "none"
                  // defaultNavigationOptions: ({ navigation }) => ({
                  //   header: () => null,
                  //   headerMode: "none",
                  //   headerTransparent: true
                  // })
                }
              ),
              NotificationsTab: createStackNavigator(
                {
                  NotificationsPage: {
                    screen: NotificationsPage,
                    navigationOptions: navigation => ({
                      title: "Activity",
                      headerTintColor: "#f1f1f1",
                      headerStyle: {
                        backgroundColor: "#000"
                      }
                    })
                  },
                  ...SHARED_GLOBAL_SCREENS
                },
                {
                  headerMode: "float"
                }
              ),
              ProfileTab: createStackNavigator(
                {
                  CurrentProfilePage: CurrentProfilePage,
                  ...SHARED_GLOBAL_SCREENS
                },
                {
                  headerMode: "none"
                }
              )
            },
            {
              headerMode: "none",
              tabBarComponent: () => null,
              // initialRouteName: "ProfileTab",

              safeAreaInset: {
                bottom: "never",
                top: "never",
                left: "never",
                right: "never"
              },
              tabBarOptions: {
                keyboardHidesTabBar: true
              },
              cardStyle: {
                backgroundColor: "#000"
              }
            }
          ),
          NewPostStack: createSharedElementStackNavigator(
            createStackNavigator,
            {
              NewPost: NewPostPage,
              EditBlockPhoto: ImagePickerPage,
              ...SHARED_GLOBAL_SCREENS
            },
            {
              cardStyle: {
                backgroundColor: "#000"
              },
              headerMode: "none",
              // initialRouteName: IS_SIMULATOR ? "NewPost" : undefined,
              defaultNavigationOptions: {
                header: () => null,
                mode: "modal",
                headerTransparent: true,
                gesturesEnabled: false
              }
            }
          ),
          ViewThread: ThreadPage
        },
        {
          cardStyle: {
            backgroundColor: "#000"
          },
          headerMode: "none",
          // initialRouteName: IS_SIMULATOR ? "NewPostStack" : undefined,
          defaultNavigationOptions: {
            header: () => null,
            headerMode: "none"
          }
        }
      ),
      ...SHARED_GLOBAL_SCREENS,
      UploadPost: UploadPostPage,
      InsertSticker: ImagePickerPage,

      Auth: createStackNavigator(
        {
          Signup: SignUpScreen,
          Login: LoginScreen
        },
        {
          defaultNavigationOptions: ({ navigation }) => ({
            headerStyle: {
              backgroundColor: COLORS.secondary,
              borderBottomWidth: 0
            },
            headerTintColor: "white"
          }),
          cardStyle: {
            backgroundColor: COLORS.primary
          }
        }
      )
    },
    {
      mode: "modal",
      headerMode: "none",

      cardStyle: {
        backgroundColor: "#000"
      }
    }
  )
);

export class App extends React.Component {
  constructor(props) {
    super(props);

    useScreens();
  }

  setNavRef = navigatorRef => {
    NavigationService.setTopLevelNavigator(navigatorRef);
  };

  render() {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <PortalProvider>
          <MaterialThemeProvider>
            <ApolloProvider>
              <UserContextProvider>
                <ImagePickerProvider>
                  <ActionSheetProvider>
                    <>
                      <Toast />
                      <Routes ref={this.setNavRef} />
                      <WhitePortal name="modal" />
                    </>
                  </ActionSheetProvider>
                </ImagePickerProvider>
              </UserContextProvider>
            </ApolloProvider>
          </MaterialThemeProvider>
        </PortalProvider>
      </>
    );
  }
}

export default App;
