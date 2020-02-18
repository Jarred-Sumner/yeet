//
//  SnapContainerView.swift
//  yeet
//
//  Created by Jarred WSumner on 2/15/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

import UIKit

protocol SnapContainerViewDelegate : UIView {
  func onFinishMoving(translation: CGPoint, scale: CGFloat, rotation: CGFloat)
  func onStartMoving(translation: CGPoint, scale: CGFloat, rotation: CGFloat)
}

@objc(SnapContainerView) class SnapContainerView: UIView, UIGestureRecognizerDelegate {
  @objc(movableViewTags) var movableViewTags: [NSNumber] = [] {
    didSet (newValue) {

    }
  }

  var snapGesture: SnapGesture? = nil
  @objc(snapPoints) var snapPoints: Dictionary<String, Any> = [:]

  var draggingViewTag: NSNumber? {
    willSet (newValue) {
      if (newValue != draggingViewTag) {
        if let draggingView = self.draggingView {
          DispatchQueue.main.async {
            self.sendStopMoving(draggingView)
          }
        }
      }
    }

    didSet {
      if let snapGesture = self.snapGesture {
        if let draggingView = self.draggingView {
          snapGesture.setTransformView(draggingView, gestgureView: superview!)
          snapGesture.isGestureEnabled = true
          DispatchQueue.main.async {
            self.sendStartMoving(draggingView)
          }
        } else {
          snapGesture.isGestureEnabled = false
        }
      }
    }
  }

  override func didSetProps(_ changedProps: [String]!) {
    Log.debug("CHANGE DPROPS \(changedProps)")
  }
  var draggingView: MovableView? {
    guard draggingViewTag != nil else {
      return nil
    }

    guard bridge != nil else {
      return nil
    }

    guard bridge?.uiManager != nil else {
      return nil
    }

    return bridge?.uiManager.view(forReactTag: draggingViewTag) as? MovableView
  }


  var textInputFocusObserver : NSObjectProtocol? = nil
  var bridge: RCTBridge? = nil

  var isMovingEnabled = true {
    didSet {
      if self.isMovingEnabled == false {
        self.draggingViewTag = nil
      }
    }
  }

  init(bridge: RCTBridge?) {
    self.bridge = bridge

    super.init(frame: .zero)


    isUserInteractionEnabled = true
//    isMultipleTouchEnabled = true

    textInputFocusObserver = NotificationCenter.default.addObserver(forName: .onChangeTextInputFocus, object: nil, queue: .main) { [weak self] _ in
      self?.isMovingEnabled = YeetTextInputView.focusedReactTag == nil
    }
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  @objc(deleteX) var deleteX: CGFloat = -1
  @objc(deleteY) var deleteY: CGFloat = -1
  @objc(deleteTag) var deleteTag: NSNumber? = nil

  var movableViews : [MovableView] {
    let unsorted = movableViewTags.compactMap { self.bridge?.uiManager?.view(forReactTag: $0) as? MovableView }
    let container = unsorted.first?.superview
    guard container != nil else {
      return []
    }

    return container?.subviews.filter { view in
      if view is MovableView {
        return unsorted.contains(view as! MovableView)
      } else {
        return false
      }
    } as! [MovableView]
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()

    if superview != nil && snapGesture == nil {
      self.isUserInteractionEnabled = true

      self.snapGesture = SnapGesture(transformView: self, gestureView: superview!)
      self.snapGesture?.isGestureEnabled = false
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesBegan(touches, with: event)

    guard draggingViewTag == nil else {
      return
    }

    guard isMovingEnabled else {
      return
    }

    for touch in touches {
      let movableViews = self.movableViews

      let tag = movableViews.first { view -> Bool in
        return view.hitTest(touch.location(in: view), with: event) != nil
      }?.reactTag

      if tag != nil {
        self.draggingViewTag = tag
        break
      }
    }

    if self.draggingViewTag == nil && touches.count == 1 {
      eventEmitter?.dispatchBackgroundTap(touches.first!, view: self)
    }
  }

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesEnded(touches, with: event)

    
    self.draggingViewTag = nil
  }

  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesEnded(touches, with: event)

    self.draggingViewTag = nil
  }

  func sendStopMoving(_ view: MovableView) {
    eventEmitter?.dispatchMoveEnd(view, snapContainer: self)
  }

  var eventEmitter : SnapContainerEventEmitter? {
    return bridge?.module(for: SnapContainerEventEmitter.self) as? SnapContainerEventEmitter
  }

  func sendStartMoving(_ view: MovableView) {
    eventEmitter?.dispatchMoveStart(view, snapContainer: self)
  }

  @objc (maxScale) var maxScale = CGFloat(3.0) {
    didSet {
      self.snapGesture?.maxScale = maxScale
    }
  }
  @objc (minScale) var minScale = CGFloat(0.5) {
    didSet {
      self.snapGesture?.minScale = minScale
    }
  }

  @objc(isGestureEnabled)
  var isGestureEnabled = true {
    didSet (newValue) {
      snapGesture?.isGestureEnabled = newValue
    }
  }

  deinit {
    if let textInputFocusObserver = self.textInputFocusObserver {
      NotificationCenter.default.removeObserver(textInputFocusObserver, name: .onChangeTextInputFocus, object: nil)
    }
  }

}
