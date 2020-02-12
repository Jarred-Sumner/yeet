import { StyleSheet } from "react-native";
import { TOP_Y } from "../../../config";
import { COLORS, SPACING } from "../../lib/styles";
import { LIST_HEADER_HEIGHT } from "../NewPost/ImagePicker/LIGHT_LIST_HEADER_HEIGHT";
import { TOP_HEADER } from "./StartFromHeader";

export const MEME_HEADER_HEIGHT = TOP_HEADER + TOP_Y;

export const styles = StyleSheet.create({
  searchContainer: {
    backgroundColor: COLORS.primaryDark,
    flex: 1,

    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden"
  },
  container: {
    // backgroundColor: COLORS.primaryDark
    flex: 1
  },
  page: {
    flex: 1
  },
  hiddenContainer: {
    backgroundColor: COLORS.primaryDark,
    display: "none"
  },
  content: {
    flex: 1
  },
  memeHeader: {
    height: MEME_HEADER_HEIGHT,
    backgroundColor: COLORS.primaryDark,
    width: "100%",
    position: "relative",
    zIndex: 10
  },
  searchHeader: {
    shadowRadius: 2,
    overflow: "visible",
    paddingTop: SPACING.half,
    shadowOffset: {
      width: 1,
      height: 1
    },
    shadowOpacity: 0.25,
    shadowColor: "black"
  },

  input: {
    paddingVertical: SPACING.normal,
    flex: 1,
    alignItems: "center",
    flexDirection: "row"
  },

  searchSpacer: { height: LIST_HEADER_HEIGHT, width: 1, marginTop: TOP_Y },
  sectionFilterButton: {
    flexDirection: "row",
    justifyContent: "center",
    flex: 1
  },
  sectionFilter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  sectionFilterLabel: {
    fontSize: 17,
    marginRight: SPACING.half
  },
  footer: {
    height: LIST_HEADER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    width: "100%"
  }
});
