//
//  YeetTextInputViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 9/12/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation



@objc(YeetTextInputViewManager)
class YeetTextInputViewManager: RCTBaseTextViewManager, RCTUIManagerObserver {
  var shadowViews = NSHashTable<YeetTextInputShadowView>(options: .weakMemory)

  override var bridge: RCTBridge! {
    didSet {
      if bridge != nil {
        self.bridge?.uiManager?.observerCoordinator.add(self)
      }
    }
  }

  override init() {
    super.init()

    NotificationCenter.default.addObserver(forName: .onChangeTextInputFocus, object: nil, queue: nil) { [weak self] notification in
      let firstTag = notification.userInfo?["oldValue"] as? NSNumber?
      let secondTag = notification.userInfo?["newValue"] as? NSNumber?

      if firstTag == nil && secondTag == nil {
        return
      }

      RCTExecuteOnUIManagerQueue { [weak self] in
        
        for shadowView in self?.shadowViews.allObjects ?? [] {
          if shadowView.reactTag == firstTag || shadowView.reactTag == secondTag {
            shadowView.dirtyLayout()
          }
        }

      }
    }
  }


  override static func moduleName() -> String! {
    return "YeetTextInputView";
  }

  override func view() -> YeetTextInputView? {
    return YeetTextInputView(bridge: self.bridge)
  }

  override func shadowView() -> YeetTextInputShadowView? {
    let shadowView =  YeetTextInputShadowView(bridge: bridge)
    shadowViews.add(shadowView)
    shadowView.textAttributes.fontSizeMultiplier = 1.0
    return shadowView
  }



  @objc(requiresMainQueueSetup)
  static override func requiresMainQueueSetup() -> Bool {
    return false
  }

  func uiManagerWillPerformMounting(_ manager: RCTUIManager!) {
    guard bridge?.isValid ?? false else {
      return
    }

    for shadowView in shadowViews.allObjects {
      shadowView.uiManagerWillPerformMounting()
    }
  }

  deinit {
    self.bridge?.uiManager?.observerCoordinator.remove(self)
    bridge = nil
    shadowViews = NSHashTable<YeetTextInputShadowView>(options: .weakMemory)
  }
  
}
