//
//  ExportableImage.swift
//  yeet
//
//  Created by Jarred WSumner on 9/7/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

class ExportableImage {
  var animatedImage: SDAnimatedImage? = nil
  var staticImage: UIImage? = nil

  var isAnimated: Bool {
    return self.animatedImage != nil
  }

  var animatedImageFrameCount: UInt {
    if let image = self.animatedImage {
      return image.animatedImageFrameCount;
    } else {
      return 0;
    }
  }


  var firstFrame: UIImage {
    if (self.animatedImage != nil) {
      return self.animatedImage!
    } else {
      return self.staticImage!
    }
  }
  
  func animatedImageDuration(at: UInt) -> TimeInterval {
    if let image = self.animatedImage {
      return image.animatedImageDuration(at: at);
    } else {
      return 0;
    }
  }

  func animatedImageFrame(at: UInt) -> UIImage? {
    if let image = self.animatedImage {
      return image.animatedImageFrame(at: at)
    } else {
      return staticImage!;
    }
  }

  required init (image: UIImage) {
    if type(of: image) == SDAnimatedImage.self {
      self.animatedImage = image as? SDAnimatedImage
    } else {
      self.staticImage = image
    }
  }

  func preloadAllFrames() {
    if let image = self.animatedImage {
      return image.preloadAllFrames()
    }
  }
}
