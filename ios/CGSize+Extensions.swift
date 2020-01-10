//
//  CGSize+Extensions.swift
//  yeet
//
//  Created by Jarred WSumner on 12/27/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

extension CGSize {
  func h264Friendly() -> CGSize {
    let h264Width = abs(self.width.toClosestMultiple(CGFloat(16)))
    let h264Height = abs(self.height.toClosestMultiple(CGFloat(16)))

    if (Int(h264Width) / Int(width) != Int(h264Height) / Int(height)) {
      return CGSize(width: h264Width + 1, height: h264Height + 1 ).h264Friendly()
    }

    return CGSize(
      width: h264Width,
      height: h264Height
    )
  }

  func dictionaryValue() -> [String: Any] {
    return [
      "width": width,
      "height": height
    ]
  }

  var h264FriendlyScale: Int {
    let h264Width = abs(self.width.toClosestMultiple(CGFloat(16)))
    let h264Height = abs(self.height.toClosestMultiple(CGFloat(16)))

    if (Int(h264Width) / Int(width) != Int(h264Height) / Int(height)) {
      return CGSize(width: width + 1, height: height + 1).h264FriendlyScale
    }

    return Int(h264Width) / Int(width)
  }
}
