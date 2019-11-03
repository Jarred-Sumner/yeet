import React from "react";
import { createIconSetFromFontello } from "react-native-vector-icons";
import fontelloConfig from "./Icon/config.json";
import Animated from "react-native-reanimated";

export const Icon = createIconSetFromFontello(fontelloConfig);

export const AnimatedIcon = Animated.createAnimatedComponent(Icon);

// ➜ cat src/components/icon/config.json | jq .glyphs[].search[0]
export enum IconName {
  plus = "plus",
  view = "view",
  play = "play",
  photo = "photo",
  pencil = "pencil",
  panels = "panels",
  list = "list",
  link = "link",
  uploadPhoto = "upload-photo",
  undo = "undo",
  home = "home",
  heart = "heart",
  trophy = "trophy",
  triangle = "triangle",
  draw = "draw",
  download = "download",
  trash = "trash",
  text = "text",
  crown = "crown",
  comment = "comment",
  sticker = "sticker",
  skip = "skip",
  close = "close",
  chevronRight = "chevron-right",
  settings = "settings",
  send = "send",
  chevronLeft = "chevron-left",
  check = "check",
  search = "search",
  remix = "remix",
  searchPhoto = "search-photo",
  camera = "camera",
  background = "background",
  redact = "redact",
  profile = "profile",
  back = "back",
  notification = "notification",
  ellipsis = "ellipsis"
}

export const IconPlus = props => <Icon {...props} name={IconName.plus} />;
export const IconView = props => <Icon {...props} name={IconName.view} />;
export const IconPlay = props => <Icon {...props} name={IconName.play} />;
export const IconPhoto = props => <Icon {...props} name={IconName.photo} />;
export const IconNotification = props => (
  <Icon {...props} name={IconName.notification} />
);
export const IconPencil = props => <Icon {...props} name={IconName.pencil} />;
export const IconPanels = props => <Icon {...props} name={IconName.panels} />;
export const IconList = props => <Icon {...props} name={IconName.list} />;
export const IconLink = props => <Icon {...props} name={IconName.link} />;
export const IconUploadPhoto = props => (
  <Icon {...props} name={IconName.uploadPhoto} />
);
export const IconUndo = props => <Icon {...props} name={IconName.undo} />;
export const IconHome = props => <Icon {...props} name={IconName.home} />;
export const IconHeart = props => <Icon {...props} name={IconName.heart} />;
export const IconTrophy = props => <Icon {...props} name={IconName.trophy} />;
export const IconTriangle = props => (
  <Icon {...props} name={IconName.triangle} />
);
export const IconDraw = props => <Icon {...props} name={IconName.draw} />;
export const IconDownload = props => (
  <Icon {...props} name={IconName.download} />
);
export const IconTrash = props => <Icon {...props} name={IconName.trash} />;
export const IconText = props => <Icon {...props} name={IconName.text} />;
export const IconCrown = props => <Icon {...props} name={IconName.crown} />;
export const IconComment = props => <Icon {...props} name={IconName.comment} />;
export const IconSticker = props => <Icon {...props} name={IconName.sticker} />;
export const IconSkip = props => <Icon {...props} name={IconName.skip} />;
export const IconClose = props => <Icon {...props} name={IconName.close} />;
export const IconChevronRight = props => (
  <Icon {...props} name={IconName.chevronRight} />
);

export const IconChevronUp = ({ style = null, ...props }) => (
  <Icon
    {...props}
    name={IconName.chevronRight}
    style={[
      style,
      {
        transform: [
          {
            translateY: -1
          },
          {
            rotate: "-90deg"
          }
        ]
      }
    ].filter(Boolean)}
  />
);
export const IconSettings = props => (
  <Icon {...props} name={IconName.settings} />
);
export const IconSend = props => <Icon {...props} name={IconName.send} />;
export const IconChevronLeft = props => (
  <Icon {...props} name={IconName.chevronLeft} />
);
export const IconCheck = props => <Icon {...props} name={IconName.check} />;
export const IconSearch = props => <Icon {...props} name={IconName.search} />;
export const IconSearchPhoto = props => (
  <Icon {...props} name={IconName.searchPhoto} />
);
export const IconCamera = props => <Icon {...props} name={IconName.camera} />;
export const IconBackground = props => (
  <Icon {...props} name={IconName.background} />
);
export const IconRedact = props => <Icon {...props} name={IconName.redact} />;
export const IconProfile = props => <Icon {...props} name={IconName.profile} />;
export const IconBack = props => <Icon {...props} name={IconName.back} />;
export const IconRemix = props => <Icon {...props} name={IconName.remix} />;
export const IconEllipsis = props => (
  <Icon {...props} name={IconName.ellipsis} />
);
