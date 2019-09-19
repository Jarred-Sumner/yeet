import {
  InMemoryCache,
  IntrospectionFragmentMatcher
} from "apollo-cache-inmemory";
import { CachePersistor } from "apollo-cache-persist";
import { ApolloClient } from "apollo-client";
import { ApolloLink, concat } from "apollo-link";
// import { BatchHttpLink } from "apollo-link-batch-http";
import { HttpLink } from "apollo-link-http";
import _ from "lodash";

import { onError } from "apollo-link-error";
import { toIdValue } from "apollo-utilities";
import { Platform, StatusBar } from "react-native";
import DeviceInfo from "react-native-device-info";
import { Storage } from "./Storage";
import { BASE_HOSTNAME } from "../../config";
import AsyncStorage from "@react-native-community/async-storage";
// import introspectionQueryResultData from "../../static/fragmentTypes.json";
// import Alert from "../lib/Alert";

export const OS = Platform.OS;
export const VERSION = Platform.Version;

export const DEVICE_ID = DeviceInfo.getUniqueID();
export const APP_VERSION = DeviceInfo.getVersion();
export const TIMEZONE = DeviceInfo.getTimezone();

const customFetch = (uri, options) => {
  StatusBar.setNetworkActivityIndicatorVisible(true);

  return fetch(uri, options).then(response => {
    StatusBar.setNetworkActivityIndicatorVisible(false);
    return response;
  });
};

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
    const displayMessage = _.first(graphQLErrors).message;
    // Alert.error(null, displayMessage);
  }

  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const GRAPHQL_URL = `${BASE_HOSTNAME}/graphql`;

const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  operation.setContext(({ headers = {} }) => ({
    credentials: "omit",
    headers: {
      ...headers,
      Authorization: `Bearer ${Storage.getCachedJWT()}`,
      "X-Device-ID": DEVICE_ID,
      "X-App-Version": APP_VERSION,
      "X-Device-Timezone": TIMEZONE,
      "X-Platform-OS": Platform.OS,
      "X-Platform-Version": Platform.Version
    }
  }));

  return forward(operation);
});

console.log("Initializing Apollo –", GRAPHQL_URL);
const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
  fetch: customFetch
});

// const fragmentMatcher = new IntrospectionFragmentMatcher({
//   introspectionQueryResultData
// });

const cache = new InMemoryCache({
  // fragmentMatcher,
  dataIdFromObject: o => {
    if (!o.id) {
      return Object.values(o).join(",");
    } else {
      return `${o.__typename}-${o.id}`;
    }
  }
  // cacheRedirects: {}
});

const persistor = new CachePersistor({
  cache,
  storage: AsyncStorage
});

const client = new ApolloClient({
  link: concat(authMiddleware, httpLink, errorLink),
  cache,
  fetchPolicy: "cache-and-network"
});

// persistor.purge().then(() => {
//   console.log("Reset Apollo Cache");
// });

export default client;

export const isInitialLoading = networkStatus => networkStatus === 1;
export const isActivelyRefetching = networkStatus => networkStatus === 4;
export const isPassivelyRefetching = networkStatus =>
  networkStatus === 2 || networkStatus === 6;
export const isFetchingMore = networkStatus => networkStatus === 3;

// Error States
export const isError = networkStatus => networkStatus === 8;
