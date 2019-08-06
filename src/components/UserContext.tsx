import * as React from "react";
import { AuthModal } from "./AuthModal";
import { BlackPortal } from "react-native-portal";
import { CurrentUserQuery_currentUser } from "../lib/graphql/CurrentUserQuery";
import CURRENT_USER_QUERY from "../lib/currentUserQuery.graphql";
import { Query } from "react-apollo";
import { Storage } from "../lib/Storage";
import { memoize } from "lodash";
import { navigateWithParent } from "../lib/NavigationService";

export enum AuthState {
  checking = "checking",
  loggedIn = "loggedIn",
  guest = "guest",
  error = "error"
}

export type UserContextType = {
  currentUser: CurrentUserQuery_currentUser;
  authState: AuthState;
  requireAuthentication: (cb) => boolean;
};

const DEFAULT_USER_CONTEXT = {
  currentUser: null,
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
    requireAuthentication: () => boolean
  ) => ({ currentUser, authState, requireAuthentication })
);

export let globalUserContext = DEFAULT_USER_CONTEXT;

class RawUserContextProvider extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    const authState = Storage.isSignedIn()
      ? AuthState.loggedIn
      : AuthState.checking;

    this.state = {
      authState,
      showAuthCard: false,

      contextValue: buildContextValue(
        props.currentUser,
        authState,
        this.handleRequireAuthentication
      )
    };

    globalUserContext = this.state.contextValue;
  }

  componentDidMount() {
    this.loadJWT();
  }

  loadJWT = async () => {
    const jwt = await Storage.getJWT();

    if (this.props.currentUser === null && jwt) {
      return this.props.reload();
    } else if (!jwt && this.state.authState === AuthState.checking) {
      this.setState({ authState: AuthState.guest });
    }
  };

  componentDidUpdate(prevProps: Props, prevState: State) {
    let newState: Partial<State> = {};

    if (
      prevProps.currentUser !== this.props.currentUser ||
      this.props.error !== prevProps.error
    ) {
      if (this.props.error && !this.props.currentUser) {
        newState.authState = AuthState.error;
      } else if (this.props.currentUser) {
        newState.authState = AuthState.loggedIn;
      } else if (!this.props.currentUser) {
        newState.authState = AuthState.guest;
      }
    }

    const contextValue = buildContextValue(
      this.props.currentUser,
      newState.authState || this.state.authState,
      this.handleRequireAuthentication
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

  handleRequireAuthentication = authCallback => {
    if (this.state.authState === AuthState.guest) {
      this.setState({ showAuthCard: true });
      this.authCallback = authCallback;
    }

    return this.state.authState === AuthState.guest;
  };

  doAuthCallback = () => {
    try {
      this.authCallback && this.authCallback();
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
      fetchPolicy="cache-and-network"
      delay={!Storage.isSignedIn()}
      query={CURRENT_USER_QUERY}
    >
      {({
        data: { currentUser = null } = { currentUser: null },
        loading,
        load,
        refetch,
        error
      }) => (
        <RawUserContextProvider
          reload={load || refetch}
          error={error}
          currentUser={currentUser}
        >
          {props.children}
        </RawUserContextProvider>
      )}
    </Query>
  );
};
