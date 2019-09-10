import {
  NativeModules,
  findNodeHandle,
  View,
  ScrollView,
  UIManager
} from "react-native";
import { YeetImageRect } from "./imageSearch";
import { PostBlockType, PostFormat } from "../components/NewPost/NewPostFormat";
import {
  EditableNodeStaticPosition,
  EditableNode,
  EditableNodeMap
} from "../components/NewPost/Node/BaseNode";
import Bluebird from "bluebird";
import { BoundsRect } from "./Rect";

const { YeetExporter } = NativeModules;

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
  value: ExportableYeetImage;
  viewTag: number;
  id: string;
  bounds: BoundsRect;
};

type ExportableTextBlock = {
  type: "text";
  value: string;
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
      viewTag: viewTag,
      frame,
      value: { width, height, source, mimeType, uri, duration }
    };
  } else if (block.type === "text") {
    return {
      type: "text",
      format: block.format,
      viewTag: viewTag,
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
  nodeRefs: Map<string, React.RefObject<View>>
) => {
  const blockBoundsMap = new Map<string, BoundsRect>();
  const inlinesBoundsMap = new Map<string, BoundsRect>();

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

  const nodes = [..._nodes.values()].map(node =>
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
    bounds: await getEstimatedBounds(ref.current.getInnerViewNode())
  };

  if (process.env.NODE_ENV !== "production") {
    console.log(JSON.stringify(data));
  }

  return new Promise((resolve, reject) => {
    YeetExporter.startExport(JSON.stringify(data), (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    });
  });
};
