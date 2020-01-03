//
//  ContentBlock.swift
//  yeet
//
//  Created by Jarred WSumner on 9/5/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SwiftyJSON
import SDWebImage
import AVFoundation
import CoreImage
import MobileCoreServices
import SwiftyBeaver
import Promise


struct ImageFrameRange {
  let timespan: ClosedRange<TimeInterval>
  let frameOffset: UInt
}

enum BlockType : String {
  case image = "image"
  case text = "text"
//  case video = "video"
}

class ContentBlock {
  let dimensions: YeetImageRect
  let type: BlockType
  let format: PostFormat
  var value: YeetImage
  let viewTag: NSNumber
  let frame: CGRect
  let nodeFrame: CGRect?
  let id: String
  let zIndex: NSNumber
  var position: NodePosition = NodePosition(y: 0.0, scale: 1.0, rotate: 0, x: 0.0)
  var totalDuration: TimeInterval = 0
  var text: String?

  var ranges: Array<ImageFrameRange> = []

  func maxRenderedFrame(scale: CGFloat = CGFloat(1), maxY: CGFloat) -> CGRect {
    var frame = (self.nodeFrame ?? self.frame).normalize(scale: scale)

    let rotate = CGFloat(position.rotate.doubleValue)
    if rotate != .zero {
      if let asset = self.value.image.video?.asset {
        let origin = frame.origin
        frame =  AVMakeRect(aspectRatio: asset.resolution, insideRect: CGRect(origin: .zero, size: frame.size))
        let rotateOrigin = frame.origin
        let multipler = CGFloat(rotate < 0 ? -2 : 2)
        frame = CGRect(origin: origin, size: frame.size)
//        frame.height = frame.height + abs(frame.origin.y / 2)
//        frame.width = frame.width + abs(frame.origin.x / 2)
      }

      frame = frame.applying(position.transform()).normalize(scale: CGFloat(1))


      return frame.normalize(scale: CGFloat(1))
    }

    return frame
  }

  

  func scaledFrame(scale: CGFloat = CGFloat(1)) -> CGRect {
    let frame = (self.nodeFrame ?? self.frame)

    return frame.normalize(scale: scale)
  }

  // The AVMutableVideoComposition layer is one long sheet of videos
  // The videos are not rotated until later, but they are scaled.
  func renderSizeFrame(scale: CGFloat = CGFloat(1)) -> CGRect {
    var frame = (self.nodeFrame ?? self.frame)

    if (self.value.image.isVideo) {
      if let asset = self.value.image.video?.asset {
        return AVMakeRect(aspectRatio: asset.resolution, insideRect: frame.normalize(scale: scale))
      }
    }

    return CGRect(
      origin: frame.origin,
      size: frame.size
    ).normalize(scale: scale).applying(position.transform())
  }





  init(value: JSON?, dimensions: JSON, viewTag: NSNumber, format: String, id: String, zIndex: NSNumber, image: ExportableMediaSource, position: JSON?, frame: CGRect, nodeFrame: CGRect?, text: String?, type: BlockType) {
    self.totalDuration = 0
    self.format = PostFormat.init(rawValue: format) ?? PostFormat.screenshot

    if let _position = position {
        self.position = NodePosition(y: _position["y"].numberValue, scale: _position["scale"].numberValue, rotate: _position["rotate"].numberValue, x: _position["x"].numberValue)
      }

    self.frame = CGRect(origin: CGPoint(x: frame.origin.x.roundedToScreenScale(), y: frame.origin.y.roundedToScreenScale()), size: CGSize(width: frame.size.width.roundedToScreenScale(), height: frame.size.height.roundedToScreenScale()))
    if let nodeFrame = nodeFrame {
      let view = image.nodeView!
      let contentView = image.view!
      let childView = view.subviews.first!
      let bounds = childView.convert(childView.bounds, to: contentView)


      var transform: CGAffineTransform = .identity

//      if image.inputView != nil {
        let offset = nodeFrame.origin
        transform = CGAffineTransform.init(translationX: offset.x, y: offset.y).translatedBy(x: view.transform.translation().x, y: view.transform.translation().y).scaledBy(x: view.transform.scaleX, y: view.transform.scaleY)


      var inset: UIEdgeInsets = .zero
      if let inputView = image.inputView {
        inputView.layoutIfNeeded()
        var stickerContainer: UIView? = nil
        var inputContainer: UIView? = nil
        var lastView: UIView? = inputView.reactSuperview()
        var remainingSearch = 10


        while (stickerContainer == nil && remainingSearch > 0 && lastView != nil)
        {
          if lastView?.nativeID == "inputContainer" {
            inputContainer = lastView!
            inset = lastView!.reactCompoundInsets
          }

          if lastView?.nativeID == "stickerContainer" {
            stickerContainer = lastView!
          } else {
            lastView = lastView?.reactSuperview()
            remainingSearch -= 1
          }
        }

        self.nodeFrame = view.bounds.inset(by: inset).applying(transform)
        
      }   else {
        Log.debug("""
          scale: \(view.transform.scaleX), \(view.transform.scaleY)
          offset: \(offset)
          translation: \(view.transform.translation())
          nodeFrame: \(nodeFrame)
        """)
        self.nodeFrame = view.frame
      }







//      if self.format == .screenshot {

//      } else {
//        self.nodeFrame = view.frame
//      }



    } else {
      self.nodeFrame = nil
    }


    if let _value = value {
      if (type == BlockType.text) {
        self.dimensions = YeetImageRect(x: NSNumber(nonretainedObject: frame.origin.x), y: NSNumber(nonretainedObject: frame.origin.y), maxX: NSNumber(nonretainedObject: frame.size.width + frame.origin.x), maxY: NSNumber(nonretainedObject: frame.size.height + frame.origin.y), width: NSNumber(nonretainedObject: frame.size.width), height: NSNumber(nonretainedObject: frame.size.height))

        self.value = YeetImage(width: self.dimensions.width, height: self.dimensions.height, source: "UIView", mimeType: MimeType.png.rawValue, uri: "memory://", duration: 0, image: image)
      } else if (type == BlockType.image) {
        self.dimensions = YeetImageRect(x: dimensions["x"].numberValue, y: dimensions["y"].numberValue, maxX: dimensions["maxX"].numberValue, maxY: dimensions["maxY"].numberValue, width: dimensions["width"].numberValue, height: dimensions["height"].numberValue)
        self.value = YeetImage(width: _value["width"].numberValue, height: _value["height"].numberValue, source: _value["source"].stringValue, mimeType: _value["mimeType"].stringValue, uri: _value["uri"].stringValue, duration: _value["duration"].numberValue, image: image)
//      } else if (type == BlockType.video) {
//        self.dimensions = YeetImageRect(x: dimensions["x"].numberValue, y: dimensions["y"].numberValue, maxX: dimensions["maxX"].numberValue, maxY: dimensions["maxY"].numberValue, width: dimensions["width"].numberValue, height: dimensions["height"].numberValue)
//        self.value = YeetVideo(width: _value["width"].numberValue, height: _value["height"].numberValue, source: _value["source"].stringValue, mimeType: _value["mimeType"].stringValue, uri: _value["uri"].stringValue, duration: _value["duration"].numberValue, image: image)
      } else {
        self.dimensions = YeetImageRect(x: 0, y: 0, maxX: 0, maxY: 0, width: 0, height: 0)
        self.value = YeetImage(width: 0, height: 0, source: "blank", mimeType: MimeType.jpg.rawValue, uri: "blank://", duration: 0, image: image)
      }
    } else {
      self.dimensions = YeetImageRect(x: 0, y: 0, maxX: 0, maxY: 0, width: 0, height: 0)
      self.value = YeetImage(width: 0, height: 0, source: "blank", mimeType: MimeType.jpg.rawValue, uri: "blank://", duration: 0, image: image)
    }


    self.viewTag = viewTag
    self.id = id
    self.zIndex = zIndex
    self.type = type
    self.text = text



    if self.value.image.isImage {
      self.calculateRanges()
    } else if self.value.image.isVideo {
      self.totalDuration = CMTimeGetSeconds(self.value.image.video!.asset.duration)
    }


  }



  func calculateRanges() {
    guard type == BlockType.image else {
      return
    }

    guard let image = value.image.image else {
      return
    }

    guard image.isAnimated else {
      return
    }

    for i in 0...image.animatedImageFrameCount - 1 {
      let newDuration = image.animatedImageDuration(at: UInt(i))

      self.ranges.append(ImageFrameRange(timespan: TimeInterval(totalDuration)...TimeInterval(newDuration + totalDuration), frameOffset: UInt(i)))
      totalDuration = newDuration + totalDuration
    }
  }


  func maxSize() -> CGSize {
    let original = dimensions.rect()
    let transform = position.transform()
    let origin = original.applying(transform).origin
    return CGSize(
      width: (original.width + origin.x) * transform.scaleX,
      height: (original.height + origin.y) * transform.scaleY
    )

  }

}

public extension UIEdgeInsets {

    /// SwifterSwift: Add all the properties of two `UIEdgeInsets` to create their addition.
    ///
    /// - Parameters:
    ///   - lhs: The left-hand expression
    ///   - rhs: The right-hand expression
    /// - Returns: A new `UIEdgeInsets` instance where the values of `lhs` and `rhs` are added together.
    static func + (_ lhs: UIEdgeInsets, _ rhs: UIEdgeInsets) -> UIEdgeInsets {
        return UIEdgeInsets(top: lhs.top + rhs.top,
                            left: lhs.left + rhs.left,
                            bottom: lhs.bottom + rhs.bottom,
                            right: lhs.right + rhs.right)
    }

    /// SwifterSwift: Add all the properties of two `UIEdgeInsets` to the left-hand instance.
    ///
    /// - Parameters:
    ///   - lhs: The left-hand expression to be mutated
    ///   - rhs: The right-hand expression
    static func += (_ lhs: inout UIEdgeInsets, _ rhs: UIEdgeInsets) {
        lhs.top += rhs.top
        lhs.left += rhs.left
        lhs.bottom += rhs.bottom
        lhs.right += rhs.right
    }

}
