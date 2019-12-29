//
//  ContentExportThumbnail.swift
//  yeet
//
//  Created by Jarred WSumner on 12/28/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit
import AVFoundation

struct ContentExportThumbnail {
  static var size = CGSize(width: 80, height: 80)
  let uri: String
  let width: Double
  let height: Double
  let type: ExportType

  init?(asset: AVURLAsset) {
    let imageGenerator = AVAssetImageGenerator(asset: asset)
    imageGenerator.maximumSize = ContentExportThumbnail.size.applying(CGAffineTransform.init(scaleX: CGFloat(2), y: CGFloat(2)))

     do {
       let cgImage = try imageGenerator.copyCGImage(at: .zero, actualTime: nil)
       let image = UIImage(cgImage: cgImage).sd_resizedImage(with: ContentExportThumbnail.size, scaleMode: .aspectFill)!
       let data = image.jpegData(compressionQuality: 0.9)!

       let thumbnailUrl = VideoProducer.generateExportURL(type: .jpg)
       try data.write(to: thumbnailUrl)

       self.init(uri: thumbnailUrl.absoluteString, width: Double(image.size.width), height:  Double(image.size.height), type: .jpg)
     } catch {
      return nil
     }
  }


  init(uri: String, width: Double, height: Double, type: ExportType) {
    self.uri = uri
    self.width = width
    self.height = height
    self.type = type
  }

  func dictionaryValue() -> Dictionary<String, Any> {
    return [
      "uri": self.uri as NSString,
      "width": NSNumber(value: self.width),
      "height": NSNumber(value: self.height),
      "type": type.rawValue,
    ]
  }
}
