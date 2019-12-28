//
//  ExportType.swift
//  yeet
//
//  Created by Jarred WSumner on 12/27/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit
import AVFoundation

enum ExportType : String {
  case png = "image/png"
  case mp4 = "video/mp4"
  case mov = "video/quicktime"
  case webp = "image/webp"
  case jpg = "image/jpeg"

  var isVideo: Bool {
    return [.mov, .mp4].contains(self)
  }

  var avFileType: AVFileType {
    if self == .mov {
      return .mov
    } else if self == .mp4 {
      return .mp4
    } else {
      return .jpg
    }
  }

  func mimeType() -> MimeType {
    switch(self) {
      case .png:
        return MimeType.png
      case .webp:
        return MimeType.webp
      case .mp4:
        return MimeType.mp4
    case .mov:
      return MimeType.mov
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
      case .mov:
        return "mov"
    }
  }
}
