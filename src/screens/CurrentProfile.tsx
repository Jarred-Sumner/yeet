import * as React from "react";
import { View } from "react-native";
import { UserContext } from "../components/UserContext";
import { ViewProfile } from "../components/ViewProfile/ViewProfile";
import { BottomTabBar, TAB_BAR_HEIGHT } from "../components/BottomTabBar";
import {
  HEADER_HEIGHT,
  COUNTER_HEIGHT
} from "../components/ViewProfile/ViewProfileHeader";

export const CurrentProfilePage = ({}) => {
  const { userId } = React.useContext(UserContext);

  return (
    <View style={{ flex: 1, backgroundColor: "#111" }}>
      <ViewProfile
        profileId={userId}
        contentOffset={{
          y: 0,
          x: 0
        }}
        contentInset={{
          bottom: TAB_BAR_HEIGHT + COUNTER_HEIGHT,
          top: 0
        }}
      />
      <BottomTabBar currentRoute="ProfileTab" />
    </View>
  );
};

export default CurrentProfilePage;
