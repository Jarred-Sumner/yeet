//
//  EmojiTextInput.swift
//  yeet
//
//  Created by Jarred WSumner on 11/12/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

class BaseEmojiTextInputView : RCTUITextView {
  // required for iOS 13
  override var textInputContextIdentifier: String? { "" } // return non-nil to show the Emoji keyboard ¯\_(ツ)_/¯

   override var textInputMode: UITextInputMode? {
       for mode in UITextInputMode.activeInputModes {
           if mode.primaryLanguage == "emoji" {
               return mode
           }
       }
       return nil
   }
}

@objc(EmojiTextInput)
class EmojiTextInput: YeetTextInputView {
  var _backedTextInputView: BaseEmojiTextInputView? = nil
  override init(bridge: RCTBridge) {
    super.init(bridge: bridge)

    self.backedTextInputView.removeFromSuperview()

    // `blurOnSubmit` defaults to `false` for <TextInput multiline={true}> by design.
    self.blurOnSubmit = false;

    let backedTextInputView = BaseEmojiTextInputView.init(frame: bounds)

    backedTextInputView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    backedTextInputView.backgroundColor = .clear
    backedTextInputView.textColor = .black
    // This line actually removes 5pt (default value) left and right padding in UITextView.
    backedTextInputView.textContainer.lineFragmentPadding = 0;
    backedTextInputView.scrollsToTop = false
    backedTextInputView.isScrollEnabled = true
    backedTextInputView.textInputDelegate = self

    _backedTextInputView = backedTextInputView
    self.addSubview(backedTextInputView)
  }

//  override var textView: BaseEmojiTextInputView {
//    return _backedTextInputView as! BaseEmojiTextInputView
//  }
}
