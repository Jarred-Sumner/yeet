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
import { createAppContainer, createStackNavigator } from "react-navigation";
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

const Routes = createAppContainer(
  createStackNavigator(
    {
      Feed: createStackNavigator(
        {
          NewPostStack: createSharedElementStackNavigator(
            createStackNavigator,
            {
              NewPost: NewPostPage,
              EditBlockPhoto: ImagePickerPage
            },
            {
              cardStyle: {
                backgroundColor: "#000"
              },
              defaultNavigationOptions: {
                header: () => null,
                mode: "modal",
                headerMode: "none",
                headerTransparent: true
              }
            }
          )
        },
        {
          cardStyle: {
            backgroundColor: "#000"
          },
          defaultNavigationOptions: {
            header: () => null
          }
        }
      ),
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

  render() {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <PortalProvider>
          <MaterialThemeProvider>
            <ApolloProvider>
              <UserContextProvider>
                <ImagePickerProvider>
                  <>
                    <Toast />
                    <Routes
                      ref={navigatorRef => {
                        NavigationService.setTopLevelNavigator(navigatorRef);
                      }}
                    />
                    <WhitePortal name="modal" />
                  </>
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
