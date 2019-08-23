import * as React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity
} from "react-native";
import CameraRoll from "@react-native-community/cameraroll";
import {
  NewPostType,
  PLACEHOLDER_POST,
  PostBlockType,
  DEFAULT_TEXT_BACKGROUND_COLOR,
  DEFAULT_TEXT_COLOR
} from "./NewPostFormat";
import { TextPostBlock } from "./TextPostBlock";
import { SafeAreaView } from "react-navigation";
import { SPACING, COLORS } from "../../lib/styles";
import { IconUploadPhoto, IconText, IconChevronRight } from "../Icon";
import { ImagePicker } from "./ImagePicker";
import { ImageCropper } from "./ImageCropper";
import { getInset } from "react-native-safe-area-view";

const TOP_Y = getInset("top");
const BOTTOM_Y = getInset("bottom");

const SCREEN_DIMENSIONS = Dimensions.get("window");

const CONTENT_WIDTH = SCREEN_DIMENSIONS.width - SPACING.normal;

const footerButtonStyles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.normal,
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    backgroundColor: "rgba(64, 0, 244, 0.1)"
  },
  icon: {
    color: "white"
  }
});

const FooterButton = ({ Icon, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={footerButtonStyles.container}>
        <Icon style={footerButtonStyles.icon} size={32} />
      </View>
    </TouchableOpacity>
  );
};

const nextButtonStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.normal,
    height: 47,
    width: 47,
    borderRadius: 24,
    backgroundColor: COLORS.primary
  },
  icon: {
    color: "white",
    marginLeft: 0
  }
});

const NextButton = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={nextButtonStyles.container}>
        <IconChevronRight style={nextButtonStyles.icon} size={24} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    width: CONTENT_WIDTH,
    height: 600
  },
  footerSide: {
    flexDirection: "row"
  },
  safeWrapper: {
    borderRadius: 16,
    marginHorizontal: SPACING.half,
    overflow: "hidden"
  },
  container: {
    backgroundColor: "#111"
  },
  wrapper: {
    position: "relative",
    marginTop: SPACING.double,
    flex: 1
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between"
  }
});

enum NewPostStep {
  choosePhoto = "choosePhoto",
  resizePhoto = "resizePhoto",
  editPhoto = "editPhoto"
}

type State = {
  post: NewPostType;
  defaultPhoto: CameraRoll.PhotoIdentifier | null;
  step: NewPostStep;
};

type BlockListProps = {
  blocks: Array<PostBlockType>;
  setBlockAtIndex: (block: PostBlockType, index: number) => void;
};
const BlockList = ({ blocks, setBlockAtIndex }: BlockListProps) => {
  const handleChangeBlock = React.useCallback(
    index => block => setBlockAtIndex(block, index),
    [setBlockAtIndex, blocks]
  );

  return blocks.map((block, index) => {
    if (block.type === "text") {
      return (
        <TextPostBlock
          key={index}
          block={block}
          onChange={handleChangeBlock(index)}
        />
      );
    } else {
      return null;
    }
  });
};

const DEFAULT_PHOTO_FIXTURE = {
  node: {
    image: {
      uri: "https://i.imgur.com/CopIMxf.jpg",
      height: 2436,
      width: 1125
    }
  }
};

export class NewPost extends React.Component<{}, State> {
  state = {
    post: PLACEHOLDER_POST,
    defaultPhoto: DEFAULT_PHOTO_FIXTURE,
    step: NewPostStep.resizePhoto
  };

  handleChangeBlock = (block: PostBlockType, index: number) => {
    const blocks = [...this.state.post.blocks];
    blocks.splice(index, 1, block);

    this.setState({
      post: {
        ...this.state.post,
        blocks
      }
    });
  };

  handleChoosePhoto = (photo: CameraRoll.PhotoIdentifier) => {
    this.setState({
      step: NewPostStep.resizePhoto,
      defaultPhoto: photo
    });
  };

  handleInsertText = () => {
    const blocks = [...this.state.post.blocks];
    blocks.push({
      type: "text",
      value: "",
      config: {
        backgroundColor: DEFAULT_TEXT_BACKGROUND_COLOR,
        color: DEFAULT_TEXT_COLOR
      }
    });

    this.setState({
      post: {
        ...this.state.post,
        blocks
      }
    });
  };

  render() {
    const { step } = this.state;

    if (step === NewPostStep.editPhoto) {
      return (
        <View style={[styles.wrapper]}>
          <SafeAreaView
            style={[styles.safeWrapper, styles.scrollContainer]}
            forceInsets={{
              top: "always",
              left: "never",
              right: "never",
              bottom: "never"
            }}
          >
            <ScrollView style={[styles.container, styles.scrollContainer]}>
              <BlockList
                blocks={this.state.post.blocks}
                setBlockAtIndex={this.handleChangeBlock}
              />
            </ScrollView>
            <View style={styles.footer}>
              <View style={[styles.footerSide]}>
                <FooterButton
                  Icon={IconUploadPhoto}
                  onPress={this.handleAddPhoto}
                />

                <FooterButton Icon={IconText} onPress={this.handleInsertText} />
              </View>

              <View style={[styles.footerSide, styles.footerSideRight]}>
                <NextButton />
              </View>
            </View>
          </SafeAreaView>
        </View>
      );
    } else if (step === NewPostStep.choosePhoto) {
      return (
        <View
          style={{
            height: SCREEN_DIMENSIONS.height
          }}
        >
          <ImagePicker
            height={SCREEN_DIMENSIONS.height}
            width={SCREEN_DIMENSIONS.width}
            onChange={this.handleChoosePhoto}
          />
        </View>
      );
    } else if (step === NewPostStep.resizePhoto) {
      return <ImageCropper photo={this.state.defaultPhoto} />;
    } else {
      return null;
    }
  }
}
