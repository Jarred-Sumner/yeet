import * as React from "react";
import { View, StyleSheet } from "react-native";
import {
  NewThreadHeader,
  THREAD_HEADER_HEIGHT
} from "../components/ThreadList/ThreadHeader";
import { COLORS, SPACING } from "../lib/styles";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { ProfileFeedComponent } from "../components/Feed/ProfileFeed";
import { UserContext } from "../components/UserContext";
import {
  PostPreviewListItem,
  POST_LIST_HEIGHT,
  PlaceholderPost,
  getContentSize,
  getPostPreviewWidth
} from "../components/Feed/PostPreviewList";
import { scaleToWidth } from "../lib/Rect";
import { buildImgSrc } from "../lib/imgUri";
import { isVideo, ImageMimeType } from "../lib/imageSearch";
import { TextInput } from "react-native-gesture-handler";
import { Button } from "../components/Button";
import { SCREEN_DIMENSIONS } from "../../config";
import { FontFamily } from "../components/Text";
import { useNavigationParam, useNavigation } from "react-navigation-hooks";
import { ContentExport, ExportData } from "../lib/Exporter";
import PostUploader, { RawPostUploader } from "../components/PostUploader";
import { ToastType, sendToast } from "../components/Toast";
import { PostFragment } from "../lib/graphql/PostFragment";
import { CreatePost_createPost } from "../lib/graphql/CreatePost";
import { CreatePostThread_createPostThread } from "../lib/graphql/CreatePostThread";
import {
  MediaUploadContext,
  PostUploadTask,
  PostUploadTaskType
} from "../lib/MediaUploadTask";
import { debounce } from "lodash";
import { sendLightFeedback } from "../lib/Vibration";

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  scroll: {
    backgroundColor: "#111"
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
    width: SCREEN_DIMENSIONS.width,
    height: StyleSheet.hairlineWidth,
    opacity: 0.25,
    backgroundColor: COLORS.muted,
    marginTop: SPACING.normal,
    marginBottom: SPACING.normal
  },
  button: {
    marginLeft: SPACING.normal,
    marginRight: SPACING.normal
  }
});

type PostPreviewItemProps = {
  contentExport: ContentExport;
  onPress: Function;
  width: number;
  height: number;
  isVisible: boolean;
  footerAction: React.ReactNode;
  sharedId: string;
};

const PostPreviewItem = ({
  contentExport,
  onPress,
  width,
  height,
  isVisible,
  footerAction,
  sharedId
}: PostPreviewItemProps) => {
  const { currentUser } = React.useContext(UserContext);
  const imageSize = scaleToWidth(width, contentExport);

  const source = React.useMemo(
    () => ({
      height: imageSize.height,
      width: imageSize.width,
      uri: contentExport.uri,
      mimeType: contentExport.type
    }),
    [contentExport]
  );

  return (
    <PostPreviewListItem
      sharedId={sharedId}
      onPress={onPress}
      source={source}
      id={`preview-new-post-${contentExport.uri}`}
      width={width}
      isVisible={isVisible}
      paused={false}
      muted
      height={height}
      imageSize={imageSize}
      photoURL={currentUser?.photoURL}
      username={currentUser?.username}
    />
  );
};

type Props = {
  contentExport?: ContentExport;
  exportData?: ExportData;
};

class RawNewThreadPage extends React.Component<Props> {
  state = {
    body: "",
    isInputFocused: false,
    startExport: false
  };

  _handleCreate = debounce(() => {
    this.handleUpload();
  }, 100);

  handleCreate = () => {
    if (this.state.body.length === 0) {
      sendToast("Please enter title", ToastType.error);
      return;
    }

    this._handleCreate();
  };

  handleChangeBody = (body: string) => this.setState({ body });
  contentOffset = {
    y: THREAD_HEADER_HEIGHT * -1,
    x: 0
  };

  textInputRef = React.createRef<TextInput>();
  postUploaderRef = React.createRef<RawPostUploader>();

  componentDidMount() {
    this.textInputRef.current.focus();
    this.setState({ isInputFocused: true });
  }

  handleUpload = async (mediaId: string) => {
    const { exportData, contentExport, format, setPostUploadTask } = this.props;

    const { blocks, nodes, bounds, colors } = exportData;

    const { body } = this.state;

    const uploadTask = new PostUploadTask({
      contentExport,
      exportData,
      format,
      threadId: null,
      body: body,
      type: PostUploadTaskType.newThread
    });

    uploadTask.start();

    setPostUploadTask(uploadTask);

    sendLightFeedback();

    this.props.onDismiss();
  };

  setFocused = () => this.setState({ isInputFocused: true });
  setBlur = () => this.setState({ isInputFocused: false });

  render() {
    const { body, contentExport, exportData } = this.props;

    let height = POST_LIST_HEIGHT;

    return (
      <View style={styles.container}>
        <NewThreadHeader />
        <KeyboardAwareScrollView
          contentInsetAdjustmentBehavior="automatic"
          paddingTop={THREAD_HEADER_HEIGHT}
          contentOffset={this.contentOffset}
          style={styles.scroll}
        >
          <ProfileTop />

          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={2}
            ref={this.textInputRef}
            value={this.state.body}
            onChangeText={this.handleChangeBody}
            placeholder="Enter a short title"
            scrollEnabled={false}
            autoCapitalize="none"
            autoCompleteType="off"
            enablesReturnKeyAutomatically
            selectionColor={COLORS.primary}
            blurOnSubmit
            textContentType="none"
            onFocus={this.setFocused}
            onBlur={this.setBlur}
            maxLength={36}
            keyboardAppearance="dark"
            returnKeyType="next"
            placeholderTextColor="rgb(83, 83, 83)"
          />

          <View style={styles.postContainer}>
            {contentExport ? (
              <PostPreviewItem
                onPress={this.handlePressPost}
                width={getPostPreviewWidth(contentExport) * 0.8}
                height={
                  scaleToWidth(
                    getPostPreviewWidth(contentExport) * 0.8,
                    contentExport
                  ).height
                }
                contentExport={contentExport}
              />
            ) : (
              <PlaceholderPost
                width={getPostPreviewWidth(contentExport)}
                height={POST_LIST_HEIGHT}
                onPress={this.handlePressNewPost}
              >
                First post
              </PlaceholderPost>
            )}
          </View>

          <View style={styles.separator} />

          <Button
            onPress={this.handleCreate}
            style={[styles.button]}
            color={COLORS.primary}
          >
            Post new thread
          </Button>
        </KeyboardAwareScrollView>
      </View>
    );
  }
}

export const NewThreadPage = props => {
  const contentExport = useNavigationParam("contentExport");
  const exportData = useNavigationParam("exportData");
  const format = useNavigationParam("format");
  const navigation = useNavigation();
  const { setPostUploadTask } = React.useContext(MediaUploadContext);

  const onDismiss = React.useCallback(() => {
    navigation.dismiss();
  }, [navigation]);

  return (
    <RawNewThreadPage
      contentExport={contentExport}
      exportData={exportData}
      format={format}
      setPostUploadTask={setPostUploadTask}
      onDismiss={onDismiss}
    />
  );
};
export default NewThreadPage;
