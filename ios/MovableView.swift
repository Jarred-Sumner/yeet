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

  var movableViewTag: NSNumber? {
    get
    set
  }
}

@objc(MovableView)
class MovableView: UIView, RCTUIManagerObserver {
  @objc(didSetProps:)
  override func didSetProps(_ changedProps: Array<String>) {
    super.didSetProps(changedProps)


    if changedProps.contains("onTransform") {
      self.sendTransformedLayout()
    }

    if changedProps.contains("inputTag") || changedProps.contains("shouldRasterizeIOS")  {
      if Thread.isMainThread {
        self.updateContentScale()
        self.transformableView?.movableViewTag = self.reactTag
      } else {
        DispatchQueue.main.async { [weak self] in
          self?.updateContentScale()
          self?.transformableView?.movableViewTag = self?.reactTag
        }
      }
    }
  }

  @objc(onTransformLayout) var onTransformLayout: RCTDirectEventBlock? = nil

  func handleLayoutTransform(_ previousRect: CGRect) -> Void {
    guard self.onTransformLayout != nil else {
      return
    }

    let _rect = transformRect

    guard _rect != previousRect else {
      return
    }

    onTransformLayout!([
      "layout": [
        "x": _rect.x,
        "y": _rect.y,
        "width": _rect.width,
        "height": _rect.height,
      ],
      "from": [
        "x": previousRect.x,
        "y": previousRect.y,
        "width": previousRect.width,
        "height": previousRect.height,
      ],
    ])
  }

  private var contentContainerTag: NSNumber? = nil

  var contentContainerView: UIView? {
    if contentContainerTag != nil {
      return bridge?.uiManager.view(forReactTag: contentContainerTag!)
    }

    var _current: UIView? = superview

    for _ in 0...10 {
      if _current == nil {
        return nil
      }

      if _current?.nativeID == "content-container" {
        contentContainerTag = _current?.reactTag
        return _current
      } else {
        _current = _current?.superview
      }
    }

    return nil
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
        self.sendTransformedLayout()
       } else {
         DispatchQueue.main.async { [weak self] in
           self?.updateContentScale()
            self?.sendTransformedLayout()
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

  @objc(onTransform) var onTransform: RCTDirectEventBlock? = nil
  @objc(transformedLayoutEventThrottleMs) var transformedLayoutEventThrottleMs: Int = Int(10)

  var shouldSendTransform: Bool {
    guard bridge?.isValid ?? false else {
      return false
    }

    guard isAttached else {
      return false
    }

    guard transformableView != nil else {
      return false
    }

    guard self.onTransform != nil else {
      return false
    }

    return true
  }


  var transformRect: CGRect {
    let transform = CGAffineTransform.init(scaleX: self.transform.scaleX, y: self.transform.scaleY).rotated(by: self.transform.rotationRadians())
    var _rect = CGRect(origin: frame.origin, size: transformableView!.reactContentFrame.size.applying(transform))
    let origin = frame.origin

    if let inputView = self.textInput {
      _rect = CGRect(origin: .zero, size: inputView.textView.contentSize).insetBy(dx: inputView.frame.origin.x * -1, dy: inputView.frame.origin.y * -1).inset(by: inputView.textView.textContainerInset).applying(transform)
      _rect.origin.x += origin.x
      _rect.origin.y += origin.y
    }

    return _rect
  }

  func _sendTransformedLayout() {
    guard shouldSendTransform else {
      return
    }

    let _rect = transformRect

    onTransform!([
      "layout": [
        "x": _rect.x,
        "y": _rect.y,
        "width": _rect.width,
        "height": _rect.height,
      ],
    ])
  }

  func sendTransformedLayout() {
    guard shouldSendTransform else {
      return
    }

    DispatchQueue.main.throttle(deadline: DispatchTime.now() + Double(Double(transformedLayoutEventThrottleMs) / 1000.0)) { [weak self] in
      self?._sendTransformedLayout()
    }
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func layoutSubviews() {
    super.layoutSubviews()

    self.sendTransformedLayout()
  }

  @objc(unfocusedBottom)
  var unfocusedBottom: NSNumber? = nil


  @objc (onMaybeNeedsAdjustment) var onMaybeNeedsAdjustment: RCTDirectEventBlock? = nil

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
    var _point = point
    let scale = max(self.layer.affineTransform().scaleX, self.layer.affineTransform().scaleY)

    if let textInput = self.textInput {
      if textInput.textView.isFirstResponder {
        return super.hitTest(point, with: event)
      } else if textInput.pointerEvents == .none {
        return nil
      } else {
//        frame = textInput.textRect.inset(by: textInput.textInset)
//        _point = self.convert(point, to: textInput.textView)
      }
    }


    if scale > 1.25 {
      frame = frame.insetBy(dx: -5, dy: -5)
    } else {
      frame = frame.insetBy(dx: -10, dy: -10)
    }

     return frame.contains(_point) ? self : nil;
   }
}
