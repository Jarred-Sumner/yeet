//
//  YeetImageRect.swift
//  yeet
//
//  Created by Jarred WSumner on 12/27/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

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
