import { useIsFocused, useNavigation, useRoute } from "@react-navigation/core";
import * as React from "react";
import { InteractionManager } from "react-native";
import { SafeAreaContext } from "react-native-safe-area-context";
import { SCREEN_DIMENSIONS } from "../../config";
import GalleryContainer, {
  GalleryStep
} from "../components/Gallery/GalleryContainer";
import { cloneDeep } from "lodash";
import { GallerySectionItem } from "../components/NewPost/ImagePicker/GallerySectionItem";

export const ImagePickerPage = props => {
  const navigation = useNavigation();
  const galleryContainerRef = React.useRef();
  const { top, left, right } = React.useContext(SafeAreaContext);
  const {
    showStart = false,
    onChange: _onChange,
    initialRoute = GallerySectionItem.all,
    query = ""
  } = useRoute().params;

  let initialStep = GalleryStep.browse;

  if (initialRoute === GallerySectionItem.search) {
    initialStep = GalleryStep.searchInput;
  }

  const handleDismiss = React.useRef(null);

  const onChange = React.useCallback(
    ({ photo, post }) => {
      if (_onChange) {
        _onChange(cloneDeep(photo), cloneDeep(post));
        navigation.goBack();
      } else {
        navigation.navigate("Root", {
          screen: "FeedTab",
          params: {
            screen: "NewPostStack",
            params: {
              screen: "NewPost",
              params: {
                image: cloneDeep(photo),
                post: cloneDeep(post)
              }
            }
          }
        });
      }

      galleryContainerRef.current.dismiss();
    },

    [navigation, _onChange, galleryContainerRef]
  );

  const onDismiss = React.useCallback(() => {
    navigation.goBack();
  }, [navigation, handleDismiss]);

  return (
    <GalleryContainer
      {...props}
      height={SCREEN_DIMENSIONS.height}
      width={SCREEN_DIMENSIONS.width - left - right}
      isFocused
      ref={galleryContainerRef}
      showStart={showStart}
      offset={0}
      initialStep={initialStep}
      initialRoute={initialRoute}
      initialQuery={query}
      onChange={onChange}
      onDismiss={onDismiss}
    />
  );
};

export default ImagePickerPage;
