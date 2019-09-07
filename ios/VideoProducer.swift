//
//  VideoProducer.swift
//  yeet
//
//  Created by Jarred WSumner on 9/5/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SwiftyJSON
import SDWebImage
import VFCabbage
import AVFoundation
import CoreImage

struct YeetImageRect {
  let x: NSNumber
  let y: NSNumber
  let maxX: NSNumber
  let maxY: NSNumber
  let width: NSNumber
  let height: NSNumber

  func rect() -> CGRect {
    return CGRect(x: CGFloat(x.doubleValue),
                  y: CGFloat(y.doubleValue),
                  width: CGFloat(maxX.doubleValue - x.doubleValue),
                  height: CGFloat(maxY.doubleValue - y.doubleValue))
  }

  func size() -> CGSize {
    return CGSize(width: CGFloat(maxX.doubleValue - x.doubleValue), height: CGFloat(maxY.doubleValue - y.doubleValue))
  }
}

struct NodePosition {
  let y: NSNumber
  let scale:  NSNumber
  let rotate:  NSNumber
  let x: NSNumber

  // CoreImage is bottom left oriented
  func transform(flipY: Bool) -> CGAffineTransform {

    return CGAffineTransform(translationX: CGFloat(x.doubleValue), y: CGFloat(y.doubleValue * (flipY ? -1.0 : 1.0))).rotated(by: CGFloat(rotate.doubleValue * -1)).scaledBy(x: CGFloat(scale.doubleValue), y: CGFloat(scale.doubleValue))
  }
}


enum PostFormat: String {
  case screenshot = "screenshot"
  case caption = "caption"
  case sticker = "sticker"
  case vent = "vent"
  case comic = "comic"
  case blargh = "blargh"
}

enum MimeType: String {
  case png = "image/png"
  case webp = "image/webp"
  case jpg = "image/jpeg"
}

class YeetImage {
  let width: NSNumber;
  let height: NSNumber;
  let source: String;
  let mimeType: MimeType;
  let uri: String;
  let duration: NSNumber;
  let image: SDAnimatedImage;

  init(width: NSNumber, height: NSNumber, source: String, mimeType: String, uri: String, duration: NSNumber, image: SDAnimatedImage) {
    self.width = width
    self.height = height
    self.source = source
    self.mimeType = MimeType.init(rawValue: mimeType) ?? MimeType.webp
    self.uri = uri
    self.duration = duration
    self.image = image
  }
}

class TextBlock {
  let type = "text"
  let value: String
  let viewTag: NSNumber
  let format: PostFormat
  let id: String
  let zIndex: NSNumber

  init(value: String, viewTag: NSNumber, format: String, id: String, zIndex: NSNumber) {
    self.value = value
    self.viewTag = viewTag
    self.format = PostFormat.init(rawValue: format) ?? PostFormat.caption
    self.id = id
    self.zIndex = zIndex
  }
}

struct ImageFrameRange {
  let timespan: ClosedRange<TimeInterval>
  let frameOffset: UInt
}

class ImageBlock {
  let dimensions: YeetImageRect
  let type = "image"
  let format: PostFormat
  let value: YeetImage
  let viewTag: NSNumber
  let id: String
  let zIndex: NSNumber
  var position: NodePosition = NodePosition(y: 0.0, scale: 1.0, rotate: 0, x: 0.0)
  var totalDuration: TimeInterval = 0

  var ranges: Array<ImageFrameRange> = []



  init(value: JSON, dimensions: JSON, viewTag: NSNumber, format: String, id: String, zIndex: NSNumber, image: SDAnimatedImage, position: JSON?) {
    self.dimensions = YeetImageRect(x: dimensions["x"].numberValue, y: dimensions["y"].numberValue, maxX: dimensions["maxX"].numberValue, maxY: dimensions["maxY"].numberValue, width: dimensions["width"].numberValue, height: dimensions["height"].numberValue)
    self.value = YeetImage(width: value["width"].numberValue, height: value["height"].numberValue, source: value["source"].stringValue, mimeType: value["mimeType"].stringValue, uri: value["uri"].stringValue, duration: value["duration"].numberValue, image: image)

    self.viewTag = viewTag
    self.format = PostFormat.init(rawValue: format) ?? PostFormat.screenshot
    self.id = id
    self.zIndex = zIndex

    if let _position = position {
      self.position = NodePosition(y: _position["y"].numberValue, scale: _position["scale"].numberValue, rotate: _position["rotate"].numberValue, x: _position["x"].numberValue)
    }

    self.calculateRanges()
  }

  func calculateRanges() {
    for i in 0...value.image.animatedImageFrameCount - 1 {
      let newDuration = value.image.animatedImageDuration(at: i)

      self.ranges.append(ImageFrameRange(timespan: TimeInterval(totalDuration)...TimeInterval(newDuration + totalDuration), frameOffset: i))
      totalDuration = newDuration + totalDuration
    }
  }
  

  func maxSize() -> CGSize {
    let original = dimensions.rect()
    let transform = position.transform(flipY: true);
    let origin = original.applying(transform).origin
    return CGSize(
      width: (original.width + origin.x) * transform.scaleX,
      height: (original.height + origin.y) * transform.scaleY
    )

  }

  func trackItem(resolution: CGSize) -> TrackItem {

    if #available(iOS 10.0, *) {
      let duration = CMTime(seconds: self.totalDuration )
      let trackItem = TrackItem(resource: ImageBlockResource(block: self, duration: duration, resolution: resolution))

      trackItem.videoConfiguration.frame = CGRect(origin: .zero, size: resolution)


      return trackItem
    } else {
      return TrackItem(resource: Resource())
    }
  }
}


class VideoProducer {
  let data: JSON
  let images: Dictionary<String, SDAnimatedImage>
  let textBlocks: Array<TextBlock>
  let imageBlocks: Array<ImageBlock>

  static func getImageBlocks(data: JSON, images: Dictionary<String, SDAnimatedImage>) -> Array<ImageBlock> {
    var imageBlocks: Array<ImageBlock> = []
    var currentIndex = 0

    let nodeBlocks = data["nodes"].arrayValue.map { node in
      return node["block"]
    }

    var allBlocks = data["blocks"].arrayValue
    allBlocks.append(contentsOf: nodeBlocks)

    allBlocks.forEach { block in
      if (block["type"].stringValue == "image") {
        let node = data["nodes"].arrayValue.first(where: {_node in
          return _node["block"].dictionaryValue["id"]?.stringValue == block["id"].stringValue
        })

        imageBlocks.append(ImageBlock(value: block["value"], dimensions: block["dimensions"], viewTag: block["viewTag"].numberValue, format: block["format"].stringValue, id: block["id"].stringValue, zIndex: NSNumber(value: currentIndex), image: images[block["id"].stringValue]!, position: node?["position"]))
      }

      currentIndex = currentIndex + 1
    }

    return imageBlocks
  }

  func resolution() -> CGSize {
    var width = CGFloat(0.0);
    var height = CGFloat(0.0);
    self.imageBlocks.forEach { imageBlock in
      let size = imageBlock.maxSize()

      if (size.width > width) {
        width = size.width
      }

      if (size.height > height) {
        height = size.height
      }
    }

    return CGSize(width: width, height: height)
  }


  func maxDuration() -> Double {
    return self.imageBlocks.map { _block in
      return _block.totalDuration
    }.max()!
  }

  func start() {
    let backgroundImage = CIImage.init(image: UIImage.from(color: UIColor.clear, size: self.resolution()))!
    let backgroundTrack = TrackItem(resource: ImageResource(image: backgroundImage, duration: CMTime(seconds: self.maxDuration())))

    let trackItems = self.imageBlocks.map { imageBlock in
      return imageBlock.trackItem(resolution: resolution())
    }

    let timeline = Timeline()


    timeline.overlays = trackItems
    timeline.videoChannel = [backgroundTrack]

    if #available(iOS 10.0, *) {
      timeline.backgroundColor = CIColor.black
    }


    timeline.renderSize = self.resolution()
    

    let compositionGenerator = CompositionGenerator(timeline: timeline)


    var presetName = AVAssetExportPresetHighestQuality
    if #available(iOS 11.0, *) {
      presetName = AVAssetExportPresetHEVCHighestQuality
    }

    guard let exportSession = compositionGenerator.buildExportSession(presetName: presetName) else { return; }

    exportSession.outputFileType = AVFileType.mp4
    exportSession.shouldOptimizeForNetworkUse = false


    let exportURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(".mp4"))
    exportSession.outputURL = exportURL
    print("[VideoProducer] Exporting \(timeline.renderSize) of \(self.maxDuration()) seconds with \(self.imageBlocks.count) images")

    exportSession.exportAsynchronously(completionHandler: {

    })

  }

  static func getTextBlocks(data: JSON) -> Array<TextBlock> {
    var textBlocks: Array<TextBlock> = []
    var currentIndex = 0

    let nodeBlocks = data["nodes"].arrayValue.map { node in
      return node["block"]
    }

    var allBlocks = data["blocks"].arrayValue
    allBlocks.append(contentsOf: nodeBlocks)

    allBlocks.forEach { block in
      if (block["type"].stringValue == "text") {

        textBlocks.append(TextBlock(value: block["value"].stringValue, viewTag: block["viewTag"].numberValue, format: block["format"].stringValue, id: block["id"].stringValue, zIndex: NSNumber(value: currentIndex)))
      }

      currentIndex = currentIndex + 1
    }

    return textBlocks
  }

  init(data: JSON, images: Dictionary<String, SDAnimatedImage>) {
    self.data = data
    self.imageBlocks = VideoProducer.getImageBlocks(data: data, images: images).sorted(by: { a, b in
      return a.zIndex.intValue < b.zIndex.intValue
    })
    self.textBlocks = VideoProducer.getTextBlocks(data: data)
    self.images = images
  }


  func allBlocks() -> Array<JSON> {
    let nodeBlocks = data["nodes"].arrayValue.map { node in
      return node["block"]

    }

    var allBlocks = data["blocks"].arrayValue
    allBlocks.append(contentsOf: nodeBlocks)

    return allBlocks;
  }
}

public extension CGAffineTransform {
  var angle: CGFloat { return atan2(-self.c, self.a) }

  var angleInDegrees: CGFloat { return self.angle * 180 / .pi }

  var scaleX: CGFloat {
    let angle = self.angle
    return self.a * cos(angle) - self.c * sin(angle)
  }

  var scaleY: CGFloat {
    let angle = self.angle
    return self.d * cos(angle) + self.b * sin(angle)
  }
}
