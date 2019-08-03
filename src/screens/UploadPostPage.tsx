import * as React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback
} from "react-native";
import { BoldText, MediumText } from "../components/Text";
import ImagePicker from "react-native-image-picker";
import { ImagePickerContext } from "../lib/ImagePickerContext";
import { Media } from "../components/Media";
import { SPACING, COLORS } from "../lib/styles";
import { IconSend, IconClose } from "../components/Icon";
import { getInset } from "react-native-safe-area-view";
import S3Upload, { startFileUpload } from "../lib/fileUpload";
import { fromPairs } from "lodash";
import { ActivityIndicator } from "react-native";
import HapticFeedback from "react-native-haptic-feedback";

const SAFE_AREA_BOTTOM = getInset("top");
const SCREEN_DIMENSIONS = Dimensions.get("window");
const MEDIA_HEIGHT = SCREEN_DIMENSIONS.height - SAFE_AREA_BOTTOM;
const BOTTOM_BAR_HEIGHT = SAFE_AREA_BOTTOM + 64;

const styles = StyleSheet.create({
  mediaContainer: {
    flex: 1,
    width: "100%",
    height: MEDIA_HEIGHT,
    marginTop: BOTTOM_BAR_HEIGHT
  },
  progressBar: {
    width: "100%",
    height: 3,
    position: "absolute",
    backgroundColor: "#fff",
    opacity: 0.45,
    top: BOTTOM_BAR_HEIGHT - 3,
    zIndex: 11
  },
  spinner: {
    marginRight: SPACING.normal
  },
  media: {
    position: "relative",
    width: "100%",
    height: MEDIA_HEIGHT
  },
  promptContainer: {
    flex: 1,
    paddingRight: SPACING.normal
  },
  promptText: {
    fontSize: 16,
    color: "#fff"
  },
  closeButton: {
    paddingLeft: SPACING.normal,
    paddingRight: SPACING.normal
  },
  header: {
    padding: SPACING.normal,
    flexDirection: "row",
    height: BOTTOM_BAR_HEIGHT,
    alignItems: "center",
    backgroundColor: COLORS.primary,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10
  },
  sendButtonContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 48 / 2,
    marginRight: SPACING.normal,

    backgroundColor: "#fff",
    shadowRadius: 1,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.15,
    shadowColor: "#333"
  },
  sendButtonContainerDisabled: {
    opacity: 0.5
  }
});

const SendButton = ({ onPress, isEnabled }) => {
  return (
    <TouchableOpacity disabled={!isEnabled} onPress={onPress}>
      <View
        style={[
          styles.sendButtonContainer,
          !isEnabled ? styles.sendButtonContainerDisabled : {}
        ]}
      >
        <IconSend size={24} color={COLORS.primaryDark} />
      </View>
    </TouchableOpacity>
  );
};

getLayout = ({
  nativeEvent: {
    layout: { height }
  }
}) => {
  this.setState({ height });
};

enum UploadStatus {
  pending = "pending",
  startPresign = "startPresign",
  presignError = "presignError",
  uploadingFile = "uploadingFile",
  uploadComplete = "uploadComplete",
  uploadFileError = "uploadingFileError"
}

class RawUploadPostPage extends React.Component {
  uploadProgressValue = new Animated.Value(SCREEN_DIMENSIONS.width * -1);

  constructor(props) {
    super(props);

    this.uploadRequest = null;
    this.presignRequest = null;

    this.state = {
      height: 0,
      error: null,
      mediaId: null,
      uploadStatus: UploadStatus.pending,
      lastPhoto: { didCancel: true }
    };
  }
  state = { height: 0 };

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
      !this.props.lastPhoto.didCancel
    ) {
      this.cancelRequests();
      this.uploadProgressValue.setValue(0);
      this.setState({
        lastPhoto: this.props.lastPhoto,
        error: null
      });
    }

    if (
      this.state.lastPhoto !== prevState.lastPhoto &&
      !this.state.lastPhoto.didCancel &&
      !this.state.lastPhoto.error
    ) {
      this.cancelRequests();

      this.startUploading(true);
    }
  }

  handleUploadProgress = (percent, status) => {
    Animated.spring(this.uploadProgressValue, {
      toValue: (percent / 100) * SCREEN_DIMENSIONS.width,
      useNativeDriver: true
    }).start();
  };
  handleUploadComplete = ({ mediaId }) => {
    this.setState({
      uploadStatus: UploadStatus.uploadComplete,
      mediaId,
      error: null
    });

    HapticFeedback.trigger("notificationSuccess");

    Animated.spring(this.uploadProgressValue, {
      toValue: SCREEN_DIMENSIONS.width,
      useNativeDriver: true
    }).start();

    this.s3Upload = null;

    return Promise.resolve();
  };

  handleUploadError = (error, more, other) => {
    if (this.canceled) {
      return Promise.resolve();
    }

    console.error(error);
    alert("Uploading failed. Please try again");
    Animated.spring(this.uploadProgressValue, {
      toValue: SCREEN_DIMENSIONS.width * -1,
      useNativeDriver: true
    });

    HapticFeedback.trigger("notificationError");

    this.setState({
      uploadStatus: UploadStatus.uploadFileError
    });

    this.s3Upload = null;

    return Promise.resolve();
  };

  startUploading = async (resetStatus = false) => {
    if (this.state.lastPhoto.didCancel) {
      return;
    }

    if (
      (this.state.uploadStatus === UploadStatus.uploadingFile ||
        this.state.uploadStatus === UploadStatus.startPresign) &&
      !resetStatus
    ) {
      return;
    } else {
      this.setState({
        uploadStatus: UploadStatus.uploadingFile
      });

      Animated.spring(this.uploadProgressValue, {
        toValue: SCREEN_DIMENSIONS.width * 1,
        useNativeDriver: true
      }).start();
    }

    this.s3Upload = await startFileUpload({
      file: this.state.lastPhoto,
      onFinishS3Put: this.handleUploadComplete,
      onError: this.handleUploadError,
      onProgress: this.handleUploadProgress,
      params: {
        from: "prompt",
        promptId: this.props.navigation.getParam("promptId")
      }
    });

    this.canceled = false;
  };
  canceled = false;

  render() {
    const { openImagePicker, navigation } = this.props;
    const promptBody = navigation.getParam("promptBody");
    const { lastPhoto, uploadStatus } = this.state;

    return (
      <View style={{ height: "100%", width: "100%" }}>
        <SafeAreaView style={styles.header} forceInsets={{ bottom: "top" }}>
          <TouchableOpacity onPress={() => navigation.pop(1)}>
            <View style={styles.closeButton}>
              <IconClose size={18} color="#ccc" />
            </View>
          </TouchableOpacity>

          <View style={styles.promptContainer}>
            <BoldText style={styles.promptText}>JOIN CHALLENGE</BoldText>
            <MediumText style={styles.promptText}>{promptBody}</MediumText>
          </View>
          {[UploadStatus.uploadingFile, UploadStatus.pending].includes(
            uploadStatus
          ) ? (
            <ActivityIndicator
              size={"small"}
              color="#ccc"
              style={styles.spinner}
            />
          ) : (
            <SendButton
              isEnabled={uploadStatus === UploadStatus.uploadComplete}
              onPress={this.handleSave}
            />
          )}
        </SafeAreaView>

        <View style={styles.mediaContainer}>
          {!lastPhoto.didCancel && (
            <TouchableWithoutFeedback onPress={() => openImagePicker()}>
              <View style={styles.media}>
                <Media
                  media={{
                    width: lastPhoto.width,
                    height: lastPhoto.height,
                    mimeType: lastPhoto.type,
                    url: lastPhoto.uri
                  }}
                  height={MEDIA_HEIGHT}
                  width={SCREEN_DIMENSIONS.width}
                />
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.progressBar,
            {
              transform: [
                {
                  translateX: this.uploadProgressValue
                }
              ]
            }
          ]}
        />
      </View>
    );
  }
}

export const UploadPostPage = props => {
  const { isOpen, lastPhoto, openImagePicker } = React.useContext(
    ImagePickerContext
  );

  return (
    <RawUploadPostPage
      {...props}
      isOpen={isOpen}
      lastPhoto={lastPhoto}
      openImagePicker={openImagePicker}
    />
  );
};

export default UploadPostPage;
