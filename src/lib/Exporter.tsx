import perf from "@react-native-firebase/perf";
import * as Sentry from "@sentry/react-native";
import Bluebird from "bluebird";
import { flatten, fromPairs, isArray, isEmpty, uniq, isFinite } from "lodash";
import { findNodeHandle, NativeModules, UIManager, View } from "react-native";
import chroma from "chroma-js";
import * as TransformMatrix from "transformation-matrix";
import {
  buildImageBlock,
  buildTextBlock,
  PostBlockType,
  PostFormat,
  PostLayout,
  POST_WIDTH,
  TextTemplate
} from "../components/NewPost/NewPostFormat";
import {
  buildEditableNode,
  EditableNode,
  EditableNodeMap,
  EditableNodeStaticPosition
} from "../components/NewPost/Node/BaseNode";
import {
  ExampleMap,
  getDefaultBorder,
  getDefaultTemplate,
  isFixedSizeBlock,
  isTextBlock,
  isImageBlock
} from "./buildPost";
import {
  ImageMimeType,
  ImageSourceType,
  isVideo,
  YeetImageContainer,
  YeetImageRect
} from "./imageSearch";
import { BoundsRect, scaleRectByFactor, isTapInside } from "./Rect";
import {
  getFontSize,
  getHighlightInset
} from "../components/NewPost/Text/TextBlockUtils";
import { BlockMap, ImagePostBlock } from "./enums";
import { Rectangle } from "./Rectangle";

const { YeetExporter } = NativeModules;

const rgbColorArray = (colors: Array<number>) => {
  return [colors[0] / 255, colors[1] / 255, colors[2] / 255, colors[3]];
};

export type ContentExport = {
  uri: string;
  width: number;
  height: number;
  type: string;
  thumbnail: {
    uri: string;
    width: number;
    height: number;
    type: string;
  };
  duration: number;
  colors: {
    background: string | null;
    primary: string | null;
    detail: string | null;
    secondary: string | null;
  };
};

export type ExportableYeetImage = {
  width: number;
  height: number;
  source: string;
  mimeType: ImageMimeType;
  uri: string;
  duration: number;
};

type ExportableImageBlock = {
  dimensions: YeetImageRect;
  type: "image";
  format: PostFormat;
  contentId: string;
  value: ExportableYeetImage;
  viewTag: number;
  id: string;
  bounds: BoundsRect;
};

type ExportableTextBlock = {
  type: "text";
  value: string;
  contentId: string;
  viewTag: number;
  template: TextTemplate;
  format: PostFormat;
  id: string;
  frame: BoundsRect;
};

type ExportableBlock = ExportableImageBlock | ExportableTextBlock;

export type ExportableNode = {
  block: ExportableBlock;
  frame: BoundsRect;
  viewTag: number;
  position: EditableNodeStaticPosition;
};

export type ExportData = {
  blocks: Array<Array<ExportableBlock>>;
  nodes: Array<ExportableNode>;
  bounds: BoundsRect;
};

const createExportableBlock = (
  block: PostBlockType,
  viewTag: number,
  frame: BoundsRect
): ExportableBlock => {
  if (block.type === "image") {
    const {
      width,
      height,
      source,
      mimeType,
      uri,
      duration
    } = block.value.image;
    return {
      type: "image",
      format: block.format,
      dimensions: block.config.dimensions,
      id: block.id,
      contentId: block.value.id,
      viewTag: viewTag,
      frame,
      config: block.config,
      value: { width, height, source, mimeType, uri, duration }
    };
  } else if (block.type === "text") {
    return {
      type: "text",
      format: block.format,
      viewTag: viewTag,
      template: block.config.template,
      contentId: block.id,
      id: block.id,
      frame,
      value: block.value,
      config: block.config
    };
  } else {
    return null;
  }
};

const createExportableNode = (
  node: EditableNode,
  viewTag: number,
  blockBounds: BoundsRect,
  nodeBounds: BoundsRect,
  nodeViewTag: number
): ExportableNode => {
  return {
    block: createExportableBlock(node.block, viewTag, blockBounds),
    frame: nodeBounds,
    viewTag: nodeViewTag,
    position: {
      x: node.position.x,
      rotate: node.position.rotate,
      scale: node.position.scale,
      y: node.position.y
    }
  };
};

export const getEstimatedBounds = (ref: React.Ref<View>): Promise<BoundsRect> =>
  new Promise((resolve, _reject) =>
    UIManager.measure(findNodeHandle(ref), (x, y, width, height) => {
      resolve({
        x,
        y,
        width,
        height
      });
    })
  );

export const getEstimatedBoundsToContainer = (
  ref: React.Ref<View>,
  container: React.Ref<View>
): Promise<BoundsRect> =>
  new Promise((resolve, _reject) => {
    let refHandle = ref?.boundsHandle ?? findNodeHandle(ref);

    UIManager.measureLayout(
      refHandle,
      findNodeHandle(container?.getNode() ?? container),
      err => reject(err),
      (x, y, width, height) => {
        resolve({
          x,
          y,
          width,
          height
        });
      }
    );
  });

export const startExport = async (
  _blocks: Array<Array<PostBlockType>>,
  _nodes: EditableNodeMap,
  refs: Map<string, React.RefObject<View>>,
  ref: React.RefObject<View>,
  nodeRefs: Map<string, React.RefObject<View>>,
  isServerOnly: boolean,
  minX: number,
  minY: number,
  backgroundColor: string
): Promise<[ContentExport, ExportData]> => {
  let hasLongVideo = false;
  console.log("A");
  const trace = await perf().startTrace("YeetExporter_startExport");
  let videoCount = 0;
  let imageCount = 0;
  let textCount = 0;

  const blockBoundsMap = new Map<string, BoundsRect>();
  const inlinesBoundsMap = new Map<string, BoundsRect>();

  const measureTime = new Date().getTime();
  await Bluebird.map(
    [...refs.entries()],
    ([id, _ref]) =>
      _ref.current &&
      getEstimatedBoundsToContainer(_ref.current, ref.current).then(bounds => {
        blockBoundsMap.set(id, bounds);
        return true;
      }),
    {
      concurrency: 3
    }
  );

  console.log("B");
  await Bluebird.map(
    [...nodeRefs.entries()],
    ([id, _ref]) =>
      _ref &&
      getEstimatedBoundsToContainer(_ref, ref.current).then(bounds => {
        inlinesBoundsMap.set(id, bounds);
        return true;
      }),
    {
      concurrency: 3
    }
  );

  console.log("C");
  const measureDuration = new Date().getTime() - measureTime;
  trace.putMetric("measure", measureDuration);

  const blocks = _blocks.map(row =>
    row.map(block => {
      const blockRef = refs.get(block.id).current;

      if (!blockRef) {
        return null;
      }

      if (block.type === "image") {
        if (isVideo(block.value.image.mimeType)) {
          videoCount = videoCount + 1;

          if (block.value.image.duration > 7.0) {
            hasLongVideo = true;
          }
        } else {
          imageCount = imageCount + 1;
        }
      } else {
        textCount = textCount + 1;
      }

      return createExportableBlock(
        block,
        findNodeHandle(blockRef),
        blockBoundsMap.get(block.id)
      );
    })
  );
  console.log("D");

  const nodes = [...Object.values(_nodes)].map(node => {
    const blockRef = refs.get(node.block.id).current;
    const nodeRef = nodeRefs.get(node.block.id);

    if (!blockRef || !nodeRef) {
      return null;
    }

    const { block } = node;

    if (block.type === "image") {
      if (isVideo(block.value.image.mimeType)) {
        videoCount = videoCount + 1;

        if (block.value.image.duration > 7.0) {
          hasLongVideo = true;
        }
      } else {
        imageCount = imageCount + 1;
      }
    } else {
      textCount = textCount + 1;
    }

    return createExportableNode(
      node,
      findNodeHandle(blockRef),
      blockBoundsMap.get(node.block.id),
      inlinesBoundsMap.get(node.block.id),
      findNodeHandle(nodeRef)
    );
  });

  console.log("E");
  trace.putMetric("imageCount", imageCount);
  trace.putMetric("videoCount", videoCount);
  trace.putMetric("textCount", textCount);

  const data: ExportData = {
    blocks: flatten(blocks).filter(Boolean),
    nodes: nodes.filter(Boolean),
    backgroundColor: rgbColorArray(chroma(backgroundColor).rgba(true)),
    bounds: {
      ...(await getEstimatedBounds(ref.current)),
      x: minX,
      y: minY
    },
    containerNode: findNodeHandle(ref.current)
  };

  console.log("F");
  if (process.env.NODE_ENV !== "production") {
    console.log(JSON.stringify(data));
  }

  return new Promise((resolve, reject) => {
    Sentry.addBreadcrumb({
      category: "action",
      message: "Start content export",
      level: Sentry.Severity.Info,
      data: {
        imageCount,
        videoCount,
        textCount,
        measureDuration
      }
    });

    const startTime = new Date().getTime();
    YeetExporter.startExport(
      JSON.stringify(data),
      isServerOnly,
      (err, result) => {
        trace.stop();

        if (err) {
          Sentry.captureException(err);
          reject(err);
          return;
        }

        Sentry.addBreadcrumb({
          category: "action",
          message: "Finish content export",
          level: Sentry.Severity.Info,
          data: {
            imageCount,
            videoCount,
            textCount,
            measureDuration,
            duration: new Date().getTime() - startTime
          }
        });

        resolve([
          result,
          {
            ...data,
            blocks
          }
        ]);
      }
    );
  });
};

export const getMediaToUpload = (
  data: ExportData
): { [key: string]: ExportableYeetImage } => {
  const nodeBlocks = Object.values(data.nodes).map(node => node.block);
  return fromPairs(
    [...data.blocks, ...nodeBlocks]
      .filter(
        ({ type, value }) =>
          type === "image" &&
          typeof value === "object" &&
          value.source === ImageSourceType.cameraRoll
      )
      .map((imageBlock: ExportableImageBlock) => {
        return [imageBlock.contentId, imageBlock.value];
      })
  );
};

export type AssetMap = {
  [url: string]: string;
};

export const convertImage = (
  image: ExportableYeetImage,
  assetMap: AssetMap
): YeetImageContainer => {
  const uri =
    typeof assetMap[image.uri] === "string" ? assetMap[image.uri] : image.uri;

  return {
    id: uri,
    image: {
      width: image.width,
      height: image.height,
      uri: uri,
      source: ImageSourceType[image.source],
      duration: image.duration,
      mimeType: image.mimeType
    }
  };
};

const sanitizeOverrides = (_overrides, scaleFactor) => {
  const overrides = {
    ..._overrides
  };

  if (isFinite(overrides.maxWidth)) {
    overrides.maxWidth = Math.min(
      Math.max(overrides.maxWidth * scaleFactor, 0),
      POST_WIDTH
    );
  }

  return overrides;
};

const convertExportableBlock = (
  block: ExportableBlock,
  assets: AssetMap,
  scaleFactor: number = 1.0,
  isSticker: Boolean = false,
  examples: ExampleMap = {}
) => {
  const format = isSticker ? PostFormat.sticker : PostFormat.post;

  if (block.type === "image") {
    const imageBlock = buildImageBlock({
      id: block.id,
      image: convertImage(block.value, assets),
      dimensions: scaleRectByFactor(scaleFactor, block.dimensions),
      width: block.dimensions.width * scaleFactor,
      height: block.dimensions.height * scaleFactor,
      autoInserted: false,
      format,
      layout: PostLayout[block.layout] || PostLayout.text
    });
    imageBlock.frame = block.frame ?? imageBlock.config.dimensions;

    return imageBlock;
  } else if (block.type === "text") {
    const template = getDefaultTemplate(block.template, format);
    const border = getDefaultBorder(
      block.config?.border ?? block.border,
      template
    );

    const hasExamples = examples ? !isEmpty(examples[block.id]) : false;
    let value = block.value;
    if (typeof value !== "string" || value.trim().length === 0) {
      value = "";
    }

    if (hasExamples) {
      const uniqueExamples = uniq(
        examples[block.id].filter(
          text => typeof text === "string" && text.trim().length > 0
        ) ?? []
      );

      if (
        value === "" &&
        isArray(examples[block.id]) &&
        examples[block.id].length > 1 &&
        uniqueExamples.length === 1
      ) {
        value = uniqueExamples[0];
      }
    }

    return buildTextBlock({
      id: block.id,
      value,

      placeholder: block.value || "Tap to edit text",
      template: template,
      autoInserted: false,
      border: border,
      layout: block.config?.layout,
      overrides: sanitizeOverrides(block.config?.overrides, scaleFactor),
      format,
      layout: PostLayout[block.layout] || PostLayout.text
    });
  } else {
    console.warn("Missing type", block.type);
    return null;
  }
};

export const convertExportedBlocks = (
  blocks: Array<ExportableBlock>,
  assets: AssetMap,
  scaleFactor: number = 1,
  examples: ExampleMap = {}
): Array<PostBlockType> => {
  return blocks
    .map(block => {
      if (isArray(block)) {
        return convertExportedBlocks(block, assets, scaleFactor, examples);
      } else {
        return convertExportableBlock(
          block,
          assets,
          scaleFactor,
          false,
          examples
        );
      }
    })
    .filter(Boolean);
};

const convertExportedNode = (
  node: ExportableNode,
  assets: AssetMap,
  scaleFactor: number = 1,
  xPadding: number = 0,
  yPadding: number = 0,
  _size: BoundsRect,
  examples: ExampleMap = {},
  relativeBlock: PostBlockType | null = null
) => {
  let size = scaleRectByFactor(scaleFactor, _size);
  const relativeSize = relativeBlock
    ? scaleRectByFactor(scaleFactor, relativeBlock?.frame ?? _size)
    : size;

  const block = convertExportableBlock(
    node.block,
    assets,
    scaleFactor,
    true,
    examples
  );
  if (!block) {
    return null;
  }

  if (block.type === "text" && isEmpty(block.value)) {
    const uniqueExamples = uniq(
      examples[block.id].filter(
        text => typeof text === "string" && text.trim().length > 0
      )
    );

    if (
      examples[block.id].length > 1 &&
      uniqueExamples.length < examples[block.id].length &&
      uniqueExamples.length === 1
    ) {
      block.value = uniqueExamples[0].trim();
    } else {
      block.value = "Tap to add text";
    }
  }

  const isFixedSize = isFixedSizeBlock(block);

  const _position = {
    x: node.position.x ?? 0,
    y: node.position.y ?? 0
  };
  let { rotate, scale } = node.position;
  let position = scaleRectByFactor(scaleFactor, _position);

  let { x, y } = position;

  const inset = getHighlightInset(block);

  let {
    maxWidth = 0,
    numberOfLines = 1,
    textAlign,
    fontSize,
    fontStyle = "normal"
  } = block.config?.overrides ?? {};

  let isBottomCentered = block.id.toLowerCase() === "bottom-text";
  let isTopCentered = block.id.toLowerCase() === "top-text";

  let canAutoCenter = true;

  if (isFinite(maxWidth) && !(isTopCentered || isBottomCentered)) {
    if (maxWidth >= size.width) {
      let maxWidthOffset = maxWidth - size.width;
      x = x - maxWidthOffset / 2;
      block.config.overrides.maxWidth = size.width;
      maxWidth = size.width;
      canAutoCenter = false;
    }
  }

  let minY = relativeBlock?.frame?.y ?? 0;

  let verticalAlign = isFixedSize ? "top" : "bottom";

  let horizontalAlign;

  if (relativeSize.width * 0.8 < maxWidth) {
    horizontalAlign = "center";
  } else if ((x + maxWidth) / size.width < 0.5) {
    horizontalAlign = "left";
  } else if ((x + maxWidth) / size.width > 0.5) {
    horizontalAlign = "right";
  }

  const hasExactHeight = isFinite(block.frame?.height);

  let estimatedHeight = hasExactHeight
    ? block.frame?.height
    : (numberOfLines || 1) * getFontSize(block) * 1.25 + yPadding;
  const bottomY = y + estimatedHeight;
  const yPercent = (_position.y + estimatedHeight) / relativeSize.height;

  if (!isBottomCentered && !isTopCentered) {
    if (yPercent > 0.8 && (isFixedSize || horizontalAlign === "center")) {
      verticalAlign = "bottom";
    } else if (isFixedSize) {
      verticalAlign = "top";
    }
  }

  if (isBottomCentered) {
    verticalAlign = "bottom";
  } else if (isTopCentered) {
    verticalAlign = "top";
  }

  const relativeRect = Rectangle.fromFrame(relativeSize);

  // if (y > size.height * 0.75) {
  //   verticalAlign = "bottom";
  // }

  // Handle bottom center
  if (
    horizontalAlign === "center" &&
    verticalAlign === "bottom" &&
    canAutoCenter
  ) {
    y =
      yPercent > 1.0
        ? size.height - yPadding - relativeRect.top
        : size.height - yPadding;
  } else if (
    horizontalAlign === "center" &&
    verticalAlign === "top" &&
    canAutoCenter
  ) {
    y = Math.max(
      Math.min(
        y - (relativeRect?.top ?? 0) - yPadding - inset,
        size.height - yPadding - inset
      ),
      0
    );
  } else if (!hasExactHeight && isFixedSize && verticalAlign === "top") {
    y = Math.max(
      minY,
      yPadding,
      Math.min(y - yPadding - inset, size.height - yPadding)
    );
  } else if (hasExactHeight && verticalAlign === "top") {
    y = Math.max(
      yPadding - inset,
      Math.min(
        y + yPadding + inset,
        size.height - block.frame.height - yPadding - inset
      )
    );
  } else if (hasExactHeight && verticalAlign === "bottom") {
    y = Math.max(
      yPadding - inset,
      Math.min(y + yPadding + inset, size.height - yPadding)
    );
  }

  if (horizontalAlign === "left") {
    x = Math.max(
      xPadding,
      Math.min(x, size.width - xPadding - maxWidth / 2 - inset)
    );
  } else if (horizontalAlign === "right") {
    x = Math.max(
      xPadding,
      Math.min(x + xPadding, size.width - maxWidth + inset * 2)
    );
  } else if (horizontalAlign === "center") {
    block.config.overrides.maxWidth = size.width - xPadding * 2;
    x = xPadding;
  }

  console.log({
    y,
    x,
    minY,
    bottomY,
    relativeRect,
    yPercent,
    verticalAlign,
    yPadding,
    horizontalAlign,
    canAutoCenter
  });
  return [
    block.id,
    buildEditableNode({
      block,
      x,
      y,
      rotate,

      verticalAlign,
      scale
    })
  ];
};

export const convertExportedNodes = (
  nodes: Array<ExportableNode>,
  assets: AssetMap,
  scaleFactor: number = 1,
  xPadding: number = 0,
  yPadding: number = 0,
  size: BoundsRect,
  examples: ExampleMap = {},
  _blocks: PostBlockType[]
): EditableNodeMap => {
  if (isEmpty(nodes)) {
    return {};
  }

  const blocks = flatten(_blocks ?? []);
  const convertedNodes = nodes.map(node => {
    const relativeBlock = blocks.find(block => {
      if (isImageBlock(block)) {
        let _block = block as ImagePostBlock;
        if (_block.frame !== null) {
          const _frame = scaleRectByFactor(1 / scaleFactor, _block.frame);
          return isTapInside(_frame, node.position);
        }
      } else if (isTextBlock(block)) {
        return false;
      }
    });
    return convertExportedNode(
      node,
      assets,
      scaleFactor,
      xPadding,
      yPadding,
      size,
      examples,
      relativeBlock
    );
  });

  return fromPairs(convertedNodes.filter(Boolean));
};

const isValidLayout = (
  layout: PostLayout,
  blocks: Array<Array<PostBlockType>>
) => {
  if (!PostLayout[layout]) {
    return false;
  }

  const _blocks = flatten(blocks);

  const blockTypes = _blocks.map(({ type }) => type);

  if (
    layout === PostLayout.media &&
    (blocks.length > 1 || blockTypes[0] !== "image")
  ) {
    return false;
  } else if (
    [PostLayout.verticalTextMedia, PostLayout.horizontalTextMedia].includes(
      layout
    ) &&
    (blocks.length > 2 || blockTypes[0] !== "text" || blockTypes[1] !== "image")
  ) {
    return false;
  } else if (
    [PostLayout.verticalMediaText, PostLayout.horizontalMediaText].includes(
      layout
    ) &&
    (blocks.length > 2 || blockTypes[0] !== "image" || blockTypes[1] !== "text")
  ) {
    return false;
  } else {
    return true;
  }
};

export const guesstimateLayout = (
  _defaultLayout: PostLayout,
  blocks: Array<Array<PostBlockType>>
) => {
  if (isValidLayout(_defaultLayout, blocks)) {
    return _defaultLayout;
  }
  const _blocks = flatten(blocks);
  const blockTypes = _blocks.map(({ type }) => type);

  if (_blocks.length === 1) {
    return PostLayout[_blocks[0]?.layout] || PostLayout.media;
  } else if (_blocks.length === 2) {
    const [firstRow, secondRow] = blocks;

    const isOnlyImages = blockTypes.every(type => type === "image");

    if (firstRow && secondRow && isOnlyImages) {
      return PostLayout.verticalMediaMedia;
    } else if (isOnlyImages) {
      return PostLayout.horizontalMediaMedia;
    } else if (!isOnlyImages && firstRow && secondRow) {
      if (_blocks[0].type === "image") {
        return PostLayout.verticalMediaText;
      } else {
        return PostLayout.verticalTextMedia;
      }
    } else {
      return PostLayout.verticalTextMedia;
    }
  } else {
    return PostLayout.media;
  }
};
