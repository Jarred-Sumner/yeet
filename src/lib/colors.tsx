import chroma from "chroma-js";

const isBlackish = (color: string) =>
  chroma.distance(color, "#000", "rgb") < 50;
const isWhiteish = (color: string) =>
  chroma.distance(color, "#fff", "rgb") < 50;
const isYellowish = (color: string) =>
  chroma.distance(color, "rgb(255, 255, 0)", "rgb") < 50;

export function getStrokeColor(color) {
  if (isWhiteish(color) || isYellowish(color)) {
    return "black";
  }

  const luminance = chroma(color).luminance();

  if (luminance > 0.59) {
    return getDarkColor(color);
  } else if (luminance > 0.49) {
    return getNeutralColor(color);
  } else {
    return getLightColor(color);
  }
}

export const isLowContrast = (color: string, backgroundColor: string) => {
  return chroma.contrast(color, backgroundColor) >= 4.5;
};

export const isTooDark = (color: string, backgroundColor: string) => {
  if (!isLowContrast(color, backgroundColor)) {
    return false;
  }

  const colorLuminance = chroma(color).luminance();
  const backgroundLuminance = chroma(backgroundColor).luminance();

  const averageLuminance = Math.abs(backgroundLuminance - colorLuminance) / 2;

  return averageLuminance < 0.5;
};

export const isTooLight = (color: string, backgroundColor: string) => {
  if (!isLowContrast(color, backgroundColor)) {
    return false;
  }

  const colorLuminance = chroma(color).luminance();
  const backgroundLuminance = chroma(backgroundColor).luminance();

  const averageLuminance = Math.abs(backgroundLuminance - colorLuminance) / 2;

  return averageLuminance > 0.5;
};

export const getDarkColor = (color: string) => {
  return chroma.scale([color, "black"], "rgb").colors(8)[6];
};

export const getLightColor = (color: string) => {
  return chroma.scale([color, "white"], "rgb").colors(8)[6];
};

export const getNeutralColor = (color: string) => {
  return chroma(color)
    .desaturate(100)
    .darken(20);
};

export const isColorDark = (color: string) => {
  return chroma(color).luminance() < 0.3;
};

export const isColorLight = (color: string) => {
  return chroma(color).luminance() > 0.71;
};

export const isColorNeutral = (color: string) => {
  const lumen = chroma(color).luminance();

  return lumen > 0.501 && lumen < 0.71;
};
