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
import AVFoundation
import CoreImage

extension CGRect {
  static func from(json: JSON) -> CGRect {
    return CGRect(
      x: CGFloat(json["x"].doubleValue),
      y: CGFloat(json["y"].doubleValue),
      width: CGFloat(json["width"].doubleValue),
      height: CGFloat(json["height"].doubleValue)
    )
  }

  static func from(x: NSNumber, y: NSNumber, width: NSNumber, height: NSNumber) -> CGRect {
    return CGRect(
      x: CGFloat(x.doubleValue),
      y: CGFloat(y.doubleValue),
      width: CGFloat(width.doubleValue),
      height: CGFloat(height.doubleValue)
    )
  }
}

struct YeetImageRect {
  let x: NSNumber
  let y: NSNumber
  let maxX: NSNumber
  let maxY: NSNumber
  let width: NSNumber
  let height: NSNumber
  let cornerRadius: NSNumber = NSNumber(value: 4)

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

    return CGAffineTransform(translationX: CGFloat(x.doubleValue), y: CGFloat(y.doubleValue * (flipY ? -1.0 : 1.0))).rotated(by: CGFloat(rotate.doubleValue)).scaledBy(x: CGFloat(scale.doubleValue), y: CGFloat(scale.doubleValue))
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
  case mp4 = "video/mp4"
}

class YeetImage {
  let width: NSNumber;
  let height: NSNumber;
  let source: String;
  let mimeType: MimeType;
  let uri: String;
  let duration: NSNumber;
  let image: ExportableImage;

  init(width: NSNumber, height: NSNumber, source: String, mimeType: String, uri: String, duration: NSNumber, image: ExportableImage) {
    self.width = width
    self.height = height
    self.source = source
    self.mimeType = MimeType.init(rawValue: mimeType) ?? MimeType.webp
    self.uri = uri
    self.duration = duration
    self.image = image
  }
}

struct ImageFrameRange {
  let timespan: ClosedRange<TimeInterval>
  let frameOffset: UInt
}

enum BlockType : String {
  case image = "image"
  case text = "text"
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



  init(value: JSON?, dimensions: JSON, viewTag: NSNumber, format: String, id: String, zIndex: NSNumber, image: ExportableImage, position: JSON?, frame: CGRect, nodeFrame: CGRect?, text: String?, type: BlockType) {


    self.frame = frame
    self.nodeFrame = nodeFrame

    if let _value = value {
      if (type == BlockType.text) {
        self.dimensions = YeetImageRect(x: NSNumber(nonretainedObject: frame.origin.x), y: NSNumber(nonretainedObject: frame.origin.y), maxX: NSNumber(nonretainedObject: frame.size.width + frame.origin.x), maxY: NSNumber(nonretainedObject: frame.size.height + frame.origin.y), width: NSNumber(nonretainedObject: frame.size.width), height: NSNumber(nonretainedObject: frame.size.height))

        self.value = YeetImage(width: self.dimensions.width, height: self.dimensions.height, source: "UIView", mimeType: MimeType.png.rawValue, uri: "memory://", duration: 0, image: image)
      } else if (type == BlockType.image) {
        self.dimensions = YeetImageRect(x: dimensions["x"].numberValue, y: dimensions["y"].numberValue, maxX: dimensions["maxX"].numberValue, maxY: dimensions["maxY"].numberValue, width: dimensions["width"].numberValue, height: dimensions["height"].numberValue)
        self.value = YeetImage(width: _value["width"].numberValue, height: _value["height"].numberValue, source: _value["source"].stringValue, mimeType: _value["mimeType"].stringValue, uri: _value["uri"].stringValue, duration: _value["duration"].numberValue, image: image)
      } else {
        self.dimensions = YeetImageRect(x: 0, y: 0, maxX: 0, maxY: 0, width: 0, height: 0)
        self.value = YeetImage(width: 0, height: 0, source: "blank", mimeType: MimeType.jpg.rawValue, uri: "blank://", duration: 0, image: image)
      }
    } else {
      self.dimensions = YeetImageRect(x: 0, y: 0, maxX: 0, maxY: 0, width: 0, height: 0)
      self.value = YeetImage(width: 0, height: 0, source: "blank", mimeType: MimeType.jpg.rawValue, uri: "blank://", duration: 0, image: image)
    }


    self.viewTag = viewTag
    self.format = PostFormat.init(rawValue: format) ?? PostFormat.screenshot
    self.id = id
    self.zIndex = zIndex
    self.type = type
    self.text = text

    if let _position = position {
      self.position = NodePosition(y: _position["y"].numberValue, scale: _position["scale"].numberValue, rotate: _position["rotate"].numberValue, x: _position["x"].numberValue)
    }



    self.totalDuration = 0
    self.calculateRanges()

  }



  func calculateRanges() {
    if (!value.image.isAnimated || type != BlockType.image) {
      return
    }


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

}

enum ExportType : String {
  case png = "image/png"
  case mp4 = "video/mp4"
  case webp = "image/webp"
  case jpg = "image/jpeg"
}

class VideoProducer {
  let data: JSON
  let images: Dictionary<String, ExportableImage>
  let blocks: Array<ContentBlock>

  var hasAnyAnimations: Bool {
    return blocks.first(where: { imageBlock in
      return imageBlock.value.image.isAnimated
    }) != nil
  }

  var isDigitalOnly: Bool {
    return blocks.filter { block in
      return block.value.mimeType == MimeType.png || block.value.mimeType == MimeType.webp
    }.count == self.blocks.count
  }

  static func getBlocks(data: JSON, images: Dictionary<String, ExportableImage>) -> Array<ContentBlock> {
    var blocks: Array<ContentBlock> = []
    var currentIndex = 0

    let nodeBlocks = data["nodes"].arrayValue.map { node in
      return node["block"]
    }

    var allBlocks = data["blocks"].arrayValue
    allBlocks.append(contentsOf: nodeBlocks)

    allBlocks.forEach { block in

      let node = data["nodes"].arrayValue.first(where: {_node in
        return _node["block"].dictionaryValue["id"]?.stringValue == block["id"].stringValue
      })

      let nodeFrame: CGRect? = node != nil ? CGRect.from(json: node!["frame"]) : nil
      let frame = CGRect.from(json: block["frame"])

      let type = block["type"].stringValue == "image" ? BlockType.image : BlockType.text
      let value = block["value"]
      let text = type == BlockType.text ? block["value"].stringValue : nil


      blocks.append(ContentBlock(value: value, dimensions: block["dimensions"], viewTag: block["viewTag"].numberValue, format: block["format"].stringValue, id: block["id"].stringValue, zIndex: NSNumber(value: currentIndex), image: images[block["id"].stringValue]!, position: node?["position"], frame: frame, nodeFrame: nodeFrame, text: text, type: type))


      currentIndex = currentIndex + 1
    }

    return blocks
  }

  

  func resolution() -> CGSize {
    var width = CGFloat(0.0);
    var height = CGFloat(0.0);
    self.blocks.forEach { imageBlock in
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
    return self.blocks.map { _block in
      return _block.totalDuration
    }.max()!
  }



  func start(estimatedBounds: CGRect, isServerOnly: Bool = false, callback: @escaping RCTResponseSenderBlock) {
    let resources = self.blocks.map { block in
      return ExportableBlock(block: block, duration: CMTime(seconds: block.totalDuration))
    }

    let isDigital = self.isDigitalOnly

    var exportURL: URL
    var exportType: ExportType


    if (self.hasAnyAnimations) {
      exportType = .mp4
      exportURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(".mp4"))
    } else if (isServerOnly) {
      exportType = .webp
      exportURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(".webp"))
    } else if (isDigital) {
      exportType = .png
      exportURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(".png"))
    } else {
      exportType = .jpg
      exportURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(".jpg"))
    }


    ContentExport.export(url: exportURL, type: exportType, estimatedBounds: estimatedBounds, duration: self.maxDuration(), resources: resources, isDigitalOnly: isDigital) { export in
      if let _export = export {
        print("Export \(_export.url)")
        callback([nil, _export.dictionaryValue()])
      } else {
        callback([])
      }

    }
//    let timeline = Timeline()
//
//
//    timeline.overlays = trackItems
//    timeline.videoChannel = [backgroundTrack]
//
//    if #available(iOS 10.0, *) {
//      timeline.backgroundColor = CIColor.black
//    }
////
////
////    timeline.renderSize = self.resolution()
////    
////
////    let compositionGenerator = CompositionGenerator(timeline: timeline)
////
////
////    var presetName = AVAssetExportPresetHighestQuality
////    if #available(iOS 11.0, *) {
////      presetName = AVAssetExportPresetHEVCHighestQuality
////    }
////
////    guard let exportSession = compositionGenerator.buildExportSession(presetName: presetName) else { return; }
////
////    exportSession.outputFileType = AVFileType.mp4
////    exportSession.shouldOptimizeForNetworkUse = false
////
////
//    let exportURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(".mp4"))
////    exportSession.outputURL = exportURL
////    print("[VideoProducer] Exporting \(timeline.renderSize) of \(self.maxDuration()) seconds with \(self.imageBlocks.count) images")
////
////    exportSession.exportAsynchronously(completionHandler: {
////
////    })

  }


  init(data: JSON, images: Dictionary<String, ExportableImage>) {
    self.data = data
    self.blocks = VideoProducer.getBlocks(data: data, images: images).sorted(by: { a, b in
      return a.zIndex.intValue < b.zIndex.intValue
    })


    self.images = images
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
