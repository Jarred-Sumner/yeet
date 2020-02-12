import { cloneDeep } from "lodash";
import memoizee from "memoizee";
import * as React from "react";
import { StyleSheet, LayoutAnimation } from "react-native";
import { SafeAreaContext } from "react-native-safe-area-context";
import { SCREEN_DIMENSIONS } from "../../../config";
import { YeetImageContainer } from "../../lib/imageSearch";
import Storage from "../../lib/Storage";
import { GalleryBrowseContainer } from "./GalleryBrowseContainer";
import { GallerySearchResultsContainer } from "./GallerySearchResultsContainer";
import GallerySearchInputContainer from "./GallerySearchInputContainer";

const styles = StyleSheet.create({});

export const getSelectedIDs = memoizee((images: Array<YeetImageContainer>) => {
  return images.map(image => image.id);
});

enum GalleryStep {
  searchInput = "searchInput",
  searchResults = "searchResults",
  browse = "browse"
}

type State = {
  query: string;
  step: GalleryStep;
};

class RawGalleryContainer extends React.PureComponent<{}, State> {
  static defaultProps = {
    step: GalleryStep.browse
  };

  constructor(props) {
    super(props);

    this.state = {
      query: "",
      step: props.step
    };
  }

  handleOpenSearchInput = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    this.setState({ step: GalleryStep.searchInput });
  };

  handleClearSearch = () => {
    this.setState({ query: "", step: GalleryStep.browse });
  };

  handleSearch = query => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    this.setState({
      query,
      step: query.length > 0 ? GalleryStep.searchResults : GalleryStep.browse
    });
  };

  handleFinish = (photo, post) => {
    const { onChange } = this.props;

    onChange({ photo, post });

    let __photo = photo;
    let _post = cloneDeep(post);
    window.requestIdleCallback(() => {
      Storage.insertRecentlyUsed(__photo, _post).catch(console.error);
      __photo = null;
      _post = null;
    });
  };

  handleChangeQuery = query => {
    if (query.length > 0 && this.state.step === GalleryStep.browse) {
      this.setState({ query, step: GalleryStep.searchInput });
    } else {
      this.setState({ query });
    }
  };

  render() {
    const { width, height, isFocused, showStart } = this.props;
    const { step, query } = this.state;

    if (step === GalleryStep.searchResults) {
      return (
        <GallerySearchResultsContainer
          onPressClose={this.handleClearSearch}
          onChangeQuery={this.handleChangeQuery}
          openSearch={this.handleOpenSearchInput}
          onChangeInputFocus={this.handleChangeFocusInput}
          query={query}
          isFocused={isFocused}
          onChange={this.handleFinish}
          height={height}
          width={width}
        />
      );
    } else if (step === GalleryStep.browse) {
      return (
        <GalleryBrowseContainer
          onPressClose={this.handleClearSearch}
          openSearch={this.handleOpenSearchInput}
          onChangeQuery={this.handleChangeQuery}
          onChangeInputFocus={this.handleChangeFocusInput}
          query={query}
          isFocused={isFocused}
          showStart={showStart}
          height={height}
          width={width}
          onChange={this.handleFinish}
        />
      );
    } else if (step === GalleryStep.searchInput) {
      return (
        <GallerySearchInputContainer
          onPressClose={this.handleClearSearch}
          onChangeQuery={this.handleChangeQuery}
          onSearch={this.handleSearch}
          onChangeInputFocus={this.handleChangeFocusInput}
          query={query}
          isFocused={isFocused}
          showStart={showStart}
          height={height}
          width={width}
          onFinish={this.handleFinish}
        />
      );
    } else {
      return null;
    }
  }
}

export const GalleryContainer = props => {
  const { left, right } = React.useContext(SafeAreaContext);

  return (
    <RawGalleryContainer
      {...props}
      showStart={props.showStart || false}
      height={SCREEN_DIMENSIONS.height}
      width={SCREEN_DIMENSIONS.width - left - right}
    />
  );
};

export default GalleryContainer;
