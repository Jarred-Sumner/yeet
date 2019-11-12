import * as React from "react";
import { AuthModal } from "./AuthModal";
import { BlackPortal } from "react-native-portal";
import { CurrentUserQuery_currentUser } from "../lib/graphql/CurrentUserQuery";
import CURRENT_USER_QUERY from "../lib/currentUserQuery.graphql";
import { Query } from "react-apollo";
import { NetworkStatus } from "apollo-client";
import { Storage } from "../lib/Storage";
import { memoize } from "lodash";
import { navigateWithParent } from "../lib/NavigationService";
import PushNotificationModal from "./PushNotificationModal";
import { handleSignIn } from "./Analytics";

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
};

const DEFAULT_USER_CONTEXT: UserContext = {
  currentUser: null,
  userId: null,
  badgeCount: 0,
  authState: AuthState.checking,
  requireAuthentication: cb => true
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
    badgeCount = 0
  ) => ({
    currentUser,
    authState,
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
        props.currentUser ? props.currentUser.badgeCount : 0
      )
    };

    globalUserContext = this.state.contextValue;
  }

  componentDidMount() {
    this.loadJWT();
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
        contextValue: {
          ...this.state.contextValue,
          authState: AuthState.guest
        }
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
      this.props.currentUser ? this.props.currentUser.badgeCount : 0
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
        this.setState({ showAuthCard: true });
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
          this.setState({ showAuthCard: true });
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
    navigateWithParent("Login", "Auth", {
      onFinish: this.authCallback ? this.doAuthCallback : undefined
    });
    this.handleDismissAuth();
  };

  navigateSignup = () => {
    navigateWithParent("SignUp", "Auth", {
      onFinish: this.authCallback ? this.doAuthCallback : undefined
    });
    this.handleDismissAuth();
  };

  render() {
    return (
      <UserContext.Provider value={this.state.contextValue}>
        <>
          {this.props.children}
          {this.state.showAuthCard && (
            <AuthModal
              visible={this.state.showAuthCard}
              onDismiss={this.handleDismissAuth}
              onPressLogin={this.navigateLogin}
              onPressSignUp={this.navigateSignup}
            />
          )}
        </>
      </UserContext.Provider>
    );
  }
}

export const UserContextProvider = props => {
  return (
    <Query
      fetchPolicy="network-only"
      notifyOnNetworkStatusChange
      query={CURRENT_USER_QUERY}
    >
      {({ data = {}, load, networkStatus, refetch, error, ...other }) => (
        <RawUserContextProvider
          reload={load || refetch}
          error={error}
          currentUser={data.currentUser}
          data={data}
          isLoading={
            networkStatus === NetworkStatus.loading ||
            networkStatus === NetworkStatus.refetch
          }
          other={other}
          isSignedIn={Storage.isSignedIn()}
        >
          {props.children}
        </RawUserContextProvider>
      )}
    </Query>
  );
};
