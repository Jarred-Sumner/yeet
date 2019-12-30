//
//  ContentExportResult.swift
//  yeet
//
//  Created by Jarred WSumner on 12/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit
import UIImageColors


struct ContentExportResult {
  let url: URL
  let resolution: CGSize
  let type: ExportType
  let duration: TimeInterval
  let colors: UIImageColors?
  var thumbnail: ContentExportThumbnail? = nil

  init(url: URL, resolution: CGSize, type: ExportType, duration: TimeInterval, colors: UIImageColors?, thumbnail: ContentExportThumbnail? = nil) {
    self.url = url
    self.resolution = resolution
    self.type = type
    self.duration = duration
    self.colors = colors
    self.thumbnail = thumbnail
  }

  func dictionaryValue() -> [String: Any] {
    return [
      "uri": url.absoluteString as NSString,
      "width": NSNumber(value: Double(resolution.width)),
      "height": NSNumber(value: Double(resolution.height)),
      "type": NSString(string: type.rawValue),
      "duration": NSNumber(value: Double(duration)),
      "thumbnail": thumbnail?.dictionaryValue() ?? [
        "uri": url.absoluteString as NSString,
        "width": NSNumber(value: Double(resolution.width)),
        "height": NSNumber(value: Double(resolution.height)),
        "type": NSString(string: type.rawValue),
      ],
      "colors": [
        "background": colors?.background.rgbaString,
        "primary": colors?.primary.rgbaString,
        "secondary": colors?.secondary.rgbaString,
        "detail": colors?.detail.rgbaString,
        ] as [String: String?]
    ]
  }

}
