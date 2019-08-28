import * as React from "react";
import { View, StyleSheet, PixelRatio, Dimensions } from "react-native";
import SketchCanvas from "./SketchCanvas";
import RNTextDetector from "react-native-text-detector";
import { flatten } from "lodash";
import RNFS from "react-native-fs";
import { resizeImage } from "../../lib/imageResize";

enum RedactionStep {
  load = "load",
  loaded = "loaded"
}

const SCREEN_DIMENSIONS = Dimensions.get("window");

const styles = StyleSheet.create({});

export class Redactor extends React.Component {
  state = {
    step: RedactionStep.load,
    resp: null,
    redactablePlaces: []
  };

  componentDidMount() {
    this.loadRedactions();
  }

  loadRedactions = async () => {
    const responses = await Promise.all(
      this.props.blocks
        .filter(({ type }) => type == "image")
        .map(block => block.value)
        .map(value => {
          return resizeImage({
            uri: value.uri,
            displaySize: {
              width: value.width,
              height: value.height
            },
            width: value.width,
            height: value.height,
            originalWidth: value.intrinsicWidth,
            originalHeight: value.intrinsicHeight
          }).then(({ uri, ...other }) => {
            console.log(other);
            return RNTextDetector.detectFromUri(uri);
          });
        })
        .filter(res => res !== false)
    );

    const boundingBoxes = flatten(
      responses[0].map(({ lines }) => {
        return lines;
      })
    ).map(({ bounding: { top, left, width, height } }) => {
      return {
        top: top,
        left: left,
        height: height,
        width: width
      };
    });

    this.setState({
      redactablePlaces: boundingBoxes,
      step: RedactionStep.loaded
    });
  };

  render() {
    return (
      <View style={{ position: "relative", height: 812, width: 414 }}>
        {this.state.redactablePlaces.map(({ top, left, width, height }) => {
          const SPACING = 4;
          return (
            <View
              style={{
                position: "absolute",
                top: top - SPACING,
                left: left - SPACING,
                width: width + SPACING,
                height: height + SPACING,
                backgroundColor: "rgba(20, 20, 20, 0.4)",
                borderWidth: 1,
                borderColor: "rgba(20, 20, 20, 1.0)",
                borderRadius: 8,
                overflow: "hidden"
              }}
            >
              <SketchCanvas
                strokeColor={"rgba(20, 20, 20, 1.0)"}
                strokeWidth={height * 1.5}
                style={{ width: width + SPACING, height: height + SPACING }}
              />
            </View>
          );
        })}
      </View>
    );
  }
}
