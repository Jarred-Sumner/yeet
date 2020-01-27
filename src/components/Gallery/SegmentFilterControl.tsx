import SegmentedControlIOS from "@react-native-community/segmented-control";
import * as React from "react";
import { SegmentedControlIOSProps, StyleSheet, View } from "react-native";
import { BOTTOM_Y, SCREEN_DIMENSIONS } from "../../../config";
import { SPACING } from "../../lib/styles";
import BlurView from "../BlurView";
import { capitalize } from "lodash";

const HEIGHT = 40;

const styles = StyleSheet.create({
  bottom: {
    position: "absolute",
    marginBottom: BOTTOM_Y / 2,
    bottom: 0,
    width: SCREEN_DIMENSIONS.width,
    left: 0,
    right: 0
  },
  flex: { flex: 1 },
  modalBottom: {
    position: "absolute",
    marginBottom: 0,
    bottom: SPACING.normal + BOTTOM_Y,
    width: SCREEN_DIMENSIONS.width,
    left: 0,
    right: 0
  },
  container: {
    width: SCREEN_DIMENSIONS.width - SPACING.normal * 2,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.75,
    shadowColor: "black",
    shadowRadius: 1,
    height: HEIGHT,
    marginHorizontal: SPACING.normal,
    marginVertical: SPACING.normal
  },

  modalContainer: {
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.75,
    shadowColor: "black",
    shadowRadius: 1,
    width: SCREEN_DIMENSIONS.width - SPACING.normal * 2,
    height: HEIGHT,
    marginHorizontal: SPACING.normal
  },
  blur: {
    width: SCREEN_DIMENSIONS.width - SPACING.normal * 2,
    height: HEIGHT,
    backgroundColor: "rgba(14, 14, 14, 0.25)",

    flex: 1,
    borderRadius: 8,
    overflow: "hidden"
  }
});

export enum CameraRollAssetType {
  all = "all",

  photos = "photos",
  videos = "videos"
}

const ORDER = ["All", "Photos", "Videos"];

const ORDER_MAPPER = {
  [CameraRollAssetType.all]: ORDER.indexOf("All"),
  [CameraRollAssetType.photos]: ORDER.indexOf("Photos"),
  [CameraRollAssetType.videos]: ORDER.indexOf("Videos")
};

export const CameraRollAssetTypeContext = React.createContext({
  assetType: "all",
  setAssetType: () => {}
});

export const CameraRollAssetTypeSwitcher = ({
  isModal = false,
  assetType,
  setAssetType
}) => {
  const handleChange = React.useCallback(
    (label: string) => {
      setAssetType(CameraRollAssetType[label.toLowerCase()]);
    },
    [setAssetType]
  );

  return (
    <SegmentFilterControl
      values={ORDER}
      onValueChange={handleChange}
      isModal={isModal}
      selectedIndex={ORDER_MAPPER[assetType]}
    />
  );
};

export enum MemeFilterType {
  recent = "recent",
  spicy = "spicy"
}

const MEME_FILTERS = ["Spicy", "Recent"];
export const MemeFilterControl = ({ isModal = false, value, onChange }) => {
  const handleChange = React.useCallback(
    (label: string) => {
      onChange(MemeFilterType[label.toLowerCase()]);
    },
    [onChange]
  );

  return (
    <SegmentFilterControl
      values={MEME_FILTERS}
      onValueChange={handleChange}
      isModal={isModal}
      selectedIndex={MEME_FILTERS.indexOf(capitalize(value))}
    />
  );
};

export const SegmentFilterControl = React.memo(
  ({
    values,
    selectedIndex,
    onValueChange,
    isModal
  }: SegmentedControlIOSProps & { isModal: boolean }) => {
    return (
      <View style={isModal ? styles.modalBottom : styles.bottom}>
        <View style={isModal ? styles.modalContainer : styles.container}>
          <BlurView blurType="dark" style={styles.blur} blurAmount={100}>
            <SegmentedControlIOS
              backgroundColor={"transparent"}
              textColor="white"
              selectedIndex={selectedIndex}
              values={values}
              style={styles.flex}
              onValueChange={onValueChange}
              tintColor={"rgba(90, 90, 90, 0.95)"}
            />
          </BlurView>
        </View>
      </View>
    );
  }
);
