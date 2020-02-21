//
//  SnapTransform.swift
//  yeet
//
//  Created by Jarred WSumner on 2/16/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

import UIKit
import SwiftyJSON

@objc(SnapTransform) class SnapTransform: NSObject {
  @objc(x) var x: CGFloat = .zero
  @objc(y) var y: CGFloat = .zero
  @objc(scaleX) var scaleX: CGFloat = 1.0
  @objc(scaleY) var scaleY: CGFloat = 1.0
  @objc(rotate) var rotate: CGFloat = 0.0

  static var identity : SnapTransform {
    return SnapTransform(x: .zero, y: .zero, scaleX: 1, scaleY: 1, rotate: 0)
  }

  convenience init(transform: CGAffineTransform, center: CGPoint, containerShadowView: RCTShadowView, shadowView: RCTShadowView) {
    var yValue : Float = 0



    let top = shadowView.top
    let bottom = shadowView.bottom
    let left = shadowView.left

    let sign = bottom.unit == YGUnit.undefined ? CGFloat(-1) : CGFloat(1)

//    let centerOffset = CGPoint(x: center.x - shadowView.layoutMetrics.frame.width / 2, y: center.y - shadowView.layoutMetrics.frame.height / 2)

    let _frame = shadowView.measureLayoutRelative(toAncestor: containerShadowView)


    let translation = transform.translation()
    let x = RCTCoreGraphicsFloatFromYogaFloat(left.value) + translation.x



    var y : CGFloat
    if bottom.unit == YGUnit.undefined {
      y = RCTCoreGraphicsFloatFromYogaFloat(top.value) + transform.translation().y
    } else {
      y = (RCTCoreGraphicsFloatFromYogaFloat(bottom.value) * -1) + transform.translation().y 
    }



    self.init(x: x, y: y, scaleX: transform.scaleX, scaleY: transform.scaleY, rotate: transform.rotationRadians())
  }

  @objc(dictionaryValue) var dictionaryValue: [String: Any] {
    return [
      "x": x,
      "y": y,
      "scaleX": scaleX,
      "scaleY": scaleY,
      "rotate": rotate,
    ]
  }

  @objc init(x: CGFloat, y: CGFloat, scaleX: CGFloat, scaleY: CGFloat, rotate: CGFloat) {
    self.x = x
    self.y = y
    self.scaleX = scaleX
    self.scaleY = scaleY
    self.rotate = rotate
    super.init()
  }

  var affineTransform: CGAffineTransform {
    return CGAffineTransform(scaleX: scaleX, y: scaleY).rotated(by: rotate)
  }

  var origin : CGPoint {
    return CGPoint(x: x, y: y)
  }
}

extension RCTConvert {
  @objc(ConvertSnapTransform:) static func ConvertSnapTransform(_ dictionary: Dictionary<String, AnyObject>) -> SnapTransform {
    return SnapTransform(
      x: dictionary["x"]?.cgFloatValue ?? .zero,
      y: dictionary["y"]?.cgFloatValue ?? .zero,
      scaleX: dictionary["scaleX"]?.cgFloatValue ?? CGFloat(1),
      scaleY: dictionary["scaleY"]?.cgFloatValue ?? CGFloat(1),
      rotate: dictionary["rotate"]?.cgFloatValue ?? .zero
    )
  }


}

//extension CALayer {
//  var originalFrame: CGRect {
//       let currentTransform = affineTransform()
//        setAffineTransform(.identity)
//       let originalFrame = frame
//       setAffineTransform(currentTransform)
//       return originalFrame
//   }
//
//    /// Helper to get point offset from center
//    func centerOffset(_ point: CGPoint) -> CGPoint {
//        return CGPoint(x: point.x - position.x, y: point.y - position.y)
//    }
//
//    /// Helper to get point back relative to center
//    func pointRelativeToCenter(_ point: CGPoint) -> CGPoint {
//        return CGPoint(x: point.x + position.x, y: point.y + position.y)
//    }
//
//    /// Helper to get point relative to transformed coords
//    func newPointInView(_ point: CGPoint) -> CGPoint {
//        // get offset from center
//        let offset = centerOffset(point)
//        // get transformed point
//      let transformedPoint = offset.applying(affineTransform())
//        // make relative to center
//        return pointRelativeToCenter(transformedPoint)
//    }
//
//    var newTopLeft: CGPoint {
//        return newPointInView(originalFrame.origin)
//    }
//
//    var newTopRight: CGPoint {
//        var point = originalFrame.origin
//        point.x += originalFrame.width
//        return newPointInView(point)
//    }
//
//    var newBottomLeft: CGPoint {
//        var point = originalFrame.origin
//        point.y += originalFrame.height
//        return newPointInView(point)
//    }
//
//    var newBottomRight: CGPoint {
//        var point = originalFrame.origin
//        point.x += originalFrame.width
//        point.y += originalFrame.height
//        return newPointInView(point)
//    }
//}
