import * as React from "react";
import { Query } from "react-apollo";
import { PromptListView } from "../components/PromptListView";
import PROMPTS_QUERY from "../lib/promptsQuery.graphql";

export class PromptListViewContainer extends React.Component {
  render() {
    return (
      <Query query={PROMPTS_QUERY}>
        {({ loading, error, data: { prompts = [] } = {} }) => {
          return <PromptListView prompts={prompts} loading={loading} />;
        }}
      </Query>
    );
  }
}
