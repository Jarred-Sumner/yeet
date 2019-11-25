import * as React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
  View
} from "react-native";
import HapticFeedback from "react-native-haptic-feedback";
import { startFileUpload } from "../lib/fileUpload";
import { ImagePickerContext } from "../lib/ImagePickerContext";
import { COLORS, SPACING } from "../lib/styles";
import { Avatar } from "./Avatar";
import {
  IconUploadPhoto,
  IconPhoto,
  IconCameraRoll,
  IconProfile,
  IconPlus
} from "./Icon";
import { BitmapIconPlus } from "./BitmapIcon";
import {
  MediaUploadTask,
  MediaUploadStatus,
  MediaUpload
} from "../lib/MediaUploadTask";
import { ImageSourceType } from "../lib/imageSearch";
import { allowSuspendIfBackgrounded } from "../lib/FileUploader";

const avatarPlaceholderStyles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative"
  },
  plus: {
    position: "absolute",
    bottom: 8,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    shadowRadius: 1,
    shadowColor: "white",
    shadowOpacity: 0.1
  },
  icon: {
    width: 24,
    height: 24
  }
});
const AvatarPlaceholder = ({ size, color = "#000" }) => {
  return (
    <>
      <View
        style={[
          avatarPlaceholderStyles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2
          }
        ]}
      >
        <IconProfile size={size * 0.92} color="#fff" />

        <View style={avatarPlaceholderStyles.plus}>
          <IconPlus
            size={24}
            color="white"
            style={avatarPlaceholderStyles.icon}
          />
        </View>
      </View>
    </>
  );
};

const uploadingAvatarIndicator = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",

    alignItems: "center",
    position: "absolute"
  }
});
const UploadingAvatarIndicator = ({ size }) => {
  return (
    <View
      style={[
        uploadingAvatarIndicator.container,
        { width: size, height: size, borderRadius: size / 2 }
      ]}
    >
      <ActivityIndicator size="small" color="white" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
    alignSelf: "center",
    alignItems: "center"
  }
});

type Props = {
  size: 44;
  mediaId: string | null;
  onChange: (mediaId: string) => void;
};

export class RawEditableAvatar extends React.Component<Props> {
  willUnmount = false;
  canceled: boolean = false;

  constructor(props) {
    super(props);

    this.state = {
      isUploading: false
    };
  }

  cancelRequests = () => {
    if (this.mediaUpload) {
      this.canceled = true;
      this.mediaUpload.cancel();
    }
  };

  componentWillUnmount() {
    this.willUnmount = true;
    this.cancelRequests();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.lastPhoto !== this.props.lastPhoto &&
      this.props.lastPhoto &&
      !this.props.lastPhoto.didCancel &&
      !this.props.lastPhoto.error
    ) {
      this.cancelRequests();
      this.setState({
        isUploading: true,
        error: null
      });
      this.startUploading();
      this.props.onBlur();
    }

    if (
      this.props.lastPhoto &&
      this.props.lastPhoto.didCancel &&
      (!prevProps.lastPhoto || !prevProps.lastPhoto.didCancel)
    ) {
      this.props.onBlur();
    }
  }

  handleUploadProgress = (percent, status) => {};
  handleUploadComplete = ({ mediaId }) => {
    this.setState({
      isUploading: false
    });
    this.props.onChange(mediaId);

    HapticFeedback.trigger("notificationSuccess");

    this.mediaUpload = null;

    return Promise.resolve();
  };

  handleUploadError = (error, more, other) => {
    if (this.canceled) {
      return Promise.resolve();
    }

    allowSuspendIfBackgrounded();

    console.error(error);
    alert("Uploading failed. Please try again");

    HapticFeedback.trigger("notificationError");

    this.setState({
      isUploading: false
    });

    this.mediaUpload = null;

    return Promise.resolve();
  };

  mediaUpload: MediaUpload | null = null;

  handleUploadChange = (upload: MediaUpload) => {
    console.log("CHANGE", upload.status, upload.presignStatus);
    if (upload.isWaiting) {
      upload.start();
    } else if (upload.isCompleted) {
      this.handleUploadComplete({ mediaId: upload.mediaId });
    } else if (upload.isFailed) {
      this.handleUploadError(upload.uploadError || upload.presignError);
    }
  };

  startUploading = async (resetStatus = false) => {
    if (this.props.lastPhoto.didCancel) {
      return;
    }

    const { lastPhoto: photo } = this.props;

    const media = {
      width: photo.width,
      height: photo.height,
      uri: photo.uri,
      mimeType: photo.type,
      source: ImageSourceType.cameraRoll,
      duration: 0
    };

    this.mediaUpload = new MediaUpload({
      media,
      onChange: this.handleUploadChange,
      onProgress: this.handleUploadProgress
    });

    this.mediaUpload.start();

    this.canceled = false;
  };

  tapAvatar = () => {
    this.props.openImagePicker();
  };

  render() {
    const { lastPhoto: localPhoto, size } = this.props;
    const isLocal = !!(
      localPhoto &&
      !localPhoto.error &&
      !localPhoto.didCancel &&
      localPhoto.uri
    );
    const url = isLocal ? localPhoto.uri : this.props.src;

    return (
      <TouchableWithoutFeedback onPress={this.tapAvatar}>
        <View style={[styles.container, { borderRadius: size / 2 }]}>
          <Avatar
            PlaceholderComponent={AvatarPlaceholder}
            size={this.props.size}
            url={url}
            isLocal={isLocal}
            key={url}
          />
          {this.state.isUploading && (
            <UploadingAvatarIndicator size={this.props.size} />
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

export const EditableAvatar = React.forwardRef(
  ({ src, value, onChange, size, onBlur = () => {} }, ref) => {
    const imagePicker = React.useContext(ImagePickerContext);

    const _openImagePicker = React.useCallback(() => {
      imagePicker.openImagePicker({
        mediaType: "photo",
        allowsEditing: true,
        maxWidth: 600,
        maxHeight: 600
      });
    }, [imagePicker.openImagePicker]);

    return (
      <RawEditableAvatar
        src={src}
        value={value}
        ref={ref}
        lastPhoto={imagePicker.lastPhoto}
        onBlur={onBlur}
        size={size}
        openImagePicker={_openImagePicker}
        onChange={onChange}
      />
    );
  }
);
