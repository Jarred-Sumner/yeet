import { debounce, throttle, uniqBy } from "lodash";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import {
  BaseButton,
  FlatList as GestureHandlerFlatList
} from "react-native-gesture-handler";
import createNativeWrapper from "react-native-gesture-handler/createNativeWrapper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated from "react-native-reanimated";
import { TOP_Y } from "../../../../config";
import {
  getTrending,
  ImageSearchResponse,
  ImageSourceType,
  searchPhrase,
  YeetImageContainer
} from "../../../lib/imageSearch";
import Image from "../../Image";
import ImageSearch, { IMAGE_SEARCH_HEIGHT } from "./ImageSearch";

// import { Image } from "../Image";

const ScrollView = createNativeWrapper(
  Animated.createAnimatedComponent(KeyboardAwareScrollView),
  {
    disallowInterruption: true
  }
);

const FlatList = Animated.createAnimatedComponent(GestureHandlerFlatList);

export const LIST_HEADER_HEIGHT = 50 + TOP_Y;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#111"
  },
  container: {
    backgroundColor: "#000"
  },
  listHeaderHeight: {
    height: LIST_HEADER_HEIGHT
  },
  headerText: {
    fontSize: 24,
    textAlign: "center"
  },
  row: {
    marginBottom: 2
  }
});

type Props = {
  height: number;
  width: number;
  animatedYOffset: Animated.Value<number>;
};

const NUM_COLUMNS = 2;

enum InternetImagesListLoadState {
  pending = "pending",
  requestPermission = "requestPermission",
  loading = "loading",
  denied = "denied",
  complete = "complete"
}

enum ResultType {
  trending = "trending",
  search = "search"
}

type State = {
  columnWidth: number;
  cellHeight: number;
  images: Array<YeetImageContainer>;
  offset: number;
  resultType: ResultType;
  hasMore: boolean;
  query: string;
  loadState: InternetImagesListLoadState;
};

const PAGE_LENGTH = NUM_COLUMNS * NUM_COLUMNS;

const photoCellStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#222",
    marginRight: 2,
    borderRadius: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    justifyContent: "center"
  }
});

const ImageCell = React.memo(
  ({
    onPress,
    image,
    height,
    width
  }: {
    onPress: Function;
    image: YeetImageContainer;
    height: number;
    width: number;
  }) => {
    const [source, setSource] = React.useState({
      width: image.preview.width,
      height: image.preview.height,
      uri: image.preview.uri,
      cache: Image.cacheControl.web
    });

    const _onPress = React.useCallback(() => {
      onPress(image);
    }, [onPress, image]);

    const onError = React.useCallback(() => {
      if (image.sourceType === ImageSourceType.giphy) {
        setSource({
          width: Number(image.source.images.fixed_height_small_still.width),
          height: Number(image.source.images.fixed_height_small_still.height),
          uri: image.source.images.fixed_height_small_still.url,
          cache: Image.cacheControl.web
        });
      }
    }, [setSource, image]);

    return (
      <BaseButton exclusive={false} onPress={_onPress}>
        <View style={[photoCellStyles.container, { width, height }]}>
          <Image
            incrementalLoad
            source={source}
            resizeMode="contain"
            onError={onError}
            style={{ height, width }}
          />
        </View>
      </BaseButton>
    );
  }
);

export class InternetImagesList extends React.PureComponent<Props, State> {
  static defaultProps = {
    animatedYOffset: new Animated.Value(0),
    initialScrollOffset: 0,
    tabBarHeight: 0,
    keyboardHeightValue: new Animated.Value(0)
  };

  handleScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            y: this.props.animatedYOffset
          }
        }
      }
    ],
    { useNativeDriver: true }
  );

  flatListRef = React.createRef<FlatList>();

  constructor(props: Props) {
    super(props);

    const columnWidth = Math.floor(props.width / NUM_COLUMNS) - 2;

    this.state = {
      columnWidth,
      cellHeight: 150,
      query: "",
      resultType: ResultType.trending,
      images: [],
      loadState: InternetImagesListLoadState.pending,
      offset: 0,
      hasMore: false
    };
  }

  componentDidMount() {
    this.loadImages(false);

    if (this.props.scrollEnabled) {
      this.flatListRef.current.getNode().flashScrollIndicators();
    }
  }

  getItemLayout = (_data, index) => ({
    length: this.state.cellHeight,
    offset: this.state.cellHeight * index,
    index
  });

  handleEndReached = throttle(() => {
    if (this.state.loadState === InternetImagesListLoadState.pending) {
      return;
    }

    this.loadImages(false);
  }, 50);

  handlePickImage = (photo: YeetImageContainer) => {
    this.props.onChange(photo);
  };

  loadImages = async (isResultChanging = true) => {
    const { loadState, query, offset, hasMore } = this.state;

    this.setState({ loadState: InternetImagesListLoadState.loading });

    const isSearching = query.trim().length > 0;
    const resultType = isSearching ? ResultType.search : ResultType.trending;

    let results: ImageSearchResponse | null = null;
    const limit = Math.floor(
      (this.props.height / this.state.cellHeight) * NUM_COLUMNS * 1.5
    );

    if (isSearching) {
      results = await searchPhrase(query, limit, this.state.offset);
    } else if (!isSearching) {
      results = await getTrending(limit, this.state.offset);
    }

    this.setState({
      images: isResultChanging
        ? results.images
        : uniqBy(this.state.images.concat(results.images), "id"),
      hasMore: results.hasMore,
      offset: results.offset,
      resultType,
      loadState: InternetImagesListLoadState.complete
    });
  };

  keyExtractor = (item: YeetImageContainer, _index: number) => item.id;

  handleRenderItem = ({ item, index, ...other }) => {
    return (
      <ImageCell
        height={this.state.cellHeight}
        width={this.state.columnWidth}
        onPress={this.handlePickImage}
        image={item}
      />
    );
  };

  _handleSearch = () => {
    this.loadImages(true);

    this.flatListRef.current.getNode().scrollToIndex({
      index: 0,
      viewOffset: 0,
      viewPosition: 0,
      animated: true
    });
  };

  handleSearch = debounce(this._handleSearch, 200, { trailing: true });

  handleChangeQuery = (query: string) => {
    this.setState({ query });

    this.handleSearch();
  };

  renderScrollView = props => <ScrollView {...props} />;

  stickyHeaderIndices = [0];

  translateYValue = Animated.interpolate(this.props.keyboardVisibleValue, {
    inputRange: [0, 1],
    outputRange: [0, this.props.tabBarHeight * -1 + TOP_Y],
    extrapolate: Animated.Extrapolate.CLAMP
  });

  render() {
    const { loadState, images, resultType } = this.state;
    const {
      width,
      height,
      paddingTop = 0,
      onPressBack,
      paddingBottom = 0,
      onScrollBeginDrag,
      scrollEnabled,
      pointerEvents,
      keyboardVisibleValue,
      keyboardHeightValue,
      tabBarHeight = 0
    } = this.props;

    return (
      <Animated.View
        style={[
          styles.wrapper,
          {
            width,
            height,
            transform: [
              {
                translateY: this.translateYValue
              }
            ]
          }
        ]}
      >
        <ImageSearch
          query={this.state.query}
          onChange={this.handleChangeQuery}
          keyboardVisibleValue={keyboardVisibleValue}
        />

        <FlatList
          data={images}
          pointerEvents={pointerEvents}
          getItemLayout={this.getItemLayout}
          renderItem={this.handleRenderItem}
          numColumns={NUM_COLUMNS}
          onScroll={this.handleScroll}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="always"
          ref={this.flatListRef}
          style={{
            width,
            height: height - IMAGE_SEARCH_HEIGHT,
            flex: 0
          }}
          contentInsetAdjustmentBehavior="never"
          removeClippedSubviews={scrollEnabled}
          onScrollBeginDrag={onScrollBeginDrag}
          scrollEventThrottle={1}
          overScrollMode="always"
          scrollEnabled={scrollEnabled}
          renderScrollComponent={this.renderScrollView}
          columnWrapperStyle={styles.row}
          keyExtractor={this.keyExtractor}
          onEndReached={this.handleEndReached}
          onViewableItemsChanged={this.handleViewableItemsChanged}
          onEndReachedThreshold={0.7}
        />
      </Animated.View>
    );
  }
}
