//
//  MovableView.swift
//  yeet
//
//  Created by Jarred WSumner on 12/23/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

protocol TransformableView : UIView {
  var scale: CGFloat {
    get
    set
  }
}

@objc(MovableView)
class MovableView: UIView, RCTUIManagerObserver {
  @objc(didSetProps:)
  override func didSetProps(_ changedProps: Array<String>) {
    super.didSetProps(changedProps)

    if changedProps.contains("inputTag") || changedProps.contains("shouldRasterizeIOS") || changedProps.contains("inputTag") {
      if Thread.isMainThread {
        self.updateContentScale()
        self.textInput?.movableViewTag = self.reactTag
      } else {
        DispatchQueue.main.async { [weak self] in
          self?.updateContentScale()
          self?.textInput?.movableViewTag = self?.reactTag
        }
      }
    }
  }

  var transformObserver: NSKeyValueObservation? = nil
  var textInput: YeetTextInputView? {
    if let tag = inputTag {
      return self.bridge?.uiManager?.view(forReactTag: tag) as? YeetTextInputView
    } else {
      return nil
    }
  }

  var mediaPlayerView: MediaPlayer? {
    if let tag = inputTag {
      return self.bridge?.uiManager?.view(forReactTag: tag) as? MediaPlayer
    } else {
      return nil
    }
  }

  var transformableView: TransformableView? {
    if let tag = inputTag {
      return self.bridge?.uiManager?.view(forReactTag: tag) as? TransformableView
    } else {
      return nil
    }
  }
  var bridge: RCTBridge? = nil

  init(bridge: RCTBridge?) {
    self.bridge = bridge
    super.init(frame: .zero)

    self.startObservingTransform()
  }

  func startObservingTransform() {
    transformObserver = self.layer.observe(\CALayer.transform) { view, changes in
       if Thread.isMainThread {
         self.updateContentScale()
       } else {
         DispatchQueue.main.async { [weak self] in
           self?.updateContentScale()
         }
       }
    }
  }

  func stopObservingTransform() {
    transformObserver?.invalidate()
    transformObserver = nil
  }

  @objc(inputTag)
  var inputTag: NSNumber? = nil



  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func layoutSubviews() {
    super.layoutSubviews()
  }

  func updateContentScale() {
    guard let transformableView = self.transformableView else {
      return
    }


    let screenScale = UIScreen.main.scale
    let scale = min(
      max(self.layer.affineTransform().scaleX, self.layer.affineTransform().scaleY),
      4.0
    )


    if self.contentScaleFactor != scale || transformableView.scale != scale {
      UIView.setAnimationsEnabled(false)
      transformableView.scale = scale
      layer.contentsScale = scale >= 1.0 ? scale * UIScreen.main.scale : scale * UIScreen.main.scale
      layer.rasterizationScale = layer.contentsScale
      self.contentScaleFactor = scale

      self.subviews.forEach { subview in
        subview.contentScaleFactor = scale
        subview.layer.contentsScale = layer.contentsScale
        layer.rasterizationScale = layer.contentsScale
      }
      UIView.setAnimationsEnabled(true)
    }



  }

  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    var frame = self.bounds
    let scale = max(self.layer.affineTransform().scaleX, self.layer.affineTransform().scaleY)

    if textInput?.textView.isFirstResponder ?? false {
      return super.hitTest(point, with: event)
    }

    if scale > 1.25 {
      frame = frame.insetBy(dx: -5, dy: -5)
    } else if frame.width < 40 || frame.height < 40 {
      frame = frame.insetBy(dx: -30, dy: -30)
    } else {
      frame = frame.insetBy(dx: -10, dy: -10)
    }

     return frame.contains(point) ? self : nil;
   }
}
