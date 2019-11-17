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
  POST_LIST_WIDTH,
  POST_LIST_HEIGHT,
  PlaceholderPost,
  getContentSize
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
  const mimeType = ImageMimeType[contentExport.type];

  const source = React.useMemo(
    () => ({
      height: imageSize.height,
      width: imageSize.width,
      uri: contentExport.uri,
      mimeType
    }),
    [contentExport]
  );

  return (
    <PostPreviewListItem
      sharedId={sharedId}
      onPress={onPress}
      source={source}
      id={`preview-new-post`}
      width={width}
      isVisible={isVisible}
      height={imageSize.height}
      imageSize={imageSize}
      isVisible
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
    startExport: false
  };

  handleCreate = () => {
    this.setState({ startExport: true }, () => {
      this.postUploaderRef.current.startUploading(true);
    });
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
  }

  handleUpload = async (mediaId: string) => {
    const { exportData, contentExport, format } = this.props;

    const { blocks, nodes, bounds, colors } = exportData;

    const { body } = this.state;

    const thread = await this.postUploaderRef.current.createPostThread({
      mediaId,
      autoplaySeconds: contentExport.duration,
      blocks,
      nodes,
      body,
      format,
      bounds,
      colors: {
        background: contentExport.colors?.background ?? null,
        primary: contentExport.colors?.primary ?? null,
        secondary: contentExport.colors?.secondary ?? null,
        detail: contentExport.colors?.detail ?? null
      }
    });

    console.log({ thread });
    sendToast("Posted successfully", ToastType.success);
    this.setState(
      {
        startExport: false
      },
      () => {
        this.props.onDone(thread);
      }
    );
  };

  render() {
    const { body, contentExport, exportData } = this.props;

    let height = POST_LIST_HEIGHT;
    if (contentExport?.height) {
      let dimensions = scaleToWidth(POST_LIST_WIDTH, contentExport);

      height = Math.min(height, dimensions.height);
    }

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
            maxLength={36}
            keyboardAppearance="dark"
            returnKeyType="next"
            placeholderTextColor="rgb(83, 83, 83)"
          />

          <View style={styles.postContainer}>
            {contentExport ? (
              <PostPreviewItem
                onPress={this.handlePressPost}
                width={POST_LIST_WIDTH}
                contentExport={contentExport}
              />
            ) : (
              <PlaceholderPost
                width={POST_LIST_WIDTH}
                height={200}
                onPress={this.handlePressNewPost}
              >
                First post
              </PlaceholderPost>
            )}
          </View>

          <View style={styles.separator} />

          <Button
            onPress={this.handleCreate}
            style={styles.button}
            color={COLORS.primary}
          >
            Create new thread
          </Button>
        </KeyboardAwareScrollView>
        <PostUploader
          visible={this.state.startExport}
          ref={this.postUploaderRef}
          onUpload={this.handleUpload}
          onCancel={this.handleCancel}
          file={contentExport}
          data={exportData}
        />
      </View>
    );
  }
}

export const NewThreadPage = props => {
  const contentExport = useNavigationParam("contentExport");
  const exportData = useNavigationParam("exportData");
  const format = useNavigationParam("format");
  const navigation = useNavigation();

  const onDone = React.useCallback(
    (thread: CreatePostThread_createPostThread) => {
      navigation.dismiss();
      navigation.navigate("ViewThread", {
        threadId: thread.id,
        thread
      });
    },
    [navigation]
  );

  return (
    <RawNewThreadPage
      contentExport={contentExport}
      exportData={exportData}
      format={format}
      onDone={onDone}
    />
  );
};
export default NewThreadPage;
