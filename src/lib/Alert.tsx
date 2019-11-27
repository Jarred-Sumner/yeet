import { Alert as RNAlert } from "react-native";
export class Alert {
  static alert(title, message) {
    return RNAlert.alert(title, message);
  }

  static prompt({
    title,
    message,
    confirm = "Yes",
    cancel = "Cancel"
  }: {
    title: string;
    message: string;
    confirm: string;
    cancel: string;
  }) {
    return new Promise(resolve => {
      RNAlert.alert(
        title,
        message,
        [
          { text: confirm, onPress: () => resolve(true) },
          {
            text: cancel,
            onPress: () => resolve(false),
            style: "cancel"
          }
        ],
        { cancelable: false }
      );
    });
  }
}

export default Alert;
