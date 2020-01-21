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

  var backgroundColor: UIColor = UIColor.black

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

  func start(estimatedBounds: CGRect, isServerOnly: Bool = false, exportURL: URL? = nil, scale: CGFloat? = nil, task: ContentExportTask) -> Promise<ContentExportResult> {
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


    return ContentExport.export(url: _exportURL, type: exportType, estimatedBounds: estimatedBounds, duration: self.maxDuration(), resources: self.resources, isDigitalOnly: isDigital, scale: scale, task: task, backgroundColor: backgroundColor)
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
