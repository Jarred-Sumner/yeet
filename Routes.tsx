/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import * as React from "react";

import createStackNavigator from "react-native-screens/createNativeStackNavigator";
import { createSwitchNavigator } from "react-navigation";
// import { createStackNavigator } from "react-native-screens";
import {
  createStackNavigator as _createStackNavigator,
  NavigationStackOptions
} from "react-navigation-stack";

import { createAppContainer } from "react-navigation";
import { createBottomTabNavigator } from "react-navigation-tabs";
import { COLORS } from "./src/lib/styles";

import CurrentProfilePage from "./src/screens/CurrentProfile";
import FeedPage from "./src/screens/Feed";
import ImagePickerPage from "./src/screens/ImagePickerPage";
import LoginScreen from "./src/screens/LoginScreen";
import NewPostPage from "./src/screens/NewPostPage";
import NotificationsPage from "./src/screens/Notifications";
import ReplyPage from "./src/screens/ReplyPage";
import SignUpScreen from "./src/screens/SignUpScreen";
import UploadPostPage from "./src/screens/UploadPostPage";
import GlobalViewProfilePage from "./src/screens/ViewProfilePage";
import ThreadPage from "./src/screens/ViewThreadPage";
import BirthdayScreen from "./src/screens/BirthdayScreen";
import AvatarScreen from "./src/screens/UploadAvatarScreen";
import NewThreadPage from "./src/screens/NewThreadPage";
import WaitlistScreen from "./src/screens/WaitlistScreen";
import { memoize } from "lodash";

const AuthStack = createStackNavigator(
  {
    Login: LoginScreen,
    Signup: SignUpScreen,
    Birthday: BirthdayScreen,
    UploadAvatar: AvatarScreen
  },
  {
    initialRouteName: "Signup",
    initialRouteParams: { isOnboarding: true },
    defaultNavigationOptions: ({ navigation }) => ({
      headerStyle: {
        backgroundColor: COLORS.primary,
        borderBottomWidth: 0
      },
      headerTintColor: "white"
    }),
    cardStyle: {
      backgroundColor: COLORS.primary
    }
  }
);

GlobalViewProfilePage.navigationOptions = {
  header: null
};

const SHARED_GLOBAL_SCREENS = {
  ViewProfile: {
    screen: GlobalViewProfilePage,
    navigationOptions: {
      header: null
    }
  },
  ViewThread: {
    screen: ThreadPage,
    navigationOptions: {
      header: null
    }
  }
};

const _AppContainer = memoize(initialRouteName => {
  return createAppContainer(
    createSwitchNavigator(
      {
        Root: createStackNavigator(
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
                          backgroundColor: "#111"
                        },
                        headerMode: "none",
                        defaultNavigationOptions: ({ navigation }) => ({
                          header: () => null
                        })
                      },
                      {
                        cardStyle: {
                          backgroundColor: "#111"
                        },

                        headerMode: "none",
                        defaultNavigationOptions: ({ navigation }) => ({
                          header: () => null,
                          headerMode: "none",
                          headerTransparent: true
                        })
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
                              backgroundColor: "#000",
                              borderBottomColor: "#111"
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
                    tabBarComponent: () => null,
                    // initialRouteName: "ProfileTab",

                    safeAreaInset: {
                      bottom: "never",
                      top: "never",
                      left: "never",
                      right: "never"
                    },

                    cardStyle: {
                      backgroundColor: "rgba(0, 0, 0, 0.95)"
                    }
                  }
                ),
                NewPostStack: createStackNavigator(
                  {
                    NewPost: NewPostPage,
                    NewThread: NewThreadPage,
                    ...SHARED_GLOBAL_SCREENS
                  },
                  {
                    // initialRouteName: "NewThread",
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
                )
              },
              {
                cardStyle: {
                  backgroundColor: "#000"
                },

                headerMode: "none",
                // initialRouteName: "NewPostStack",
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
            EditBlockPhoto: ImagePickerPage,

            Auth: AuthStack
          },
          {
            // initialRouteName: "NewPost",
            // initialRouteParams: {
            //   threadId: "mYkCBX"
            // },
            mode: "modal",
            headerMode: "none",
            path: "",
            cardStyle: {
              backgroundColor: "#000"
            }
          }
        ),
        RootAuth: AuthStack,
        Waitlist: _createStackNavigator(
          {
            WaitlistScreen: WaitlistScreen,
            Login: LoginScreen
          },
          {
            mode: "modal",

            defaultNavigationOptions: ({
              navigation
            }): NavigationStackOptions => ({
              headerStyle: {
                backgroundColor: COLORS.primary,
                borderBottomWidth: 0
              },

              headerTintColor: "white"
            })
          }
        )
      },
      {
        initialRouteName
      }
    )
  );
});

let AppContainer;

export const Routes = React.forwardRef(
  ({ initialRouteName, ...props }, ref) => {
    if (!AppContainer) {
      AppContainer = _AppContainer(initialRouteName);
    }

    return <AppContainer {...props} ref={ref} />;
  }
);
