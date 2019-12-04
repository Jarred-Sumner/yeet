import * as React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Modal } from "./Modal";
import { SPACING, COLORS } from "../lib/styles";
import { SemiBoldText, Text } from "./Text";
import { Button } from "./Button";
import { IconNotification } from "./Icon";
import Storage from "../lib/Storage";
import OneSignal from "react-native-onesignal";
import { checkNotifications } from "react-native-permissions";

export const shouldShowPushNotificationModal = async (
  aggressive: boolean = true
) => {
  const { status } = await checkNotifications();

  if (status === "granted" || status === "blocked") {
    return false;
  }

  const hasDeclinedModal = await Storage.hasDismissedPushNotificationModal();

  if (hasDeclinedModal) {
    return false;
  }

  return true;
};

const authModalStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fcfcfc",
    borderTopLeftRadius: 4,
    width: "100%",
    borderTopRightRadius: 4,
    paddingTop: SPACING.double
  },
  button: {
    marginBottom: SPACING.normal
  },
  title: {
    fontSize: 27,
    marginHorizontal: SPACING.double,
    marginBottom: SPACING.double,
    textAlign: "center",
    alignSelf: "center"
  },
  emphasisText: {
    color: COLORS.primary
  },
  regularText: {
    color: "#333"
  },
  loginText: {
    fontSize: 18
  },
  loginContainer: {
    paddingVertical: SPACING.double,
    borderTopColor: "#eee",
    borderTopWidth: 1,
    marginTop: SPACING.normal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  }
});

const PushNotificationModalComponent = ({ onYes, onNo }) => {
  return (
    <View style={authModalStyles.container}>
      <SemiBoldText
        style={[authModalStyles.title, authModalStyles.regularText]}
      >
        Enable{"\n"}
        <SemiBoldText style={authModalStyles.emphasisText}>
          <IconNotification color="#888" size={24} /> pUsH nOtiFs
        </SemiBoldText>
        ?
      </SemiBoldText>

      <Button onPress={onYes} style={authModalStyles.button}>
        Allow notifications
      </Button>

      <TouchableOpacity onPress={onNo}>
        <View style={authModalStyles.loginContainer}>
          <Text
            style={[authModalStyles.loginText, authModalStyles.regularText]}
          >
            <SemiBoldText style={authModalStyles.emphasisText}>
              go away
            </SemiBoldText>
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const PushNotificationModal = ({ visible, onDismiss }) => {
  const handleYes = React.useCallback(() => {
    OneSignal.registerForPushNotifications();
    Storage.setDismissedPushNotificationModal(true);

    onDismiss();
  }, [onDismiss]);

  const handleNo = React.useCallback(() => {
    Storage.setDismissedPushNotificationModal(true);
    onDismiss();
  }, [onDismiss]);
  return (
    <Modal visible={visible} onPressBackdrop={onDismiss} onDismiss={handleNo}>
      <PushNotificationModalComponent onYes={handleYes} onNo={handleNo} />
    </Modal>
  );
};

export default PushNotificationModal;
