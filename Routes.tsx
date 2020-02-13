/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
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
import GlobalViewProfilePage from "./src/screens/ViewProfilePage";
import ThreadPage from "./src/screens/ViewThreadPage";

const Auth = createNativeStackNavigator();
const Feed = createNativeStackNavigator();
const Root = createNativeStackNavigator();
const NewPost = createNativeStackNavigator();
// const IS_SCREENS_ENABLED = true;

// if (IS_SCREENS_ENABLED) {

// }

// const AuthStack = () => createStackNavigator(
//   {
//     Login: LoginScreen,
//     Signup: SignUpScreen,
//     Birthday: BirthdayScreen,
//     UploadAvatar: AvatarScreen
//   },
//   {
//     initialRouteName: "Signup",
//     initialRouteParams: { isOnboarding: true },
//     defaultNavigationOptions: ({ navigation }) => ({
//       headerStyle: {
//         backgroundColor: COLORS.primary,
//         borderBottomWidth: 0
//       },
//       headerTintColor: "white"
//     }),
//     cardStyle: {
//       backgroundColor: COLORS.primary
//     }
//   }
// );

const AuthStack = () => (
  <Auth.Navigator>
    <Auth.Screen name="Login" component={LoginScreen} />
    <Auth.Screen name="Signup" component={SignUpScreen} />
    <Auth.Screen name="Birthday" component={BirthdayScreen} />
    <Auth.Screen name="UploadAvatar" component={AvatarScreen} />
  </Auth.Navigator>
);

const FeedStack = () => (
  <Feed.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
    <Feed.Screen name="ThreadList" component={FeedPage} />
    <Feed.Screen name="ViewThread" component={ThreadPage} />
    <Feed.Screen name="ViewProfile" component={GlobalViewProfilePage} />
    <Feed.Screen name="ReplyToPost" component={ReplyPage} />
    <Feed.Screen name="SharePost" component={NewThreadPage} />

    <Feed.Screen
      options={{
        stackPresentation: "transparentModal",
        gestureEnabled: true,
        contentStyle: { backgroundColor: "transparent" }
      }}
      name="NewPostStack"
      component={NewPostStack}
    />
  </Feed.Navigator>
);
const NewPostStack = () => (
  <NewPost.Navigator screenOptions={{ headerShown: false }}>
    <NewPost.Screen name="NewPost" component={NewPostPage} />
    <NewPost.Screen name="NewThread" component={NewThreadPage} />
  </NewPost.Navigator>
);

const RootStack = React.forwardRef(({ initialRouteName }, ref) => (
  <Root.Navigator
    ref={ref}
    screenOptions={{
      stackPresentation: "modal",
      headerShown: false,
      stackAnimation: "none",
      contentStyle: { flex: 1, backgroundColor: COLORS.background }
    }}
    initialRouteName={initialRouteName}
  >
    <Root.Screen name="FeedTab" component={FeedStack} />
    <Root.Screen
      options={{
        contentStyle: { backgroundColor: "transparent" },
        stackPresentation: "transparentModal"
      }}
      name="ImagePicker"
      component={ImagePickerPage}
    />

    <Root.Screen name="ViewProfile" component={GlobalViewProfilePage} />
    <Root.Screen name="ViewPost" component={ThreadPage} />
  </Root.Navigator>
));

GlobalViewProfilePage.navigationOptions = {
  header: null
};

export const Routes = React.forwardRef((props, ref) => (
  <NavigationContainer>
    <RootStack {...props} ref={ref} />
  </NavigationContainer>
));

// const _AppContainer =
//  <NavigationContainer>
//     createSwitchNavigator(
//       {
//         Root: createStackNavigator(
//           {
//             Home: createStackNavigator(
//               {
//                 FeedTab: createStackNavigator(
//                   {
//                     ThreadList: FeedPage,
//                     ViewThread: {
//                       screen: ThreadPage,
//                       navigationOptions: {
//                         gestureEnabled: true
//                       }
//                     },
//                     ReplyToPost: ReplyPage,
//                     EditBlockPhotoInReply: ImagePickerPage,
//                     SharePost: NewThreadPage,
//                     // ...SHARED_GLOBAL_SCREENS
//                   },
//                   {
//                     cardStyle: {
//                       backgroundColor: COLORS.background
//                     },
//                     headerMode: "none",
//                     defaultNavigationOptions: ({ navigation }) => ({
//                       header: () => null,
//                       gestureEnabled: true
//                     })
//                   }
//                 ),
//                 NewPostStack: createStackNavigator(
//                   {
//                     ImagePicker: createStackNavigator(
//                       {
//                         ImagePickerBrowse: {
//                           screen: ImagePickerPage
//                         },
//                         ImagePickerSearch: {
//                           screen: ImagePickerSearchPage
//                         }
//                       },
//                       {
//                         // initialRouteName: "ImagePickerSearch",

//                         navigationOptions: {
//                           stackAnimation: "fade"
//                         },
//                         defaultNavigationOptions: {
//                           header: () => null,
//                           safeAreaInsets: {
//                             top: 0,
//                             bottom: 0,
//                             left: 0,
//                             right: 0
//                           },
//                           headerMode: "none",
//                           cardStyle: { backgroundColor: COLORS.background },
//                           headerTransparent: false,
//                           gestureEnabled: true
//                         }
//                       }
//                     ),
//                     NewPost: NewPostPage,
//                     NewThread: NewThreadPage
//                   },
//                   {
//                     translucent: false,
//                     // initialRouteName: "NewThread",
//                     cardStyle: { backgroundColor: COLORS.background },

//                     headerMode: "none",
//                     // initialRouteName: IS_SIMULATOR ? "NewPost" : undefined,
//                     defaultNavigationOptions: {
//                       header: () => null,
//                       headerMode: "none",
//                       cardStyle: { backgroundColor: COLORS.background },
//                       headerTransparent: false,
//                       gestureEnabled: true,
//                       safeAreaInsets: {
//                         top: 0,
//                         bottom: 0,
//                         left: 0,
//                         right: 0
//                       }
//                     },
//                     navigationOptions: {
//                       gestureEnabled: true
//                     }
//                   }
//                 )
//               },
//               {
//                 cardStyle: {
//                   backgroundColor: COLORS.background
//                 },
//                 mode: "modal",

//                 headerMode: "none",
//                 // initialRouteName: "NewPostStack",
//                 defaultNavigationOptions: {
//                   header: () => null,
//                   headerMode: "none"
//                 }
//               }
//             ),
//             ViewProfile: {
//               screen: GlobalViewProfilePage,
//               path: "profiles/:profileId"
//             },
//             ViewThread: {
//               screen: ThreadPage,
//               path: "threads/:threadId"
//             },
//             UploadPost: UploadPostPage,
//             InsertSticker: ImagePickerPage,
//             EditBlockPhoto: ImagePickerPage,

//             Auth: AuthStack
//           },
//           {
//             // initialRouteName: "NewPost",
//             // initialRouteParams: {
//             //   threadId: "mYkCBX"
//             // },
//             mode: "modal",
//             headerMode: "none",
//             path: "",
//             cardStyle: {
//               backgroundColor: COLORS.background
//             }
//           }
//         ),
//         RootAuth: AuthStack,
//         Waitlist: _createStackNavigator(
//           {
//             WaitlistScreen: WaitlistScreen,
//             Login: LoginScreen
//           },
//           {
//             mode: "modal",

//             defaultNavigationOptions: ({
//               navigation
//             }): NavigationStackOptions => ({
//               headerStyle: {
//                 backgroundColor: COLORS.primary,
//                 borderBottomWidth: 0
//               },

//               headerTintColor: "white"
//             })
//           }
//         )
//       },
//       {
//         initialRouteName
//       }
//     )
//   );
//   </NavigationContainer>
//   )
