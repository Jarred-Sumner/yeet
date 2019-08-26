import * as React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { getInset } from "react-native-safe-area-view";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-navigation";
import { SPACING, COLORS } from "../../lib/styles";
import { IconText, IconUploadPhoto, IconSend, IconDownload } from "../Icon";
import { PostBlockType } from "./NewPostFormat";
import { TextPostBlock } from "./TextPostBlock";
import { ImagePostBlock } from "./ImagePostBlock";
import { BorderlessButton, ScrollView } from "react-native-gesture-handler";
import { IconButton } from "../Button";
import LinearGradient from "react-native-linear-gradient";
import { Toolbar } from "./Toolbar";

const TOP_Y = getInset("top");
const BOTTOM_Y = getInset("bottom");

const SCREEN_DIMENSIONS = Dimensions.get("window");

export const POST_WIDTH = SCREEN_DIMENSIONS.width;
export const MAX_POST_HEIGHT =
  SCREEN_DIMENSIONS.height - TOP_Y - SPACING.double;

const FooterButton = ({ Icon, onPress, color, size = 32 }) => {
  return (
    <IconButton
      size={size}
      Icon={Icon}
      color={color}
      type="shadow"
      onPress={onPress}
    />
  );
};

const NextButton = ({ onPress }) => {
  return (
    <IconButton
      size={24}
      type="fill"
      onPress={onPress}
      Icon={IconSend}
      backgroundColor={COLORS.secondary}
    />
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    width: POST_WIDTH,
    height: MAX_POST_HEIGHT
  },
  footerSide: {
    flexDirection: "row",
    alignItems: "flex-end"
  },
  safeWrapper: {
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  container: {
    backgroundColor: "#fff"
  },
  wrapper: {
    position: "relative",
    justifyContent: "center",
    backgroundColor: "#fff",
    alignItems: "center",
    width: "100%",
    height: "100%"
  },
  footer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    paddingHorizontal: SPACING.double,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: "space-between"
  },
  layerStyles: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
});

enum LayerZIndex {
  sheet = 1,
  icons = 2,
  footer = 2
}

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

const MiddleSheet = ({ width, height }) => {
  return (
    <LinearGradient
      useAngle
      width={width}
      height={height}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      angle={270.32}
      angleCenter={{ x: 0.5, y: 0.5 }}
      locations={[0.2742, 0.75]}
      colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0)"]}
    />
  );
};

const Layer = ({
  zIndex,
  isShown = true,
  pointerEvents = "box-none",
  children,
  isFrozen,
  width,
  height
}) => {
  if (!isShown) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={pointerEvents}
      needsOffscreenAlphaCompositing={isFrozen}
      shouldRasterizeIOS={isFrozen}
      renderToHardwareTextureAndroid={isFrozen}
      style={[
        StyleSheet.absoluteFillObject,
        {
          width,
          height,
          zIndex,
          alignSelf: "stretch",
          overflow: "visible",
          backgroundColor: "transparent"
        }
      ]}
    >
      {children}
    </Animated.View>
  );
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
      <View style={[styles.wrapper]}>
        <View style={[styles.safeWrapper, styles.scrollContainer]}>
          <ScrollView
            directionalLockEnabled
            horizontal={false}
            vertical
            alwaysBounceVertical={false}
            style={{ width: POST_WIDTH, height: MAX_POST_HEIGHT }}
            contentContainerStyle={[
              {
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                flex: 0,
                backgroundColor: "#fff"
              }
            ]}
          >
            <BlockList
              blocks={post.blocks}
              setBlockAtIndex={this.handleChangeBlock}
            />
          </ScrollView>

          <Layer
            zIndex={LayerZIndex.sheet}
            width={POST_WIDTH}
            isFrozen
            pointerEvents="none"
            height={MAX_POST_HEIGHT}
          >
            <MiddleSheet width={POST_WIDTH} height={MAX_POST_HEIGHT} />
          </Layer>

          <Layer zIndex={LayerZIndex.icons}>
            <Toolbar />
          </Layer>

          <Layer zIndex={LayerZIndex.footer} width={"100%"}>
            <SafeAreaView
              forceInset={{
                top: "never",
                left: "never",
                right: "never",
                bottom: "always"
              }}
              style={styles.footer}
            >
              <View style={[styles.footerSide]}>
                <IconButton Icon={IconDownload} color="#000" size={32} />
              </View>

              <View style={[styles.footerSide, styles.footerSideRight]}>
                <NextButton />
              </View>
            </SafeAreaView>
          </Layer>
        </View>
      </View>
    );
  }
}
