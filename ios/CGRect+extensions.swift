//
//  CGRectExtensions.swift
//  yeet
//
//  Created by Jarred WSumner on 12/27/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit
import SwiftyJSON

// Fitting and Filling
extension CGRect {
  /// Calculates the fitting aspect scale between a source size
  /// and a destination rectangle
  public func fittingAspect(of sourceSize: CGSize) -> CGFloat {
    let scaleW = width / sourceSize.width
    let scaleH = height / sourceSize.height
    return fmin(scaleW, scaleH)
  }

  /// Calculates the filling aspect scale between a source size
  /// and a destination rectangle
  public func fillingAspect(of sourceSize: CGSize) -> CGFloat {
    let scaleW = width / sourceSize.width
    let scaleH = height / sourceSize.height
    return fmax(scaleW, scaleH)
  }

  /// Fitting into a destination rectangle
  public func fitting(_ destination: CGRect) -> CGRect {
    let aspect = destination.fittingAspect(of: size)
    let targetSize = CGSize(width: width * aspect, height: height * aspect)
    return CGRect.around(destination.center, size: targetSize)
  }

  /// Filling a destination rectangle
  public func filling(_ destination: CGRect) -> CGRect {
    let aspect = destination.fillingAspect(of: size)
    let targetSize = CGSize(width: width * aspect, height: height * aspect)
    return CGRect.around(destination.center, size: targetSize)
  }
}


extension CGRect {
  /// Sets and returns top left corner
  public var topLeft: CGPoint {
    get { return origin }
    set { origin = newValue }
  }

  /// Sets and returns top center point
  public var topCenter: CGPoint {
    get { return CGPoint(x: midX, y: minY) }
    set { origin = CGPoint(x: newValue.x - width / 2,
                           y: newValue.y) }
  }

  /// Returns top right corner
  public var topRight: CGPoint {
    get { return CGPoint(x: maxX, y: minY) }
    set { origin = CGPoint(x: newValue.x - width,
                           y: newValue.y) }
  }

  /// Returns center left point
  public var centerLeft: CGPoint {
    get { return CGPoint(x: minX, y: midY) }
    set { origin = CGPoint(x: newValue.x,
                           y: newValue.y - height / 2) }
  }

  /// Sets and returns center point
  public var center: CGPoint {
    get { return CGPoint(x: midX, y: midY) }
    set { origin = CGPoint(x: newValue.x - width / 2,
                           y: newValue.y - height / 2) }
  }

  /// Returns center right point
  public var centerRight: CGPoint {
    get { return CGPoint(x: maxX, y: midY) }
    set { origin = CGPoint(x: newValue.x - width,
                           y: newValue.y - height / 2) }
  }

  /// Returns bottom left corner
  public var bottomLeft: CGPoint {
    get { return CGPoint(x: minX, y: maxY) }
    set { origin = CGPoint(x: newValue.x,
                           y: newValue.y - height) }
  }

  /// Returns bottom center point
  public var bottomCenter: CGPoint {
    get { return CGPoint(x: midX, y: maxY) }
    set { origin = CGPoint(x: newValue.x - width / 2,
                           y: newValue.y - height) }
  }

  /// Returns bottom right corner
  public var bottomRight: CGPoint {
    get { return CGPoint(x: maxX, y: maxY) }
    set { origin = CGPoint(x: newValue.x - width,
                           y: newValue.y - height) }
  }

  func cropSize(rotationAngle: CGFloat) -> CGSize {
    return CGSize(
      width: origin.x + size.width,
      height: origin.y + size.height
    ).applying(CGAffineTransform.init(rotationAngle: rotationAngle))
  }
}

// Exposed fields without indirection
extension CGRect {
  /// Returns origin x
  public var x: CGFloat {
    get { return origin.x }
    set { origin.x = newValue }
  }

  /// Returns origin y
  public var y: CGFloat {
    get { return origin.y }
    set { origin.y = newValue }
  }

  /// Returns size width
  public var width: CGFloat {
    get { return size.width } // normally built-in
    set { size.width = newValue }
  }

  /// Returns size height
  public var height: CGFloat {
    get { return size.height } // normally built-in
    set { size.height = newValue }
  }
}

// Rectangle Properties
extension CGRect {
  /// Return rectangle's area
  public var area: CGFloat { return width * height }

  /// Return rectangle's diagonal extent
  public var diagonalExtent: CGFloat { return hypot(width, height) }
}

// Moving Rects
extension CGRect {

  /// Returns rect translated to origin
  public var zeroed: CGRect {
    return CGRect(origin: .zero, size: size)
  }

  /// Constructs a rectangle around a center with the given size
  public static func around(_ center: CGPoint, size: CGSize) -> CGRect {
    var rect = CGRect(origin: .zero, size: size)
    rect.center = center
    return rect
  }

  /// Returns rect centered around point
  func around(_ center: CGPoint) -> CGRect {
    return CGRect.around(center, size: size)
  }

  /// Returns rect with coaligned centers
  public func centered(in mainRect: CGRect) -> CGRect {
    return CGRect.around(mainRect.center, size: size)
  }

}


extension CGRect {
  func normalize(scale: CGFloat = CGFloat(1)) -> CGRect {
    let rect = self.standardized.applying(.init(scaleX: scale, y: scale))

    return CGRect(
      origin: CGPoint(x: rect.origin.x.rounded(.toNearestOrEven), y: rect.origin.y.rounded(.toNearestOrEven)),
      size: CGSize(width: rect.size.width.rounded(.toNearestOrEven), height: rect.size.height.rounded(.toNearestOrEven))
    )
  }

  func h264Friendly() -> CGRect {
    let size = self.size.h264Friendly()

//    let origin = CGPoint(
//      x: self.origin.x + self.size.width - size.width,
//      y: self.origin.y + self.size.height - size.height
//    )

    return CGRect(
      origin: origin,
      size: size
      )
//      size: CGSize(
//        width: size.width - origin.x,
//        height: size.height - origin.y
//      )
//    )
  }
}

extension CGRect {
  static func from(json: JSON) -> CGRect {
    return CGRect(
      x: CGFloat(json["x"].doubleValue),
      y: CGFloat(json["y"].doubleValue),
      width: CGFloat(json["width"].doubleValue),
      height: CGFloat(json["height"].doubleValue)
    )
  }

  static func from(x: NSNumber, y: NSNumber, width: NSNumber, height: NSNumber) -> CGRect {
    return CGRect(
      x: CGFloat(x.doubleValue),
      y: CGFloat(y.doubleValue),
      width: CGFloat(width.doubleValue),
      height: CGFloat(height.doubleValue)
    )
  }
}
