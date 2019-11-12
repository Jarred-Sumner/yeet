/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import createStackNavigator from "react-native-screens/createNativeStackNavigator";
import { createAppContainer } from "react-navigation";
import { createBottomTabNavigator } from "react-navigation-tabs";
import { COLORS } from "./src/lib/styles";
import CurrentProfilePage from "./src/screens/CurrentProfile";
import { FeedPage } from "./src/screens/Feed";
import ImagePickerPage from "./src/screens/ImagePickerPage";
import LoginScreen from "./src/screens/LoginScreen";
import NewPostPage from "./src/screens/NewPostPage";
import NotificationsPage from "./src/screens/Notifications";
import ReplyPage from "./src/screens/ReplyPage";
import SignUpScreen from "./src/screens/SignUpScreen";
import UploadPostPage from "./src/screens/UploadPostPage";
import GlobalViewProfilePage from "./src/screens/ViewProfilePage";
import ThreadPage from "./src/screens/ViewThreadPage";

GlobalViewProfilePage.navigationOptions = {
  header: null
};

const SHARED_GLOBAL_SCREENS = {
  ViewProfile: {
    screen: GlobalViewProfilePage
  },
  ViewThread: {
    screen: ThreadPage
  }
};

export const Routes = createAppContainer(
  createStackNavigator(
    {
      Home: createStackNavigator(
        {
          RootScreens: createBottomTabNavigator(
            {
              FeedTab: createStackNavigator(
                {
                  ThreadList: FeedPage,
                  ViewThread: ThreadPage,
                  ReplyToPost: ReplyPage,
                  EditBlockPhotoInReply: ImagePickerPage,
                  ...SHARED_GLOBAL_SCREENS
                },
                {
                  cardStyle: {
                    backgroundColor: "#000"
                  },
                  headerMode: "none",
                  defaultNavigationOptions: ({ navigation }) => ({
                    header: () => null
                  })
                },
                {
                  cardStyle: {
                    backgroundColor: "#000"
                  },

                  headerMode: "none",
                  defaultNavigationOptions: ({ navigation }) => ({
                    header: () => null,
                    headerMode: "none",
                    headerTransparent: true
                  })
                }
              ),
              // FeedTab: createSharedElementStackNavigator(
              //   _createStackNavigator,
              //   {
              //     ThreadList: FeedPage,
              //     ViewThread: ThreadPage,
              //     ReplyToPost: ReplyPage,
              //     EditBlockPhotoInReply: ImagePickerPage,
              //     ...SHARED_GLOBAL_SCREENS
              //   },
              //   {
              //     cardStyle: {
              //       backgroundColor: "#000"
              //     },
              //     headerMode: "none"
              //     // defaultNavigationOptions: ({ navigation }) => ({
              //     //   header: () => null
              //     // })
              //   },
              //   {
              //     cardStyle: {
              //       backgroundColor: "#000"
              //     },

              //     headerMode: "none"
              //     // defaultNavigationOptions: ({ navigation }) => ({
              //     //   header: () => null,
              //     //   headerMode: "none",
              //     //   headerTransparent: true
              //     // })
              //   }
              // ),
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
          NewPostStack: createStackNavigator(
            {
              NewPost: NewPostPage,
              EditBlockPhoto: ImagePickerPage,
              ...SHARED_GLOBAL_SCREENS
            },
            {
              cardStyle: {
                backgroundColor: "transparent"
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
          )
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
      ViewProfile: {
        screen: GlobalViewProfilePage,
        path: "profiles/:profileId"
      },
      ViewThread: {
        screen: ThreadPage,
        path: "threads/:threadId"
      },
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
      path: "",
      cardStyle: {
        backgroundColor: "#000"
      }
    }
  )
);
