import { cloneDeep, isArray } from "lodash";
import memoizee from "memoizee";
import * as React from "react";
import {
  StyleSheet,
  View,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SafeAreaContext } from "react-native-safe-area-context";
import {
  useIsFocused,
  useNavigation,
  useNavigationParam,
  useRoute
} from "@react-navigation/core";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../config";
import { GalleryHeader } from "../components/Gallery/GalleryHeader";
import { GallerySectionList } from "../components/Gallery/GallerySectionList";
import { DEFAULT_TABS } from "../components/Gallery/GalleryTabView";
import { ImagePickerSearch } from "../components/Gallery/ImagePickerSearch";
import { FilterBarRow } from "../components/NewPost/ImagePicker/FilterBarRow";
import {
  GallerySectionItem,
  ICONS
} from "../components/NewPost/ImagePicker/GallerySectionItem";
import { YeetImageContainer } from "../lib/imageSearch";
import Storage from "../lib/Storage";
import { sendLightFeedback } from "../lib/Vibration";
import { SearchTagList } from "../components/Search/SearchTagList";
import { COLORS, SPACING } from "../lib/styles";
import GallerySearchInputContainer from "../components/Gallery/GallerySearchInputContainer";

export const getSelectedIDs = memoizee((images: Array<YeetImageContainer>) => {
  return images.map(image => image.id);
});

export const ImagePickerSearchPage = props => {
  const navigation = useNavigation();
  const { onSearch, onFinish, blockId } = useRoute().params;
  const { top, left, right } = React.useContext(SafeAreaContext);
  const isFocused = useIsFocused();

  const _onSearch = React.useCallback(
    (query: string) => {
      onSearch(query);
      navigation.navigate("ImagePicker");
    },
    [navigation, onSearch, onFinish]
  );

  return (
    <GallerySearchInputContainer
      {...props}
      navigation={navigation}
      blockId={blockId}
      onSearch={_onSearch}
      goBack={onFinish}
      height={SCREEN_DIMENSIONS.height}
      width={SCREEN_DIMENSIONS.width - left - right}
      isFocused={isFocused}
    />
  );
};

export default ImagePickerSearchPage;
