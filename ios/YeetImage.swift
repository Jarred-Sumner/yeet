//
//  YeetImage.swift
//  yeet
//
//  Created by Jarred WSumner on 12/27/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

class YeetImage : YeetMedia {
  let image: ExportableMediaSource;

  init(width: NSNumber, height: NSNumber, source: String, mimeType: String, uri: String, duration: NSNumber, image: ExportableMediaSource) {
    self.image = image
    super.init(width: width, height: height, source: source, mimeType: mimeType, uri: uri, duration: duration)
  }
}
