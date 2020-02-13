import { useIsFocused, useNavigation, useRoute } from "@react-navigation/core";
import * as React from "react";
import { InteractionManager } from "react-native";
import { SafeAreaContext } from "react-native-safe-area-context";
import { SCREEN_DIMENSIONS } from "../../config";
import GalleryContainer from "../components/Gallery/GalleryContainer";
import { cloneDeep } from "lodash";

export const ImagePickerPage = props => {
  const navigation = useNavigation();
  const { top, left, right } = React.useContext(SafeAreaContext);

  const onChange = React.useCallback(
    ({ photo, post }) => {
      navigation.navigate("FeedTab", {
        screen: "NewPostStack",
        params: {
          screen: "NewPost",
          params: {
            image: cloneDeep(photo),
            post: cloneDeep(post)
          }
        }
      });
    },

    [navigation]
  );

  const onDismiss = React.useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <GalleryContainer
      {...props}
      height={SCREEN_DIMENSIONS.height}
      width={SCREEN_DIMENSIONS.width - left - right}
      showStart
      isFocused
      offset={0}
      onChange={onChange}
      onDismiss={onDismiss}
    />
  );
};

export default ImagePickerPage;
