//
//  YeetVideo.swift
//  yeet
//
//  Created by Jarred WSumner on 12/27/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit
import AVFoundation

class YeetVideo : YeetMedia {
  let video: AVURLAsset

  init(width: NSNumber, height: NSNumber, source: String, mimeType: String, uri: String, duration: NSNumber, asset: AVURLAsset) {
    self.video = asset
    super.init(width: width, height: height, source: source, mimeType: mimeType, uri: uri, duration: duration)
  }
}
