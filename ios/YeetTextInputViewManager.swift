//
//  YeetTextInputViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 9/12/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation


@objc(YeetTextInputViewManager)
class YeetTextInputViewManager: RCTMultilineTextInputViewManager {
  override static func moduleName() -> String! {
    return "YeetTextInputView";
  }

  override func view() -> YeetTextInputView? {
    return YeetTextInputView(bridge: self.bridge)
  }

  
  @objc(requiresMainQueueSetup)
  static override func requiresMainQueueSetup() -> Bool {
    return true
  }

}
