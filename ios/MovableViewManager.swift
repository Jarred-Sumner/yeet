//
//  MovableViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 12/23/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

@objc(MovableViewManager)
class MovableViewManager: RCTViewManager {
  var shadowViews = NSHashTable<MovableShadowView>(options: .weakMemory)

  var keyboardNotification: KeyboardNotification? = nil

  @objc(clearKeyboardNotification) func clearKeyboardNotification() {
    keyboardNotification = nil
  }

  @objc func handleKeyboardEvent(_ notification: NSNotification) {
    RCTExecuteOnUIManagerQueue {
      let keyboardNotification = KeyboardNotification(notification)
      self.keyboardNotification = keyboardNotification

      if notification.name == UIResponder.keyboardWillShowNotification {
        self.shadowViews.allObjects.forEach { shadowView in
          shadowView.handleKeyboardShowEventEndFrame(keyboardNotification.screenFrameEnd)
        }
      } else if notification.name == UIResponder.keyboardWillHideNotification {
        self.shadowViews.allObjects.forEach { shadowView in
          shadowView.handleKeyboardHideEvent()
        }
      }
    }

  }

  @objc func handleTextInputFocusChange() {

  }

  @objc(invalidate) func invalidate() {
    clearKeyboardNotification()
    unsubscribeFromKeyboard()
  }

  override var bridge: RCTBridge! {
    didSet {
      if bridge != nil {
        subscribeToKeyboard()
      }
    }
  }

  func subscribeToKeyboard() {
//    NotificationCenter.default.addObserver(self, selector: #selector(handleKeyboardEvent(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
//     NotificationCenter.default.addObserver(self, selector: #selector(handleKeyboardEvent(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
//
//     NotificationCenter.default.addObserver(self, selector: #selector(clearKeyboardNotification), name: UIResponder.keyboardDidHideNotification, object: nil)
//     NotificationCenter.default.addObserver(self, selector: #selector(clearKeyboardNotification), name: UIResponder.keyboardDidShowNotification, object: nil)
//     NotificationCenter.default.addObserver(self, selector: #selector(handleTextInputFocusChange), name: .onChangeTextInputFocus, object: nil)
  }

  func unsubscribeFromKeyboard() {
//    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillShowNotification, object: nil)
//    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillHideNotification, object: nil)
//    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardDidHideNotification, object: nil)
//    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardDidShowNotification, object: nil)
//    NotificationCenter.default.removeObserver(self, name: .onChangeTextInputFocus, object: nil)
  }

  override static func moduleName() -> String! {
    return "MovableView";
  }

  override func view() -> MovableView? {
    return MovableView(bridge: self.bridge)
  }

//  override func shadowView() -> MovableShadowView? {
//    let shadow = MovableShadowView(self.bridge)
//    shadowViews.add(shadow)
//    return shadow
//  }

  

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  deinit {
    unsubscribeFromKeyboard()
  }
}
