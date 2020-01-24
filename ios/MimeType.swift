//
//  MimeType.swift
//  yeet
//
//  Created by Jarred WSumner on 12/27/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit
import MobileCoreServices
import Foundation

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

  static func images() -> Array<MimeType> {
    return [
      MimeType.heic,
      MimeType.webp,
      MimeType.jpg,
      MimeType.heif,
      MimeType.tiff,
      MimeType.bmp,
      MimeType.png,
    ]
  }

  func utiType() -> String {
    switch self {
    case .png:
      return "public.png"
    case .gif:
      return "public.gif"
    case .webp:
      return "public.webp"
    case .jpg:
      return "public.jpeg"
    case .mp4:
      return "public.mpeg-4"

    case .heic:
      return "public.heic"

    case .heif:
      return "public.heif"
    case .tiff:
      return "public.tiff"
    case .mov:
      return "com.apple.quicktime-movie"
    case .bmp:
      return "public.bmp"
    }
  }

  static func from(uti: String) -> MimeType? {
    switch uti {
    case "public.png":
      return MimeType.png
  case "public.gif":
      return MimeType.gif
  case "public.webp":
      return MimeType.webp
    case "public.jpeg":
  return MimeType.jpg
    case "public.mpeg-4":
  return MimeType.mp4

    case "public.heic":
  return MimeType.heic

    case "public.heif":
      return MimeType.heif
  case "public.tiff":
      return MimeType.tiff
    case "com.apple.quicktime-movie":
      return MimeType.mov
    case "public.bmp":
  return MimeType.bmp
  default:
    return nil
    }
  }

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

extension UIImage {
  var mimeType: MimeType {
    switch sd_imageFormat {
    case .GIF:
      return .gif
    case .HEIC:
        return .heic
    case .HEIF:
      return .heif
    case .PNG:
      return .png
    case .TIFF:
      return .tiff
    case .JPEG:
      return .jpg
    case .undefined:
      return .jpg
    case .webP:
      return .webp
    default:
      return .jpg
    }
  }

  var sharableMimeType: MimeType {
    let type = self.mimeType

    if [MimeType.png, MimeType.tiff, MimeType.bmp, MimeType.webp].contains(type) {
      return .png
    } else {
      return .jpg
    }
  }

  var sharableData: Data? {
    let type = self.sharableMimeType

    if type == .png {
      return self.pngData()
    } else {
      return self.jpegData(compressionQuality: CGFloat(0.95))
    }
  }
}
