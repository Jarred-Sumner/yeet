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
import MobileCoreServices
import SwiftyBeaver
import Promise

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
  func transform() -> CGAffineTransform {
    return CGAffineTransform.init(rotationAngle: CGFloat(rotate.doubleValue))
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
  case gif = "image/gif"
  case webp = "image/webp"
  case jpg = "image/jpeg"
  case mp4 = "video/mp4"
  case heic = "image/heic"
  case heif = "image/heif"
  case tiff = "image/tiff"
  case mov = "video/quicktime"
  case bmp = "image/bmp"

  func fileExtension() -> String {
    switch self {
    case .png:
      return "png"
    case .gif:
      return "gif"
    case .webp:
      return "webp"
    case .jpg:
      return "jpg"
    case .mp4:
      return "mp4"

    case .heic:
      return "heic"

    case .heif:
      return "heif"
    case .tiff:
      return "tiff"
    case .mov:
      return "mov"
    case .bmp:
      return "bmp"
    }
  }

  static func url(_ url: URL) -> MimeType? {
    return fileExtension(url.pathExtension)
  }

  func isAnimatable() -> Bool {
    return [.gif, .webp].contains(self)
  }

  static func fileExtension(_ ext: String) -> MimeType? {
      let fileExtension = ext as CFString

     guard
         let extUTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, fileExtension, nil)?.takeUnretainedValue()
     else { return nil }

     guard
         let mimeUTI = UTTypeCopyPreferredTagWithClass(extUTI, kUTTagClassMIMEType)
     else { return nil }

    return MimeType(rawValue: mimeUTI.takeUnretainedValue() as String)
  }
}

class YeetMedia {
  let width: NSNumber;
  let height: NSNumber;
  let source: String;
  let mimeType: MimeType;
  let uri: String;
  let duration: NSNumber;


  init(width: NSNumber, height: NSNumber, source: String, mimeType: String, uri: String, duration: NSNumber) {
    self.width = width
    self.height = height
    self.source = source
    self.mimeType = MimeType.init(rawValue: mimeType) ?? MimeType.webp
    self.uri = uri
    self.duration = duration
  }
}

class YeetImage : YeetMedia {
  let image: ExportableMediaSource;

  init(width: NSNumber, height: NSNumber, source: String, mimeType: String, uri: String, duration: NSNumber, image: ExportableMediaSource) {
    self.image = image
    super.init(width: width, height: height, source: source, mimeType: mimeType, uri: uri, duration: duration)
  }
}

class YeetVideo : YeetMedia {
  let video: AVURLAsset

  init(width: NSNumber, height: NSNumber, source: String, mimeType: String, uri: String, duration: NSNumber, asset: AVURLAsset) {
    self.video = asset
    super.init(width: width, height: height, source: source, mimeType: mimeType, uri: uri, duration: duration)
  }
}


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

  func renderedFrame(scale: CGFloat = CGFloat(1)) -> CGRect {
    let frame = (self.nodeFrame ?? self.frame)

    return frame.applying(position.transform()).normalize(scale: scale)
  }

  func scaledFrame(scale: CGFloat = CGFloat(1)) -> CGRect {
    let frame = (self.nodeFrame ?? self.frame)

    return frame.normalize(scale: scale)
  }

  
  func maxRenderedFrame(scale: CGFloat = CGFloat(1)) -> CGRect {
    let frame = (self.nodeFrame ?? self.frame)

    return CGRect(
      origin: frame.origin,
      size: frame.applying(position.transform()).size
    ).normalize(scale: scale)
  }


  init(value: JSON?, dimensions: JSON, viewTag: NSNumber, format: String, id: String, zIndex: NSNumber, image: ExportableMediaSource, position: JSON?, frame: CGRect, nodeFrame: CGRect?, text: String?, type: BlockType) {
    self.totalDuration = 0

    self.frame = CGRect(origin: CGPoint(x: frame.origin.x.roundedToScreenScale(), y: frame.origin.y.roundedToScreenScale()), size: CGSize(width: frame.size.width.roundedToScreenScale(), height: frame.size.height.roundedToScreenScale()))
    if let nodeFrame = nodeFrame {
      self.nodeFrame = CGRect(origin: CGPoint(x: nodeFrame.origin.x.roundedToScreenScale(), y: nodeFrame.origin.y.roundedToScreenScale()), size: CGSize(width: nodeFrame.size.width.roundedToScreenScale(), height: nodeFrame.size.height.roundedToScreenScale()))
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
    self.format = PostFormat.init(rawValue: format) ?? PostFormat.screenshot
    self.id = id
    self.zIndex = zIndex
    self.type = type
    self.text = text

    if let _position = position {
      self.position = NodePosition(y: _position["y"].numberValue, scale: _position["scale"].numberValue, rotate: _position["rotate"].numberValue, x: _position["x"].numberValue)
    }

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

enum ExportType : String {
  case png = "image/png"
  case mp4 = "video/mp4"
  case webp = "image/webp"
  case jpg = "image/jpeg"

  func mimeType() -> MimeType {
    switch(self) {
      case .png:
        return MimeType.png
      case .webp:
        return MimeType.webp
      case .mp4:
        return MimeType.mp4
      case .jpg:
        return MimeType.jpg
    }
  }

  func fileExtension() -> String {
    switch(self) {
      case .png:
        return "png"
      case .webp:
        return "webp"
      case .mp4:
        return "mp4"
      case .jpg:
        return "jpg"
    }
  }
}

class VideoProducer {
  let data: JSON
  let images: Dictionary<String, ExportableMediaSource>
  let blocks: Array<ContentBlock>

  var hasAnyAnimations: Bool {
    return blocks.first(where: { imageBlock in
      guard let image = imageBlock.value.image.image else {
        return false
      }

      return image.isAnimated
    }) != nil
  }

  var hasAnyVideos: Bool {
    return blocks.first(where: { imageBlock in
      return imageBlock.value.image.video != nil
    }) != nil
  }

  var isDigitalOnly: Bool {
    return blocks.filter { block in
      return block.value.mimeType == MimeType.png || block.value.mimeType == MimeType.webp
    }.count == self.blocks.count
  }

  static func getBlocks(data: JSON, images: Dictionary<String, ExportableMediaSource>) -> Array<ContentBlock> {
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
      let id = block["id"].stringValue
      let image = images[id]!


      blocks.append(ContentBlock(value: value, dimensions: block["dimensions"], viewTag: block["viewTag"].numberValue, format: block["format"].stringValue, id: id, zIndex: NSNumber(value: currentIndex), image: image, position: node?["position"], frame: frame, nodeFrame: nodeFrame, text: text, type: type))


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



  static func generateExportURL(type: ExportType) -> URL {
     return URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(".\(type.fileExtension())"))
  }

  lazy var resources: Array<ExportableBlock> = self.blocks.map { block in
    return ExportableBlock(block: block, duration: CMTime(seconds: block.totalDuration))
  }

  static let contentExportQueue = DispatchQueue.init(label: "com.codeblogcorp.ContentExportQueue", qos: .background, attributes: .concurrent, autoreleaseFrequency: .workItem, target: nil)

  func start(estimatedBounds: CGRect, isServerOnly: Bool = false, exportURL: URL? = nil, scale: CGFloat? = nil) -> Promise<ContentExport> {
    let isDigital = self.isDigitalOnly


    var exportType: ExportType = .jpg
    measure(name: "determine export type") {
      if (self.hasAnyAnimations || self.hasAnyVideos) {
        exportType = .mp4
      }
  //    else if (isServerOnly) {
  //      exportType = .webp
  //    }
      else if (isDigital) {
        exportType = .png
      } else {
        exportType = .jpg
      }
    }

    let _exportURL: URL = exportURL != nil ? exportURL! : VideoProducer.generateExportURL(type: exportType)


    return ContentExport.export(url: _exportURL, type: exportType, estimatedBounds: estimatedBounds, duration: self.maxDuration(), resources: self.resources, isDigitalOnly: isDigital, scale: scale)
  }


  init(data: JSON, images: Dictionary<String, ExportableMediaSource>) {
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
