//
//  UIView+keyboardAnimation.swift
//  yeet
//
//  Created by Jarred WSumner on 1/12/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import UIKit
import Foundation

extension UIView {

  func yeetReactSetFrame(_ frame: CGRect) {
      // These frames are in terms of anchorPoint = topLeft, but internally the
      // views are anchorPoint = center for easier scale and rotation animations.
      // Convert the frame so it works with anchorPoint = center.
      let position = CGPoint(x: frame.midX, y: frame.midY)
      let bounds = CGRect(origin: .zero, size: frame.size)
      // Avoid crashes due to nan coords
    if (position.x.isNaN || position.y.isNaN ||
      bounds.origin.x.isNaN || bounds.origin.y.isNaN ||
      bounds.size.width.isNaN || bounds.size.height.isNaN) {
        Log.error("Invalid layout for \(self.reactTag)\(self). position: \(position). bounds: \(bounds)")
        return;
      }

      self.center = position;
      self.bounds = bounds;
    
  }

  func reactSetFrame(_ frame: CGRect, _ animator: UIViewPropertyAnimator) {
    let position = CGPoint(x: frame.midX, y: frame.midY)
    let bounds = CGRect(origin: .zero, size: frame.size)
    let placeholder = UIView()
    placeholder.center = position
    placeholder.bounds = bounds
      placeholder.transform = layer.affineTransform()

    var sizeTranslation: CGAffineTransform
    let isGrowing = placeholder.frame.width > self.frame.width

    if isGrowing {
      sizeTranslation = CGAffineTransform.init(translationX: (self.frame.width - placeholder.frame.width) / 2, y: (self.frame.height - placeholder.frame.height) / 2)
    } else {
      sizeTranslation = CGAffineTransform.init(translationX: (placeholder.frame.width - self.frame.width) / -2, y: (placeholder.frame.height - self.frame.height) / -2)
    }

    let originalNeedsDisplayOnBoundsChange = self.layer.needsDisplayOnBoundsChange
    let originalContentMode = self.contentMode
    let originalClipsToBounds = self.clipsToBounds

    self.layer.needsDisplayOnBoundsChange = true
    self.contentMode = .redraw
    self.clipsToBounds = false

    animator.addAnimations { [unowned self] in
      self.center = position.applying(sizeTranslation)
    }

    animator.addCompletion { [weak self] animation in
      guard let this = self else {
        return
      }

      if animation == .end {
        this.yeetReactSetFrame(frame)

        this.layer.needsDisplayOnBoundsChange = originalNeedsDisplayOnBoundsChange
        this.contentMode = originalContentMode
        this.clipsToBounds = originalClipsToBounds
      } else {
        Log.warning("setFrame Animation interrupted in \(self)")
      }
    }
  }
  
  func reactSetFrame(_ frame: CGRect, _ _keyboardNotification: KeyboardNotification?, completion: ((_ finished: Bool) -> Void)? = nil) {
    guard let keyboardNotification = _keyboardNotification else {
      self.yeetReactSetFrame(frame)
      completion?(true)
      return
    }

    let position = CGPoint(x: frame.midX, y: frame.midY)
    let bounds = CGRect(origin: .zero, size: frame.size)
    let placeholder = UIView()
    placeholder.center = position
    placeholder.bounds = bounds
//    placeholder.transform = layer.affineTransform()

    var sizeTranslation: CGAffineTransform
    let isGrowing = placeholder.frame.width > self.frame.width

    if isGrowing {
      sizeTranslation = CGAffineTransform.init(translationX: (self.frame.width - placeholder.frame.width) / 2, y: (self.frame.height - placeholder.frame.height) / 2)
    } else {
      sizeTranslation = CGAffineTransform.init(translationX: (placeholder.frame.width - self.frame.width) / -2, y: (placeholder.frame.height - self.frame.height) / -2)
    }

    let originalNeedsDisplayOnBoundsChange = self.layer.needsDisplayOnBoundsChange
    let originalContentMode = self.contentMode
    let originalClipsToBounds = self.clipsToBounds

    self.layer.needsDisplayOnBoundsChange = true
    self.contentMode = .redraw
    self.clipsToBounds = false

    self.layoutIfNeeded()

    UIView.animate(keyboardNotification, animations: { [weak self] in
      self?.center = position.applying(sizeTranslation)
    }, completion: { [weak self] finished in
      if finished {
        self?.yeetReactSetFrame(frame)
        self?.contentMode = originalContentMode
        self?.clipsToBounds = originalClipsToBounds
        self?.layer.needsDisplayOnBoundsChange = originalNeedsDisplayOnBoundsChange
      }

      completion?(finished)
    })
  }

}
