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

  func sendBackgroundTapEvent(_ location: CGPoint) {
    self.eventEmitter?.dispatchBackgroundTap(location)
  }

  var snapGesture: SnapGesture? = nil
  @objc(snapPoints) var _snapPoints: [Dictionary<String, NSNumber>] = []

  var snapPoints: [CGRect] = []

  var draggingViewTag: NSNumber? {
    willSet (newValue) {
      if (newValue != draggingViewTag) {
        if let draggingView = self.draggingView {
            self.sendStopMoving(draggingView)

        }
      }
    }

    didSet {
      if let snapGesture = self.snapGesture {
        if let draggingView = self.draggingView {
          snapGesture.setTransformView(draggingView, gestgureView: gestureView)
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
    Log.debug("SNAP POINTS \(snapPoints)")

    if changedProps.contains("snapPoints") {
      snapPoints = _snapPoints.map { RCTConvert.cgRect($0) }
    }
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

      self.snapGesture = SnapGesture(transformView: self, gestureView: gestureView)
      snapGesture?.onGestureStart = { [weak self] point in
        self?.handlePressDown(point)
      }

      snapGesture?.onGestureStop = { [weak self] point in
        self?.draggingViewTag = nil
      }

      snapGesture?.onPressBackground = { [weak self] point in
        self?.handlePressBackground(point)
      }
      
      self.snapGesture?.isGestureEnabled = false
    }
  }



  func handleGestureStop(_ point: CGPoint) {
    guard self.draggingViewTag == nil else {
      self.draggingViewTag = nil
      return
    }


  }

  func handlePressBackground(_ _point: CGPoint) {
    var view : UIView? = nil
     if var reactTag = YeetTextInputView.focusedReactTag {
       if YeetTextInputView.focusedMovableViewReactTag != nil {
         reactTag = YeetTextInputView.focusedMovableViewReactTag!
       }

      view = bridge?.uiManager.view(forReactTag: reactTag)
       if view != nil {
         let _point = self.convert(_point, to: view!)
         if view!.hitTest(_point, with: nil) == nil {
            sendBackgroundTapEvent(_point)
           return
         }

        }
     }

    if view == nil {
      view = hitTest(_point, with: nil)
    }

    if view == nil {
      view = movableViews.first { view in
        return view.hitTest(self.convert(_point, to: view), with: nil) != nil
      }
    }

    if let _movableView = view as? MovableView {
      view = _movableView.textInput
    }

    if let _view = view as? YeetTextInputView {
      _view.handleTap()
    } else {
      sendBackgroundTapEvent(_point)
    }
  }


  func handlePressDown(_ _point: CGPoint) {
    let point = gestureView.convert(_point, to: self)
    guard draggingViewTag == nil else {
      return
    }

    guard isMovingEnabled else {
      return
    }

    let movableViews = self.movableViews

    var tag: NSNumber? = nil
    if self.bounds.contains(point) {
      guard let _view = hitTest(point, with: nil) else {
        return
      }

      tag = movableViews.first { view -> Bool in
        return _view.isDescendant(of: view)
      }?.reactTag
    } else {
      tag = movableViews.first { view -> Bool in
        return view.hitTest(self.convert(point, to: view), with: nil) != nil
      }?.reactTag
    }

    if tag != nil {
      self.draggingViewTag = tag
    }
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesBegan(touches, with: event)
  }


  override func layoutSubviews() {
    super.layoutSubviews()

    if let snapGesture = self.snapGesture {
      if snapGesture.weakGestureView != gestureView {
         snapGesture.setTransformView(snapGesture.weakTransformView, gestgureView: gestureView)
       }
    }
  }



//  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
//    super.touchesEnded(touches, with: event)
//
//    let skipBackgroundTap = draggingViewTag != nil
//    self.draggingViewTag = nil
//  }

  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
      return touch.view == gestureRecognizer.view
  }
//
//  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
//    super.touchesCancelled(touches, with: event)
//
//    self.draggingViewTag = nil
//  }

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

  var scrollView : YeetScrollView? { reactSuperview() as? YeetScrollView }
  var gestureView : UIView! {
    return superview
//    guard let scrollView = self.scrollView else {
//      return self
//    }
//
//    if scrollView.isContentCentered {
//      return scrollView
//    } else {
//      return self
//    }
  }

  deinit {
    if let textInputFocusObserver = self.textInputFocusObserver {
      NotificationCenter.default.removeObserver(textInputFocusObserver, name: .onChangeTextInputFocus, object: nil)
    }
  }

}

