import * as React from "react";
import { View, StyleSheet } from "react-native";
import { NewPost, DEFAULT_POST } from "../components/NewPost/NewPost";
import { UserContext } from "../components/UserContext";
import { useNavigation, useFocusState } from "react-navigation-hooks";
import {
  buildImageBlock,
  minImageWidthByFormat,
  DEFAULT_POST_FORMAT
} from "../components/NewPost/NewPostFormat";

const styles = StyleSheet.create({
  container: {}
});

export class NewPostPage extends React.Component {
  constructor(props) {
    super(props);

    const image = props.navigation.getParam("image");
    const blockId = props.navigation.getParam("blockId");

    if (image && blockId) {
      const minWidth = minImageWidthByFormat(DEFAULT_POST_FORMAT);

      const imageBlock = buildImageBlock({
        image,
        id: blockId,
        width: minWidth,
        autoInserted: true,
        height: image.image.height * (minWidth / image.image.width),
        format: DEFAULT_POST_FORMAT
      });

      const defaultBlocks = [...DEFAULT_POST.blocks];
      defaultBlocks.splice(
        defaultBlocks.findIndex(block => block.type === "image"),
        1,
        imageBlock
      );

      this.state = {
        defaultBlocks
      };
    } else {
      this.state = { defaultBlocks: undefined };
    }
  }

  componentDidMount() {
    if (this.props.isFocused || this.props.isFocusing) {
      this.props.requireAuthentication();
    }
  }

  componentDidUpdate(prevProps) {
    if (
      (this.props.isFocused || this.props.isFocusing) &&
      !prevProps.isFocused
    ) {
      this.props.requireAuthentication();
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <NewPost
          navigation={this.props.navigation}
          defaultBlocks={this.state.defaultBlocks}
        />
      </View>
    );
  }
}

export default pageProps => {
  const userContext = React.useContext(UserContext);
  const { isFocused, isFocusing } = useFocusState();

  return (
    <NewPostPage
      {...pageProps}
      requireAuthentication={userContext.requireAuthentication}
      authState={userContext.authState}
      isFocused={isFocused}
      isFocusing={isFocusing}
    />
  );
};
