//
//  YeetTextInputViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 9/12/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation


@objc(EmojiTextInputViewManager)
class EmojiTextInputViewManager: RCTMultilineTextInputViewManager {
  override static func moduleName() -> String! {
    return "EmojiTextInputView";
  }

  override func view() -> EmojiTextInput? {
    return EmojiTextInput(bridge: self.bridge)
  }


  @objc(requiresMainQueueSetup)
  private func requiresMainQueueSetup() -> Bool {
    return true
  }


}
