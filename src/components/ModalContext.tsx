import * as React from "react";
import ReportModal from "./ReportModal";
import PushNotificationModal from "./PushNotificationModal";

type ModalContextValue = {
  isReportModalShown: boolean;
  isPushNotificationModalShown: boolean;
  openReportModal: (id: string, type: string) => void;
  openPushNotificationModal: () => void;
};

const DEFAULT_VALUE: ModalContextValue = {
  isReportModalShown: false,
  isPushNotificationModalShown: false,
  openReportModal: (id: string, type: string) => {},
  openPushNotificationModal: () => {}
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
        openPushNotificationModal: this.openPushNotificationModal
      }
    };
  }

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

  render() {
    const { contextValue } = this.state;
    const { isReportModalShown, isPushNotificationModalShown } = contextValue;

    return (
      <>
        <ModalContext.Provider value={contextValue}>
          {this.props.children}
        </ModalContext.Provider>

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
