import * as React from "react";
import { View, StyleSheet, Text, FlatList, Dimensions } from "react-native";
import { BoldText } from "../components/Text";
import PROMPTS_QUERY from "../lib/promptsQuery.graphql";
import { Query } from "react-apollo";
import { ViewPrompt } from "../components/Prompt/ViewPrompt";
import CreatePostPage from "./CreatePostPage";
import { Modal } from "../components/Modal";

const styles = StyleSheet.create({});

const SCREEN_DIMENSIONS = Dimensions.get("window");

class RawViewPostPage extends React.Component {
  state = {
    height: SCREEN_DIMENSIONS.height - 86,
    visibleIndex: 0,
    isScrolling: false
  };
  static navigationOptions = {
    title: "Home"
  };

  renderItem = ({ item: prompt, index }) => {
    return (
      <ViewPrompt
        prompt={prompt}
        isScrolling={this.state.isScrolling}
        height={this.state.height}
        isVisible={this.state.visibleIndex === index}
      />
    );
  };

  getItemLayout = (data, index) => ({
    length: this.state.height,
    offset: this.state.height * index,
    index
  });

  onViewableItemsChanged = ({ viewableItems = [], changed } = {}) => {
    const [{ index: visibleIndex = -1 }] = viewableItems;
    const prompt = this.props.prompts[visibleIndex];

    this.setState({ visibleIndex }, () => {
      if (this.props.navigation.isFocused) {
        CreatePostPage.lastPrompt = {
          body: prompt.body,
          id: prompt.id
        };
      }
    });
  };

  onLayout = ({
    nativeEvent: {
      layout: { height }
    }
  }) => this.setState({ height });

  startScrolling = () => this.setState({ isScrolling: true });
  stopScrolling = () => this.setState({ isScrolling: false });

  render() {
    return (
      <FlatList
        data={this.props.prompts}
        renderItem={this.renderItem}
        onScrollBeginDrag={this.startScrolling}
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
        onScrollEndDrag={this.stopScrolling}
        getItemLayout={this.getItemLayout}
        extraData={{
          height: this.state.height,
          isScrolling: this.state.isScrolling,
          visibleIndex: this.state.visibleIndex
        }}
        onLayout={this.onLayout}
        onViewableItemsChanged={this.onViewableItemsChanged}
        snapToInterval={this.state.height}
        decelerationRate="fast"
        contentContainerStyle={{ width: "100%" }}
        directionalLockEnabled
        contentInsetAdjustmentBehavior="never"
        pinchGestureEnabled={false}
        overScrollMode="never"
      />
    );
  }
}

export const ViewPostPage = props => (
  <Query query={PROMPTS_QUERY}>
    {({ loading, error, data: { prompts = [] } = {} }) => (
      <RawViewPostPage {...props} prompts={prompts} loading={loading} />
    )}
  </Query>
);

export default ViewPostPage;
