import * as React from "react";
import { View, StyleSheet, KeyboardAvoidingView } from "react-native";
import { ScrollView, BorderlessButton } from "react-native-gesture-handler";
import { useQuery } from "react-apollo";
import TAGS_QUERY from "../../lib/SearchTags.graphql";
import TRENDING_TAGS_QUERY from "../../lib/TrendingSearchTags.graphql";
import { SearchTags } from "../../lib/graphql/SearchTags";
import { TrendingSearchTags } from "../../lib/graphql/TrendingSearchTags";
import { MediumText, SemiBoldText } from "../Text";
import { SPACING, COLORS } from "../../lib/styles";
import { IconSearch, IconChevronRight } from "../Icon";
import { findAll as findWordsToHighlight } from "highlight-words-core";
import Animated from "react-native-reanimated";
import chroma from "chroma-js";

const Fuse = require("fuse.js");

const styles = StyleSheet.create({
  activeSearchTagButton: {
    flex: 0,
    display: "flex"
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
  hidden: { display: "none" },
  searchTagRight: { flexDirection: "row", alignItems: "center" },
  searchTagItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.normal
  },
  searchIcon: {
    marginRight: SPACING.half
  },
  highlight: {
    color: chroma
      .blend(chroma(COLORS.primary), "rgba(255, 255, 255, 0.5)", "burn")
      .alpha(1.0)
      .css()
  },
  searchTagLabel: {
    flex: 0,
    alignItems: "center",
    paddingVertical: SPACING.normal,
    fontSize: 16,
    color: "white"
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

const LIMIT = 10;

const SearchTagListItem = React.memo(
  ({
    result = "",
    onPress,
    query,
    showArrow: _showArrow
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

    const showArrow = _showArrow && query.length > 0;
    const nodes = React.useMemo(() => {
      if (!result) {
        return [];
      }

      if (result.toLowerCase() === query.toLowerCase()) {
        return <MediumText style={styles.highlight}>{result}</MediumText>;
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
            <MediumText
              key={`${start}-${highlight}-${end}`}
              style={styles.highlight}
            >
              {text}
            </MediumText>
          );
        } else {
          return text;
        }
      });
    }, [result, query, findWordsToHighlight]);

    return (
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
          <View style={styles.searchTagLeft}>
            <IconSearch size={14} style={styles.searchIcon} color="#ccc" />

            <MediumText numberOfLines={1} style={styles.searchTagLabel}>
              {nodes}
            </MediumText>
          </View>
          <View style={!showArrow ? styles.hidden : styles.searchTagRight}>
            <IconChevronRight size={14} color="#ccc" />
          </View>
        </Animated.View>
      </BorderlessButton>
    );
  }
);

const SearchTagListComponent = ({ results, onPress, query }) => {
  return (
    <KeyboardAvoidingView behavior="height" style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        automaticallyAdjustContentInsets
        style={styles.list}
        keyboardDismissMode="on-drag"
        alwaysBounceVertical={false}
      >
        <SearchTagListItem
          query={query}
          result={results[0]}
          onPress={onPress}
          showArrow={results.length === 1}
        />
        <SearchTagListItem
          query={query}
          result={results[1]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[2]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[3]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[4]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[5]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[6]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[7]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[8]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[9]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[10]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[11]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[12]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[12]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[13]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[14]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[15]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[16]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[17]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[18]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[19]}
          onPress={onPress}
        />
        <SearchTagListItem
          query={query}
          result={results[20]}
          onPress={onPress}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const SearchTagList = ({ query = "", onPressTag }) => {
  const tagsQuery = useQuery<SearchTags>(TAGS_QUERY, {
    fetchPolicy: "cache-first"
  });

  const trendingTags = useQuery<TrendingSearchTags>(TRENDING_TAGS_QUERY, {
    fetchPolicy: "cache-first"
  });

  const fuse = React.useMemo(() => {
    const tags = tagsQuery?.data?.searchTags ?? [];
    console.log({ tags });
    if (tags.length > 0) {
      return new Fuse(tags);
    } else {
      return null;
    }
  }, [tagsQuery?.data?.searchTags]);

  console.log(fuse, "FUSE!");

  const results = React.useMemo(() => {
    const showTrending =
      query.trim().length === 0 ||
      (tagsQuery?.data?.searchTags || []).length === 0;
    let list: [String] = [];

    if (showTrending) {
      list = trendingTags?.data?.trendingSearchTags ?? [];
    } else if (fuse) {
      list = fuse.search(query);
    } else {
      list = [];
    }

    console.log(list);
    const matchingItem = list.findIndex(
      item => item.toLowerCase() === query.toLowerCase()
    );

    if (matchingItem > -1) {
      return list;
    } else if (query.trim().length > 0) {
      return [query].concat(list);
    } else {
      return list;
    }
  }, [fuse, trendingTags?.data, query, fuse]);

  return (
    <SearchTagListComponent
      query={query}
      results={results}
      onPress={onPressTag}
    />
  );
};
