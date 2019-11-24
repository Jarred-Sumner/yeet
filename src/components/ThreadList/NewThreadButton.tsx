import { IconPlus } from "../Icon";
import { IconButton } from "../Button";
import { COLORS } from "../../lib/styles";
import { UserContext, AuthState } from "../UserContext";
import * as React from "react";
import { useNavigation } from "react-navigation-hooks";

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
    <IconButton
      type="fill"
      Icon={IconPlus}
      color="white"
      onPress={handlePress}
      backgroundColor={COLORS.secondary}
      size={30}
      containerSize={54}
    />
  );
};
