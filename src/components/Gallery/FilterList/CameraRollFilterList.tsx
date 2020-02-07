import { NetworkStatus } from "apollo-client";
import { uniqBy } from "lodash";
import * as React from "react";
import { useQuery } from "react-apollo";
import { RESULTS } from "react-native-permissions";
import CAMERA_ROLL_QUERY from "../../../lib/CameraRollQuery.local.graphql";
import { ScrollDirection } from "../../FastList";
import {
  buildValue,
  GalleryFilterListComponent,
  getPaginatedLimit
} from "../GalleryFilterList";
import { GalleryValue } from "../GallerySection";
import MediaPlayer from "../../MediaPlayer";
import { CameraRollAssetTypeSwitcher } from "../SegmentFilterControl";
import {
  SQUARE_ITEM_HEIGHT,
  VERTICAL_ITEM_HEIGHT,
  VERTICAL_ITEM_WIDTH
} from "../sizes";
import { View } from "react-native";
import { photosAuthorizationStatus } from "../../../lib/Yeet";

export const CameraRollFilterList = ({
  query = "",
  isFocused,
  offset,
  scrollY,
  isModal,
  defaultAssetType = "all",
  ...otherProps
}) => {
  const ref = React.useRef<GalleryFilterListComponent>(null);
  const [assetType, setAssetType] = React.useState(defaultAssetType);
  const [album, setAlbum] = React.useState(null);

  let columnCount = 3;
  let height = SQUARE_ITEM_HEIGHT;
  let width = SQUARE_ITEM_HEIGHT;

  if (assetType === "videos") {
    columnCount = 3;
    height = VERTICAL_ITEM_HEIGHT;
    width = VERTICAL_ITEM_WIDTH;
  }

  const photosQuery = useQuery(CAMERA_ROLL_QUERY, {
    skip: photosAuthorizationStatus() !== RESULTS.GRANTED,
    variables: {
      assetType,
      width,
      height,
      contentMode: "aspectFill",
      album: album ? album.id : undefined,

      first: getPaginatedLimit(columnCount, height) * 2
    },
    returnPartialData: true,
    partialRefetch: false,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only"
  });

  const handleChangeAlbum = React.useCallback(
    album => {
      setAlbum(album);
      setAssetType("all");
    },
    [
      setAlbum,
      setAssetType,
      photosQuery,
      width,
      height,
      columnCount,
      height,
      getPaginatedLimit
    ]
  );

  // const onVisibleItemsChange = React.useCallback(
  //   items => {
  //     const oldestItem = maxBy(items, "image.timestamp");
  //     if (oldestItem) {
  //       const newDate = new Date(oldestItem.image.timestamp);
  //       const isDifferent = !_lastVisibleDate.current
  //         ? true
  //         : !isSameDay(_lastVisibleDate.current, newDate);
  //       if (isDifferent) {
  //         setVisibleDate(newDate);
  //         _lastVisibleDate.current = newDate;
  //       }
  //     } else if (_lastVisibleDate.current) {
  //       _lastVisibleDate.current = null;
  //       setVisibleDate(null);
  //     }
  //   },
  //   [maxBy, first, switcherRef, setVisibleDate, _lastVisibleDate]
  // );

  React.useEffect(() => {
    const sessionId = photosQuery?.data?.cameraRoll?.sessionId;

    if (sessionId) {
      return () => {
        global.MediaPlayerViewManager?.stopAlbumSession(
          photosQuery?.data?.cameraRoll?.sessionId
        );
      };
    }
  }, [photosQuery?.data?.cameraRoll?.sessionId]);

  const data: Array<GalleryValue> = React.useMemo(() => {
    const data = photosQuery?.data?.cameraRoll?.data ?? [];

    return buildValue(data);
  }, [
    photosQuery?.data?.cameraRoll?.id,
    photosQuery?.data?.cameraRoll?.data,
    assetType,
    photosQuery?.data?.cameraRoll?.sessionId
  ]);

  const handleEndReached = React.useCallback(
    args => {
      const { networkStatus, loading } = photosQuery;

      if (loading === true) {
        return;
      }

      const { direction } = args?.nativeEvent ?? {};

      if (
        !(
          (photosQuery?.data?.cameraRoll?.page_info?.has_next_page ?? false) &&
          networkStatus !== NetworkStatus.fetchMore &&
          typeof photosQuery?.fetchMore === "function"
        )
      ) {
        return;
      }

      if (
        direction === ScrollDirection.up ||
        direction === ScrollDirection.neutral
      ) {
        return;
      }

      let offset =
        photosQuery?.data?.cameraRoll?.page_info?.offset +
        photosQuery?.data?.cameraRoll?.page_info?.limit;

      return photosQuery.fetchMore({
        variables: {
          // after: photosQuery.data.cameraRoll.page_info.end_cursor,
          offset: offset,
          assetType,
          width,
          height,
          cache: true,
          first: getPaginatedLimit(columnCount, height)
        },

        updateQuery: (
          previousResult,
          { fetchMoreResult }: { fetchMoreResult }
        ) => {
          return {
            ...fetchMoreResult,
            cameraRoll: {
              ...fetchMoreResult.cameraRoll,
              data: uniqBy(
                previousResult.cameraRoll.data.concat(
                  fetchMoreResult.cameraRoll.data
                ),
                "id"
              )
            }
          };
        }
      });
    },
    [
      assetType,
      photosQuery?.networkStatus,
      photosQuery?.fetchMore,
      photosQuery?.data,
      width,
      height,
      columnCount,
      getPaginatedLimit,
      photosQuery?.data?.cameraRoll?.page_info?.has_next_page,
      photosQuery.data?.cameraRoll?.page_info?.end_cursor,
      photosQuery.data?.cameraRoll?.page_info?.offset
    ]
  );

  React.useEffect(() => {
    return () => {
      window.requestIdleCallback(() => MediaPlayer.stopCachingAll());
    };
  }, []);

  const _setAssetType = React.useCallback(
    assetType => {
      setAssetType(assetType);
    },
    [setAssetType]
  );

  return (
    <GalleryFilterListComponent
      {...otherProps}
      data={data}
      onRefresh={photosQuery?.refetch}
      isFocused={isFocused}
      ref={ref}
      listKey={assetType}
      offset={offset}
      scrollY={scrollY}
      paused
      // onVisibleItemsChange={onVisibleItemsChange}
      numColumns={columnCount}
      itemHeight={height}
      paused={!isFocused}
      itemWidth={width}
      isModal={isModal}
      onEndReached={handleEndReached}
      networkStatus={photosQuery.networkStatus}
      hasNextPage={
        photosQuery?.data?.cameraRoll?.page_info?.has_next_page ?? false
      }
    >
      <CameraRollAssetTypeSwitcher
        isModal={isModal}
        // visibleDate={visibleDate}
        assetType={assetType}
        onChangeAlbum={handleChangeAlbum}
        album={album}
        setAssetType={_setAssetType}
      />
    </GalleryFilterListComponent>
  );
};
