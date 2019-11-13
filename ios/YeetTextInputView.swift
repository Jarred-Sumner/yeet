//
//  YeetTextInputView.swift
//  yeet
//
//  Created by Jarred WSumner on 9/12/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

@objc(YeetTextInputView)
class YeetTextInputView : RCTMultilineTextInputView {
  static var DEFAULT_HIGHLIGHT_CORNER_RADIUS = CGFloat(4)
  static var DEFAULT_HIGHLIGHT_INSET = CGFloat(2)
  static var DEFAULT_HIGHLIGHT_COLOR = UIColor.blue

  @objc(fontSizeRange)
  var fontSizeRange: Dictionary<String, Int> = [:] {
    didSet {
      self.adjustFontSize(text: self.textView.text)
    }
  }



  @objc(highlightLayer)
  var highlightLayer = CAShapeLayer()

  @objc(highlightColor)
  var highlightColor = YeetTextInputView.DEFAULT_HIGHLIGHT_COLOR {
    didSet {
      highlightLayer.fillColor = self.highlightColor.cgColor
      self.drawHighlight()
    }
  }

  @objc(highlightCornerRadius)
  var highlightCornerRadius = YeetTextInputView.DEFAULT_HIGHLIGHT_CORNER_RADIUS {
    didSet {
      highlightLayer.cornerRadius = self.highlightCornerRadius
      self.drawHighlight()
    }
  }

  @objc(highlightInset)
  var highlightInset = CGFloat(YeetTextInputView.DEFAULT_HIGHLIGHT_INSET) {
    didSet {
      self.drawHighlight()
    }
  }

  @objc(showHighlight)
  var showHighlight = true {
    didSet (newValue) {
      if (newValue) {
        self.drawHighlight()
      } else {
        self.removeHighlight()
      }
    }
  }


  var lastHighlightKey: String? = nil
  func highlightKey(text: String?) -> String {
    return "\(String(describing: text))-\(highlightInset)-\(highlightCornerRadius)-\(highlightColor)"
  }
  func drawHighlight(text: NSString? = nil) {
    if (!showHighlight) {
      return
    }

    let _text: NSString = text != nil ? text! : (textView.text as NSString)

    DispatchQueue.main.async {
      UITextView.setHighlightPath(textView: self.textView, inset: self.highlightInset, radius: self.highlightCornerRadius, highlightLayer: self.highlightLayer)
    }

//
//
//    let key = self.highlightKey(text: _text as String)
//    if (lastHighlightKey == key) {
//      return
//    }
//
//
//
////    highlightSubview.bounds = self.backedTextInputView.layer.bounds
////    highlightSubview.frame = CGRect(origin: .zero, size: self.backedTextInputView.layer.bounds.size)
////    highlightLayer.bounds = self.backedTextInputView.layer.bounds
////    highlightLayer.frame = self.backedTextInputView.layer.frame
//
//    let tempText = _text != textView.text as NSString ? textView.text : nil
//    if (tempText != nil) {
//      textView.text = _text as String
//
//    }
//    UITextView.setHighlightPath(textView: textView, inset: highlightInset, radius: highlightCornerRadius, highlightLayer: highlightLayer)
//    if (tempText != nil) {
//      textView.text = tempText
//    }
//    lastHighlightKey = key


  }


  func adjustFontSize(text: String) {
//    if (self.fontSizeRange.count == 0) {
//      return
//    }
//
//    let forLength = fontSizeRange.keys.first(where: { key in
//      let length = Int(key)!
//
//      return length - text.count <= 0
//    })
//    let size = forLength != nil ? fontSizeRange[forLength!] : fontSizeRange[fontSizeRange.endIndex].value
//
//    let fontSize = CGFloat(size ?? 30)
//
//    if fontSize !=  self.textAttributes?.fontSize {
//      self.textAttributes?.fontSize = fontSize
//      self.backedTextInputView.reactTextAttributes?.fontSize = fontSize
//
//
//      UIView.animate(withDuration: 0.1) {
//        self.textView.font = self.textAttributes?.effectiveFont()
//      }
//    }
  }


  func removeHighlight() {
    if self.highlightLayer.superlayer != nil {
      self.highlightLayer.removeFromSuperlayer()
    }
  }

  var highlightSubview = UIView()

  override func layoutSubviews() {
    super.layoutSubviews()

    if self.highlightSubview.superview == nil {
      highlightSubview.layer.addSublayer(highlightLayer)
      self.backedTextInputView.insertSubview(highlightSubview, at: 0)
    }

    self.drawHighlight()
    self.adjustFontSize(text: textView.text)
  }



  var textView: UITextView {
    return self.backedTextInputView as! UITextView
  }

  override init(bridge: RCTBridge) {
    super.init(bridge: bridge)
    self.highlightLayer = CAShapeLayer()
    self.highlightLayer.masksToBounds = false
    self.highlightLayer.isOpaque = true
    
    self.highlightLayer.edgeAntialiasingMask = CAEdgeAntialiasingMask(rawValue: 15)
    self.highlightLayer.allowsEdgeAntialiasing = true
    self.highlightLayer.cornerRadius = YeetTextInputView.DEFAULT_HIGHLIGHT_CORNER_RADIUS



//    self.textView.contentMode = .center
    self.highlightLayer.fillColor = YeetTextInputView.DEFAULT_HIGHLIGHT_COLOR.cgColor


//    textView.textContainer.lineBreakMode = .byWordWrapping

    self.adjustFontSize(text: textView.text)
    backedTextInputView.textInputDelegate = self

  }

  override func textInputDidBeginEditing() {
    super.textInputDidBeginEditing()
    self.adjustFontSize(text: textView.text)
    self.drawHighlight()

  }

  override func textInputDidReturn() {
    self.drawHighlight()
  }



  override func textInputDidEndEditing() {
    super.textInputDidEndEditing()
    self.adjustFontSize(text: textView.text)
    self.drawHighlight(text: textView.text as NSString?)

  }



  override func textInputShouldChangeText(in range: NSRange, replacementText string: String) -> Bool {
    let shouldReject = super.textInputShouldChangeText(in: range, replacementText: string)

    if let oldString = textView.text {
      guard let range = Range(range, in: oldString) else {
        return shouldReject
      }

      let newString = oldString.replacingCharacters(in: range, with: string)
      self.adjustFontSize(text: newString)
      self.drawHighlight(text: newString as NSString?)
    }

    return shouldReject
  }

  override func textInputDidChange() {
    super.textInputDidChange()

    self.adjustFontSize(text: textView.text)
    self.drawHighlight(text: textView.text as NSString?)

  }

}

