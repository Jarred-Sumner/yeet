import {
  NativeModules,
  findNodeHandle,
  View,
  ScrollView,
  UIManager
} from "react-native";
import { YeetImageRect, ImageSourceType } from "./imageSearch";
import { PostBlockType, PostFormat } from "../components/NewPost/NewPostFormat";
import {
  EditableNodeStaticPosition,
  EditableNode,
  EditableNodeMap
} from "../components/NewPost/Node/BaseNode";
import Bluebird from "bluebird";
import { BoundsRect } from "./Rect";
import { fromPairs } from "lodash";

const { YeetExporter } = NativeModules;

export type ContentExport = {
  uri: string;
  width: number;
  height: number;
  type: string;
  duration: number;
};

type ExportableYeetImage = {
  width: number;
  height: number;
  source: string;
  mimeType: "image/png" | "image/webp" | "image/jpeg";
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
  format: PostFormat;
  id: string;
  frame: BoundsRect;
};

type ExportableBlock = ExportableImageBlock | ExportableTextBlock;

export type ExportableNode = {
  block: ExportableBlock;
  frame: BoundsRect;
  position: EditableNodeStaticPosition;
};

export type ExportData = {
  blocks: Array<ExportableBlock>;
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
      value: { width, height, source, mimeType, uri, duration }
    };
  } else if (block.type === "text") {
    return {
      type: "text",
      format: block.format,
      viewTag: viewTag,
      contentId: block.id,
      id: block.id,
      frame,
      value: block.value
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

const getEstimatedBounds = (ref: React.Ref<View>): Promise<BoundsRect> =>
  new Promise((resolve, _reject) =>
    UIManager.measure(findNodeHandle(ref), (x, y, width, height) => {
      resolve({ x, y, width, height });
    })
  );

export const startExport = async (
  _blocks: Array<PostBlockType>,
  _nodes: EditableNodeMap,
  refs: Map<string, React.RefObject<View>>,
  ref: React.RefObject<ScrollView>,
  nodeRefs: Map<string, React.RefObject<View>>,
  isServerOnly: boolean
): Promise<[ContentExport, ExportData]> => {
  const blockBoundsMap = new Map<string, BoundsRect>();
  const inlinesBoundsMap = new Map<string, BoundsRect>();

  console.time("Start Measure");

  await Bluebird.map(
    [...refs.entries()],
    ([id, ref]) =>
      getEstimatedBounds(ref.current).then(bounds => {
        blockBoundsMap.set(id, bounds);
        return true;
      }),
    {
      concurrency: 3
    }
  );

  await Bluebird.map(
    [...nodeRefs.entries()],
    ([id, ref]) =>
      getEstimatedBounds(ref).then(bounds => {
        inlinesBoundsMap.set(id, bounds);
        return true;
      }),
    {
      concurrency: 3
    }
  );

  const blocks = _blocks.map(block =>
    createExportableBlock(
      block,
      findNodeHandle(refs.get(block.id).current),
      blockBoundsMap.get(block.id)
    )
  );

  const nodes = [...Object.values(_nodes)].map(node =>
    createExportableNode(
      node,
      findNodeHandle(refs.get(node.block.id).current),
      blockBoundsMap.get(node.block.id),
      inlinesBoundsMap.get(node.block.id),
      findNodeHandle(nodeRefs.get(node.block.id))
    )
  );

  const data: ExportData = {
    blocks,
    nodes,
    bounds: await getEstimatedBounds(ref.current)
  };

  if (process.env.NODE_ENV !== "production") {
    console.log(JSON.stringify(data));
  }

  console.timeEnd("Start Measure");

  return new Promise((resolve, reject) => {
    YeetExporter.startExport(
      JSON.stringify(data),
      isServerOnly,
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve([result, data]);
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
