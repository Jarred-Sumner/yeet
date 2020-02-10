/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { memoize } from "lodash";
import * as React from "react";
import { createAppContainer, createSwitchNavigator } from "react-navigation";
// import { createStackNavigator } from "react-native-screens";
import {
  createStackNavigator as _createStackNavigator,
  NavigationStackOptions,
  TransitionSpecs
} from "react-navigation-stack";
import { COLORS } from "./src/lib/styles";
import BirthdayScreen from "./src/screens/BirthdayScreen";
import FeedPage from "./src/screens/Feed";
import ImagePickerPage from "./src/screens/ImagePickerPage";
import ImagePickerSearchPage from "./src/screens/ImagePickerSearchPage";
import LoginScreen from "./src/screens/LoginScreen";
import NewPostPage from "./src/screens/NewPostPage";
import NewThreadPage from "./src/screens/NewThreadPage";
import ReplyPage from "./src/screens/ReplyPage";
import SignUpScreen from "./src/screens/SignUpScreen";
import AvatarScreen from "./src/screens/UploadAvatarScreen";
import UploadPostPage from "./src/screens/UploadPostPage";
import GlobalViewProfilePage from "./src/screens/ViewProfilePage";
import ThreadPage from "./src/screens/ViewThreadPage";
import WaitlistScreen from "./src/screens/WaitlistScreen";

const IS_SCREENS_ENABLED = true;

let createStackNavigator = _createStackNavigator;
if (IS_SCREENS_ENABLED) {
  // createStackNavigator = __createStackNavigator;
}

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

const MyTransition = {
  gestureDirection: "horizontal",
  transitionSpec: {
    open: TransitionSpecs.TransitionIOSSpec,
    close: TransitionSpecs.TransitionIOSSpec
  },
  cardStyle: {
    backgroundColor: "black"
  },
  cardStyleInterpolator: ({ current, next, layouts }) => {
    return {
      cardStyle: {
        opacity: current.progress
      }
    };
  }
};

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
      header: null,
      gestureEnabled: true
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
                FeedTab: createStackNavigator(
                  {
                    ThreadList: FeedPage,
                    ViewThread: {
                      screen: ThreadPage,
                      navigationOptions: {
                        gestureEnabled: true
                      }
                    },
                    ReplyToPost: ReplyPage,
                    EditBlockPhotoInReply: ImagePickerPage,
                    SharePost: NewThreadPage,
                    ...SHARED_GLOBAL_SCREENS
                  },
                  {
                    cardStyle: {
                      backgroundColor: COLORS.background
                    },
                    headerMode: "none",
                    defaultNavigationOptions: ({ navigation }) => ({
                      header: () => null,
                      gestureEnabled: true
                    })
                  }
                ),
                NewPostStack: createStackNavigator(
                  {
                    ImagePicker: createStackNavigator(
                      {
                        ImagePickerBrowse: {
                          screen: ImagePickerPage
                        },
                        ImagePickerSearch: {
                          screen: ImagePickerSearchPage
                        }
                      },
                      {
                        // initialRouteName: "ImagePickerSearch",

                        navigationOptions: {
                          stackAnimation: "fade"
                        },
                        defaultNavigationOptions: {
                          header: () => null,
                          safeAreaInsets: {
                            top: 0,
                            bottom: 0,
                            left: 0,
                            right: 0
                          },
                          headerMode: "none",
                          cardStyle: { backgroundColor: COLORS.background },
                          headerTransparent: false,
                          gestureEnabled: true
                        }
                      }
                    ),
                    NewPost: NewPostPage,
                    NewThread: NewThreadPage
                  },
                  {
                    translucent: false,
                    // initialRouteName: "NewThread",
                    cardStyle: { backgroundColor: COLORS.background },

                    headerMode: "none",
                    // initialRouteName: IS_SIMULATOR ? "NewPost" : undefined,
                    defaultNavigationOptions: {
                      header: () => null,
                      headerMode: "none",
                      cardStyle: { backgroundColor: COLORS.background },
                      headerTransparent: false,
                      gestureEnabled: true,
                      safeAreaInsets: {
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0
                      }
                    },
                    navigationOptions: {
                      gestureEnabled: true
                    }
                  }
                )
              },
              {
                cardStyle: {
                  backgroundColor: COLORS.background
                },
                mode: "modal",

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
              backgroundColor: COLORS.background
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
