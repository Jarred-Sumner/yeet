import { IconPlus, IconCircleAdd } from "../Icon";
import { IconButton } from "../Button";
import { COLORS } from "../../lib/styles";
import { UserContext, AuthState } from "../UserContext";
import { View, StyleSheet } from "react-native";
import * as React from "react";
import { useNavigation } from "react-navigation-hooks";
import { RectButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { BlurView } from "../BlurView";
import { SemiBoldText } from "../Text";
import chroma from "chroma-js";

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

export const NewThreadButton = () => {
  const { requireAuthentication, authState } = React.useContext(UserContext);
  const navigation = useNavigation();

  const handlePress = React.useCallback(() => {
    if (authState === AuthState.guest) {
      requireAuthentication();
      return;
    }

    navigation.navigate("NewPostStack");
  }, [requireAuthentication, navigation, authState]);

  return (
    <RectButton onPress={handlePress}>
      <Animated.View style={styles.container}>
        <View style={styles.iconContainer}>
          <IconCircleAdd size={24} color="#fff" />
        </View>

        <View style={styles.text}>
          <SemiBoldText style={styles.label}>New post</SemiBoldText>
        </View>
      </Animated.View>
    </RectButton>
  );
};
