import BottomSheet from "reanimated-bottom-sheet";
import { View, StyleSheet } from "react-native";
import * as React from "react";
import { BlurView } from "@react-native-community/blur";
import GalleryTabView from "./GalleryTabView";
import Animated, {
  Transitioning,
  Transition,
  TransitioningView,
  Easing
} from "react-native-reanimated";
import { SCREEN_DIMENSIONS, TOP_Y } from "../../../config";
import { SPACING } from "../../lib/styles";
import { BaseButton } from "react-native-gesture-handler";
import { throttle } from "lodash";
import { sheetOpacity } from "../../lib/animations";

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    height: SCREEN_DIMENSIONS.height,
    width: SCREEN_DIMENSIONS.width
  },
  blurWrapper: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden"
  },

  transition: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999
  },
  sheetTransition: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998
  }
});

export class GallerySheet extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.show !== prevProps.show) {
      if (!this.props.show) {
        Animated.timing(this.dismissY, {
          toValue: 0,
          duration: 500,
          easing: Easing.elastic(0.8)
        }).start(() => {
          this.isDismissingValue.setValue(0);

          this.setState({ show: false }, () => {
            this.scrollY.setValue(0);
          });
        });
      } else if (this.props.show) {
        this.scrollY.setValue(0);
        this.setState({ show: true }, () => {
          Animated.timing(this.dismissY, {
            toValue: SCREEN_DIMENSIONS.height * -1,
            duration: 500,
            easing: Easing.elastic(0.8)
          }).start(() => {
            this.isDismissingValue.setValue(0);
          });
        });
      }
    }
  }

  scrollY = new Animated.Value(0);
  dismissY = new Animated.Value(0);
  isDismissingValue = new Animated.Value(0);
  static TOP_OFFSET = 100;

  translateY = Animated.interpolate(this.scrollY, {
    inputRange: [-1 * GallerySheet.TOP_OFFSET, 0],
    outputRange: [GallerySheet.TOP_OFFSET, TOP_Y],
    extrapolate: Animated.Extrapolate.CLAMP
  });

  render() {
    const { onDismiss } = this.props;

    const { show } = this.state;

    const inset = SPACING.normal;

    const height = SCREEN_DIMENSIONS.height - GallerySheet.TOP_OFFSET + TOP_Y;

    return (
      <>
        <Animated.View
          pointerEvents={show ? "auto" : "none"}
          style={styles.sheetTransition}
        >
          <BaseButton enabled={show} onPress={onDismiss}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  opacity: sheetOpacity(
                    this.dismissY,
                    this.scrollY,
                    SCREEN_DIMENSIONS.height,
                    GallerySheet.TOP_OFFSET
                  )
                }
              ]}
            />
          </BaseButton>
        </Animated.View>

        <Animated.Code
          exec={Animated.block([
            Animated.onChange(
              this.scrollY,
              Animated.cond(
                Animated.and(
                  Animated.lessThan(this.scrollY, -50),
                  Animated.eq(this.isDismissingValue, 0)
                ),
                Animated.block([
                  Animated.set(this.isDismissingValue, 1),
                  Animated.call([], this.props.onDismiss)
                ])
              )
            )
          ])}
        />

        <Animated.View
          pointerEvents={show ? "auto" : "none"}
          style={[
            styles.transition,
            {
              transform: [
                {
                  translateY: SCREEN_DIMENSIONS.height
                },
                {
                  translateY: this.dismissY
                },
                {
                  translateY: this.translateY
                }
              ]
            }
          ]}
        >
          <Animated.View
            style={[
              styles.blurWrapper,
              {
                height: SCREEN_DIMENSIONS.height,
                width: SCREEN_DIMENSIONS.width
              },
              {
                transform: [
                  {
                    translateY: this.translateY
                  }
                ]
              }
            ]}
          >
            <BlurView
              blurType="extraDark"
              blurAmount={25}
              style={{
                height
              }}
            >
              <GalleryTabView
                width={SCREEN_DIMENSIONS.width}
                height={height}
                inset={inset}
                onPress={this.props.onPress}
                initialRoute={this.props.initialRoute}
                show={this.props.show}
                scrollY={this.scrollY}
              />
            </BlurView>
          </Animated.View>
        </Animated.View>
      </>
    );
  }
}
