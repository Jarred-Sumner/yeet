import {
  IconClock,
  IconCameraRoll,
  IconGlobe,
  IconSticker,
  IconGIF,
  IconCrown,
  IconStar
} from "../../Icon";
export enum GallerySectionItem {
  clipboardImage = "clipboardImage",
  assets = "assets",
  clipboardURL = "clipboardURL",
  cameraRoll = "cameraRoll",
  search = "search",
  memes = "memes",
  internet = "internet",
  sticker = "sticker",
  recent = "recent",
  all = "all",
  gifs = "gifs"
}
export const FILTER_LABELS = {
  [GallerySectionItem.search]: "Search",
  [GallerySectionItem.all]: "For You",
  [GallerySectionItem.clipboardImage]: "Clipboard",
  [GallerySectionItem.recent]: "Recent",
  [GallerySectionItem.assets]: "Assets",
  [GallerySectionItem.sticker]: "Sticker",
  [GallerySectionItem.internet]: "Internet",
  [GallerySectionItem.clipboardURL]: "Clipboard",
  [GallerySectionItem.memes]: "YEET!",
  [GallerySectionItem.gifs]: "GIF",
  [GallerySectionItem.cameraRoll]: "Library"
};
export const ICONS = {
  [GallerySectionItem.internet]: IconStar,
  [GallerySectionItem.assets]: IconStar,
  [GallerySectionItem.recent]: IconClock,
  [GallerySectionItem.sticker]: IconSticker,
  [GallerySectionItem.memes]: IconGlobe,
  [GallerySectionItem.all]: IconStar,
  [GallerySectionItem.cameraRoll]: IconCameraRoll,
  [GallerySectionItem.gifs]: IconGIF
};
export const FILTERS = [
  {
    label: FILTER_LABELS[GallerySectionItem.all],
    value: GallerySectionItem.all
  },
  {
    label: FILTER_LABELS[GallerySectionItem.assets],
    value: GallerySectionItem.assets
  },
  {
    label: FILTER_LABELS[GallerySectionItem.clipboardImage],
    value: GallerySectionItem.clipboardImage
  },
  {
    label: FILTER_LABELS[GallerySectionItem.recent],
    value: GallerySectionItem.recent
  },
  {
    label: FILTER_LABELS[GallerySectionItem.memes],
    value: GallerySectionItem.memes
  },
  {
    label: FILTER_LABELS[GallerySectionItem.cameraRoll],
    value: GallerySectionItem.cameraRoll
  },
  {
    label: FILTER_LABELS[GallerySectionItem.internet],
    value: GallerySectionItem.internet
  },

  {
    label: FILTER_LABELS[GallerySectionItem.sticker],
    value: GallerySectionItem.sticker
  },

  {
    label: FILTER_LABELS[GallerySectionItem.gifs],
    value: GallerySectionItem.gifs
  }
];
