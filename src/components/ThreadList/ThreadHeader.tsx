import * as React from "react";

import { View, StyleSheet, ActivityIndicator } from "react-native";
import Animated, {
  TransitioningView,
  Transitioning,
  Transition
} from "react-native-reanimated";
import SafeAreaView from "react-native-safe-area-view";
import {
  BackButton,
  IconButton,
  useBackButtonBehavior,
  IconButtonEllipsis
} from "../Button";
import {
  Text,
  MediumText,
  SemiBoldText,
  LETTER_SPACING_MAPPING
} from "../Text";
import {
  IconEllipsis,
  IconClose,
  IconDownload,
  IconChevronLeft,
  IconCheck
} from "../Icon";
import { SPACING, COLORS } from "../../lib/styles";
import { TOP_Y, SCREEN_DIMENSIONS } from "../../../config";
import { BlurView } from "@react-native-community/blur";
import tinycolor from "tinycolor2";
import {
  MediaUploadContext,
  PostUploadTaskStatus
} from "../../lib/MediaUploadTask";
import { MediaUploadProgress } from "../MediaUploadProgress";
import {
  TouchableWithoutFeedback,
  BorderlessButton
} from "react-native-gesture-handler";
import { useFocusState } from "react-navigation-hooks";
import { CurrentUserAvatar } from "../Avatar";
import { UserContext } from "../UserContext";

export const THREAD_HEADER_HEIGHT = 34 + SPACING.normal;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: SPACING.normal,
    paddingTop: TOP_Y,
    zIndex: 1
  },
  blur: {
    backgroundColor: "rgba(0, 0, 0, 1.0)",
    opacity: 0.9
  },
  bar: {
    position: "absolute",
    top: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    left: 0,

    right: 0,
    zIndex: 0,
    height: THREAD_HEADER_HEIGHT + TOP_Y
  },
  nonBlurryBar: {
    backgroundColor: "black"
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarContainer: {
    marginRight: SPACING.half,
    marginLeft: -24 - SPACING.half
  },
  doneSection: {
    width: 100,
    marginLeft: -100
  },
  side: {
    flexDirection: "row",
    alignItems: "center",
    height: THREAD_HEADER_HEIGHT,
    overflow: "visible"
  },
  title: {
    marginTop: 4,
    color: "white",
    fontSize: 14,
    overflow: "visible",
    textAlign: "center"
  },
  bigTitle: {
    marginTop: 0,
    color: "white",
    overflow: "visible",
    fontSize: 18,
    letterSpacing: LETTER_SPACING_MAPPING["18"],
    textAlign: "center"
  },
  rightSide: {
    justifyContent: "flex-end",
    width: 44
  },
  username: {
    fontSize: 13,
    lineHeight: 13,
    color: COLORS.muted,
    textTransform: "uppercase",
    textAlign: "center"
  },
  titleSide: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    flex: 1
  },
  safe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%"
  },
  textButton: {
    paddingLeft: SPACING.normal,
    height: THREAD_HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  usernameTitle: {
    fontSize: 16,
    flexWrap: "nowrap",
    color: "white",
    marginTop: 0
  },
  usernameTitleContainer: {
    alignItems: "center",
    flexDirection: "row",
    height: 24
  },
  textButtonLabel: {
    color: COLORS.muted,
    fontSize: 18,
    textAlign: "center"
  },
  leftSide: {
    width: 44
  },
  uploadPending: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.half,
    minWidth: 45,
    justifyContent: "flex-end",
    height: THREAD_HEADER_HEIGHT
  },
  uploadPendingText: {
    marginRight: SPACING.half
  },
  spinner: {
    marginRight: SPACING.half
  },
  down: {
    transform: [{ rotate: "270deg" }]
  },
  progress: {
    position: "absolute",
    top: THREAD_HEADER_HEIGHT + TOP_Y,
    left: 0,
    right: 0,
    zIndex: 0
  }
});

export const ThreadHeader = ({ thread, threadId }) => {
  const ref = React.useRef();

  const behavior = useBackButtonBehavior();

  const { postUploadTask, setPostUploadTask, status } = React.useContext(
    MediaUploadContext
  );

  const hasAutoExpanded = React.useRef(postUploadTask?.threadId === threadId);

  const [showPendingUploads, setShowPendingUploads] = React.useState(
    hasAutoExpanded.current
  );

  const transitionRef = React.useRef<TransitioningView>();

  const toggleShowPendingUploads = () => {
    setShowPendingUploads(!showPendingUploads);
    transitionRef.current.animateNextTransition();
  };

  const { isFocused } = useFocusState();

  const showExpandIcon =
    status !== PostUploadTaskStatus.waiting &&
    postUploadTask?.threadId === threadId;

  const autoDismissTimer = React.useRef(-1);

  React.useEffect(() => {
    if (postUploadTask?.isFinished && isFocused) {
      autoDismissTimer.current = window.setTimeout(() => {
        setPostUploadTask(null);
        setShowPendingUploads(false);

        autoDismissTimer.current = -1;
      }, 10000);
    } else if (
      status !== PostUploadTaskStatus.complete &&
      autoDismissTimer.current > -1
    ) {
      window.clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = -1;
    } else if (
      status !== PostUploadTaskStatus.complete &&
      !hasAutoExpanded.current
    ) {
      setShowPendingUploads(true);
    }
  }, [
    postUploadTask?.isFinished ?? false,
    showPendingUploads,
    setShowPendingUploads,
    status,
    autoDismissTimer,
    isFocused
  ]);

  React.useEffect(() => {
    return () => {
      if (autoDismissTimer.current > -1) {
        window.clearTimeout(autoDismissTimer.current);
      }
    };
  }, [autoDismissTimer]);

  return (
    <>
      <BlurView
        style={[styles.bar, styles.blur]}
        blurType="dark"
        blurAmount={12}
        viewRef={ref}
      />

      <View ref={ref} style={[styles.bar, styles.container]}>
        <View style={[styles.side, styles.leftSide]}>
          <BackButton behavior={behavior} size={16} />
        </View>

        <View style={[styles.side, styles.titleSide]}>
          <Text style={styles.username} numberOfLines={1}>
            @{thread?.profile?.username}
          </Text>
          <MediumText numberOfLines={1} style={styles.title}>
            {thread?.body || ""}
          </MediumText>
        </View>

        <View style={[styles.side, styles.rightSide]}>
          {showExpandIcon && (
            <TouchableWithoutFeedback onPress={toggleShowPendingUploads}>
              <Animated.View style={styles.uploadPending}>
                {!postUploadTask.isFinished && (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                    style={styles.spinner}
                  />
                )}
                <IconChevronLeft style={styles.down} size={16} color="#fff" />
              </Animated.View>
            </TouchableWithoutFeedback>
          )}
        </View>
      </View>

      <Transitioning.View
        ref={transitionRef}
        transition={
          <Transition.Together>
            <Transition.In interpolation="easeIn" type="fade" />
            <Transition.Change interpolation="easeIn" />
            <Transition.Out interpolation="easeOut" type="fade" />
          </Transition.Together>
        }
        pointerEvents={showPendingUploads ? "auto" : "none"}
        style={styles.progress}
      >
        {showPendingUploads && postUploadTask?.contentExport && (
          <MediaUploadProgress hideIcon />
        )}
      </Transitioning.View>
    </>
  );
};

export const NewThreadHeader = ({ onDone, onBack, buttonStyle, children }) => {
  const ref = React.useRef();

  const behavior = useBackButtonBehavior();
  const {
    currentUser: { username }
  } = React.useContext(UserContext);

  return (
    <View ref={ref} style={[styles.bar, styles.container, styles.nonBlurryBar]}>
      <View style={[styles.side, styles.leftSide]}>
        <BackButton onPress={onBack} behavior={behavior} size={16} />
      </View>

      <View style={[styles.side, styles.titleSide, styles.usernameContainer]}>
        <View style={styles.avatarContainer}>
          <CurrentUserAvatar size={24} />
        </View>
        <View style={styles.usernameTitleContainer}>
          <MediumText
            numberOfLines={1}
            adjustsFontSizeToFit
            suppressHighlighting
            lineBreakMode="tail"
            style={[styles.title, styles.usernameTitle]}
          >
            @{username}
          </MediumText>
        </View>
      </View>

      <View style={[styles.side, styles.rightSide, styles.doneSection]}>
        <BorderlessButton onPress={onDone}>
          <View style={styles.textButton}>
            <SemiBoldText style={[styles.textButtonLabel, buttonStyle]}>
              {children}
            </SemiBoldText>
          </View>
        </BorderlessButton>
      </View>
    </View>
  );
};

export const CommentEditorHeader = ({ onCancel }) => {
  const ref = React.useRef();

  const handlePressCancel = React.useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <>
      <BlurView
        style={[styles.bar, styles.blur]}
        blurType="dark"
        blurAmount={12}
        viewRef={ref}
      />

      <View ref={ref} style={[styles.bar, styles.container]}>
        <View style={[styles.side, styles.leftSide]}>
          {/* <IconButton
            type="shadow"
            Icon={IconClose}
            size={16}
            color="white"
            onPress={handlePressCancel}
          /> */}
        </View>

        <View style={[styles.side, styles.titleSide]}>
          <Text style={styles.username} numberOfLines={1}>
            Post a comment
          </Text>
          <MediumText numberOfLines={1} style={styles.title}>
            Write your comment
          </MediumText>
        </View>

        <View style={[styles.side, styles.rightSide]}>
          {/* <IconButtonEllipsis onPress={handlePressEllipsis} /> */}
        </View>
      </View>
    </>
  );
};
