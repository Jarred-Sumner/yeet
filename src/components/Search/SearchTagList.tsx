import { findAll as findWordsToHighlight } from "highlight-words-core";
import { get, isArray } from "lodash";
import matchSorter from "match-sorter";
import * as React from "react";
import { useQuery } from "react-apollo";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  View
} from "react-native";
import {
  BaseButton,
  BorderlessButton,
  ScrollView
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SCREEN_DIMENSIONS } from "../../../config";
import { fetchWith } from "../../lib/graphql";
import { SearchTags } from "../../lib/graphql/SearchTags";
import { TrendingSearchTags } from "../../lib/graphql/TrendingSearchTags";
import { ImageMimeType } from "../../lib/imageSearch";
import TAGS_QUERY from "../../lib/SearchTags.graphql";
import { COLORS, SPACING } from "../../lib/styles";
import TRENDING_TAGS_QUERY from "../../lib/TrendingSearchTags.graphql";
import { COLUMN_COUNT, COLUMN_GAP } from "../Gallery/COLUMN_COUNT";
import { SQUARE_ITEM_HEIGHT, SQUARE_ITEM_WIDTH } from "../Gallery/sizes";
import { IconChevronRight, IconSearch } from "../Icon";
import Image from "../Image";
import { Text } from "../Text";
import {
  SearchHashtagVariables,
  SearchHashtag
} from "../../lib/graphql/SearchHashtag";
import SEARCH_HASHTAG_QUERY from "../../lib/SearchHashtag.graphql";
import GalleryItem from "../Gallery/GalleryItem";
import { postToCell } from "../Gallery/GalleryFilterList";
import { PanSheetContext } from "../Gallery/PanSheetView";
import { PanSheetViewSize } from "../../lib/Yeet";

const styles = StyleSheet.create({
  activeSearchTagButton: {
    flex: 0,
    display: "flex"
  },
  previewImage: {
    width: SQUARE_ITEM_WIDTH,
    height: SQUARE_ITEM_HEIGHT
  },
  previewImageContainer: {
    width: SQUARE_ITEM_WIDTH,
    height: SQUARE_ITEM_HEIGHT,
    position: "relative"
  },
  spinner: {
    position: "absolute",
    zIndex: -1,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  },
  disabledSearchTagButton: {
    flex: 0,
    display: "none"
  },
  searchTagLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  resultsList: { flexDirection: "row" },
  hashTag: {
    color: COLORS.mutedLabel
  },
  hidden: { display: "none" },
  searchTagRight: { flexDirection: "row", alignItems: "center" },
  searchTagItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.normal
  },
  searchIcon: {
    marginLeft: SPACING.half
  },
  searchIconLeft: {
    paddingRight: SPACING.half
  },
  usernameContainer: {
    position: "absolute",
    bottom: 0,
    left: 0
  },
  username: {
    color: COLORS.mutedLabel,
    fontSize: 16,
    padding: 4,
    textShadowColor: "black",
    textShadowRadius: 1,
    textShadowOffset: {
      width: 1,
      height: 1
    }
  },
  previewGap: {
    width: COLUMN_GAP,
    height: SQUARE_ITEM_HEIGHT,
    backgroundColor: COLORS.primaryDark
  },
  highlight: {
    color: "white"
  },
  searchTagLabel: {
    flex: 0,
    alignItems: "center",
    paddingVertical: SPACING.normal,
    fontSize: 16,
    color: COLORS.mutedLabel
  },
  container: {
    flex: 1
  },
  contentContainer: {
    flexGrow: 1
  },
  list: {
    flex: 0
  }
});

const SearchPreview = ({ query, onPressResult }) => {
  const width = SQUARE_ITEM_WIDTH;
  const limit = COLUMN_COUNT;
  const height = SQUARE_ITEM_HEIGHT;

  const hashTagQuery = useQuery<SearchHashtag, SearchHashtagVariables>(
    SEARCH_HASHTAG_QUERY,
    {
      fetchPolicy: "cache-first",
      variables: {
        limit,
        offset: 0,
        hashtag: query
      }
    }
  );

  const results = hashTagQuery?.data?.searchHashtag?.data ?? [];

  return (
    <View
      width={SCREEN_DIMENSIONS.width}
      height={height}
      style={styles.resultsList}
    >
      {results[0] ? (
        <GalleryItem
          {...postToCell(results[0])}
          onPress={onPressResult}
          width={width}
          height={height}
          username={results[0].profile.username}
        />
      ) : (
        <View width={width} height={height} />
      )}

      {results[1] && <View style={styles.previewGap} />}
      {results[1] ? (
        <GalleryItem
          {...postToCell(results[1])}
          onPress={onPressResult}
          width={width}
          height={height}
          username={results[1].profile.username}
        />
      ) : (
        <View width={width} height={height} />
      )}

      {results[2] && <View style={styles.previewGap} />}

      {results[2] ? (
        <GalleryItem
          {...postToCell(results[2])}
          onPress={onPressResult}
          width={width}
          height={height}
          username={results[2].profile.username}
        />
      ) : (
        <View width={width} height={height} />
      )}
    </View>
  );
};

const SearchTagListItem = React.memo(
  ({
    result = "",
    onPress,
    onPressResult,
    query,
    showArrow: _showArrow,
    skipNetwork
  }: {
    result: string;
    onPress: Function;
    query: string;
    showArrow: boolean;
  }) => {
    const handlePress = React.useCallback(() => onPress && onPress(result), [
      onPress,
      result
    ]);

    const nodes = React.useMemo(() => {
      if (!result) {
        return [];
      }

      if (result.toLowerCase() === query.toLowerCase()) {
        return <Text style={styles.highlight}>{result}</Text>;
      }

      return findWordsToHighlight({
        searchWords: query.split(""),
        textToHighlight: result,
        caseSensitive: false
      }).map(chunk => {
        const { end, highlight, start } = chunk;
        const text = result.substr(start, end - start);
        if (highlight) {
          return (
            <Text key={`${start}-${highlight}-${end}`} style={styles.highlight}>
              {text}
            </Text>
          );
        } else {
          return text;
        }
      });
    }, [result, query, findWordsToHighlight]);

    return (
      <View>
        <BorderlessButton
          style={
            result.length > 0
              ? styles.activeSearchTagButton
              : styles.disabledSearchTagButton
          }
          enabled={result.length > 0}
          onPress={handlePress}
        >
          <Animated.View style={styles.searchTagItem}>
            {skipNetwork && (
              <IconSearch
                size={14}
                color={COLORS.mutedLabel}
                style={styles.searchIconLeft}
              />
            )}

            <View style={styles.searchTagLeft}>
              <Text numberOfLines={1} style={styles.searchTagLabel}>
                {!skipNetwork && <Text style={styles.hashTag}>#</Text>}

                {nodes}
              </Text>

              <IconChevronRight
                size={14}
                style={styles.searchIcon}
                color={COLORS.mutedLabel}
              />
            </View>
          </Animated.View>
        </BorderlessButton>

        {!skipNetwork && (
          <SearchPreview query={result} onPressResult={onPressResult} />
        )}
      </View>
    );
  }
);

const SearchTagListComponent = ({
  results,
  onPress,
  query,
  hasMatches,
  waitFor,
  simultaneousHandlers,
  onPressResult
}) => {
  const { setActiveScrollView, setSize } = React.useContext(PanSheetContext);
  const scrollRef = React.useRef<ScrollView>();

  React.useLayoutEffect(() => {
    const scrollView = scrollRef.current;

    if (scrollView) {
      setActiveScrollView(scrollView);
    }

    setSize(PanSheetViewSize.tall);
  }, [setActiveScrollView, setSize, scrollRef]);

  return (
    <KeyboardAvoidingView behavior="height" style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        automaticallyAdjustContentInsets
        style={styles.list}
        keyboardDismissMode="on-drag"
        alwaysBounceVertical={false}
        ref={scrollRef}
        waitFor={waitFor}
        simultaneousHandlers={simultaneousHandlers}
        directionalLockEnabled
      >
        <SearchTagListItem
          query={query}
          result={results[0]}
          onPress={onPress}
          onPressResult={onPressResult}
          skipNetwork={!hasMatches}
        />
        <SearchTagListItem
          query={query}
          result={results[1]}
          onPress={onPress}
          onPressResult={onPressResult}
        />
        <SearchTagListItem
          query={query}
          result={results[2]}
          onPress={onPress}
          onPressResult={onPressResult}
        />
        <SearchTagListItem
          query={query}
          result={results[3]}
          onPress={onPress}
          onPressResult={onPressResult}
        />
        <SearchTagListItem
          query={query}
          result={results[4]}
          onPress={onPress}
          onPressResult={onPressResult}
        />
        <SearchTagListItem
          query={query}
          result={results[5]}
          onPress={onPress}
          onPressResult={onPressResult}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const SearchTagList = ({
  query = "",
  onPressTag,
  onPressResult,
  waitFor,
  simultaneousHandlers
}) => {
  const tagsQuery = useQuery<SearchTags>(TAGS_QUERY, {
    fetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true
  });

  const trendingTags = useQuery<TrendingSearchTags>(TRENDING_TAGS_QUERY, {
    fetchPolicy: "cache-first"
  });

  const hasMatches = React.useRef(false);
  const results = React.useMemo(() => {
    const showTrending =
      query.trim().length === 0 ||
      (tagsQuery?.data?.searchTags || []).length === 0;
    let list: [String] = [];

    if (showTrending) {
      list = trendingTags?.data?.trendingSearchTags ?? [];
    } else if (tagsQuery?.data?.searchTags) {
      list = matchSorter(
        tagsQuery?.data?.searchTags,
        query.replace("#", "").trim()
      );
    } else {
      list = [];
    }

    const matchingItem = list.findIndex(
      item => item.toLowerCase() === query.toLowerCase()
    );

    hasMatches.current = list.length > 0;

    if (list.length === 0 && query.trim().length > 0) {
      return [query];
    } else {
      return list;
    }
  }, [trendingTags?.data, query, tagsQuery?.data?.searchTags]);

  return (
    <SearchTagListComponent
      query={query}
      results={results}
      hasMatches={hasMatches.current}
      onPress={onPressTag}
      waitFor={waitFor}
      simultaneousHandlers={simultaneousHandlers}
      onPressResult={onPressResult}
    />
  );
};
