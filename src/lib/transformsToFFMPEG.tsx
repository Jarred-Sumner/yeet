import {
  EditableNodeMap,
  EditableNodePosition
} from "../components/NewPost/Node/BaseNode";
import { PostBlockType } from "../components/NewPost/NewPostFormat";
import { YeetImageRect } from "./imageSearch";

export const filtersForTransforms = ({
  width,
  height,
  scale,
  rotate,
  videoOffset,
  x,
  y,
  absoluteX,
  absoluteY
}: {
  width: number;
  height: number;
  scale: number;
  rotate: number;
  x: number;
  y: number;
  videoOffset: number;
  absoluteX: number;
  absoluteY: number;
}) => {
  const filters = [];

  filters.push(
    cropFilter({ offset: videoOffset, x, y, maxX: width, maxY: height })
  );

  if (scale !== 1.0) {
    filters.push(
      scaleFilter({
        width: width * scale,
        height: height * scale,
        offset: videoOffset
      })
    );
  }

  if (rotate % 360 !== 0) {
    filters.push(
      rotateFilter({
        degrees: rotate,
        offset: videoOffset
      })
    );
  }

  filters.push(
    overlayFilter({
      offset: videoOffset,
      x: absoluteX,
      y: absoluteY
    })
  );

  return filters;
};

const getMaxSize = (
  dimensions: YeetImageRect,
  position: EditableNodePosition = {
    scale: 1.0,
    x: 0,
    y: 0,
    rotate: 0
  }
) => {
  return {
    width: (dimensions.maxX - dimensions.x) * position.scale + position.x,
    height: (dimensions.maxY - dimensions.y) * position.scale + position.y
  };
};

export const getCommand = (
  blocks: Array<PostBlockType>,
  inlines: EditableNodeMap,
  fileName: string
) => {
  const filters = [];
  const uris = [];
  let maxX = 0;
  let maxY = 0;

  let videoOffset = -1;
  blocks.map(block => {
    if (block.type === "image") {
      videoOffset = videoOffset + 1;
      const dimensions = block.config.dimensions;
      uris.push(block.value.image.uri);
      filters.push(
        filtersForTransforms({
          width: dimensions.maxX - dimensions.x,
          height: dimensions.maxY - dimensions.y,
          x: dimensions.x,
          y: dimensions.y,
          scale: 1.0,
          rotate: 0,
          videoOffset,
          absoluteX: 0,
          absoluteY: 0
        })
      );

      const { width, height } = getMaxSize(dimensions);

      if (maxX < width) {
        maxX = width;
      }

      if (maxY < height) {
        maxY = height;
      }
    }
  });

  [...inlines.entries()].map(([id, node]) => {
    const block = node.block;
    if (block.type === "image") {
      videoOffset = videoOffset + 1;
      const dimensions = block.config.dimensions;
      uris.push(block.value.image.uri);

      filters.push(
        filtersForTransforms({
          width: dimensions.maxX - dimensions.x,
          height: dimensions.maxY - dimensions.y,
          x: dimensions.x,
          y: dimensions.y,
          scale: node.position.scale,
          rotate: node.position.rotate,
          videoOffset,
          absoluteX: node.position.x,
          absoluteY: node.position.y
        })
      );

      const { width, height } = getMaxSize(dimensions, node.position);

      if (maxX < width) {
        maxX = width;
      }

      if (maxY < height) {
        maxY = height;
      }
    }
  });

  const inputs = uris.map(uri => `-i ${uri}`).join(" ");
  const filterComplex = `-filter_complex ${filters
    .map(filterList => filterList.join("; "))
    .join("")}`;

  return `${inputs} ${filterComplex} -s ${Math.floor(maxX)}x${Math.floor(
    maxY
  )} ${fileName}.webm`;
};

const overlayFilter = ({ offset, x, y }) =>
  `[${offset}:v]overlay=${Math.floor(x)}:${Math.floor(y)}`;

const cropFilter = ({ offset, x, y, maxX, maxY }) =>
  `[${offset}:v]crop=${Math.floor(maxX)}:${Math.floor(maxY)}:${Math.floor(
    x
  )}:${Math.floor(y)}`;

const scaleFilter = ({ offset, width, height }) =>
  `[${offset}:v]scale=w=${Math.floor(width)}:h=${Math.floor(height)}`;

const rotateFilter = ({ degrees, offset }) =>
  `[${offset}:v]rotate=${Math.floor(degrees / 360) * -1}*PI/180`;
