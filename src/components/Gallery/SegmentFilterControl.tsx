import SegmentedControlIOS from "@react-native-community/segmented-control";
import * as React from "react";
import {
  SegmentedControlIOSProps,
  StyleSheet,
  View,
  LayoutAnimation
} from "react-native";
import { BOTTOM_Y, SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import { SPACING, COLORS } from "../../lib/styles";
import BlurView from "../BlurView";
import { capitalize } from "lodash";
import chroma from "chroma-js";
import { SemiBoldText, MediumText } from "../Text";
import { BaseButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import {
  ActionSheetOptions,
  useActionSheet
} from "@expo/react-native-action-sheet";

import { useLayout } from "react-native-hooks";
import { IconCircleArrowUp, IconChevronUp } from "../Icon";
import { sendSelectionFeedback } from "../../lib/Vibration";
import { format } from "date-fns/esm";
import { Timestamp, shortDateFormat } from "../Timestamp";
import { CAROUSEL_HEIGHT } from "../NewPost/NewPostFormat";
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
  dateLabel: {
    fontSize: 20,
    color: "white",
    textShadowRadius: 1,
    textShadowColor: "black",
    textAlign: "center",
    width: "100%"
  },
  date: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  flex: { flex: 1 },
  modalBottom: {
    position: "absolute",
    marginBottom: 0,
    bottom: BOTTOM_Y,
    width: SCREEN_DIMENSIONS.width,
    left: 0,
    right: 0,
    zIndex: 999
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
    flexDirection: "row",
    backgroundColor: "rgba(14, 14, 14, 0.25)",

    flex: 1,
    borderRadius: 8,
    overflow: "hidden"
  },
  modalBlur: {
    width: SCREEN_DIMENSIONS.width - SPACING.normal * 2,
    height: HEIGHT,
    flexDirection: "row",
    backgroundColor: chroma
      .blend(chroma(COLORS.primaryDark).alpha(0.55), "#333", "overlay")
      .alpha(0.25)
      .css(),

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
  onChangeAlbum,
  album,
  visibleDate,
  setAssetType
}) => {
  const handleChange = React.useCallback(
    (label: string) => {
      if (album && label === album?.title) {
        setAssetType(CameraRollAssetType.all);
      } else {
        setAssetType(CameraRollAssetType[label.toLowerCase()]);
      }
    },
    [setAssetType, album, onChangeAlbum]
  );

  const onPressActionSheet = React.useCallback(() => {
    const albums = global.MediaPlayerViewManager.getAlbums();
    const options = ["All"]
      .concat(
        albums.map(album =>
          album.count > 0 ? `${album.title} (${album.count})` : album.title
        )
      )
      .concat(["Cancel"]);
    const opts: ActionSheetOptions = {
      title: "Albums",
      options: options,
      cancelButtonIndex: options.length - 1
    };
    return [
      opts,
      index => {
        if (opts[index] !== "Cancel") {
          if (index === 0) {
            onChangeAlbum(null);
          } else {
            const album = albums[index - 1];
            if (album) {
              onChangeAlbum(album);
            }
          }
        }
      }
    ];
  }, [onChangeAlbum, album]);

  const values = React.useMemo(() => {
    if (!album?.title) {
      return ORDER;
    } else {
      return [album.title, ...ORDER.slice(1)];
    }
  }, [ORDER, album]);

  return (
    <SegmentFilterControl
      values={values}
      onValueChange={handleChange}
      isModal={isModal}
      actionSheetIndex={0}
      onPressActionSheet={onPressActionSheet}
      selectedIndex={ORDER_MAPPER[assetType]}
    >
      {visibleDate && (
        <View style={styles.date}>
          <Timestamp
            time={visibleDate}
            TextComponent={SemiBoldText}
            numberOfLines={1}
            formatter={shortDateFormat}
            style={styles.dateLabel}
          />
        </View>
      )}
    </SegmentFilterControl>
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

const segmentStyles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "space-evenly",
    height: HEIGHT,

    flexDirection: "row"
  },
  labelContainer: {
    flex: 1,
    paddingHorizontal: 0,
    height: HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row"
  },
  withChevron: {
    justifyContent: "space-between",
    height: HEIGHT,
    paddingLeft: 16
  },
  wrapper: {
    flex: 1
  },
  items: {
    height: HEIGHT,
    flex: 1,
    flexDirection: "row",
    zIndex: 10
  },
  itemsContainer: {
    height: HEIGHT,
    position: "relative",
    flex: 1,
    flexDirection: "row"
  },
  item: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    borderRightWidth: 1,
    height: HEIGHT,

    position: "relative",

    borderRightColor: "transparent"
  },
  notLastItem: {
    borderRightColor: chroma.blend("#444", COLORS.primary, "darken").css()
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    flexDirection: "row"
  },
  selectedBackground: {},
  label: {
    fontSize: 16,
    color: COLORS.white,
    flex: 1,
    textAlign: "center"
  },
  selectedLabel: {
    fontSize: 16,
    color: COLORS.white,
    flex: 1,
    paddingHorizontal: SPACING.half,
    textAlign: "center"
  },
  selectedContainer: {
    position: "absolute",
    opacity: 0.95,
    top: 0,
    bottom: 0
  },
  selectedContent: {
    flex: 1,
    height: "100%",
    borderRadius: 0,
    overflow: "hidden"
  },
  menu: {},
  menuItem: {},
  chevron: {
    marginRight: SPACING.half,
    flex: 0,

    justifyContent: "center"
  }
});

const CustomSegmentItem = ({
  isSelected,
  isLast,
  item,
  onLayout,
  onChange,
  onPress: _onPress
}) => {
  const onPress = React.useCallback(() => {
    onChange(item);
    if (!isSelected) {
      sendSelectionFeedback();
      LayoutAnimation.configureNext({
        duration: 150,

        ...LayoutAnimation.Presets.linear,
        create: {
          duration: 150,
          ...LayoutAnimation.Presets.linear.create
        },
        update: {
          ...LayoutAnimation.Presets.linear.update,
          duration: 150
        },
        delete: {
          ...LayoutAnimation.Presets.linear.delete,
          duration: 150
        }
      });
    } else if (_onPress) {
      _onPress();
    }
  }, [onChange, item, isSelected, _onPress]);
  const containerStyle = React.useMemo(() => {
    return !isLast
      ? [
          segmentStyles.item,
          _onPress && segmentStyles.withChevron,
          segmentStyles.notLastItem
        ]
      : [segmentStyles.item, _onPress && segmentStyles.withChevron];
  }, [segmentStyles, isLast, _onPress]);

  return (
    <BaseButton style={segmentStyles.button} onPress={onPress}>
      <Animated.View onLayout={onLayout} style={containerStyle}>
        <View style={segmentStyles.labelContainer}>
          <MediumText
            adjustsFontSizeToFit
            numberOfLines={1}
            style={
              isSelected ? segmentStyles.selectedLabel : segmentStyles.label
            }
          >
            {item}
          </MediumText>
        </View>

        {_onPress && (
          <View width={16} style={segmentStyles.chevron}>
            <IconChevronUp color="white" size={6} />
          </View>
        )}
      </Animated.View>
    </BaseButton>
  );
};
const CustomSegmentControl = ({
  values,
  selectedIndex,
  tintColor,
  actionSheetIndex = -1,
  onPressActionSheet,
  onValueChange
}) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const [width, setWidth] = React.useState(0);
  const onLayout = React.useCallback(
    ({
      nativeEvent: {
        layout: { width, x }
      }
    }) => setWidth(width + x),
    [setWidth]
  );

  const handleOpenActionSheet = React.useCallback(() => {
    onPressActionSheet && showActionSheetWithOptions(...onPressActionSheet());
  }, [onPressActionSheet, showActionSheetWithOptions]);

  const renderItem = React.useCallback(
    (item, index) => {
      return (
        <CustomSegmentItem
          item={item}
          onLayout={onLayout}
          isLast={index === values.length - 1}
          isSelected={selectedIndex === index}
          onChange={onValueChange}
          key={index}
          onPress={
            actionSheetIndex === index && onPressActionSheet
              ? handleOpenActionSheet
              : undefined
          }
        />
      );
    },
    [
      onLayout,
      selectedIndex,
      onValueChange,
      values.length,
      onPressActionSheet,
      actionSheetIndex,
      handleOpenActionSheet
    ]
  );

  const selectedContainerStyle = React.useMemo(
    () => [
      {
        width: width,
        height: HEIGHT,
        left: width * selectedIndex
      },
      segmentStyles.selectedContainer
    ],
    [segmentStyles.selectedContainer, width, selectedIndex]
  );

  const selectedContentStyle = React.useMemo(
    () => [
      segmentStyles.selectedContent,
      {
        backgroundColor: tintColor
      }
    ],
    [segmentStyles.selectedContent, tintColor]
  );

  return (
    <BlurView blurType="dark" blurAmount={100} style={styles.blur}>
      <View style={segmentStyles.itemsContainer}>
        <View style={selectedContainerStyle}>
          <View style={selectedContentStyle} />
        </View>
        <View style={segmentStyles.items}>{values.map(renderItem)}</View>
      </View>
    </BlurView>
  );
};

export const SegmentFilterControl = React.memo(
  ({
    values,
    selectedIndex,
    onValueChange,
    isModal,
    children,
    onPressActionSheet,
    actionSheetIndex = -1
  }: SegmentedControlIOSProps & { isModal: boolean }) => {
    return (
      <View style={isModal ? styles.modalBottom : styles.bottom}>
        {children}

        <View style={isModal ? styles.modalContainer : styles.container}>
          <CustomSegmentControl
            backgroundColor={"transparent"}
            textColor="white"
            selectedIndex={selectedIndex}
            values={values}
            style={styles.flex}
            onValueChange={onValueChange}
            onPressActionSheet={onPressActionSheet}
            actionSheetIndex={actionSheetIndex}
            tintColor={chroma
              .blend(chroma(COLORS.primaryDark).alpha(0.55), "#fff", "overlay")
              .alpha(0.25)
              .css()}
          />
          {/* <SegmentedControlIOS
              backgroundColor={"transparent"}
              textColor="white"
              selectedIndex={selectedIndex}
              values={values}
              style={styles.flex}
              onValueChange={onValueChange}
              tintColor={"rgba(90, 90, 90, 0.95)"}
            /> */}
        </View>
      </View>
    );
  }
);
