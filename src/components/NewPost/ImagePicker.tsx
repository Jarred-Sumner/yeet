import CameraRoll from "@react-native-community/cameraroll";
import * as React from "react";
import { StyleSheet, View, Image, Dimensions } from "react-native";
import {
  FlatList as GestureHandlerFlatList,
  BaseButton
} from "react-native-gesture-handler";
import Permissions from "react-native-permissions";
// import { Image } from "../Image";
import { DeniedPhotoPermission } from "./DeniedPhotoPermission";
import { RequestPhotoPermission } from "./RequestPhotoPermission";
import { SPACING } from "../../lib/styles";
import Animated from "react-native-reanimated";
import createNativeWrapper from "react-native-gesture-handler/createNativeWrapper";
import SafeAreaView from "react-native-safe-area-view";
import { SemiBoldText } from "../Text";
import { getInset } from "react-native-safe-area-view";
import { IconClose } from "../Icon";
import { IconButton } from "react-native-paper";
import { ScrollView as NavigationScrollView } from "react-navigation";

const TOP_Y = getInset("top");

const ScrollView = createNativeWrapper(
  Animated.createAnimatedComponent(NavigationScrollView),
  {
    disallowInterruption: true
  }
);

const FlatList = Animated.createAnimatedComponent(GestureHandlerFlatList);

const SCREEN_DIMENSIONS = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000"
  },
  headerText: {
    fontSize: 24
  },
  row: {
    marginBottom: 2
  }
});

export const LIST_HEADER_HEIGHT = 40 + TOP_Y;

const DefaultListHeaderComponent = ({ hidden }) => {
  return (
    <SafeAreaView
      forceInset={{
        top: "always",
        left: "never",
        right: "never",
        bottom: "never"
      }}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        height: LIST_HEADER_HEIGHT - TOP_Y,
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: SPACING.normal
      }}
    >
      <SemiBoldText style={styles.headerText}>CAMERA ROLL</SemiBoldText>
    </SafeAreaView>
  );
};

type Props = {
  height: number;
  width: number;
  animatedYOffset: Animated.Value<number>;
};

const NUM_COLUMNS = 3;

enum ImagePickerLoadState {
  pending = "pending",
  requestPermission = "requestPermission",
  loading = "loading",
  denied = "denied",
  complete = "complete"
}

type State = {
  columnWidth: number;
  cellHeight: number;
  photos: Array<CameraRoll.PhotoIdentifier>;
  loadState: ImagePickerLoadState;
  page: Pick<CameraRoll.PhotoIdentifiersPage, "page_info">;
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

const PhotoCell = ({
  onPress,
  photo,
  height,
  width
}: {
  onPress: Function;
  photo: CameraRoll.PhotoIdentifier;
  height: number;
  width: number;
}) => {
  const _onPress = React.useCallback(() => {
    onPress(photo);
  }, [onPress, photo]);

  const source = Image.resolveAssetSource({
    width,
    height,
    uri: photo.node.image.uri
  });

  // const source = {
  //   width: photo.node.image.width,
  //   height: photo.node.image.height,
  //   uri: photo.node.image.uri
  // };

  return (
    <BaseButton exclusive={false} onPress={_onPress}>
      <View style={[photoCellStyles.container, { width, height }]}>
        <Image source={source} resizeMode="contain" />
      </View>
    </BaseButton>
  );
};

export class ImagePicker extends React.Component<Props, State> {
  static defaultProps = {
    animatedYOffset: new Animated.Value(0),
    initialScrollOffset: 0,
    ListHeaderComponent: DefaultListHeaderComponent
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

    const desiredAspectRatio =
      SCREEN_DIMENSIONS.height / SCREEN_DIMENSIONS.width;

    const columnWidth = Math.floor(props.width / NUM_COLUMNS) - 2;

    this.state = {
      columnWidth,
      cellHeight: desiredAspectRatio * columnWidth,

      photos: [],
      loadState: ImagePickerLoadState.pending,
      page: {
        has_next_page: false,
        start_cursor: "",
        end_cursor: ""
      }
    };
  }

  componentDidMount() {
    this.checkPermissions();

    if (this.props.scrollEnabled) {
      this.flatListRef.current.getNode().flashScrollIndicators();
    }
  }

  checkPermissions = async () => {
    status = await Permissions.check("photo");
    this.handlePermissionChange(status);
  };

  handlePermissionChange = (status: string) => {
    if (status === "authorized") {
      this.loadPhotos(true);
    } else {
      this.setState({
        loadState:
          {
            denied: ImagePickerLoadState.denied,
            undetermined: ImagePickerLoadState.requestPermission,
            restricted: ImagePickerLoadState.loading
          }[status] || ImagePickerLoadState.requestPermission
      });
    }
  };

  requestPhotoPermission = async () => {
    status = await Permissions.request("photo");
    this.handlePermissionChange(status);
  };

  getItemLayout = (_data, index) => ({
    length: this.state.cellHeight,
    offset: this.state.cellHeight * index,
    index
  });

  handleEndReached = () => {
    if (this.state.loadState === ImagePickerLoadState.pending) {
      return;
    }

    this.loadPhotos(false);
  };

  handlePickPhoto = (photo: CameraRoll.PhotoIdentifier) => {
    this.props.onChange(photo);
  };

  loadPhotos = async (initial: boolean = false) => {
    if (
      this.state.loadState === ImagePickerLoadState.loading ||
      this.state.loadState === ImagePickerLoadState.denied ||
      (!initial && this.state.loadState === ImagePickerLoadState.pending)
    ) {
      return;
    }

    if (!initial && !this.state.page.has_next_page) {
      return;
    }

    this.setState({ loadState: ImagePickerLoadState.loading });

    const params = {
      assetType: "photos",
      groupTypes: "All",
      first: PAGE_LENGTH * 2
    };

    if (!initial) {
      params.after = this.state.page.end_cursor;
    }

    const response = await CameraRoll.getPhotos(params);

    this.setState({
      photos: [...this.state.photos, ...response.edges],
      page: response.page_info,
      loadState: ImagePickerLoadState.complete
    });
  };

  keyExtractor = (item: CameraRoll.PhotoIdentifier, _index: number) =>
    item.node.image.uri;

  handleRenderItem = ({ item, index }) => {
    return (
      <PhotoCell
        height={this.state.cellHeight}
        width={this.state.columnWidth}
        onPress={this.handlePickPhoto}
        photo={item}
      />
    );
  };

  renderHeader = props => (
    <DefaultListHeaderComponent
      {...props}
      onPressBack={this.props.onPressBack}
      hidden={!this.props.scrollEnabled}
    />
  );

  render() {
    const { loadState, photos } = this.state;
    const {
      width,
      height,
      ListHeaderComponent,
      paddingTop = 0,
      onPressBack,
      paddingBottom = 0,
      onScrollBeginDrag,
      scrollEnabled,
      pointerEvents
    } = this.props;

    if (loadState === ImagePickerLoadState.denied) {
      return <DeniedPhotoPermission />;
    } else if (loadState === ImagePickerLoadState.requestPermission) {
      return <RequestPhotoPermission onPress={this.requestPhotoPermission} />;
    } else {
      return (
        <FlatList
          data={photos}
          pointerEvents={pointerEvents}
          getItemLayout={this.getItemLayout}
          initialNumToRender={Math.floor(PAGE_LENGTH * 1.5)}
          renderItem={this.handleRenderItem}
          numColumns={NUM_COLUMNS}
          onScroll={this.handleScroll}
          ref={this.flatListRef}
          style={{
            width,
            height,
            // paddingTop,
            flexGrow: 0,
            flexShrink: 0
          }}
          contentInsetAdjustmentBehavior="never"
          ListHeaderComponent={this.renderHeader()}
          removeClippedSubviews={scrollEnabled}
          stickyHeaderIndices={[0]}
          onScrollBeginDrag={onScrollBeginDrag}
          scrollEventThrottle={1}
          overScrollMode="always"
          ListHeaderComponentStyle={{
            height: LIST_HEADER_HEIGHT
          }}
          scrollEnabled={scrollEnabled}
          renderScrollComponent={props => <ScrollView {...props} />}
          columnWrapperStyle={styles.row}
          keyExtractor={this.keyExtractor}
          onEndReached={this.handleEndReached}
        />
      );
    }
  }
}
