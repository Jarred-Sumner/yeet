//
//  AnimatedImageResource.swift
//  yeet
//
//  Created by Jarred WSumner on 9/6/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SDWebImage
import VFCabbage
import CoreImage
import AVFoundation
import UIKit



@available(iOS 10.0, *)
class ImageBlockResource : ImageResource {
  var block: ImageBlock? = nil
  let fps = 60
  var lastCIImage: CIImage? = nil
  var lastOffset: UInt = 0
  let resolution: CGSize

  required init(block: ImageBlock, duration: CMTime, resolution: CGSize) {
    self.block = block
    self.resolution = resolution
    super.init()
    self.status = .avaliable
    self.duration = duration

    self.selectedTimeRange = CMTimeRange(start: CMTime.zero, duration: duration)

    block.value.image.preloadAllFrames()
  }

  required init() {
    self.resolution = CGSize.zero
    super.init()

  }

  


  open override func image(at time: CMTime, renderSize: CGSize) -> CIImage? {
    if let block = self.block {
      let duration = block.totalDuration
      var frameRange = block.ranges.first(where: { imageFrameRange in
        return imageFrameRange.timespan.contains(time.seconds)
      })

      if frameRange?.frameOffset == lastOffset && self.lastCIImage != nil {
        return self.lastCIImage
      }

    if let frame = block.value.image.animatedImageFrame(at: frameRange!.frameOffset) {
        self.lastCIImage = CIImage.init(image: frame)
        self.lastOffset = frameRange!.frameOffset
        return self.lastCIImage
      } else {
        return nil
      }
    } else {
      return nil
    }

  }

  // MARK: - NSCopying
  open override func copy(with zone: NSZone? = nil) -> Any {
    let resource = super.copy(with: zone) as! ImageBlockResource
    resource.block = block
    return resource
  }

}


extension UIImage {
  static func from(color: UIColor, size: CGSize) -> UIImage {
    let rect = CGRect(x: 0, y: 0, width: size.width, height: size.height)
    UIGraphicsBeginImageContext(rect.size)
    let context = UIGraphicsGetCurrentContext()
    context!.setFillColor(color.cgColor)
    context!.fill(rect)
    let img = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()
    return img!
  }
}

private extension CIImage {

  func flipYCoordinate() -> CIImage {
    let flipYTransform = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: 0, ty: extent.origin.y * 2 + extent.height)
    return transformed(by: flipYTransform)
  }

}

