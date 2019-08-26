import * as React from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { getInset } from "react-native-safe-area-view";
import { SafeAreaView } from "react-navigation";
import { SPACING, COLORS } from "../../lib/styles";
import { IconText, IconUploadPhoto, IconChevronRight } from "../Icon";
import { PostBlockType } from "./NewPostFormat";
import { TextPostBlock } from "./TextPostBlock";
import { ImagePostBlock } from "./ImagePostBlock";
import { BorderlessButton } from "react-native-gesture-handler";

const TOP_Y = getInset("top");
const BOTTOM_Y = getInset("bottom");

const SCREEN_DIMENSIONS = Dimensions.get("window");

const footerButtonStyles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.double,
    alignItems: "center",
    height: 60,
    backgroundColor: "rgba(64, 0, 244, 0.1)"
  },
  icon: {
    color: "white"
  }
});

export const POST_WIDTH = SCREEN_DIMENSIONS.width - 8;
export const MAX_POST_HEIGHT =
  SCREEN_DIMENSIONS.height - TOP_Y - BOTTOM_Y - SPACING.double;

const FooterButton = ({ Icon, onPress }) => {
  return (
    <BorderlessButton onPress={onPress}>
      <View style={footerButtonStyles.container}>
        <Icon style={footerButtonStyles.icon} size={32} />
      </View>
    </BorderlessButton>
  );
};

const nextButtonStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.normal,
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary
  },
  icon: {
    color: "white",
    marginLeft: 0
  }
});

const NextButton = ({ onPress }) => {
  return (
    <BorderlessButton onPress={onPress}>
      <View style={nextButtonStyles.container}>
        <IconChevronRight style={nextButtonStyles.icon} size={32} />
      </View>
    </BorderlessButton>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    width: POST_WIDTH,
    height: MAX_POST_HEIGHT
  },
  footerSide: {
    flexDirection: "row"
  },
  safeWrapper: {
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  container: {
    backgroundColor: "#111"
  },
  wrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%"
  },
  footer: {
    flexDirection: "row",
    position: "absolute",
    bottom: SPACING.normal,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: "space-between"
  }
});

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
    } else if (block.type === "image") {
      return (
        <ImagePostBlock
          key={index}
          block={block}
          onChange={handleChangeBlock(index)}
        />
      );
    }
    {
      return null;
    }
  });
};
export class PostEditor extends React.Component {
  constructor(props) {
    super(props);
  }

  handleChangeBlock = (block: PostBlockType, index: number) => {
    const blocks = [...this.props.post.blocks];
    blocks.splice(index, 1, block);

    this.props.onChange({
      ...this.props.post,
      blocks
    });
  };

  handleInsertText = () => {
    const blocks = [...this.props.post.blocks];
    blocks.push({
      type: "text",
      value: "",
      config: {
        backgroundColor: "red",
        color: "white"
      }
    });

    this.props.onChange({
      ...this.props.post,
      blocks
    });
  };

  render() {
    const { post } = this.props;
    return (
      <SafeAreaView style={[styles.wrapper]}>
        <View style={[styles.safeWrapper, styles.scrollContainer]}>
          <ScrollView style={[styles.container, styles.scrollContainer]}>
            <BlockList
              blocks={post.blocks}
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
        </View>
      </SafeAreaView>
    );
  }
}
