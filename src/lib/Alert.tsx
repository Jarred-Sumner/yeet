import { Alert as RNAlert } from "react-native";
export class Alert {
  static alert(title, message) {
    return RNAlert.alert(title, message);
  }
}

export default Alert;
