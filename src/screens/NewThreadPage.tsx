import * as React from "react";
import { MaskedViewIOS, PixelRatio, StyleSheet, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useNavigation, useNavigationParam } from "react-navigation-hooks";
import { TOP_Y } from "../../config";
import { ProfileFeedComponent } from "../components/Feed/ProfileFeed";
import MediaPlayer, { MediaPlayerComponent } from "../components/MediaPlayer";
import { ScrollView } from "../components/ScrollView";
import { ShareFooter } from "../components/Share/ShareFooter";
import {
  InstagramShareNetwork,
  InstagramStoryShareNetwork,
  ShareNetworkType,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  SnapchatShareNetwork
} from "../components/Share/ShareNetwork";
import { FontFamily } from "../components/Text";
import {
  NewThreadHeader,
  THREAD_HEADER_HEIGHT
} from "../components/ThreadList/ThreadHeader";
import { UserContext } from "../components/UserContext";
import { ContentExport, ExportData } from "../lib/Exporter";
import {
  MediaUploadContext,
  PostUploadTask,
  PostUploadTaskType
} from "../lib/MediaUploadTask";
import { scaleToWidth } from "../lib/Rect";
import { SPACING, COLORS } from "../lib/styles";

const ITEM_SEPARATOR_WIDTH = 32;

const NETWORK_ORDER = [
  ShareNetworkType.instagramPost,
  ShareNetworkType.instagramStory,
  ShareNetworkType.snapchat
];

const INSTAGRAM_POST_POSITION = NETWORK_ORDER.indexOf(
  ShareNetworkType.instagramPost
);
const INSTAGRAM_STORY_POSITION = NETWORK_ORDER.indexOf(
  ShareNetworkType.instagramStory
);
const SNAPCHAT_POSITION = NETWORK_ORDER.indexOf(ShareNetworkType.snapchat);

const ProfileTop = () => {
  const { currentUser } = React.useContext(UserContext);

  if (!currentUser) {
    return null;
  }

  return (
    <ProfileFeedComponent
      profile={currentUser}
      showTimestamp={false}
      showEllipsis={false}
      body={null}
    />
  );
};

const CONTENT_CONTAINER_TOP = TOP_Y + THREAD_HEADER_HEIGHT + 24;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scroll: {
    backgroundColor: "#000"
  },
  textInput: {
    marginBottom: SPACING.normal,
    paddingLeft: SPACING.normal,
    paddingRight: SPACING.normal,
    fontSize: 24,
    fontFamily: FontFamily.semiBold,
    color: "#fff"
  },
  postContainer: {
    paddingLeft: SPACING.normal,
    paddingRight: SPACING.normal
  },
  separator: {
    width: ITEM_SEPARATOR_WIDTH,
    height: 1
  },
  highlightText: {
    color: COLORS.white
  },
  previewContainer: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1
  },
  contentContainer: {
    paddingTop: CONTENT_CONTAINER_TOP,
    position: "relative",
    zIndex: 1,
    paddingLeft: 8
  }
});

const MAX_INSTAGRAM_POST_HEIGHT = SHARE_CARD_HEIGHT - 150;

const ItemSeparatorComponent = () => <View style={styles.separator} />;

type PostPreviewItemProps = {
  contentExport: ContentExport;
  onPress: Function;
  width: number;
  height: number;
  isVisible: boolean;
  footerAction: React.ReactNode;
  sharedId: string;
};

const PrivateAnimatedMediaPlayer = Animated.createAnimatedComponent(
  MediaPlayer
);
const AnimatedMediaPlayer = React.forwardRef((props, ref) => {
  const _ref = React.useRef(null);
  React.useImperativeHandle(ref, () => _ref.current?.getNode());

  return <PrivateAnimatedMediaPlayer {...props} ref={_ref} />;
});
const AnimatedMaskView = Animated.createAnimatedComponent(MaskedViewIOS);

const PostPreviewItem = React.forwardRef((props: PostPreviewItemProps, ref) => {
  const {
    contentExport,
    onPress,
    width,
    height,
    isVisible,
    footerAction,
    position,
    sharedId
  } = props;
  const { currentUser } = React.useContext(UserContext);
  const imageSize = scaleToWidth(width, contentExport);

  const maxStoryHeight = height;

  const storyScale = Math.max(maxStoryHeight / imageSize.height, 1.0);

  const source = React.useMemo(
    () => [
      {
        height: imageSize.height,
        width: imageSize.width,
        url: contentExport.uri,
        mimeType: contentExport.type,
        bounds: {
          x: 0,
          y: 0,
          ...imageSize
        },
        id: `preview-${contentExport.uri}`,
        duration: contentExport.duration,
        playDuration: contentExport.duration,
        pixelRatio: PixelRatio.get()
      }
    ],
    [contentExport, imageSize]
  );

  const storyMargin = StyleSheet.hairlineWidth;

  return (
    <Animated.View
      style={[
        styles.previewContainer,
        {
          width,
          height: Animated.interpolate(position, {
            inputRange: [
              INSTAGRAM_POST_POSITION,
              INSTAGRAM_STORY_POSITION,
              SNAPCHAT_POSITION
            ],
            outputRange: [
              MAX_INSTAGRAM_POST_HEIGHT,
              height - storyMargin,
              height - storyMargin
            ],
            extrapolate: Animated.Extrapolate.CLAMP
          }),
          overflow: "hidden",
          top: Animated.interpolate(position, {
            inputRange: [
              INSTAGRAM_POST_POSITION,
              INSTAGRAM_STORY_POSITION,
              SNAPCHAT_POSITION
            ],
            outputRange: [
              CONTENT_CONTAINER_TOP + 38,
              CONTENT_CONTAINER_TOP + storyMargin,
              CONTENT_CONTAINER_TOP + storyMargin
            ],
            extrapolate: Animated.Extrapolate.CLAMP
          }),

          transform: [
            {
              translateX: Animated.interpolate(position, {
                inputRange: [
                  INSTAGRAM_POST_POSITION,
                  INSTAGRAM_STORY_POSITION,
                  SNAPCHAT_POSITION
                ],
                outputRange: [
                  8 + 32,
                  8 + 32 + SHARE_CARD_WIDTH + ITEM_SEPARATOR_WIDTH,
                  8 + 32 + (SHARE_CARD_WIDTH + ITEM_SEPARATOR_WIDTH) * 2
                ],
                extrapolate: Animated.Extrapolate.CLAMP
              })
            }
          ]
        }
      ]}
    >
      <AnimatedMediaPlayer
        ref={ref}
        style={{
          width: imageSize.width,
          height: imageSize.height,
          transform: [
            {
              translateY: Animated.interpolate(position, {
                inputRange: [
                  INSTAGRAM_POST_POSITION,
                  INSTAGRAM_STORY_POSITION,
                  SNAPCHAT_POSITION
                ],
                outputRange: [
                  (imageSize.height - MAX_INSTAGRAM_POST_HEIGHT) / 2,
                  0,
                  0
                ],
                extrapolate: Animated.Extrapolate.CLAMP
              })
            },
            {
              scale: Animated.interpolate(position, {
                inputRange: [
                  INSTAGRAM_POST_POSITION,
                  INSTAGRAM_STORY_POSITION,
                  SNAPCHAT_POSITION
                ],
                outputRange: [
                  1,
                  Math.min(maxStoryHeight / imageSize.height, 1),
                  Math.min(maxStoryHeight / imageSize.height, 1)
                ],
                extrapolate: Animated.Extrapolate.CLAMP
              })
            }
          ]
        }}
        sources={source}
        autoPlay
        isActive
        borderRadius={0}
        paused={false}
      />
    </Animated.View>
  );
});

type Props = {
  contentExport?: ContentExport;
  exportData?: ExportData;
};

class RawNewThreadPage extends React.Component<Props> {
  state = {
    body: "",
    network: ShareNetworkType.instagramPost,
    showDone: false,
    startExport: false
  };

  handleChangeBody = (body: string) => this.setState({ body });

  textInputRef = React.createRef<TextInput>();
  uploadTask: PostUploadTask | null = null;

  componentDidMount() {
    this.handleUpload();
  }

  onBack = () => {
    return this.uploadTask?.cancel();
  };

  handleUpload = async () => {
    const {
      exportData,
      contentExport,
      format,
      layout,
      editToken,
      setPostUploadTask,
      threadId = null
    } = this.props;

    const { blocks, nodes, bounds, colors } = exportData;

    const { body } = this.state;

    this.uploadTask = new PostUploadTask({
      contentExport,
      exportData,
      format,
      threadId,
      editToken,
      layout,
      body,
      type: threadId ? PostUploadTaskType.newPost : PostUploadTaskType.newThread
    });

    this.uploadTask.start();

    setPostUploadTask(this.uploadTask);
  };

  onDismiss = () => {
    this.props.onDismiss();
  };

  scrollX = new Animated.Value(0);
  handleScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            x: this.scrollX
          }
        }
      }
    ],
    { useNativeDriver: true }
  );

  contentInset = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  };

  contentOffset = {
    y: 0,
    x: 0
  };

  snapOffsets = [
    this.contentOffset.x,
    ITEM_SEPARATOR_WIDTH + SHARE_CARD_WIDTH,
    (ITEM_SEPARATOR_WIDTH + SHARE_CARD_WIDTH) * 2
  ];

  position = Animated.interpolate(this.scrollX, {
    inputRange: this.snapOffsets,
    outputRange: this.snapOffsets.map((offset, index) => index),
    extrapolate: Animated.Extrapolate.CLAMP
  });

  currentPosition = Animated.round(this.position);
  mediaPlayerRef = React.createRef<MediaPlayerComponent>();

  handleChangePosition = ([position]) => {
    this.setState({
      network: NETWORK_ORDER[position]
    });
  };

  handlePressSave = () => {
    this.mediaPlayerRef.current.save();
    this.setState({ showDone: true });
  };

  handlePressMore = () => {
    this.mediaPlayerRef.current.share(null);
    this.setState({ showDone: true });
  };

  handlePressButton = () => {
    this.mediaPlayerRef.current.share(this.state.network);
    this.setState({ showDone: true });
  };

  render() {
    const { body, contentExport, exportData } = this.props;

    return (
      <View style={styles.container}>
        <Animated.Code
          exec={Animated.block([
            Animated.onChange(
              this.currentPosition,
              Animated.block([
                Animated.call([this.currentPosition], this.handleChangePosition)
              ])
            )
          ])}
        />
        <NewThreadHeader
          buttonStyle={this.state.showDone ? styles.highlightText : null}
          onBack={this.onBack}
          onDone={this.onDismiss}
        >
          {this.state.showDone ? "Done" : "Skip"}
        </NewThreadHeader>

        <ScrollView
          contentInsetAdjustmentBehavior="never"
          contentInset={this.contentInset}
          horizontal
          directionalLockEnabled
          snapToOffsets={this.snapOffsets}
          snapToStart={false}
          disableIntervalMomentum
          snapToEnd={false}
          pagingEnabled
          disableScrollViewPanResponder
          scrollToOverflowEnabled
          overScrollMode="always"
          decelerationRate="fast"
          scrollEventThrottle={1}
          onScroll={this.handleScroll}
          contentOffset={this.contentOffset}
          contentContainerStyle={styles.contentContainer}
          style={styles.scroll}
        >
          <PostPreviewItem
            contentExport={contentExport}
            width={SHARE_CARD_WIDTH}
            ref={this.mediaPlayerRef}
            height={SHARE_CARD_HEIGHT}
            position={this.position}
          />
          <ItemSeparatorComponent />
          <InstagramShareNetwork
            contentExportHeight={Math.min(
              scaleToWidth(SHARE_CARD_WIDTH, contentExport).height,
              MAX_INSTAGRAM_POST_HEIGHT
            )}
          />
          <ItemSeparatorComponent />
          <InstagramStoryShareNetwork />
          <ItemSeparatorComponent />
          <SnapchatShareNetwork />
          <ItemSeparatorComponent />
          <ItemSeparatorComponent />
        </ScrollView>

        <ShareFooter
          network={this.state.network}
          onPressLink={this.handlePressLink}
          onPressSave={this.handlePressSave}
          onPressMore={this.handlePressMore}
          onPressButton={this.handlePressButton}
        />
      </View>
    );
  }
}

export const NewThreadPage = props => {
  const contentExport = useNavigationParam("contentExport");
  const exportData = useNavigationParam("exportData");
  const format = useNavigationParam("format");
  const layout = useNavigationParam("layout");
  const editToken = useNavigationParam("editToken");
  const navigation = useNavigation();
  const { setPostUploadTask } = React.useContext(MediaUploadContext);

  const onDismiss = React.useCallback(() => {
    navigation.dismiss();
  }, [navigation]);

  return (
    <RawNewThreadPage
      contentExport={contentExport}
      exportData={exportData}
      editToken={editToken}
      layout={layout}
      format={format}
      setPostUploadTask={setPostUploadTask}
      onDismiss={onDismiss}
    />
  );
};
export default NewThreadPage;
