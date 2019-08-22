function isCropValid(crop) {
  return (
    crop &&
    crop.width &&
    crop.height &&
    !isNaN(crop.width) &&
    !isNaN(crop.height)
  );
}

function resizeCrop() {
  const { evData } = this;
  const nextCrop = this.makeNewCrop();
  const { ord } = evData;

  // On the inverse change the diff so it's the same and
  // the same algo applies.
  if (evData.xInversed) {
    evData.xDiff -= evData.cropStartWidth * 2;
    evData.xDiffPc -= evData.cropStartWidth * 2;
  }
  if (evData.yInversed) {
    evData.yDiff -= evData.cropStartHeight * 2;
    evData.yDiffPc -= evData.cropStartHeight * 2;
  }

  // New size.
  const newSize = this.getNewSize();

  // Adjust x/y to give illusion of 'staticness' as width/height is increased
  // when polarity is inversed.
  let newX = evData.cropStartX;
  let newY = evData.cropStartY;

  if (evData.xCrossOver) {
    newX = nextCrop.x + (nextCrop.width - newSize.width);
  }

  if (evData.yCrossOver) {
    // This not only removes the little "shake" when inverting at a diagonal, but for some
    // reason y was way off at fast speeds moving sw->ne with fixed aspect only, I couldn't
    // figure out why.
    if (evData.lastYCrossover === false) {
      newY = nextCrop.y - newSize.height;
    } else {
      newY = nextCrop.y + (nextCrop.height - newSize.height);
    }
  }

  const { width, height } = this.componentDimensions;
  const containedCrop = containCrop(
    this.props.crop,
    {
      unit: nextCrop.unit,
      x: newX,
      y: newY,
      width: newSize.width,
      height: newSize.height,
      aspect: nextCrop.aspect
    },
    width,
    height
  );

  nextCrop.y = containedCrop.y;
  nextCrop.height = containedCrop.height;

  evData.lastYCrossover = evData.yCrossOver;
  this.crossOverCheck();

  return nextCrop;
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

function convertToPercentCrop(crop, imageWidth, imageHeight) {
  if (crop.unit === "%") {
    return crop;
  }

  return {
    unit: "%",
    aspect: crop.aspect,
    x: (crop.x / imageWidth) * 100,
    y: (crop.y / imageHeight) * 100,
    width: (crop.width / imageWidth) * 100,
    height: (crop.height / imageHeight) * 100
  };
}

function convertToPixelCrop(crop, imageWidth, imageHeight) {
  if (crop.unit === "px") {
    return crop;
  }

  return {
    unit: "px",
    aspect: crop.aspect,
    x: (crop.x * imageWidth) / 100,
    y: (crop.y * imageHeight) / 100,
    width: (crop.width * imageWidth) / 100,
    height: (crop.height * imageHeight) / 100
  };
}

function containCrop(prevCrop, crop, imageWidth, imageHeight) {
  const pixelCrop = convertToPixelCrop(crop, imageWidth, imageHeight);
  const prevPixelCrop = convertToPixelCrop(prevCrop, imageWidth, imageHeight);
  const contained = { ...pixelCrop };

  if (pixelCrop.y + pixelCrop.height > imageHeight) {
    contained.height = imageHeight - pixelCrop.y;
  }

  return contained;
}
