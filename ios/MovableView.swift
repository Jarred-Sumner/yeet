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


  override func reactSetFrame(_ frame: CGRect) {
    if let animator = self.animator {
      self.reactSetFrame(frame, animator)
      incrementReadyCount()
    } else {
      super.yeetReactSetFrame(frame)
    }
  }

  var animator: UIViewPropertyAnimator? = nil {
    didSet {
      animationReadyCount = 0
    }
  }

  var animationReadyCount = 0
  var requiredReadyCount: Int {
    if textInput != nil {
      return layer.affineTransform() != .identity ? 3 : 2
    } else {
      return 2
    }
  }

  func incrementReadyCount() {
    guard let animator = self.animator else {
      return
    }

    animationReadyCount += 1

    if animationReadyCount >= requiredReadyCount && animator.state == .inactive {
      animator.startAnimation()
    }
  }

  var isTransformAnimationInProgress = false
  @objc(yeetTransform) var yeetTransform : CATransform3D {
    get {
      return layer.transform
    }

    set (newValue) {
      guard !CATransform3DEqualToTransform(layer.transform, newValue) else {
        return
      }

      let affineTransform = CATransform3DGetAffineTransform(newValue)
      Log.debug("""
        Set Transform!
          To: \(affineTransform.scaleXY()) \(affineTransform.rotationRadians())rad
          From: \(layer.affineTransform().scaleXY()) \(layer.affineTransform().rotationRadians())rad
      """)

      if let animator = self.animator {
        // https://stackoverflow.com/questions/10497397/from-catransform3d-to-cgaffinetransform?rq=1
         self.layer.allowsEdgeAntialiasing = affineTransform != CGAffineTransform.identity

        animator.addAnimations { [unowned self] in
          self.layer.transform = newValue
          self.layoutIfNeeded()
        }

        animator.addCompletion { [weak self] state in
          if state == .end {
            self?.updateContentScale()
          }
        }

        incrementReadyCount()
      } else {

        setTransformValue(newValue)
      }
    }
  }

  func setTransformValue(_ newValue: CATransform3D) {

    self.layer.transform = newValue
     // https://stackoverflow.com/questions/10497397/from-catransform3d-to-cgaffinetransform?rq=1
    self.layer.allowsEdgeAntialiasing = layer.affineTransform() != CGAffineTransform.identity

    DispatchQueue.main.throttle(deadline: .now() + 0.1) { [weak self] in
      self?.updateContentScale()
    }


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


  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func layoutSubviews() {
    super.layoutSubviews()
  }

  @objc(unfocusedBottom)
  var unfocusedBottom: NSNumber? = nil

  @objc(unfocusedLeft)
  var unfocusedLeft: NSNumber? = nil


  @objc (onMaybeNeedsAdjustment) var onMaybeNeedsAdjustment: RCTDirectEventBlock? = nil

  var canUpdateContentScale: Bool {
    return animator?.state != .active
  }


  func updateContentScale() {
    guard canUpdateContentScale else {
      return
    }

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
      self.setNeedsDisplay()
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
