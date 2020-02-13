import * as React from "react";
import ReportModal from "./ReportModal";
import PushNotificationModal from "./PushNotificationModal";
import ImagePickerPage from "../screens/ImagePickerPage";

type ModalContextValue = {
  isReportModalShown: boolean;
  isPushNotificationModalShown: boolean;
  isImagePickerModalShown: boolean;
  openReportModal: (id: string, type: string) => void;
  openPushNotificationModal: () => void;
  openImagePickerModal: () => void;
};

const DEFAULT_VALUE: ModalContextValue = {
  isReportModalShown: false,
  isPushNotificationModalShown: false,
  isImagePickerModalShown: false,
  openReportModal: (id: string, type: string) => {},
  openPushNotificationModal: () => {},
  openImagePickerModal: () => {}
};

export const ModalContext = React.createContext<ModalContextValue>(
  DEFAULT_VALUE
);

type State = {
  contextValue: ModalContextValue;
  reportModalProps: any;
};

export class ModalContextProvider extends React.Component<
  { children: React.ReactChildren },
  State
> {
  constructor(props) {
    super(props);

    this.state = {
      reportModalProps: {},
      contextValue: {
        ...DEFAULT_VALUE,
        openReportModal: this.openReportModal,
        openPushNotificationModal: this.openPushNotificationModal,
        openImagePickerModal: this.openImagePickerModal
      }
    };
  }
  openImagePickerModal = () =>
    this.setState({
      contextValue: {
        ...this.state.contextValue,
        isImagePickerModalShown: true
      }
    });

  openPushNotificationModal = () =>
    this.setState({
      contextValue: {
        ...this.state.contextValue,
        isPushNotificationModalShown: true
      }
    });

  openReportModal = (id: string, type: string) => {
    this.setState({
      contextValue: {
        ...this.state.contextValue,
        isReportModalShown: true
      },
      reportModalProps: { id, type }
    });
  };

  dismissPushNotificationModal = () =>
    this.setState({
      contextValue: {
        ...this.state.contextValue,
        isPushNotificationModalShown: false
      }
    });

  dismissReportModal = () =>
    this.setState({
      contextValue: {
        ...this.state.contextValue,
        isReportModalShown: false
      },
      reportModalProps: {}
    });

  dismissImagePickerModal = () =>
    this.setState({
      contextValue: {
        ...this.state.contextValue,
        isImagePickerModalShown: false
      },
      reportModalProps: {}
    });

  render() {
    const { contextValue } = this.state;
    const {
      isReportModalShown,
      isPushNotificationModalShown,
      isImagePickerModalShown
    } = contextValue;

    return (
      <>
        <ModalContext.Provider value={contextValue}>
          {this.props.children}
        </ModalContext.Provider>

        {isImagePickerModalShown && (
          <ImagePickerPage isFocused onDismiss={this.dismissImagePickerModal} />
        )}

        {isReportModalShown && (
          <ReportModal
            {...this.state.reportModalProps}
            visible
            onDismiss={this.dismissReportModal}
          />
        )}

        {isPushNotificationModalShown && (
          <PushNotificationModal
            visible
            onDismiss={this.dismissPushNotificationModal}
          />
        )}
      </>
    );
  }
}
