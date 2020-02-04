import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { BatchHttpLink } from "apollo-link-batch-http";
import { setContext } from "apollo-link-context";
import { onError } from "apollo-link-error";
import { RetryLink } from "apollo-link-retry";
import _ from "lodash";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { BASE_HOSTNAME } from "../../config";
import { Storage } from "./Storage";

// import introspectionQueryResultData from "../../static/fragmentTypes.json";
// import Alert from "../lib/Alert";

export const OS = Platform.OS;
export const VERSION = Platform.Version;

export const DEVICE_ID = DeviceInfo.getUniqueID();
export const APP_VERSION = DeviceInfo.getVersion();
export const TIMEZONE = DeviceInfo.getTimezone();

const customFetch = (uri, options) => {
  return fetch(uri, options).then(response => {
    return response;
  });
};

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true
  },
  attempts: {
    max: 5,
    retryIf: (error, _operation) => !!error
  }
});

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

export const getRequestHeaders = (headers: Object = {}) =>
  Storage.getJWT().then(jwt => {
    return {
      ...headers,
      Authorization: jwt ? `Bearer ${jwt}` : undefined,
      "X-Device-ID": DEVICE_ID,
      "X-App-Version": APP_VERSION,
      "X-Device-Timezone": TIMEZONE,
      "X-Platform-OS": Platform.OS,
      "X-Platform-Version": Platform.Version
    };
  });

const authLink = setContext((_, { headers: _headers }) => {
  return getRequestHeaders(_headers).then(headers => {
    return { headers };
  });
});

console.log("Initializing Apollo –", GRAPHQL_URL);
const httpLink = new BatchHttpLink({
  uri: GRAPHQL_URL,
  fetch: customFetch,
  credentials: "include"
});

// const fragmentMatcher = new IntrospectionFragmentMatcher({
//   introspectionQueryResultData
// });

const dataIdFromObject = o => {
  if (!o.id) {
    return Object.values(o).join(",");
  } else {
    return `${o.__typename}-${o.id}`;
  }
};
const cache = new InMemoryCache({
  // fragmentMatcher,
  dataIdFromObject,

  cacheRedirects: {
    Query: {
      // post: (_, args) =>
      //   toIdValue(dataIdFromObject({ __typename: "Post", id: args.id }))
      // profile: (_, args) =>
      //   toIdValue(dataIdFromObject({ __typename: "Profile", id: args.id }))
    }
  }
});

const client = new ApolloClient({
  link: authLink
    .concat(httpLink)
    .concat(errorLink)
    .concat(retryLink),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all"
    },
    query: {
      errorPolicy: "all"
    },
    mutate: {
      errorPolicy: "all"
    }
  },
  resolvers: {}
});

export let hasLoadedCache = false;

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
