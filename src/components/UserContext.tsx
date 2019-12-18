import { NetworkStatus } from "apollo-client";
import { memoize } from "lodash";
import * as React from "react";
import { useQuery } from "react-apollo";
import CURRENT_USER_QUERY from "../lib/currentUserQuery.graphql";
import {
  CurrentUserQuery,
  CurrentUserQueryVariables,
  CurrentUserQuery_currentUser
} from "../lib/graphql/CurrentUserQuery";
import { navigate } from "../lib/NavigationService";
import { Storage } from "../lib/Storage";
import { handleSignIn } from "./Analytics";
import { AuthModal } from "./AuthModal";

export enum AuthState {
  checking = "checking",
  loggedIn = "loggedIn",
  guest = "guest",
  error = "error"
}

type RequireAuthenticationFunctionCB = (
  cb: (success: boolean) => void
) => boolean;

type RequireAuthenticationFunctionPromise = () => Promise<boolean>;

export type RequireAuthenticationFunction =
  | RequireAuthenticationFunctionCB
  | RequireAuthenticationFunctionPromise;

export type UserContextType = {
  currentUser: CurrentUserQuery_currentUser;
  userId: string | null;
  authState: AuthState;
  badgeCount: number;
  requireAuthentication: RequireAuthenticationFunction;
  hideAuthModal: () => void;
};

const DEFAULT_USER_CONTEXT: UserContextType = {
  currentUser: null,
  userId: null,
  badgeCount: 0,
  authState: AuthState.checking,
  requireAuthentication: cb => true,
  hideAuthModal: () => {}
};

export const UserContext = React.createContext<UserContextType>(
  DEFAULT_USER_CONTEXT
);

type Props = {
  children: React.ReactChildren;
  currentUser: CurrentUserQuery_currentUser;
};

type State = {
  contextValue: UserContextType;
  authState: AuthState;
  showAuthCard: boolean;
};

const buildContextValue = memoize(
  (
    currentUser: CurrentUserQuery_currentUser,
    authState: AuthState,
    requireAuthentication: () => boolean,
    badgeCount = 0,
    hideAuthModal
  ) => ({
    currentUser,
    authState,
    hideAuthModal,
    requireAuthentication,
    badgeCount: currentUser ? currentUser.badgeCount : badgeCount,
    userId:
      typeof currentUser === "object" && !!currentUser ? currentUser.id : null
  })
);

export let globalUserContext = DEFAULT_USER_CONTEXT;

class RawUserContextProvider extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    const authState =
      Storage.isSignedIn() || !!props.currentUser
        ? AuthState.loggedIn
        : AuthState.checking;

    this.state = {
      authState,
      showAuthCard: false,

      contextValue: buildContextValue(
        props.currentUser,
        authState,
        this.handleRequireAuthentication,
        props.currentUser ? props.currentUser.badgeCount : 0,
        this.handleDismissAuth
      )
    };

    globalUserContext = this.state.contextValue;
  }

  componentDidMount() {
    this.loadJWT();
  }

  componentWillUnmount() {
    if (this.autModalDismissTimeout > -1) {
      window.clearTimeout(this.autModalDismissTimeout);
      this.autModalDismissTimeout = -1;
    }
  }

  loadJWT = async () => {
    const jwt = await Storage.getJWT();
    console.log(this.props.currentUser);

    if (
      !jwt &&
      this.state.authState === AuthState.checking &&
      !this.props.isLoading
    ) {
      this.setState({
        authState: AuthState.guest,
        contextValue: buildContextValue(
          this.props.currentUser,
          AuthState.guest,
          this.handleRequireAuthentication,
          this.props.currentUser ? this.props.currentUser.badgeCount : 0,
          this.handleDismissAuth
        )
      });
    }
  };

  componentDidUpdate(prevProps: Props, prevState: State) {
    let newState: Partial<State> = {};

    if (
      prevProps.currentUser !== this.props.currentUser ||
      this.props.error !== prevProps.error ||
      (!this.props.isLoading && prevProps.isLoading)
    ) {
      if (this.props.error && !this.props.currentUser) {
        newState.authState = AuthState.error;
      } else if (this.props.currentUser) {
        newState.authState = AuthState.loggedIn;
        handleSignIn(this.props.currentUser);
      } else if (!this.props.currentUser) {
        newState.authState = AuthState.guest;
      }
    }

    const contextValue = buildContextValue(
      this.props.currentUser,
      newState.authState || this.state.authState,
      this.handleRequireAuthentication,
      this.props.currentUser ? this.props.currentUser.badgeCount : 0,
      this.handleDismissAuth
    );

    if (contextValue !== this.state.contextValue) {
      newState.contextValue = contextValue;
    }

    if (Object.keys(newState).length > 0) {
      this.setState(newState);
    }

    if (this.state.contextValue !== prevState.contextValue) {
      globalUserContext = this.state.contextValue;
    }
  }

  handleRequireAuthentication: RequireAuthenticationFunction = authCallback => {
    if (typeof authCallback === "function") {
      if (this.state.authState === AuthState.guest) {
        // this.navigateLogin();
        this.authCallback = authCallback;
      }

      return this.state.authState === AuthState.guest;
    } else {
      if (this.state.authState === AuthState.guest) {
        return Promise.resolve(false);
      } else if (this.state.authState === AuthState.loggedIn) {
        return Promise.resolve(true);
      } else {
        return new Promise(resolve => {
          // this.navigateLogin();
          this.authCallback = resolve;
        });
      }
    }
  };

  doAuthCallback = () => {
    try {
      this.authCallback &&
        this.authCallback(this.state.authState === AuthState.loggedIn);
    } catch (exception) {
      console.warn(exception);
    } finally {
      this.authCallback = null;
    }
  };

  handleDismissAuth = () => this.setState({ showAuthCard: false });
  navigateLogin = () => {
    navigate("Login", {
      onFinish: this.handleFinish(
        this.authCallback ? this.doAuthCallback : undefined
      )
    });
  };
  handleFinish = callback => {
    if (this.state.showAuthCard) {
      this.handleDismissAuth();
    }

    this.doAuthCallback();
  };

  navigateSignup = () => {
    navigate("Signup", {
      onFinish: this.handleFinish(
        this.authCallback ? this.doAuthCallback : undefined
      )
    });
  };

  render() {
    return (
      <UserContext.Provider value={this.state.contextValue}>
        <>
          {this.props.children}
          {/* {this.state.showAuthCard && (
            <AuthModal
              visible={this.state.showAuthCard}
              onDismiss={this.handleDismissAuth}
              onPressLogin={this.navigateLogin}
              onPressSignUp={this.navigateSignup}
            />
          )} */}
        </>
      </UserContext.Provider>
    );
  }
}

export const UserContextProvider = props => {
  const userQuery = useQuery<CurrentUserQuery, CurrentUserQueryVariables>(
    CURRENT_USER_QUERY,
    {
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true
    }
  );

  return (
    <RawUserContextProvider
      reload={userQuery.refetch}
      error={userQuery.error}
      currentUser={userQuery.data?.currentUser}
      data={userQuery.data}
      isLoading={
        userQuery.networkStatus === NetworkStatus.loading ||
        userQuery.networkStatus === NetworkStatus.refetch
      }
      isSignedIn={Storage.isSignedIn()}
    >
      {props.children}
    </RawUserContextProvider>
  );
};
