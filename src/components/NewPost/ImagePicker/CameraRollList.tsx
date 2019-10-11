import CameraRoll from "@react-native-community/cameraroll";
import * as React from "react";
import { Image as RNImage, StyleSheet, View } from "react-native";
import { BaseButton } from "react-native-gesture-handler";
import Permissions from "react-native-permissions";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../../config";
import { imageContainerFromCameraRoll } from "../../../lib/imageSearch";
import { SPACING } from "../../../lib/styles";
import Image from "../../Image";
// import { Image } from "../Image";
import { DeniedPhotoPermission } from "../DeniedPhotoPermission";
import { RequestPhotoPermission } from "../RequestPhotoPermission";
import { DurationLabel } from "./DurationLabel";
import { FlatList, ScrollView } from "../../FlatList";

export const LIST_HEADER_HEIGHT = 50 + TOP_Y;

const styles = StyleSheet.create({
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

const NUM_COLUMNS = 3;

enum CameraRollListLoadState {
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
  loadState: CameraRollListLoadState;
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
    justifyContent: "center",
    position: "relative"
  },
  durationContainer: {
    position: "absolute",
    left: SPACING.half,
    bottom: SPACING.half
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

  const source = {
    width: photo.node.image.width,
    height: photo.node.image.height,
    uri: photo.node.image.uri
  };

  const isVideo = photo.node.type === "video";
  const MediaComponent = isVideo ? RNImage : Image;

  return (
    <BaseButton
      exclusive
      shouldActivateOnStart
      disallowInterruption={false}
      onPress={_onPress}
    >
      <View style={[photoCellStyles.container, { width, height }]}>
        <MediaComponent
          paused
          muted
          source={source}
          resizeMode="contain"
          style={{ width, height }}
        />

        {isVideo && (
          <DurationLabel
            duration={photo.node.image.playableDuration}
            style={photoCellStyles.durationContainer}
          />
        )}
      </View>
    </BaseButton>
  );
};

export class CameraRollList extends React.Component<Props, State> {
  static defaultProps = {
    animatedYOffset: new Animated.Value(0),
    initialScrollOffset: 0
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
      loadState: CameraRollListLoadState.pending,
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
            denied: CameraRollListLoadState.denied,
            undetermined: CameraRollListLoadState.requestPermission,
            restricted: CameraRollListLoadState.loading
          }[status] || CameraRollListLoadState.requestPermission
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
    if (this.state.loadState === CameraRollListLoadState.pending) {
      return;
    }

    this.loadPhotos(false);
  };

  handlePickPhoto = (photo: CameraRoll.PhotoIdentifier) => {
    console.log("PHOTO");
    this.props.onChange(imageContainerFromCameraRoll(photo));
  };

  loadPhotos = async (initial: boolean = false) => {
    if (
      this.state.loadState === CameraRollListLoadState.loading ||
      this.state.loadState === CameraRollListLoadState.denied ||
      (!initial && this.state.loadState === CameraRollListLoadState.pending)
    ) {
      return;
    }

    if (!initial && !this.state.page.has_next_page) {
      return;
    }

    this.setState({ loadState: CameraRollListLoadState.loading });

    const params = {
      assetType: "All",
      groupTypes: "All",
      first: initial ? PAGE_LENGTH * 2 : PAGE_LENGTH
    };

    if (!initial) {
      params.after = this.state.page.end_cursor;
    }

    const response = await CameraRoll.getPhotos(params);

    this.setState({
      photos: [...this.state.photos, ...response.edges],
      page: response.page_info,
      loadState: CameraRollListLoadState.complete
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

  renderStandaloneItem = item => (
    <PhotoCell
      height={this.state.cellHeight}
      width={this.state.columnWidth}
      onPress={this.handlePickPhoto}
      photo={item}
      key={this.keyExtractor(item)}
    />
  );

  renderScrollView = props => <ScrollView {...props} />;

  render() {
    const { loadState, photos } = this.state;
    const {
      width,
      height,
      paddingTop = 0,
      onPressBack,
      paddingBottom = 0,
      onScrollBeginDrag,
      scrollEnabled,
      pointerEvents
    } = this.props;

    if (loadState === CameraRollListLoadState.denied) {
      return <DeniedPhotoPermission />;
    } else if (loadState === CameraRollListLoadState.requestPermission) {
      return <RequestPhotoPermission onPress={this.requestPhotoPermission} />;
    } else if (scrollEnabled) {
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
            flexGrow: 0,
            flexShrink: 0
          }}
          contentInsetAdjustmentBehavior="never"
          removeClippedSubviews={false}
          onScrollBeginDrag={onScrollBeginDrag}
          scrollEventThrottle={1}
          overScrollMode="always"
          scrollEnabled={scrollEnabled}
          renderScrollComponent={this.renderScrollView}
          columnWrapperStyle={styles.row}
          keyExtractor={this.keyExtractor}
          onEndReached={this.handleEndReached}
        />
      );
    } else {
      return (
        <View style={{ width, height, flexDirection: "row", flexWrap: "wrap" }}>
          {photos
            .slice(0, Math.floor(PAGE_LENGTH * 1.5))
            .map(this.renderStandaloneItem)}
        </View>
      );
    }
  }
}
