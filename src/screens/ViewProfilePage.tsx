import * as React from "react";
import { View } from "react-native";
import { UserContext } from "../components/UserContext";
import { ViewProfile } from "../components/ViewProfile/ViewProfile";
import { BottomTabBar, TAB_BAR_HEIGHT } from "../components/BottomTabBar";
import {
  HEADER_HEIGHT,
  COUNTER_HEIGHT
} from "../components/ViewProfile/ViewProfileHeader";
import { useNavigationParam, useNavigation } from "react-navigation-hooks";
import { useBackButtonBehavior } from "../components/Button";

export const ViewProfilePage = () => {
  const profileId = useNavigationParam("profileId");
  const backButtonBehavior = useBackButtonBehavior();

  return (
    <View style={{ flex: 1, backgroundColor: "#111" }}>
      <ViewProfile
        profileId={profileId}
        backButtonBehavior={backButtonBehavior}
        contentOffset={{
          y: 0,
          x: 0
        }}
        contentInset={{
          bottom: COUNTER_HEIGHT,
          top: 0
        }}
      />
    </View>
  );
};

export default ViewProfilePage;
