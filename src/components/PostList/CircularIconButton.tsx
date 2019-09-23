import React from "react";
import { View, StyleSheet } from "react-native";
import { IconHeart, Icon } from "../Icon";
import { SPACING, COLORS } from "../../lib/styles";
import { Text, MediumText, SemiBoldText } from "../Text";
import { BaseButton } from "react-native-gesture-handler";
import CircularProgressBar, { CircularPogressBar } from "./CircularProgressBar";
import Animated from "react-native-reanimated";

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
    position: "relative"
  },
  defaultSizeIcon: {
    fontSize: 26,
    color: "white"
  },
  defaultSizeText: {
    fontSize: 24,
    color: "white"
  }
});

export class CircularIconButton extends React.Component {
  static defaultProps = {
    Icon: IconHeart
  };
  state = { userIcon: null };

  componentDidMount() {
    Icon.getImageSource(this.props.iconName, this.props.iconSize, "white").then(
      source => this.setState({ userIcon: source })
    );
  }

  render() {
    const {
      count,
      Icon,
      onPress,
      iconSize,
      backgroundColor,
      size,
      progress
    } = this.props;

    const containerStyle = {
      width: size * 1.5,
      height: size * 1.5,
      overflow: "visible",
      alignItems: "center",
      justifyContent: "center"
    };

    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <BaseButton disallowInterruption onPress={onPress}>
          <View style={[styles.container, containerStyle]}>
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, containerStyle, { zIndex: 0 }]}
            >
              <CircularProgressBar
                maskImage={this.state.userIcon}
                progress={progress}
                width={size}
              />
            </View>
          </View>
        </BaseButton>
        <View style={styles.count}>
          <SemiBoldText style={{ fontSize: 18 }}>{count}</SemiBoldText>
        </View>
      </View>
    );
  }
}
