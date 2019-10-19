//
//  AnimatedImageResource.swift
//  yeet
//
//  Created by Jarred WSumner on 9/6/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SDWebImage
import CoreImage
import AVFoundation
import UIKit
import VFCabbage


@available(iOS 10.0, *)
class ExportableBlock : ImageResource {
  var block: ContentBlock? = nil
  let fps = 60
  var lastCIImage: CIImage? = nil
  var lastOffset: UInt = 0


  required init(block: ContentBlock, duration: CMTime) {
    self.block = block
    super.init()
    self.status = .avaliable
    self.duration = duration

    self.selectedTimeRange = CMTimeRange(start: CMTime.zero, duration: duration)

  }

  required init() {
    
    super.init()

  }
  


  open override func image(at time: CMTime, renderSize: CGSize) -> CIImage? {
    guard let block = self.block else {
      return nil
    }

    guard let image = block.value.image.image else {
      return nil
    }

    if image.isAnimated {
      if (self.lastCIImage == nil) {
        self.lastCIImage = CIImage.init(image: image.staticImage!)
      }

      return self.lastCIImage
    } else {
      guard let frameRange = block.ranges.first(where: { imageFrameRange in
        return imageFrameRange.timespan.contains(time.seconds)
      }) else {
        return nil
      }

      if frameRange.frameOffset == lastOffset && self.lastCIImage != nil {
        return self.lastCIImage
      }

      self.lastCIImage = CIImage.init(cgImage: image.animatedImageFrame(at: frameRange.frameOffset))
       self.lastOffset = frameRange.frameOffset
       return self.lastCIImage
    }
  }

  

  // MARK: - NSCopying
  open override func copy(with zone: NSZone? = nil) -> Any {
    let resource = super.copy(with: zone) as! ExportableBlock
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

