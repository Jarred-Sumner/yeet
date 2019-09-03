import CameraRoll from "@react-native-community/cameraroll";
import * as React from "react";
import { StyleSheet, View, Image, Dimensions } from "react-native";
import { FlatList, BaseButton } from "react-native-gesture-handler";
import Permissions from "react-native-permissions";
// import { Image } from "../Image";
import { DeniedPhotoPermission } from "./DeniedPhotoPermission";
import { RequestPhotoPermission } from "./RequestPhotoPermission";
import { SPACING } from "../../lib/styles";

const SCREEN_DIMENSIONS = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {},
  row: {
    marginBottom: 2
  }
});

type Props = {
  height: number;
  width: number;
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
        <Image
          source={source}
          resizeMode="center"
          style={{
            maxHeight: height,
            maxWidth: width
          }}
        />
      </View>
    </BaseButton>
  );
};

export class ImagePicker extends React.Component<Props, State> {
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

  render() {
    const { loadState, photos } = this.state;
    const { width, height, ListHeaderComponent } = this.props;

    if (loadState === ImagePickerLoadState.denied) {
      return <DeniedPhotoPermission />;
    } else if (loadState === ImagePickerLoadState.requestPermission) {
      return <RequestPhotoPermission onPress={this.requestPhotoPermission} />;
    } else {
      return (
        <FlatList
          data={photos}
          getItemLayout={this.getItemLayout}
          initialNumToRender={Math.floor(PAGE_LENGTH * 1.5)}
          renderItem={this.handleRenderItem}
          numColumns={NUM_COLUMNS}
          style={{
            width,
            height,
            flexGrow: 0,
            flexShrink: 0
          }}
          contentInsetAdjustmentBehavior="never"
          ListHeaderComponent={ListHeaderComponent}
          removeClippedSubviews
          columnWrapperStyle={styles.row}
          keyExtractor={this.keyExtractor}
          onEndReached={this.handleEndReached}
        />
      );
    }
  }
}
