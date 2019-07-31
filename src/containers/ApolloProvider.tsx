import apolloClient from "../lib/graphql";
import { ApolloProvider as RawApolloProvider } from "react-apollo";
import React from "react";

export class ApolloProvider extends React.Component {
  render() {
    return (
      <RawApolloProvider client={apolloClient}>
        {this.props.children}
      </RawApolloProvider>
    );
  }
}

export default ApolloProvider;
