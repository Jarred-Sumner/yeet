//
//  ExportableImage.swift
//  yeet
//
//  Created by Jarred WSumner on 9/7/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import PINRemoteImage

class ExportableImage {
  var animatedImage: PINCachedAnimatedImage? = nil
  var staticImage: UIImage? = nil

  var isAnimated: Bool {
    return self.animatedImage != nil
  }

  var animatedImageFrameCount: UInt {
    if let image = self.animatedImage {
      return UInt(image.frameCount);
    } else {
      return 0;
    }
  }


  var firstFrame: UIImage {
    if (self.animatedImage != nil) {
      return self.animatedImage!.coverImage!
    } else {
      return self.staticImage!
    }
  }
  
  func animatedImageDuration(at: UInt) -> TimeInterval {
    if let image = self.animatedImage {
      return image.duration(at: at);
    } else {
      return 0;
    }
  }

  func animatedImageFrame(at: UInt) -> CGImage? {
    if let image = self.animatedImage {
      return image.image(at: at)!.takeRetainedValue()
    } else {
      return staticImage!.cgImage
    }
  }

  required init (image: UIImage) {
    if type(of: image) == PINCachedAnimatedImage.self {
      self.animatedImage = image as! PINCachedAnimatedImage
    } else {
      self.staticImage = image
    }
  }

  func preloadAllFrames() {

  }
}
