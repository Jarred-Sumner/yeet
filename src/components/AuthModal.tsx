import * as React from "react";
import { View, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Modal } from "./Modal";
import { SPACING, COLORS } from "../lib/styles";
import { SemiBoldText, Text } from "./Text";
import { Button } from "./Button";

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

const AuthModalComponent = ({ onPressSignUp, onPressLogin }) => {
  return (
    <View style={authModalStyles.container}>
      <SemiBoldText
        style={[authModalStyles.title, authModalStyles.regularText]}
      >
        To continue, you need a {"\n"}
        <SemiBoldText style={authModalStyles.emphasisText}>
          yeet
        </SemiBoldText>{" "}
        account.
      </SemiBoldText>

      <Button onPress={onPressSignUp} style={authModalStyles.button}>
        Sign up with email
      </Button>

      <TouchableOpacity onPress={onPressLogin}>
        <View style={authModalStyles.loginContainer}>
          <Text
            style={[authModalStyles.loginText, authModalStyles.regularText]}
          >
            Already have an account?{" "}
            <SemiBoldText style={authModalStyles.emphasisText}>
              Login
            </SemiBoldText>
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const AuthModal = ({
  visible,
  onDismiss,
  onPressLogin,
  onPressSignUp
}) => {
  return (
    <Modal visible={visible} onDismiss={onDismiss}>
      <AuthModalComponent
        onPressLogin={onPressLogin}
        onPressSignUp={onPressSignUp}
      />
    </Modal>
  );
};

export default AuthModal;
