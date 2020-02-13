  //
//  PanViewSheet.swift
//  yeet
//
//  Created by Jarred WSumner on 2/11/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

import Foundation
import UIKit
import PanModal
import SwiftyJSON

@objc(PanViewSheet)
class PanViewSheet : UIView {



  override func didSetProps(_ changedProps: [String]!) {
    if self.reactTag != nil {
      self.panViewController?.panViewTag = reactTag
    }

    RCTExecuteOnMainQueue {
      self.panViewController?.panModalSetNeedsLayoutUpdate()
    }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()

    guard superview != nil else {
      return
    }

    guard !presented else {
      return
    }


    if (!self.isUserInteractionEnabled && !(superview?.reactSubviews()?.contains(self) ?? false)) {
       return;
   }

    assert(self.panViewController != nil, "Can't present modal view controller without a presenting view controller")


    self.panViewController?.panViewTag = reactTag
    self.panViewController?.topOffset = self.screenOffset
    self.panViewController?.minY = self.screenMinY
    self.panViewController?.longHeight = self.longHeight
    self.panViewController?.shortHeight = self.shortHeight


    if let reactSubview = self.reactSubview {
      self.panViewController?.view.insertSubview(reactSubview, at: 0)
      panViewController?.panModalSetNeedsLayoutUpdate()
    }


    delegate?.present(self, with: reactViewController(), animated: true)
    presented = true
  }

  func presentIt() {



  }
  var canPresent = false

  var delegate: PanHostViewInteractor? = nil



  @objc(invalidate) func invalidate() {
    dismissController()
    reactSubview = nil
  }

  var presented = false
  override func didMoveToSuperview() {
    super.didMoveToSuperview()

    if (!presented && superview == nil) {
      self.dismissController()
    }
  }

  func dismissController() {
    presented = false
    self.delegate?.dismiss(self, with: reactViewController(), animated: true)
  }

  @objc(containerTag) var containerTag: NSNumber? = nil
  lazy var touchHandler = RCTTouchHandler(bridge: bridge)
  init(bridge: RCTBridge) {
    self.bridge = bridge
    super.init(frame: .zero)

    self.backgroundColor = .clear
  }

  var reactSubview : UIView? = nil
  override func insertReactSubview(_ subview: UIView!, at atIndex: Int) {
    super.insertReactSubview(subview, at: atIndex)
    touchHandler?.attach(to: subview)
   reactSubview = subview


  }

  override func removeReactSubview(_ subview: UIView!) {
    super.removeReactSubview(subview)
    touchHandler?.detach(from: subview)

     reactSubview = nil
  }

  @objc(longHeight) var longHeight : CGFloat = UIScreen.main.bounds.height {


    didSet (newValue) {
      self.panViewController?.longHeight = newValue
    }
  }

  @objc(shortHeight) var shortHeight : CGFloat = UIScreen.main.bounds.height - 200 {

     didSet (newValue) {
       self.panViewController?.shortHeight = newValue
     }
  }


  func onPresent(_ parent: UIViewController) {
//    panViewController?.didMove(toParent: parent)
  }

  override func didUpdateReactSubviews() {

  }

  @objc(onWillDismiss)
  var onWillDismiss: RCTDirectEventBlock? = nil
  @objc(onDismiss)
  var onDismiss: RCTDirectEventBlock? = nil

  @objc(screenMinY)
  var screenMinY : CGFloat = .zero {
    didSet (newValue) {
      self.panViewController?.minY = newValue
    }
  }

  @objc(screenOffset)
  var screenOffset : CGFloat = .zero {
    didSet (newValue) {
      self.panViewController?.topOffset = newValue
    }
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  @objc(panScrollTag) var panScrollTag: NSNumber? {
    get {
      return panViewController?.panScrollTag
    }

    set (newValue) {
      Log.debug("PAN SCROL TAG \(newValue)")
      panViewController?.panScrollTag = newValue
    }
  }

  static let PAN_PRESENTATION_STATE_CONVERTER = [
    "longForm": PanModalPresentationController.PresentationState.longForm,
    "shortForm": PanModalPresentationController.PresentationState.shortForm
  ]

  static let PAN_PRESENTATION_TO_STRING = Dictionary(grouping: PAN_PRESENTATION_STATE_CONVERTER.keys.sorted(), by: { PAN_PRESENTATION_STATE_CONVERTER[$0]! })

  @objc(defaultPresentationState)
  var _defaultPresentationState : String? = nil {
    didSet (newValue) {
      defaultPresentationState = PanViewSheet.PAN_PRESENTATION_STATE_CONVERTER[newValue ?? "shortForm"] ?? .shortForm
    }
  }

  var defaultPresentationState: PanModalPresentationController.PresentationState = .shortForm

  @objc(onTransition)
  var onTransition: RCTDirectEventBlock? = nil

  func willTransition(to: PanModalPresentationController.PresentationState) {
    guard let _onTransition = self.onTransition else {
      return
    }

    let from: PanModalPresentationController.PresentationState = to == .longForm ? .shortForm : .longForm
    DispatchQueue.global(qos: .background).async {
      _onTransition([
        "from": PanViewSheet.PAN_PRESENTATION_TO_STRING[from],
        "to": PanViewSheet.PAN_PRESENTATION_TO_STRING[to]
      ])
    }

  }

  @objc(bridge)
  var bridge: RCTBridge? = nil
  @objc(panViewController)
  var panViewController: PanViewController? = nil {
    didSet {
//      self.panViewController?.boundsDidChangeBlock = { rect in
//        guard let bridge = self.bridge else {
//          return
//        }
//
//        guard !bridge.isLoading && bridge.isValid else {
//          return
//        }
//
//        self.bridge?.uiManager.setSize(rect.size, for: self)
//      }
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
  }


  deinit {

  }


}

