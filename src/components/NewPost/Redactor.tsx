import * as React from "react";
import { View, StyleSheet, PixelRatio, Dimensions } from "react-native";
import SketchCanvas from "./SketchCanvas";
import RNTextDetector from "react-native-text-detector";
import { flatten } from "lodash";
import RNFS from "react-native-fs";
import { resizeImage } from "../../lib/imageResize";
import {
  Svg,
  Defs,
  Rect,
  ClipPath,
  Mask,
  Polyline,
  G,
  Path,
  Use,
  Image as SVGImage
} from "react-native-svg";
import { toPath } from "svg-points";

const CORNER_RADIUS = 4;
const X_PADDING = 2;
const Y_PADDING = 2;
const DEFAULT_STROKE_COLOR = "rgb(255,255,255)";

const RedactSVG = React.memo(
  ({ points = [], width, height, intrinsicWidth, intrinsicHeight, src }) => {
    return (
      <Svg
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        width={width}
        height={height}
      >
        <Defs>
          <ClipPath id="clip">
            <Rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.75)" />

            {points.map(({ width, height, top, left, scale = 1.0, id }) => (
              <Rect
                key={id}
                scale={scale}
                width={width}
                height={height}
                rx={CORNER_RADIUS}
                ry={CORNER_RADIUS}
                x={left}
                fill="rgba(0, 0, 0, 0)"
                y={top}
              />
            ))}
          </ClipPath>
        </Defs>

        {points.length > 0 && (
          <Rect
            width="100%"
            rx={CORNER_RADIUS}
            ry={CORNER_RADIUS}
            height="100%"
            fill={"rgba(0, 0, 0, 0.65)"}
            clipPath={"url(#clip)"}
          />
        )}
      </Svg>
    );
  }
);

enum RedactionStep {
  load = "load",
  loaded = "loaded"
}

const styles = StyleSheet.create({});

export class Redactor extends React.Component {
  state = {
    step: RedactionStep.load,
    resp: null,
    strokeColor: DEFAULT_STROKE_COLOR,
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
          return RNTextDetector.detectFromUri(value.uri);
          // return resizeImage({
          //   uri: value.uri,
          //   displaySize: {
          //     width: value.width,
          //     height: value.height
          //   },
          //   width: value.width,
          //   height: value.height,
          //   originalWidth: value.intrinsicWidth,
          //   originalHeight: value.intrinsicHeight
          // }).then(({ uri, ...other }) => {
          //   console.log(other);
          //   return RNTextDetector.detectFromUri(uri);
          // });
        })
        .filter(res => res !== false)
    );

    const boundingBoxes = flatten(
      responses[0].map(({ lines }) => {
        return lines;
      })
    ).map(({ bounding: { top, left, width, height } }) => {
      const scale =
        this.props.blocks[0].value.width / this.props.blocks[0].value.src.width;
      return {
        top: top * scale - Y_PADDING,
        left: left * scale - X_PADDING,
        height: height * scale + Y_PADDING * 2,
        width: width * scale + X_PADDING * 2,
        id: `${top}, ${left}, ${width}, ${height}`
      };
    });

    this.setState({
      redactablePlaces: boundingBoxes,
      step: RedactionStep.loaded
    });
  };

  canvasRefs = new Map();

  setCanvasRef = id => canvasRef => {
    if (canvasRef) {
      this.canvasRefs.set(id, canvasRef);
    } else {
      this.canvasRefs.delete(id);
    }
  };

  render() {
    const { width, height, blocks } = this.props;
    const { redactablePlaces, strokeColor } = this.state;

    return (
      <View style={{ position: "relative", height, width }}>
        <RedactSVG
          points={redactablePlaces}
          width={width}
          height={height}
          intrinsicHeight={blocks[0].value.src.height}
          intrinsicWidth={blocks[0].value.src.width}
          src={blocks[0].value.uri}
        />

        {redactablePlaces.map(({ top, left, width, height, id }) => (
          <SketchCanvas
            width={width}
            height={height}
            key={id}
            strokeColor={strokeColor}
            strokeWidth={height * 1.05}
            ref={this.setCanvasRef(id)}
            style={{
              position: "absolute",
              height,
              width,
              top,
              left,

              borderRadius: CORNER_RADIUS,
              overflow: "hidden"
            }}
          />
        ))}
      </View>
    );
  }
}
