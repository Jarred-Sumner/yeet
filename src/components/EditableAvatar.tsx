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
import { IconUploadPhoto } from "./Icon";

const avatarPlaceholderStyles = StyleSheet.create({
  container: {
    padding: SPACING.normal,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowOpacity: 0.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 1,
      height: 1
    }
  }
});
const AvatarPlaceholder = ({ size, color = COLORS.secondaryOpacity }) => {
  return (
    <>
      <View
        style={[
          avatarPlaceholderStyles.container,
          {
            backgroundColor: color,
            width: size,
            height: size,
            borderRadius: size / 2
          }
        ]}
      >
        <IconUploadPhoto size={size * 0.45} color="#fff" />
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
    alignItems: "center",
    borderWidth: 1,
    borderColor: "white"
  }
});

type Props = {
  size: 44;
  mediaId: string | null;
  onChange: (mediaId: string) => void;
};

class RawEditableAvatar extends React.Component<Props> {
  willUnmount = false;
  s3Upload: S3Upload | null = null;
  canceled: boolean = false;

  constructor(props) {
    super(props);

    this.state = {
      isUploading: false
    };
  }

  cancelRequests = () => {
    if (this.s3Upload) {
      this.canceled = true;
      this.s3Upload.abortUpload();
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

    this.s3Upload = null;

    return Promise.resolve();
  };

  handleUploadError = (error, more, other) => {
    if (this.canceled) {
      return Promise.resolve();
    }

    console.error(error);
    alert("Uploading failed. Please try again");

    HapticFeedback.trigger("notificationError");

    this.setState({
      isUploading: false
    });

    this.s3Upload = null;

    return Promise.resolve();
  };

  startUploading = async (resetStatus = false) => {
    if (this.props.lastPhoto.didCancel) {
      return;
    }

    if (this.props.isUploading && !resetStatus) {
      return;
    } else {
      this.setState({
        isUploading: true
      });
    }

    this.s3Upload = await startFileUpload({
      file: this.props.lastPhoto,
      onFinishS3Put: this.handleUploadComplete,
      onError: this.handleUploadError,
      onProgress: this.handleUploadProgress,
      params: {
        from: "avatar"
      }
    });

    this.canceled = false;
  };

  render() {
    const { lastPhoto: localPhoto, openImagePicker, size } = this.props;
    const isLocal = !!(
      localPhoto &&
      !localPhoto.error &&
      !localPhoto.didCancel &&
      localPhoto.uri
    );
    const url = isLocal ? localPhoto.uri : this.props.src;

    return (
      <TouchableWithoutFeedback onPress={openImagePicker}>
        <View style={[styles.container, { borderRadius: size / 2 }]}>
          <Avatar
            PlaceholderComponent={AvatarPlaceholder}
            size={this.props.size}
            url={url}
            isLocal={isLocal}
          />
          {this.state.isUploading && (
            <UploadingAvatarIndicator size={this.props.size} />
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

export const EditableAvatar = ({ src, value, onChange, size, onBlur }) => {
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
      lastPhoto={imagePicker.lastPhoto}
      onBlur={onBlur}
      size={size}
      openImagePicker={_openImagePicker}
      onChange={onChange}
    />
  );
};
