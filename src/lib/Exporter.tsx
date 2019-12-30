import {
  NativeModules,
  findNodeHandle,
  View,
  ScrollView,
  UIManager,
  Image,
  PixelRatio,
  Alert
} from "react-native";
import { isEmpty, isArray, flatten } from "lodash";
import rnTextSize, {
  TSFontSpecs,
  TSMeasureParams
} from "react-native-text-size";

import {
  YeetImageRect,
  ImageSourceType,
  YeetImageContainer,
  ImageMimeType,
  isVideo,
  imageContainerFromMediaSource
} from "./imageSearch";
import {
  PostBlockType,
  PostFormat,
  buildImageBlock,
  buildTextBlock,
  TextTemplate,
  PostLayout,
  POST_WIDTH,
  CAROUSEL_HEIGHT
} from "../components/NewPost/NewPostFormat";
import {
  EditableNodeStaticPosition,
  EditableNode,
  EditableNodeMap,
  buildEditableNode
} from "../components/NewPost/Node/BaseNode";
import Bluebird from "bluebird";
import { BoundsRect, scaleRectByFactor } from "./Rect";
import { fromPairs } from "lodash";
import perf from "@react-native-firebase/perf";
import * as Sentry from "@sentry/react-native";
import { FONT_STYLES } from "./fonts";
import { IS_DEVELOPMENT } from "../../config";
import { getDefaultBorder, getDefaultTemplate } from "./buildPost";

const { YeetExporter } = NativeModules;

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

const getEstimatedBoundsToContainer = (
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
  isServerOnly: boolean
): Promise<[ContentExport, ExportData]> => {
  let hasLongVideo = false;
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

  trace.putMetric("imageCount", imageCount);
  trace.putMetric("videoCount", videoCount);
  trace.putMetric("textCount", textCount);

  const data: ExportData = {
    blocks: flatten(blocks).filter(Boolean),
    nodes: nodes.filter(Boolean),
    bounds: await getEstimatedBounds(ref.current),
    containerNode: findNodeHandle(ref.current)
  };

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

  if (typeof overrides.maxWidth === "number") {
    overrides.maxWidth = overrides.maxWidth * scaleFactor;
  }

  return overrides;
};

const convertExportableBlock = (
  block: ExportableBlock,
  assets: AssetMap,
  scaleFactor: number = 1.0,
  isSticker: Boolean = false
) => {
  const format = isSticker ? PostFormat.sticker : PostFormat.post;

  if (block.type === "image") {
    return buildImageBlock({
      id: block.id,
      image: convertImage(block.value, assets),
      dimensions: scaleRectByFactor(scaleFactor, block.dimensions),
      width: block.dimensions.width * scaleFactor,
      height: block.dimensions.height * scaleFactor,
      autoInserted: false,
      format,
      layout: PostLayout[block.layout] || PostLayout.text
    });
  } else if (block.type === "text") {
    const template = getDefaultTemplate(block.template, format);
    const border = getDefaultBorder(
      block.config?.border ?? block.border,
      template
    );

    return buildTextBlock({
      id: block.id,
      value: isEmpty(block.value) ? "" : block.value,
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
  scaleFactor: number = 1
): Array<PostBlockType> => {
  return blocks
    .map(block => {
      if (isArray(block)) {
        return convertExportedBlocks(block, assets, scaleFactor);
      } else {
        return convertExportableBlock(block, assets, scaleFactor);
      }
    })
    .filter(Boolean);
};

const convertExportedNode = async (
  node: ExportableNode,
  assets: AssetMap,
  scaleFactor: number = 1,
  xPadding: number = 0,
  yPadding: number = 0,
  size: BoundsRect
) => {
  const block = convertExportableBlock(node.block, assets, scaleFactor, true);
  if (!block) {
    return null;
  }

  const _position = {
    x: node.position.x ?? 0,
    y: node.position.y ?? 0
  };
  let { rotate, scale } = node.position;
  let { x, y } = scaleRectByFactor(scaleFactor, _position);

  const { maxWidth, textAlign, fontSize, fontStyle = "normal" } =
    block.config?.overrides ?? {};

  const isRightOriented =
    _position.x +
      ((1 / scaleFactor) * block.config?.overrides?.maxWidth ?? 0) / 2 >
    size.width / 2;
  const isLeftOriented =
    _position.x +
      +(((1 / scaleFactor) * block.config?.overrides?.maxWidth ?? 0) / 2) <
    size.width / 2;
  const isTopOriented = _position.y < size.height / 2;
  const isBottomOriented = _position.y > size.height / 2;

  if (xPadding > 0 && size && isLeftOriented) {
    x = Math.max(
      xPadding,
      Math.min(x - xPadding * 2, size.width - xPadding - maxWidth / 2)
    );
  } else if (xPadding > 0 && size && isRightOriented) {
    x = Math.max(
      xPadding,
      Math.min(x + xPadding * 2, size.width - xPadding - maxWidth / 2)
    );
  }

  if (yPadding > 0 && size) {
    y = Math.max(
      yPadding,
      Math.min(y + yPadding + fontSize, size.height - yPadding)
    );
  }

  if (block.type === "text" && isEmpty(block.value)) {
    block.value = "Tap to edit text";
  }

  return [
    block.id,
    buildEditableNode({
      block,
      x,
      y,
      rotate,
      scale
    })
  ];
};

export const convertExportedNodes = async (
  nodes: Array<ExportableNode>,
  assets: AssetMap,
  scaleFactor: number = 1,
  xPadding: number = 0,
  yPadding: number = 0,
  size: BoundsRect
): Promise<EditableNodeMap> => {
  const convertedNodes = await Bluebird.map(
    nodes,
    node =>
      convertExportedNode(node, assets, scaleFactor, xPadding, yPadding, size),
    {
      concurrency: 2
    }
  );

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
