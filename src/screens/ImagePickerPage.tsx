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
  const isFocused = useIsFocused();
  const [isFinishedAnimating, setFinishedAnimating] = React.useState(
    !isFocused
  );

  React.useLayoutEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setFinishedAnimating(true);
    });

    return () => task.cancel();
  }, [setFinishedAnimating]);

  const onChange = React.useCallback(
    ({ photo, post }) => {
      navigation.navigate("NewPost", {
        image: cloneDeep(photo),
        post: cloneDeep(post)
      });
    },
    [navigation]
  );

  return (
    <GalleryContainer
      {...props}
      navigation={navigation}
      height={SCREEN_DIMENSIONS.height}
      width={SCREEN_DIMENSIONS.width - left - right}
      showStart={isFinishedAnimating}
      isFocused={isFocused}
      isFinishedAnimating={isFinishedAnimating}
      onChange={onChange}
    />
  );
};

export default ImagePickerPage;
