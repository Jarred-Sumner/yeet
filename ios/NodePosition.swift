//
//  NodePosition.swift
//  yeet
//
//  Created by Jarred WSumner on 12/27/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

struct NodePosition {
  let y: NSNumber
  let scale:  NSNumber
  let rotate:  NSNumber
  let x: NSNumber

  // CoreImage is bottom left oriented
  func transform() -> CGAffineTransform {
    return CGAffineTransform.init(rotationAngle: CGFloat(rotate.doubleValue))
  }
}
