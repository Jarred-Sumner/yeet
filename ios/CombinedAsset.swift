//
//  CombinedAsset.swift
//  yeet
//
//  Created by Jarred WSumner on 10/16/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import AVFoundation


class CombinedAsset {
  var asset: AVURLAsset
  typealias SpriteSheet = [String: CGRect]
  var offsets: CombinedAsset.SpriteSheet

  init(asset: AVURLAsset, offsets: CombinedAsset.SpriteSheet) {
    self.asset = asset
    self.offsets = offsets
  }

}
