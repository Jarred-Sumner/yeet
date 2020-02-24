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
class MovableView: UIView, RCTUIManagerObserver, UIGestureRecognizerDelegate {
  @objc(didSetProps:)
  override func didSetProps(_ changedProps: Array<String>) {
    super.didSetProps(changedProps)


    if changedProps.contains("inputTag") || changedProps.contains("shouldRasterizeIOS")  {
      RCTExecuteOnMainQueue { [weak self] in
        self?.updateContentScale()
        self?.transformableView?.movableViewTag = self?.reactTag
      }
    }
  }

  var didAutoAnimate = false

  override func reactSetFrame(_ frame: CGRect) {
   updateContentScale()
    if textInput?.isFixedSize ?? false {
      super.reactSetFrame(frame)
      sendTransformEvent()
      return
    }

    let shouldAutoAnimateEmptyTextInput = textInput != nil && textInput?.reactTag == YeetTextInputView.focusedReactTag && textInput?.willAutoFocus ?? false && (frame.width == UIScreen.main.bounds.width || self.frame.width == UIScreen.main.bounds.width) && !didAutoAnimate


    if let animator = self.animator {


      self.reactSetFrame(frame, animator)
      let isShowingKeyboard = textInput?.isShowingKeyboard ?? false
       let isHidingKeyboard = textInput?.isHidingKeyboard ?? false

//      animator.addAnimations { [weak self] in
//        if isShowingKeyboard {
//          self?.overlayView?.layer.opacity = 1.0
//        } else if isHidingKeyboard {
//          self?.overlayView?.layer.opacity = 0.0
//        }
//      }
//
//      animator.addCompletion { [weak self] _ in
//        if isShowingKeyboard {
//          self?.overlayView?.layer.opacity = 1.0
//        } else if isHidingKeyboard {
//          self?.overlayView?.layer.opacity = 0.0
//        }

//        self?.sendTransformEvent()
//      }

      incrementReadyCount()

    // Happened too fast!
    } else if shouldAutoAnimateEmptyTextInput {
      didAutoAnimate = true
      animator = UIViewPropertyAnimator(duration: 0.3, timingParameters: UISpringTimingParameters())
      reactSetFrame(frame, animator!)

      animator?.addAnimations { [weak self] in
        self?.overlayView?.layer.opacity = 1.0
      }

      animator?.addCompletion { [weak self] _ in
        self?.overlayView?.layer.opacity = 1.0
        self?.sendTransformEvent()
      }

      incrementReadyCount()
    } else {
      super.yeetReactSetFrame(frame)
      self.sendTransformEvent()
    }
  }

  var animator: UIViewPropertyAnimator? = nil {
    willSet (newValue) {

      if self.animator != nil && self.animator != newValue {
        if self.animator?.state != .inactive {
          self.animator?.stopAnimation(true)
        }
      }

      newValue?.isInterruptible = true
    }
    didSet {
      guard oldValue != animator else {
        return
      }

      
      animationReadyCount = 0


      if var animator = animator {
        animator.addCompletion { [weak self, weak animator] state in
          if state == .end {
            DispatchQueue.main.async { [weak self, weak animator] in
             if animator == self?.animator {
               animator = nil
               self?.animator = nil
             }
           }
          }

        }
      }

    }
  }

  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
    return true
  }

  var hasTransform : Bool { return layer.affineTransform() != .identity }
  var animationReadyCount = 0
  var requiredReadyCount: Int {
    if let textInput = self.textInput {
      if hasTransform && !textInput.isFixedSize {
        return 3
      } else if !hasTransform && textInput.isFixedSize {
        return 1
      } else if textInput.text?.isEmpty ?? true {
        return 1
      } else {
        return 2
      }
    } else {
      return 2
    }
  }

  func incrementReadyCount() {
    guard let animator = self.animator else {
      return
    }

    animationReadyCount += 1

    if animationReadyCount >= requiredReadyCount && animator.state == .inactive && !animator.isRunning {
      animator.startAnimation()
    }
  }

  @objc(overlayTag)
  var overlayTag: NSNumber? = nil

  var overlayView: UIView? {
    guard let bridge = self.bridge else {
      return nil
    }

    guard bridge.isValid else {
      return nil
    }

    guard let tag = overlayTag else {
      return nil
    }

    return bridge.uiManager.view(forReactTag: tag)
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

      if let animator = self.animator {
        // https://stackoverflow.com/questions/10497397/from-catransform3d-to-cgaffinetransform?rq=1
         self.layer.allowsEdgeAntialiasing = affineTransform != CGAffineTransform.identity

        let bounds = self.bounds
        let oldFrame = bounds.applying(layer.affineTransform())
        let newFrame = bounds.applying(affineTransform)


        var animatedValue = newValue

        animator.addAnimations { [unowned self] in
          self.layer.transform = newValue
        }

        animator.addCompletion { [weak self] state in
          if state == .end {
            self?.layer.transform = newValue
            self?.updateContentScale()
          }

          self?.sendTransformEvent()
        }

        incrementReadyCount()
      } else {
        setTransformValue(newValue)
        self.sendTransformEvent()
      }
    }
  }




  func sendTransformEvent() {

  }


  func setTransformValue(_ newValue: CATransform3D) {

    self.layer.transform = newValue
     // https://stackoverflow.com/questions/10497397/from-catransform3d-to-cgaffinetransform?rq=1
    self.layer.allowsEdgeAntialiasing = layer.affineTransform() != CGAffineTransform.identity

    DispatchQueue.main.throttle(deadline: .now() + 0.1) { [weak self] in
      self?.updateContentScale()
    }
  }

  override var reactTransform: CGAffineTransform {
    get {
      return super.reactTransform
    }

    set (newValue) {
      self.setTransformValue(CATransform3DMakeAffineTransform(newValue))
    }
  }


  @objc(contentContainerTag) var contentContainerTag: NSNumber? = nil

  var contentContainerView: SnapContainerView? {
    if contentContainerTag != nil {
      return bridge?.uiManager.view(forReactTag: contentContainerTag!) as! SnapContainerView
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

    isUserInteractionEnabled = true
  }

  @objc(uid)
  var uid: String? = nil


  @objc(inputTag)
  var inputTag: NSNumber? = nil

  @objc(onTransform) var onTransform: RCTDirectEventBlock? = nil

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

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func layoutSubviews() {
    super.layoutSubviews()
  }



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
    let superValue = super.hitTest(point, with: event)

    guard let textInput = self.textInput else {
     return superValue
    }

    if textInput.textView.isFirstResponder {
      return superValue
    } else if textInput.pointerEvents == .none {
      return nil
    } else {
      return superValue
    }

   }
}
