//
//  FloatingPoint+Extensions.swift
//  yeet
//
//  Created by Jarred WSumner on 12/27/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

extension BinaryFloatingPoint {

  func rounded(toPlaces places:Int) -> Self {
         let divisor = pow(Double(10.0), Double(places))
         return Self((Double(self) * divisor).rounded() / divisor)
     }

  func toClosestMultiple(_ of: Self, _ rule: FloatingPointRoundingRule = .up) -> Self {
    return self.rounded(rule, toMultipleOf: of)
  }

  func isMultiple(_ of: Self, _ rule: FloatingPointRoundingRule = .up) -> Bool {
    return self.rounded(rule, toMultipleOf: of) == self
  }


  func rounded(_ roundingRule: FloatingPointRoundingRule,
               toMultipleOf m: Self) -> Self
  {
      switch roundingRule {
      case .toNearestOrEven:
          return self - self.remainder(dividingBy: m)
      case .toNearestOrAwayFromZero:
          let x = self >= 0 ? self + m/2 : self - m/2
          return x - x.truncatingRemainder(dividingBy: m)
      case .awayFromZero:
          let x = self.rounded(.towardZero, toMultipleOf: m)
          if self == x {
              return self
          } else {
              return self >= 0 ? x + m : x - m
          }
      case .towardZero:
          return self - self.truncatingRemainder(dividingBy: m)
      case .down:
          return self < 0
              ? self.rounded(.awayFromZero, toMultipleOf: m)
              : self.rounded(.towardZero, toMultipleOf: m)
      case .up:
          return self >= 0
              ? self.rounded(.awayFromZero, toMultipleOf: m)
              : self.rounded(.towardZero, toMultipleOf: m)
      }
  }

  var degreesToRadians: Self { return self * .pi / 180 }
 var radiansToDegrees: Self { return self * 180 / .pi }

  func roundedToScreenScale(_ rule: FloatingPointRoundingRule = .toNearestOrAwayFromZero) -> Self {
      let scale: Self = Self(1.0 / UIScreen.main.scale)
      return scale * (self / scale).rounded(rule)
  }
}

extension BinaryInteger {
    var degreesToRadians: CGFloat { return CGFloat(self) * .pi / 180 }
}

