import CameraRoll from "@react-native-community/cameraroll";
import * as React from "react";
import { Image as RNImage, StyleSheet, View, Platform } from "react-native";
import { BaseButton } from "react-native-gesture-handler";
import Permissions, { PERMISSIONS, RESULTS } from "react-native-permissions";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../../config";
import {
  imageContainerFromCameraRoll,
  mediaSourceFromImage,
  mimeTypeFromFilename,
  isVideo
} from "../../../lib/imageSearch";
import { SPACING } from "../../../lib/styles";
import Image from "../../Image";
// import { Image } from "../Image";
import { DeniedPhotoPermission } from "../DeniedPhotoPermission";
import { RequestPhotoPermission } from "../RequestPhotoPermission";
import { DurationLabel } from "./DurationLabel";
import { FlatList, ScrollView } from "../../FlatList";
import MediaPlayer from "../../MediaPlayer";
import { throttle } from "lodash";

export const LIST_HEADER_HEIGHT = 50 + TOP_Y;

export enum CameraRollMediaType {
  none = "none",
  panorama = "panorama",
  hdr = "hdr",
  screenshot = "screenshot",
  live = "live",
  videoStreamed = "video-streamed",
  videoHighfps = "video-highfps",
  timelapse = "timelapse",
  portrait = "portrait"
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000"
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
  mediaType: CameraRollMediaType | null;
  aspectRatio: number;
  animatedYOffset: Animated.Value<number>;
  columnCount: number;
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

  const _isVideo = photo.node.type === "video";
  // const source = React.useMemo(() => {
  //   if (isVideo) {
  //     return {
  //       width: photo.node.image.width,
  //       height: photo.node.image.height,
  //       uri: photo.node.image.uri
  //     };
  //   } else {
  //     return [
  //       mediaSourceFromImage(imageContainerFromCameraRoll(photo), {
  //         width,
  //         height,
  //         x: 0,
  //         y: 0
  //       })
  //     ];
  //   }
  // }, [
  //   imageContainerFromCameraRoll,
  //   mediaSourceFromImage,
  //   photo,
  //   isVideo,
  //   width,
  //   height
  // ]);

  const source = _isVideo
    ? {
        width: photo.node.image.width,
        height: photo.node.image.height,
        uri: photo.node.image.uri
      }
    : mediaSourceFromImage(imageContainerFromCameraRoll(photo), {
        width,
        height,
        x: 0,
        y: 0
      });

  const MediaComponent = _isVideo ? RNImage : Image;

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
          source={_isVideo ? source : undefined}
          mediaSource={!_isVideo ? source : undefined}
          resizeMode="cover"
          style={{ width, height }}
        />

        {_isVideo && (
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
    initialScrollOffset: 0,
    mediaType: null,
    aspectRatio: 16 / 9,
    scrollEnabled: true,
    paddingTop: 0,
    paddingBottom: 0,
    columnCount: 3
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

    const columnWidth = Math.floor(props.width / props.columnCount) - 2;

    this.state = {
      columnWidth,
      cellHeight: props.aspectRatio * columnWidth,

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
      this.flatListRef.current.flashScrollIndicators();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.photos !== this.state.photos) {
    }
  }

  startCaching = (photos: Array<CameraRoll.PhotoIdentifier>) => {
    const bounds = {
      width: this.state.columnWidth,
      height: this.state.cellHeight,
      x: 0,
      y: 0
    };

    const mediaSources = photos.map(photo =>
      mediaSourceFromImage(imageContainerFromCameraRoll(photo), bounds)
    );

    MediaPlayer.startCaching(mediaSources, bounds, "cover");
  };

  stopCaching = () => {
    const bounds = {
      width: this.state.columnWidth,
      height: this.state.cellHeight,
      x: 0,
      y: 0
    };

    const mediaSources = this.state.photos.map(photo =>
      mediaSourceFromImage(imageContainerFromCameraRoll(photo), bounds)
    );

    if (mediaSources.length > 0) {
      MediaPlayer.stopCaching(mediaSources, bounds, "cover");
    }
  };

  componentWillUnmount() {
    this.stopCaching();
  }

  checkPermissions = async () => {
    status = await Permissions.check(PERMISSIONS.IOS.PHOTO_LIBRARY);
    this.handlePermissionChange(status);
  };

  handlePermissionChange = (status: string) => {
    if (status === RESULTS.GRANTED) {
      this.loadPhotos(true);
    } else {
      this.setState({
        loadState:
          {
            [RESULTS.BLOCKED]: CameraRollListLoadState.denied,
            [RESULTS.DENIED]: CameraRollListLoadState.requestPermission,
            [RESULTS.UNAVAILABLE]: CameraRollListLoadState.loading
          }[status] || CameraRollListLoadState.requestPermission
      });
    }
  };

  requestPhotoPermission = async () => {
    status = await Permissions.request(PERMISSIONS.IOS.PHOTO_LIBRARY);
    this.handlePermissionChange(status);
  };

  getItemLayout = (_data, index) => ({
    length: this.state.cellHeight,
    offset: this.state.cellHeight * index,
    index
  });

  handleEndReached = throttle(() => {
    if (this.state.loadState === CameraRollListLoadState.pending) {
      return;
    }

    this.loadPhotos(false);
  }, 25);

  handlePickPhoto = (photo: CameraRoll.PhotoIdentifier) => {
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
      first: initial ? this.pageLength * 2 : this.pageLength
    };

    if (this.props.mediaType) {
      params.mediaSubtypes = this.props.mediaType;
    }

    if (!initial) {
      params.after = this.state.page.end_cursor;
    }

    const response = await CameraRoll.getPhotos(params);

    const nextBatch = response.edges;
    this.setState({
      photos: [...this.state.photos, ...nextBatch],
      page: response.page_info,
      loadState: CameraRollListLoadState.complete
    });

    this.startCaching(nextBatch);
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

  get pageLength() {
    return this.props.columnCount * this.props.columnCount;
  }

  contentInset = {
    top: this.props.paddingTop,
    bottom: this.props.paddingBottom
  };

  contentOffset = {
    y: this.props.paddingTop * -1,
    x: 0
  };

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
      pointerEvents,
      columnCount
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
          contentInset={this.contentInset}
          contentOffset={this.contentOffset}
          initialNumToRender={Math.floor(this.pageLength * 1.5)}
          renderItem={this.handleRenderItem}
          numColumns={columnCount}
          onScroll={this.handleScroll}
          ref={this.flatListRef}
          style={{
            flex: 1
          }}
          contentInsetAdjustmentBehavior="never"
          removeClippedSubviews={Platform.select({
            ios: false,
            android: true
          })}
          onScrollBeginDrag={onScrollBeginDrag}
          scrollEventThrottle={1}
          overScrollMode="always"
          scrollEnabled={scrollEnabled}
          columnWrapperStyle={styles.row}
          keyExtractor={this.keyExtractor}
          onEndReached={this.handleEndReached}
        />
      );
    } else {
      return (
        <View style={{ width, height, flexDirection: "row", flexWrap: "wrap" }}>
          {photos
            .slice(0, Math.floor(this.pageLength * 1.5))
            .map(this.renderStandaloneItem)}
        </View>
      );
    }
  }
}

export const ScreenshotList = (props: Partial<Props>) => {
  return (
    <CameraRollList
      {...props}
      mediaType={CameraRollMediaType.screenshot}
      columnCount={3}
      aspectRatio={SCREEN_DIMENSIONS.height / SCREEN_DIMENSIONS.width}
    />
  );
};
