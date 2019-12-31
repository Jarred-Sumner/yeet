import React from "react";
import { createIconSetFromFontello } from "react-native-vector-icons";
import fontelloConfig from "./Icon/config.json";
import Animated from "react-native-reanimated";

export const Icon = React.memo(createIconSetFromFontello(fontelloConfig));

export const AnimatedIcon = Animated.createAnimatedComponent(Icon);

// ➜ cat src/components/icon/config.json | jq .glyphs[].search[0]
export enum IconName {
  add = "add",
  arrowLeft = "arrow-left",
  back = "back",
  background = "background",
  die1 = "die1",
  die2 = "die2",
  die3 = "die3",
  die4 = "die4",
  die5 = "die5",
  die6 = "die6",
  camera = "camera",
  cameraroll = "cameraroll",
  cut = "cut",
  playbackFastforward = "playbackfastforward",
  playbackPrevious = "playbackprevious",
  playbackRewind = "playbackrewind",
  movie = "movie",
  justifyAll = "justifyall",
  justifyCenter = "justifycenter",
  justifyLeft = "justifyleft",
  justifyRight = "justifyright",
  checkmark = "checkmark",
  hourglass = "hourglass",
  circleCheckmark = "circlecheckmark",
  stopwatch = "stopwatch",
  help = "help",
  chevronLeft = "chevron-left",
  chevronRight = "chevron-right",
  circleaddAlt = "plus-circle-alt",
  circleadd = "plus-circle",
  clip = "clip",
  close = "close",
  crop = "crop",
  homeAlt = "home-alt",
  home = "home",
  like = "like",
  likeAlt = "like-alt",
  link = "link",
  lock = "lock",
  notificationAlt = "notification-copy",
  notification = "notification",
  pause = "pause",
  pencil = "pencil",
  play = "play",
  profileAlt = "profile-alt",
  searchPhoto = "search-photo",
  search = "search",
  sticker = "sticker",
  text = "text",
  trash = "trash",
  repost = "repost",
  draw = "draw",
  download = "download",
  profile = "profile",
  redact = "redact",
  remix = "remix",
  searchAlt = "search-alt",
  save = "save",
  ellipsis = "more",
  ellipsisAlt = "more-alt",
  heart = "heart",
  check = "check",
  comment = "comment",
  crown = "crown",
  list = "list",
  panels = "panels",
  photo = "photo",
  plus = "plus",
  send = "send",
  settings = "settings",
  skip = "skip",
  triangle = "triangle",
  trophy = "trophy",
  undo = "undo",
  uploadPhoto = "upload-photo",
  view = "view",
  cancer = "cancer",
  capricorn = "capricorn",
  sagittarius = "sagittarius",
  aries = "aries",
  taurus = "taurus",
  gemini = "gemini",
  leo = "leo",
  aquarius = "aquarius",
  pisces = "pisces",
  virgo = "virgo",
  libra = "libra",
  scorpio = "scorpio"
}

export const IconAdd = props => <Icon name={IconName.add} {...props} />;
export const IconArrowleft = props => (
  <Icon name={IconName.arrowLeft} {...props} />
);
export const IconBack = props => <Icon name={IconName.back} {...props} />;
export const IconBackground = props => (
  <Icon name={IconName.background} {...props} />
);
export const IconCamera = props => <Icon name={IconName.camera} {...props} />;
export const IconCameraRoll = props => (
  <Icon name={IconName.cameraroll} {...props} />
);
export const IconCheckmark = props => (
  <Icon name={IconName.checkmark} {...props} />
);
export const IconChevronLeft = props => (
  <Icon name={IconName.chevronLeft} {...props} />
);
export const IconChevronRight = props => (
  <Icon name={IconName.chevronRight} {...props} />
);
export const IconCircleAddAlt = props => (
  <Icon name={IconName.circleaddAlt} {...props} />
);
export const IconCircleAdd = props => (
  <Icon name={IconName.circleadd} {...props} />
);
export const IconClip = props => <Icon name={IconName.clip} {...props} />;
export const IconClose = props => <Icon name={IconName.close} {...props} />;
export const IconCrop = props => <Icon name={IconName.crop} {...props} />;
export const IconHomeAlt = props => <Icon name={IconName.homeAlt} {...props} />;
export const IconHome = props => <Icon name={IconName.home} {...props} />;
export const IconLike = props => <Icon name={IconName.like} {...props} />;
export const IconLikeAlt = props => <Icon name={IconName.likeAlt} {...props} />;
export const IconLink = props => <Icon name={IconName.link} {...props} />;
export const IconLock = props => <Icon name={IconName.lock} {...props} />;
export const IconNotificationAlt = props => (
  <Icon name={IconName.notificationAlt} {...props} />
);
export const IconNotification = props => (
  <Icon name={IconName.notification} {...props} />
);
export const IconPause = props => <Icon name={IconName.pause} {...props} />;
export const IconPencil = props => <Icon name={IconName.pencil} {...props} />;
export const IconPlay = props => <Icon name={IconName.play} {...props} />;
export const IconProfileAlt = props => (
  <Icon name={IconName.profileAlt} {...props} />
);
export const IconSearchphoto = props => (
  <Icon name={IconName.searchPhoto} {...props} />
);
export const IconSearch = props => <Icon name={IconName.search} {...props} />;
export const IconSticker = props => <Icon name={IconName.sticker} {...props} />;
export const IconText = props => <Icon name={IconName.text} {...props} />;
export const IconTrash = props => <Icon name={IconName.trash} {...props} />;
export const IconRepost = props => <Icon name={IconName.repost} {...props} />;
export const IconEllipsisAlt = props => (
  <Icon name={IconName.ellipsisAlt} {...props} />
);
export const IconDraw = props => <Icon name={IconName.draw} {...props} />;
export const IconDownload = props => (
  <Icon name={IconName.download} {...props} />
);
export const IconProfile = props => <Icon name={IconName.profile} {...props} />;
export const IconRedact = props => <Icon name={IconName.redact} {...props} />;
export const IconRemix = props => <Icon name={IconName.remix} {...props} />;
export const IconSearchAlt = props => (
  <Icon name={IconName.searchAlt} {...props} />
);
export const IconSave = props => <Icon name={IconName.save} {...props} />;
export const IconEllipsis = props => (
  <Icon name={IconName.ellipsis} {...props} />
);
export const IconHeart = props => <Icon name={IconName.heart} {...props} />;
export const IconCheck = props => <Icon name={IconName.check} {...props} />;
export const IconComment = props => <Icon name={IconName.comment} {...props} />;
export const IconCrown = props => <Icon name={IconName.crown} {...props} />;
export const IconList = props => <Icon name={IconName.list} {...props} />;
export const IconPanels = props => <Icon name={IconName.panels} {...props} />;
export const IconPhoto = props => <Icon name={IconName.photo} {...props} />;
export const IconPlus = props => <Icon name={IconName.plus} {...props} />;
export const IconSend = props => <Icon name={IconName.send} {...props} />;
export const IconSettings = props => (
  <Icon name={IconName.settings} {...props} />
);
export const IconSkip = props => <Icon name={IconName.skip} {...props} />;
export const IconTriangle = props => (
  <Icon name={IconName.triangle} {...props} />
);
export const IconTrophy = props => <Icon name={IconName.trophy} {...props} />;
export const IconUndo = props => <Icon name={IconName.undo} {...props} />;
export const IconUploadphoto = props => (
  <Icon name={IconName.uploadPhoto} {...props} />
);
export const IconView = props => <Icon name={IconName.view} {...props} />;

export const IconHourglass = props => (
  <Icon name={IconName.hourglass} {...props} />
);
export const IconHelp = props => <Icon name={IconName.help} {...props} />;
export const IconCircleCheckmark = props => (
  <Icon name={IconName.circleCheckmark} {...props} />
);
export const IconStopwatch = props => (
  <Icon name={IconName.stopwatch} {...props} />
);

export const IconCancer = props => <Icon name={IconName.cancer} {...props} />;
export const IconCapricorn = props => (
  <Icon name={IconName.capricorn} {...props} />
);
export const IconSagittarius = props => (
  <Icon name={IconName.sagittarius} {...props} />
);
export const IconAries = props => <Icon name={IconName.aries} {...props} />;
export const IconTaurus = props => <Icon name={IconName.taurus} {...props} />;
export const IconGemini = props => <Icon name={IconName.gemini} {...props} />;
export const IconLeo = props => <Icon name={IconName.leo} {...props} />;
export const IconAquarius = props => (
  <Icon name={IconName.aquarius} {...props} />
);
export const IconPisces = props => <Icon name={IconName.pisces} {...props} />;
export const IconVirgo = props => <Icon name={IconName.virgo} {...props} />;
export const IconLibra = props => <Icon name={IconName.libra} {...props} />;
export const IconScorpio = props => <Icon name={IconName.scorpio} {...props} />;

export const IconCut = props => <Icon name={IconName.cut} {...props} />;
export const IconPlaybackFastforward = props => (
  <Icon name={IconName.playbackFastforward} {...props} />
);
export const IconPlaybackPrevious = props => (
  <Icon name={IconName.playbackPrevious} {...props} />
);
export const IconPlaybackRewind = props => (
  <Icon name={IconName.playbackRewind} {...props} />
);
export const IconMovie = props => <Icon name={IconName.movie} {...props} />;
export const IconJustifyAll = props => (
  <Icon name={IconName.justifyAll} {...props} />
);
export const IconJustifyCenter = props => (
  <Icon name={IconName.justifyCenter} {...props} />
);
export const IconJustifyLeft = props => (
  <Icon name={IconName.justifyLeft} {...props} />
);
export const IconJustifyRight = props => (
  <Icon name={IconName.justifyRight} {...props} />
);

export const IconDie1 = props => <Icon name={IconName.die1} {...props} />;
export const IconDie2 = props => <Icon name={IconName.die2} {...props} />;
export const IconDie3 = props => <Icon name={IconName.die3} {...props} />;
export const IconDie4 = props => <Icon name={IconName.die4} {...props} />;
export const IconDie5 = props => <Icon name={IconName.die5} {...props} />;
export const IconDie6 = props => <Icon name={IconName.die6} {...props} />;
