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
};

type ExportableTextBlock = {
  type: "text";
  value: string;
  viewTag: number;
  format: PostFormat;
  id: string;
};

type ExportableBlock = ExportableImageBlock | ExportableTextBlock;

export type ExportableNode = {
  block: ExportableBlock;
  position: EditableNodeStaticPosition;
};

export type ExportData = {
  blocks: Array<ExportableBlock>;
  nodes: Array<ExportableNode>;
  bounds: { x: number; y: number; width: number; height: number };
};

const createExportableBlock = (
  block: PostBlockType,
  viewTag: number
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
      value: { width, height, source, mimeType, uri, duration }
    };
  } else if (block.type === "text") {
    return {
      type: "text",
      format: block.format,
      viewTag: viewTag,

      value: block.value
    };
  } else {
    return null;
  }
};

const createExportableNode = (
  node: EditableNode,
  viewTag: number
): ExportableNode => {
  return {
    block: createExportableBlock(node.block, viewTag),
    position: {
      x: node.position.x,
      rotate: node.position.rotate,
      scale: node.position.scale,
      y: node.position.y
    }
  };
};

const getEstimatedBounds = (ref: React.RefObject<ScrollView>) =>
  new Promise((resolve, _reject) =>
    UIManager.measure(
      findNodeHandle(ref.current.getInnerViewNode()),
      (x, y, width, height) => {
        resolve({ x, y, width, height });
      }
    )
  );

export const startExport = async (
  _blocks: Array<PostBlockType>,
  _nodes: EditableNodeMap,
  refs: Map<string, React.RefObject<View>>,
  ref: React.RefObject<ScrollView>
) => {
  const blocks = _blocks.map(block =>
    createExportableBlock(block, findNodeHandle(refs.get(block.id).current))
  );

  const nodes = [..._nodes.values()].map(node =>
    createExportableNode(node, findNodeHandle(refs.get(node.block.id).current))
  );

  const data: ExportData = {
    blocks,
    nodes,
    bounds: await getEstimatedBounds(ref)
  };

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
