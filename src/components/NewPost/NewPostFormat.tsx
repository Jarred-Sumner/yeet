import nanoid from "nanoid/non-secure";
import { SPACING, COLORS } from "../../lib/styles";
import { getInset } from "react-native-safe-area-view";
import { YeetImageContainer, YeetImageRect } from "../../lib/imageSearch";
import { TOP_Y, SCREEN_DIMENSIONS } from "../../../config";
import {
  scaleToWidth,
  scaleRectToWidth,
  scaleRectToHeight
} from "../../lib/Rect";

export const CAROUSEL_HEIGHT = 40 + getInset("top") + SPACING.half;

export const POST_WIDTH = SCREEN_DIMENSIONS.width;

export const MAX_POST_HEIGHT = SCREEN_DIMENSIONS.height - TOP_Y - 100;

const MAX_BLOCK_WIDTH = POST_WIDTH;
const MAX_BLOCK_HEIGHT = MAX_POST_HEIGHT;

const VERTICAL_IMAGE_DIMENSIONS = {
  width: MAX_BLOCK_WIDTH,
  height: MAX_BLOCK_HEIGHT / 3
};

const HORIZONTAL_IMAGE_DIMENSIONS = {
  width: MAX_BLOCK_WIDTH / 2,
  height: MAX_BLOCK_WIDTH
};

export enum PostFormat {
  post = "post",
  sticker = "sticker",
  comment = "comment"
}

export enum PostLayout {
  horizontalTextMedia = "horizontalTextMedia",
  verticalTextMedia = "verticalTextMedia",

  verticalMediaText = "verticalMediaText",
  horizontalMediaText = "horizontalMediaText",

  media = "media",
  text = "text",

  verticalMediaMedia = "verticalMediaMedia",
  horizontalMediaMedia = "horizontalMediaMedia"
}

export const minImageWidthByFormat = (format: PostFormat) => {
  if (format === PostFormat.sticker) {
    return SCREEN_DIMENSIONS.width * 0.75;
  } else {
    return POST_WIDTH;
  }
};

interface PostBlock {
  type: "text" | "image";
  required: boolean;
  format: PostFormat;
  layout: PostLayout;
  config: {};
  autoInserted: boolean;
  id: string;
}

export type TextPostBlock = PostBlock & {
  type: "text";
  value: string;
  config: {
    placeholder?: string;
    minHeight?: number;
    overrides: Object;
  };
};

export type ImagePostBlock = PostBlock & {
  type: "image";
  value: YeetImageContainer;
  config: {
    dimensions: YeetImageRect;
  };
};

export type PostBlockType = TextPostBlock | ImagePostBlock;

export type NewPostType = {
  blocks: Array<PostBlockType>;
  height: number;
  width: number;
  format: PostFormat;
  layout: PostLayout;
};

export const DEFAULT_TEXT_COLOR = "#f1f1f1";
export const DEFAULT_TEXT_BACKGROUND_COLOR = "#121212";

export const DEFAULT_FORMAT = PostFormat.post;

export type ChangeBlockFunction = (change: PostBlockType) => void;

export const buildTextBlock = ({
  value,
  format,
  layout,
  autoInserted,
  minHeight,
  placeholder,
  overrides = {},
  id = null,
  required = true
}): TextPostBlock => {
  return {
    type: "text",
    id: id ?? generateBlockId(),
    format,
    layout,
    value,
    autoInserted,
    required,
    config: {
      placeholder,
      minHeight,
      overrides
    }
  };
};

export const buildImageBlock = ({
  image,
  width,
  height,
  autoInserted,
  layout,
  required = true,
  placeholder = false,
  id: _id,
  format,
  dimensions = {}
}: {
  image: YeetImageContainer;
  layout: PostLayout;
  autoInserted: boolean;
  format: PostFormat;
  dimensions: Partial<YeetImageRect>;
}): ImagePostBlock => {
  const id = _id || generateBlockId();

  if (placeholder) {
    return {
      type: "image",
      id,
      layout,
      format,
      autoInserted,
      required,
      value: null,
      config: {
        dimensions: null
      }
    };
  }

  const { width: _width, height: _height, ..._dimensions } = dimensions;

  return {
    type: "image",
    id,
    format,
    layout,
    autoInserted,
    required,
    value: image,
    config: {
      dimensions: Object.assign(
        {},
        {
          width: width || _width,
          height: height || _height,
          x: 0,
          y: 0,
          maxX: width,
          maxY: height
        },
        _dimensions
      )
    }
  };
};

const scaleImageBlockToWidth = (
  width: number,
  block: ImagePostBlock
): ImagePostBlock => {
  return {
    ...block,
    config: {
      ...block.config,
      dimensions: scaleRectToWidth(width, block.config.dimensions)
    }
  };
};

const scaleImageBlockToHeight = (
  height: number,
  block: ImagePostBlock
): ImagePostBlock => {
  return {
    ...block,
    config: {
      ...block.config,
      dimensions: scaleRectToHeight(height, block.config.dimensions)
    }
  };
};

export const isPlaceholderImageBlock = (block: ImagePostBlock) => {
  return block.type === "image" && block.value === null;
};

export const presetsByFormat = {
  [PostFormat.comment]: {
    textTop: 0,
    paddingTop: 0,
    padding: 0,
    borderRadius: 4
  },
  [PostFormat.post]: {
    borderRadius: 8,
    paddingTop: 0,
    textTop: 0,
    paddingHorizontal: SPACING.normal,
    paddingVertical: SPACING.normal,
    backgroundColor: "#000",
    color: "white"
  }
};

export enum FocusType {
  panning = 2,
  absolute = 1,
  static = 0
}

const blocksForFormat = (
  format: PostFormat,
  layout: PostLayout,
  _blocks: Array<PostBlockType>
): Array<PostBlockType> => {
  let blocks = [..._blocks];

  if (format === PostFormat.comment) {
    return [
      blocks.find(block => block.type === "text") ??
        buildTextBlock({
          value: "",
          placeholder: "",
          autoInserted: true,
          id: generateBlockId(),
          format: PostFormat.comment,
          layout
        })
    ];
  }

  switch (layout) {
    case PostLayout.horizontalMediaMedia: {
      blocks = blocks.filter(block => block.type === "image").slice(0, 2);

      for (let i = blocks.length; i < 2; i++) {
        blocks.push(
          buildImageBlock({
            image: null,
            autoInserted: true,
            format,
            layout,
            dimensions: HORIZONTAL_IMAGE_DIMENSIONS
          })
        );
      }

      return blocks.map(block =>
        scaleImageBlockToWidth(HORIZONTAL_IMAGE_DIMENSIONS.width, block)
      );
    }
    case PostLayout.verticalMediaMedia: {
      blocks = blocks.filter(block => block.type === "image").slice(0, 2);

      let dimensions = VERTICAL_IMAGE_DIMENSIONS;

      if (blocks.length === 1) {
        dimensions = blocks[0].config.dimensions;

        if (dimensions.height < 200) {
          dimensions = {
            ...dimensions,
            height: Math.max(dimensions.height, 200)
          };
        }
      }

      for (let i = blocks.length; i < 2; i++) {
        blocks.push(
          buildImageBlock({
            image: null,
            autoInserted: true,
            format,
            layout,
            dimensions
          })
        );
      }

      return blocks.map(block =>
        scaleImageBlockToWidth(VERTICAL_IMAGE_DIMENSIONS.width, block)
      );
    }
    case PostLayout.verticalTextMedia: {
      const imageBlock =
        blocks.find(block => block.type === "image") ??
        buildImageBlock({
          image: null,
          autoInserted: true,
          format,
          layout,
          dimensions: VERTICAL_IMAGE_DIMENSIONS
        });

      const textBlock =
        blocks.find(block => block.type === "text") ??
        buildTextBlock({
          value: "",
          placeholder: "Tap to edit text",
          autoInserted: true,
          format,
          layout
        });

      textBlock.config.minHeight = null;

      return [
        textBlock,
        scaleImageBlockToWidth(VERTICAL_IMAGE_DIMENSIONS.width, imageBlock)
      ];
    }
    case PostLayout.verticalMediaText: {
      const imageBlock = scaleImageBlockToWidth(
        VERTICAL_IMAGE_DIMENSIONS.width,
        blocks.find(block => block.type === "image") ??
          buildImageBlock({
            image: null,
            autoInserted: true,
            format,
            layout,
            dimensions: VERTICAL_IMAGE_DIMENSIONS
          })
      );

      const textBlock =
        blocks.find(block => block.type === "text") ??
        buildTextBlock({
          value: "",
          placeholder: "Tap to edit text",
          autoInserted: true,
          format,
          layout
        });

      textBlock.config.minHeight = null;

      return [imageBlock, textBlock];
    }
    case PostLayout.horizontalMediaText: {
      const imageBlock = scaleImageBlockToWidth(
        HORIZONTAL_IMAGE_DIMENSIONS.width,
        blocks.find(block => block.type === "image") ??
          buildImageBlock({
            image: null,
            autoInserted: true,
            format,
            layout,
            dimensions: {
              width: MAX_BLOCK_WIDTH / 2,
              height: MAX_BLOCK_WIDTH
            }
          })
      );

      const textBlock: TextPostBlock =
        blocks.find(block => block.type === "text") ??
        buildTextBlock({
          value: "",
          placeholder: "Tap to edit text",
          autoInserted: true,
          format,
          layout
        });

      textBlock.config.minHeight = imageBlock.config.dimensions.maxY;

      return [imageBlock, textBlock];
    }
    case PostLayout.horizontalTextMedia: {
      const imageBlock: ImagePostBlock = scaleImageBlockToWidth(
        HORIZONTAL_IMAGE_DIMENSIONS.width,
        blocks.find(block => block.type === "image") ??
          buildImageBlock({
            autoInserted: true,

            image: null,
            format,
            layout,
            dimensions: {
              width: MAX_BLOCK_WIDTH / 2,
              height: MAX_BLOCK_WIDTH
            }
          })
      );

      const textBlock: TextPostBlock =
        blocks.find(block => block.type === "text") ??
        buildTextBlock({
          value: "",
          placeholder: "Tap to edit text",
          autoInserted: true,
          format,
          layout
        });

      textBlock.config.minHeight = imageBlock.config.dimensions.height;

      return [textBlock, imageBlock];
    }
    case PostLayout.horizontalMediaMedia: {
      const firstImageBlock =
        blocks.find(block => block.type === "image") ??
        buildImageBlock({
          image: null,
          autoInserted: true,
          format,
          layout,
          dimensions: HORIZONTAL_IMAGE_DIMENSIONS
        });

      const secondImageBlock =
        blocks.filter(block => block.type === "image")[1] ??
        buildImageBlock({
          image: null,
          autoInserted: true,
          format,
          layout,
          dimensions: HORIZONTAL_IMAGE_DIMENSIONS
        });

      return [firstImageBlock, secondImageBlock].map(block =>
        scaleImageBlockToWidth(HORIZONTAL_IMAGE_DIMENSIONS.width, block)
      );
    }
    case PostLayout.media: {
      return [
        scaleImageBlockToWidth(
          POST_WIDTH,
          blocks.find(block => block.type === "image") ??
            buildImageBlock({
              image: null,
              autoInserted: true,
              format,
              layout,
              dimensions: VERTICAL_IMAGE_DIMENSIONS
            })
        )
      ];
    }
    case PostLayout.text: {
      return [
        blocks.find(block => block.type === "text") ??
          buildTextBlock({
            value: "",
            placeholder: "Tap to edit text",
            autoInserted: true,
            format,
            layout
          })
      ];
    }
  }
};

export const buildPost = ({
  format,
  layout,
  blocks: _blocks,
  width,
  height
}: {
  format: PostFormat;
  layout: PostLayout;
  blocks: Array<PostBlockType>;
  width: number;
  height: number;
}): NewPostType => {
  const presets = presetsByFormat[format];
  const blocks = blocksForFormat(format, layout, _blocks).map(block => ({
    ...block,
    layout
  }));

  return {
    format,
    layout,
    width,
    blocks,
    height
  };
};

export const generateBlockId = nanoid;

export const DEFAULT_POST_FORMAT = PostFormat.post;

// const DEVELOPMENT_POST_FIXTURE = {
//   format: "screenshot",
//   blocks: [
//     {
//       type: "image",
//       format: "screenshot",
//       dimensions: { width: 414, height: 552, x: 0, y: 0, maxX: 414, maxY: 552 },
//       id: "bmoRLK-ZMTsio5thJW5KT",
//       contentId: "ph://60863845-FF9C-4F04-A910-398D016B6384/L0/001",
//       viewTag: 803,
//       frame: { x: 0, y: 0, width: 414, height: 552 },
//       value: {
//         width: 768,
//         height: 1024,
//         source: "cameraRoll",
//         mimeType: "image/jpeg",
//         uri: "ph://60863845-FF9C-4F04-A910-398D016B6384/L0/001",
//         duration: 0
//       }
//     }
//   ],
//   nodes: [
//     {
//       block: {
//         type: "image",
//         format: "sticker",
//         dimensions: {
//           width: 310.5,
//           height: 172.638,
//           x: 0,
//           y: 0,
//           maxX: 310.5,
//           maxY: 172.638
//         },
//         id: "jUlqsRfWmT8OvTgrn0v2C",
//         contentId: "d3DiXTPbqh83K",
//         viewTag: 1379,
//         frame: { x: 15, y: 15, width: 310.5, height: 172.5 },
//         value: {
//           width: 500,
//           height: 278,
//           source: "giphy",
//           mimeType: "video/mp4",
//           uri:
//             "https://media0.giphy.com/media/d3DiXTPbqh83K/giphy.mp4?cid=f94a78089e09d52157b4b8b1ff9b2ecdba13c8fcbc47a708&rid=giphy.mp4",
//           duration: 1
//         }
//       },
//       frame: { x: 52.75, y: 322.6809997558594, width: 310.5, height: 172.5 },
//       viewTag: 1385,
//       position: { x: 52.75, rotate: 0, scale: 1, y: 322.681 }
//     }
//   ],
//   bounds: { x: 0, y: 0, width: 414, height: 754 }
// };

// const DEVELOPMENT_POST_FIXTURE = {
//   format: PostFormat.screenshot,
//   backgroundColor: "#000",
//   blocks: [
//     {
//       type: "text",
//       id: "123123",
//       format: "caption",
//       value: "",
//       autoInserted: true,
//       config: { placeholder: "Enter a title", overrides: {} }
//     },
//     {
//       type: "image",
//       id: "1231232",
//       format: "caption",
//       required: true,
//       value: {
//         id: "lszAB3TzFtRaU",
//         source: {
//           type: "gif",
//           id: "lszAB3TzFtRaU",
//           slug: "will-ferrell-lszAB3TzFtRaU",
//           url: "https://giphy.com/gifs/will-ferrell-lszAB3TzFtRaU",
//           bitly_gif_url: "https://gph.is/2bZxV6R",
//           bitly_url: "https://gph.is/2bZxV6R",
//           embed_url: "https://giphy.com/embed/lszAB3TzFtRaU",
//           username: "",
//           source:
//             "https://popkey.co/m/mv3Ra-lol-will+ferrell-lolz-anchorman-guy-dude",
//           rating: "g",
//           content_url: "",
//           source_tld: "popkey.co",
//           source_post_url:
//             "https://popkey.co/m/mv3Ra-lol-will+ferrell-lolz-anchorman-guy-dude",
//           is_sticker: 0,
//           import_datetime: "2016-09-04 10:03:33",
//           trending_datetime: "2019-09-08 04:15:11",
//           images: {
//             fixed_height_still: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200_s.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200_s.gif",
//               width: "266",
//               height: "200"
//             },
//             original_still: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy_s.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy_s.gif",
//               width: "346",
//               height: "260"
//             },
//             fixed_width: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200w.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200w.gif",
//               width: "200",
//               height: "150",
//               size: "758500",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200w.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200w.mp4",
//               mp4_size: "40858",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200w.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200w.webp",
//               webp_size: "411146"
//             },
//             fixed_height_small_still: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100_s.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100_s.gif",
//               width: "133",
//               height: "100"
//             },
//             fixed_height_downsampled: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200_d.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200_d.gif",
//               width: "266",
//               height: "200",
//               size: "120489",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200_d.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200_d.webp",
//               webp_size: "57838"
//             },
//             preview: {
//               width: "268",
//               height: "200",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-preview.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-preview.mp4",
//               mp4_size: "27705"
//             },
//             fixed_height_small: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100.gif",
//               width: "133",
//               height: "100",
//               size: "377998",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100.mp4",
//               mp4_size: "24727",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100.webp",
//               webp_size: "234746"
//             },
//             downsized_still: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-downsized_s.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-downsized_s.gif",
//               width: "346",
//               height: "260",
//               size: "30060"
//             },
//             downsized: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-downsized.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-downsized.gif",
//               width: "346",
//               height: "260",
//               size: "1946739"
//             },
//             downsized_large: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.gif",
//               width: "346",
//               height: "260",
//               size: "1946739"
//             },
//             fixed_width_small_still: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100w_s.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100w_s.gif",
//               width: "100",
//               height: "75"
//             },
//             preview_webp: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-preview.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-preview.webp",
//               width: "196",
//               height: "147",
//               size: "49116"
//             },
//             fixed_width_still: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200w_s.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200w_s.gif",
//               width: "200",
//               height: "150"
//             },
//             fixed_width_small: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100w.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100w.gif",
//               width: "100",
//               height: "75",
//               size: "224250",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100w.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100w.mp4",
//               mp4_size: "17481",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/100w.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100w.webp",
//               webp_size: "156146"
//             },
//             downsized_small: {
//               width: "346",
//               height: "260",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-downsized-small.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-downsized-small.mp4",
//               mp4_size: "160111"
//             },
//             fixed_width_downsampled: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200w_d.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200w_d.gif",
//               width: "200",
//               height: "150",
//               size: "68808",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200w_d.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200w_d.webp",
//               webp_size: "34312"
//             },
//             downsized_medium: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.gif",
//               width: "346",
//               height: "260",
//               size: "1946739"
//             },
//             original: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.gif",
//               width: "346",
//               height: "260",
//               size: "1946739",
//               frames: "73",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.mp4",
//               mp4_size: "155509",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.webp",
//               webp_size: "1254730"
//             },
//             fixed_height: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200.gif",
//               width: "266",
//               height: "200",
//               size: "1376195",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200.mp4",
//               mp4_size: "57453",
//               webp:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/200.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=200.webp",
//               webp_size: "695024"
//             },
//             looping: {
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-loop.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-loop.mp4",
//               mp4_size: "890785"
//             },
//             original_mp4: {
//               width: "480",
//               height: "360",
//               mp4:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.mp4?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.mp4",
//               mp4_size: "155509"
//             },
//             preview_gif: {
//               url:
//                 "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy-preview.gif?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy-preview.gif",
//               width: "124",
//               height: "93",
//               size: "49737"
//             },
//             "480w_still": {
//               url:
//                 "https://media2.giphy.com/media/lszAB3TzFtRaU/480w_s.jpg?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=480w_s.jpg",
//               width: "480",
//               height: "361"
//             }
//           },
//           title: "will ferrell lol GIF",
//           analytics: {
//             onload: {
//               url:
//                 "https://giphy-analytics.giphy.com/simple_analytics?response_id=4d7bf768c02b4a884a251f8f8c97989ab85fd37e&event_type=GIF_TRENDING&gif_id=lszAB3TzFtRaU&action_type=SEEN"
//             },
//             onclick: {
//               url:
//                 "https://giphy-analytics.giphy.com/simple_analytics?response_id=4d7bf768c02b4a884a251f8f8c97989ab85fd37e&event_type=GIF_TRENDING&gif_id=lszAB3TzFtRaU&action_type=CLICK"
//             },
//             onsent: {
//               url:
//                 "https://giphy-analytics.giphy.com/simple_analytics?response_id=4d7bf768c02b4a884a251f8f8c97989ab85fd37e&event_type=GIF_TRENDING&gif_id=lszAB3TzFtRaU&action_type=SENT"
//             }
//           }
//         },
//         preview: {
//           uri:
//             "https://media3.giphy.com/media/lszAB3TzFtRaU/100.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100.webp",
//           width: 133,
//           height: 100,
//           duration: 0,
//           mimeType: "image/webp",
//           source: "giphy",
//           asset: {
//             uri:
//               "https://media3.giphy.com/media/lszAB3TzFtRaU/100.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=100.webp",
//             width: 133,
//             height: 100
//           },
//           transform: []
//         },
//         image: {
//           uri:
//             "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.webp",
//           width: 346,
//           height: 260,
//           duration: 1,
//           mimeType: "image/webp",
//           source: "giphy",
//           asset: {
//             uri:
//               "https://media3.giphy.com/media/lszAB3TzFtRaU/giphy.webp?cid=f94a78084d7bf768c02b4a884a251f8f8c97989ab85fd37e&rid=giphy.webp",
//             width: 346,
//             height: 260
//           },
//           transform: []
//         },
//         sourceType: "giphy"
//       },
//       config: {
//         dimensions: {
//           width: 414,
//           height: 311.0982658959538,
//           x: 0,
//           y: 0,
//           maxX: 414,
//           maxY: 311.0982658959538
//         }
//       }
//     }
//   ]
// };
