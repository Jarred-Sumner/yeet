import * as React from "react";
import ImagePicker from "react-native-image-picker";
import { StatusBar } from "react-native";
import HapticFeedback from "react-native-haptic-feedback";

export const ImagePickerContext = React.createContext({
  isOpen: false,
  openImagePicker: () => {},
  lastPhoto: null
});

const DEFAULT_IMAGE_LIBRARY_OPTIONS = {
  videoQuality: "high",
  allowsEditing: false,
  formatToMp4: true,
  mediaType: "mixed",
  quality: 0.9,
  noData: true
};

export let openImagePicker;

export class ImagePickerProvider extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contextValue: {
        isOpen: false,
        lastPhoto: null,
        openImagePicker: this.handleOpenPicker
      }
    };
  }

  setContextValue = ({ isOpen, lastPhoto }) => {
    this.setState({
      contextValue: {
        isOpen,
        lastPhoto,
        openImagePicker: this.handleOpenPicker
      }
    });
  };

  handleOpenPicker = (opts = DEFAULT_IMAGE_LIBRARY_OPTIONS) => {
    if (this.state.isOpen) {
      HapticFeedback.trigger("impactMedium");
      return;
    }

    HapticFeedback.trigger("impactMedium");

    this.setContextValue({ isOpen: true, lastPhoto: null });
    StatusBar.setHidden(true, "slide");
    ImagePicker.launchImageLibrary(opts, imageResponse => {
      this.setContextValue({
        isOpen: false,
        lastPhoto: {
          ...imageResponse,
          type:
            imageResponse.uri &&
            imageResponse.uri.toUpperCase().endsWith(".MP4")
              ? "application/mp4"
              : imageResponse.type
        }
      });
      StatusBar.setHidden(false, "fade");
    });
  };

  componentDidMount() {
    openImagePicker = this.handleOpenPicker;
  }

  render() {
    return (
      <ImagePickerContext.Provider value={this.state.contextValue}>
        {this.props.children}
      </ImagePickerContext.Provider>
    );
  }
}
