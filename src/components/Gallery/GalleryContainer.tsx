import { cloneDeep } from "lodash";
import memoizee from "memoizee";
import * as React from "react";
import {
  StyleSheet,
  View,
  findNodeHandle,
  Keyboard,
  LayoutAnimation
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import { YeetImageContainer } from "../../lib/imageSearch";
import Storage from "../../lib/Storage";
import { GalleryBrowseContainer } from "./GalleryBrowseContainer";
import GallerySearchInputContainer from "./GallerySearchInputContainer";
import { GallerySearchResultsContainer } from "./GallerySearchResultsContainer";
import { PanSheetView } from "./PanSheetView";
import {
  presentPanSheetView,
  dismissKeyboard,
  PanSheetViewSize
} from "../../lib/Yeet";
import { LIST_HEADER_HEIGHT } from "../NewPost/ImagePicker/LIGHT_LIST_HEADER_HEIGHT";
import BottomSheet from "reanimated-bottom-sheet";
import { StartFromHeader, TOP_HEADER } from "./StartFromHeader";
import { COLORS } from "../../lib/styles";
import LinearGradient from "react-native-linear-gradient";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: COLORS.primaryDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },
  page: { flex: 1, width: "100%", height: "100%" }
});

export const getSelectedIDs = memoizee((images: Array<YeetImageContainer>) => {
  return images.map(image => image.id);
});

export enum GalleryStep {
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
    initialStep: GalleryStep.browse,
    initialQuery: ""
  };

  constructor(props) {
    super(props);

    this.state = {
      query: props.initialQuery,
      step: props.initialStep
    };
  }

  handleOpenSearchInput = () => {
    this.setState({ step: GalleryStep.searchInput });
  };

  handleClearSearch = () => {
    dismissKeyboard();
    this.setState({ query: "", step: GalleryStep.browse });
  };

  handleSearch = query => {
    dismissKeyboard();
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

  handleChangeFocusInput = isInputFocused => {
    console.log({ isInputFocused });
  };

  handleChangeQuery = query => {
    if (query.length > 0 && this.state.step === GalleryStep.browse) {
      this.setState({ query, step: GalleryStep.searchInput });
    } else {
      this.setState({ query });
    }
  };

  renderStep() {
    const { width, height, isFocused, showStart } = this.props;
    const { step, query } = this.state;

    if (step === GalleryStep.searchResults) {
      return (
        <GallerySearchResultsContainer
          onPressClose={this.handleClearSearch}
          onChangeQuery={this.handleChangeQuery}
          openSearch={this.handleOpenSearchInput}
          onChangeInputFocus={this.handleChangeFocusInput}
          simultaneousHandlers={this.simultaneousHandlers}
          waitFor={this.waitFor}
          scrollY={this.scrollY}
          offset={this.props.offset}
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
          simultaneousHandlers={this.simultaneousHandlers}
          waitFor={this.waitFor}
          onChangeInputFocus={this.handleChangeFocusInput}
          query={query}
          isFocused={isFocused}
          initialRoute={this.props.initialRoute}
          offset={this.props.offset}
          showStart={showStart}
          scrollY={this.scrollY}
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
          simultaneousHandlers={this.simultaneousHandlers}
          waitFor={this.waitFor}
          query={query}
          scrollY={this.scrollY}
          offset={this.props.offset}
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

  renderSharedElementTransitions() {
    // const {
    //   prevIndex,
    //   nextIndex,
    //   stack,
    //   sharedElementScreens,
    //   sharedElementsConfig,
    //   transitionConfig,
    //   animValue
    // } = this.state;
    // //if (!sharedElementConfig) return;
    // if (prevIndex === nextIndex && nextIndex === stack.length - 1) {
    //   // console.log('renderSharedElementTransitions: null');
    //   return null;
    // }
    // const startIndex = Math.min(prevIndex, nextIndex);
    // const endIndex = startIndex + 1;
    // if (!sharedElementsConfig || !transitionConfig) {
    //   return;
    // }
    // const { debug } = transitionConfig;
    // const startScreen = sharedElementScreens[startIndex];
    // const endScreen = sharedElementScreens[endIndex];
    // const nodes = sharedElementsConfig.map(sharedElementConfig => {
    //   const { id, otherId, ...other } = sharedElementConfig;
    //   const node: any = {
    //     id,
    //     start: {
    //       node: startScreen ? startScreen.nodes[id] : undefined,
    //       ancestor: startScreen ? startScreen.ancestor : undefined
    //     },
    //     end: {
    //       node: endScreen ? endScreen.nodes[id] : undefined,
    //       ancestor: endScreen ? endScreen.ancestor : undefined
    //     },
    //     ...other,
    //     debug: sharedElementConfig.debug || debug
    //   };
    //   return node;
    // });
    // // console.log('renderSharedElementTransitions: ', nodes);
    // const position = Animated.subtract(animValue, startIndex);
    // return (
    //   <View style={styles.sharedElements} pointerEvents="none">
    //     {nodes.map(({ id, ...other }) => (
    //       <SharedElementTransition
    //         key={`SharedElementTransition.${id}`}
    //         {...other}
    //         position={position}
    //       />
    //     ))}
    //   </View>
    // );
  }

  simultaneousHandlers = [];
  handleDismiss = () => {
    this.props?.onDismiss();
  };
  handleWillDismiss = () => {};

  waitFor = [];
  scrollY = new Animated.Value<number>(0);

  presenter = React.createRef();
  panSheet = React.createRef<PanSheetView>();

  dismiss = () => {
    this.panSheet.current.dismiss();
  };
  componentDidMount() {
    // this.setState({ showPanSheetView: true }, () => {
    //   // presentPanSheetView(0, findNodeHandle(this.panSheet.current));
    // });
  }

  showHeader = () => {
    this.setState({ showHeader: true });
    console.warn("DDI APPER");
  };

  startFromHeader = header => {
    if (header) {
      this.headerTag = findNodeHandle(header);
      this.panSheet.current.setNativeProps({ headerTag: this.headerTag });
    }
  };
  headerTag: number | null;

  render() {
    const { showStart } = this.props;

    return (
      <View style={{ flex: 1 }}>
        <PanSheetView
          ref={this.panSheet}
          screenOffset={showStart ? TOP_HEADER : LIST_HEADER_HEIGHT + 8}
          headerTag={this.headerTag}
          screenMinY={TOP_Y}
          longHeight={SCREEN_DIMENSIONS.height - TOP_Y}
          defaultPresentationState={
            this.props.initialStep === GalleryStep.searchInput
              ? PanSheetViewSize.tall
              : PanSheetViewSize.short
          }
          shortHeight={
            SCREEN_DIMENSIONS.height -
            TOP_Y -
            (showStart ? TOP_HEADER : LIST_HEADER_HEIGHT)
          }
          onDismiss={this.handleDismiss}
          onWillDismiss={this.handleWillDismiss}
          didAppear={this.showHeader}
        >
          <View style={styles.container}>{this.renderStep()}</View>
        </PanSheetView>
        {showStart && (
          <StartFromHeader ref={this.startFromHeader} scrollY={this.scrollY} />
        )}
      </View>
    );
  }
}

export const GalleryContainer = React.forwardRef((props, ref) => {
  const { left, right } = React.useContext(SafeAreaContext);

  return (
    <RawGalleryContainer
      {...props}
      ref={ref}
      showStart={props.showStart || false}
      height={SCREEN_DIMENSIONS.height}
      isFocused={props.isFocused}
      width={SCREEN_DIMENSIONS.width - left - right}
    />
  );
});

export default GalleryContainer;
