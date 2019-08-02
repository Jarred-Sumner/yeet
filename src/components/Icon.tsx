import React from "react";
import { createIconSetFromFontello } from "react-native-vector-icons";
import fontelloConfig from "./Icon/config.json";

export const Icon = createIconSetFromFontello(fontelloConfig);

// ➜ cat src/components/icon/config.json | jq .glyphs[].search[0]
export enum IconName {
  background = "background",
  camera = "camera",
  check = "check",
  chevronLeft = "chevron-left",
  chevronRight = "chevron-right",
  close = "close",
  comment = "comment",
  crown = "crown",
  download = "download",
  heart = "heart",
  home = "home",
  link = "link",
  pencil = "pencil",
  play = "play",
  plus = "plus",
  profile = "profile",
  searchPhoto = "search-photo",
  trophy = "trophy",
  skip = "skip",
  triangle = "triangle",
  search = "search",
  list = "list",
  send = "send",
  settings = "settings",
  view = "view",
  uploadPhoto = "upload-photo",
  trash = "trash",
  text = "text"
}

export const IconBackground = props => (
  <Icon name={IconName.background} {...props} />
);
export const IconCamera = props => <Icon name={IconName.camera} {...props} />;
export const IconCheck = props => <Icon name={IconName.check} {...props} />;
export const IconChevronLeft = props => (
  <Icon name={IconName.chevronLeft} {...props} />
);
export const IconChevronRight = props => (
  <Icon name={IconName.chevronRight} {...props} />
);
export const IconList = props => <Icon name={IconName.list} {...props} />;
export const IconClose = props => <Icon name={IconName.close} {...props} />;
export const IconComment = props => <Icon name={IconName.comment} {...props} />;
export const IconCrown = props => <Icon name={IconName.crown} {...props} />;
export const IconDownload = props => (
  <Icon name={IconName.download} {...props} />
);
export const IconHeart = props => <Icon name={IconName.heart} {...props} />;
export const IconHome = props => <Icon name={IconName.home} {...props} />;
export const IconLink = props => <Icon name={IconName.link} {...props} />;
export const IconPencil = props => <Icon name={IconName.pencil} {...props} />;
export const IconPlay = props => <Icon name={IconName.play} {...props} />;
export const IconPlus = props => <Icon name={IconName.plus} {...props} />;
export const IconProfile = props => <Icon name={IconName.profile} {...props} />;
export const IconSearchPhoto = props => (
  <Icon name={IconName.searchPhoto} {...props} />
);
export const IconSearch = props => <Icon name={IconName.search} {...props} />;
export const IconSend = props => <Icon name={IconName.send} {...props} />;
export const IconSettings = props => (
  <Icon name={IconName.settings} {...props} />
);
export const IconView = props => <Icon name={IconName.view} {...props} />;
export const IconUpload = props => (
  <Icon name={IconName.uploadPhoto} {...props} />
);
export const IconTrash = props => <Icon name={IconName.trash} {...props} />;
export const IconText = props => <Icon name={IconName.text} {...props} />;
export const IconTrophy = props => <Icon name={IconName.trophy} {...props} />;
export const IconSkip = props => <Icon name={IconName.skip} {...props} />;
export const IconTriangle = props => (
  <Icon name={IconName.triangle} {...props} />
);
