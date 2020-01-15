//
//  YeetView.swift
//  yeet
//
//  Created by Jarred WSumner on 1/13/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import UIKit

@objc(YeetView)
class YeetView: UIView {
  weak var animator: UIViewPropertyAnimator? = nil
  var textAlign: NSTextAlignment = .left
  

  private var _pointerEvents: RCTPointerEvents = .unspecified

  @objc(pointerEvents) var pointerEvents: RCTPointerEvents {
    get {
      return _pointerEvents
    }

    set (newValue) {
      _pointerEvents = newValue

      if (pointerEvents == .none) {
         self.accessibilityViewIsModal = false
       }
    }
  }

  override func reactSetFrame(_ frame: CGRect) {
    if let animator = self.animator {
      super.reactSetFrame(frame, animator)
    } else {
      super.reactSetFrame(frame)
    }
  }
}
