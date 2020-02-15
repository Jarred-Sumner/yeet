import { useNavigation } from "@react-navigation/core";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import {
  RectButton,
  TouchableWithoutFeedback
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { COLORS } from "../../lib/styles";
import { IconCircleAdd } from "../Icon";
import { SemiBoldText } from "../Text";
import { AuthState, UserContext } from "../UserContext";

const styles = StyleSheet.create({
  text: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  label: {
    fontSize: 17,
    flex: 1,
    textAlign: "center",
    paddingRight: 32,
    alignSelf: "center",
    justifyContent: "center"
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    paddingVertical: 14,
    borderRadius: 32,
    width: 190,
    backgroundColor: COLORS.primary
  },
  iconContainer: {
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  }
});

export const NewThreadButton = ({ onPress }) => {
  const { requireAuthentication, authState } = React.useContext(UserContext);
  // const { openImagePickerModal } = React.useContext(ModalContext);
  const navigation = useNavigation();

  const handlePress = React.useCallback(() => {
    if (authState === AuthState.guest) {
      requireAuthentication();
      return;
    }
    navigation.navigate("ImagePicker", { showStart: true });
  }, [requireAuthentication, authState, navigation]);

  return (
    <TouchableWithoutFeedback onPressOut={handlePress}>
      <Animated.View style={styles.container}>
        <View style={styles.iconContainer}>
          <IconCircleAdd size={24} color="#fff" />
        </View>

        <View style={styles.text}>
          <SemiBoldText style={styles.label}>New post</SemiBoldText>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
