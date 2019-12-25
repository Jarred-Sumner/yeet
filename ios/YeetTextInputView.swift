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


  @objc(strokeColor)
  var strokeColor: UIColor? = nil {
    didSet {
      highlightLayer.strokeColor = self.strokeColor?.cgColor
    }
  }

  enum Border : String {
    case stroke = "stroke"
    case ellipse = "ellipse"
    case solid = "solid"
    case hidden = "hidden"
    case invert = "invert"
    case highlight = "highlight"
  }

  var border: Border = .hidden

  @objc(highlightLayer)
  var highlightLayer = CAShapeLayer()

  @objc(highlightColor)
  var highlightColor = YeetTextInputView.DEFAULT_HIGHLIGHT_COLOR {
    didSet {
      highlightLayer.fillColor = self.highlightColor.cgColor
    }
  }

  @objc(highlightCornerRadius)
  var highlightCornerRadius = YeetTextInputView.DEFAULT_HIGHLIGHT_CORNER_RADIUS {
    didSet {
      highlightLayer.cornerRadius = self.highlightCornerRadius
    }
  }

  @objc(strokeWidth)
  var strokeWidth: CGFloat = 0.0 {
    didSet {
      highlightLayer.lineWidth = strokeWidth
    }
  }

  @objc(highlightInset)
  var highlightInset = CGFloat(YeetTextInputView.DEFAULT_HIGHLIGHT_INSET)
  var showHighlight: Bool {
    return [.solid, .stroke, .highlight, .ellipse, .invert].contains(borderType)
  }

//  override var intrinsicContentSize: CGSize {
//    if showHighlight {
//      return self.highlightLayer.path?.boundingBox.size ?? super.intrinsicContentSize
//    } else {
//      return super.intrinsicContentSize
//    }
//  }

  

  var lastHighlightKey: String? = nil
  func highlightKey(text: String?) -> String {
    return "\(String(describing: text))-\(highlightInset)-\(highlightCornerRadius)-\(highlightColor)"
  }

  func drawHighlight(async: Bool = false) {
    if (!showHighlight) {
      return
    }

    if (self.highlightLayer.superlayer == nil) {
      self.highlightSubview.layer.addSublayer(self.highlightLayer)
    }





    UITextView.setHighlightPath(textView: self.textView as! UITextView, inset: UIEdgeInsets.init(top: highlightInset, left: highlightInset, bottom: highlightInset, right: highlightInset), radius: self.highlightCornerRadius, highlightLayer: self.highlightLayer, borderType: self.borderType, strokeWidth: strokeWidth, strokeColor: strokeColor ?? UIColor.clear)





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


  

  @objc(didSetProps:)
  override func didSetProps(_ changedProps: Array<String>) {
    super.didSetProps(changedProps)



    let needsUpdateHighlight = changedProps.contains("borderType") || changedProps.contains("borderTypeString") || changedProps.contains("highlightInset") || changedProps.contains("highlightColor") || changedProps.contains("strokeColor") || changedProps.contains("strokeWidth") || changedProps.contains("highlightCornerRadius") || changedProps.contains("text")
    if (needsUpdateHighlight) {
      if Thread.isMainThread {
        self.updateHighlight()
      } else {
        DispatchQueue.main.async {
         self.updateHighlight()
        }
      }
    }

  }


  func updateHighlight() {
    if (showHighlight) {
      self.drawHighlight()
    } else {
      self.removeHighlight()
    }
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

//    self.textView.sizeToFit()
  }


  func removeHighlight() {
    if self.highlightLayer.superlayer != nil {
      self.highlightLayer.removeFromSuperlayer()
      self.invalidateIntrinsicContentSize()
    }
  }

  var highlightSubview = UIView()

  override func layoutSubviews() {
    super.layoutSubviews()

    if self.highlightSubview.superview == nil {
      if showHighlight {
        highlightSubview.layer.addSublayer(highlightLayer)
      }

      self.backedTextInputView.insertSubview(highlightSubview, at: 0)

    }

    self.updateHighlight()
    self.adjustFontSize(text: textView.text)
  }

  enum TextTemplate : String {
    case post = "post"
    case comment = "comment"
    case basic = "basic"
    case momsSpaghetti = "momsSpaghetti"
    case sarcasticText = "sarcasticText"
  }

  var textTemplate: TextTemplate = .post


  @objc(borderTypeString)
  var borderTypeString: String = "hidden" {
    didSet {
      self.borderType = Border.init(rawValue: borderTypeString) ?? .hidden
    }
  }

  var borderType: Border = .hidden

//  override func sizeThatFits(_ size: CGSize) -> CGSize {
//    guard showHighlight && textView.text.count > 0 else {
//      return super.sizeThatFits(size)
//    }
//
//
//    if let boundingBox = self.highlightLayer.path?.boundingBox {
//      return boundingBox.inset(by: reactPaddingInsets).standardized.size
//    } else {
//      return super.sizeThatFits(size)
//    }
//  }



  @objc(template)
  var template: String = "post" {
    didSet {
      self.textTemplate = TextTemplate(rawValue: template) ?? .post
    }
  }

  var textInputView : UIView {
    return self.textView.textInputView
  }

  var hasSetContentScale = false
  var textScale: CGFloat {
    get {
      return textInputView.contentScaleFactor
    }

    set (newValue) {
      let oldValue = self.textScale
      textInputView.contentScaleFactor = newValue

      if self.textScale != oldValue {
        self.updateTextScale()
      }

      hasSetContentScale = true
    }

  }

  func updateTextScale() {
    DispatchQueue.main.throttle(deadline: DispatchTime.now() + 0.1, context: self) { [weak self] in
      self?._updateTextScale()
    }

  }

  func _updateTextScale() {

    self.textView.contentScaleFactor = self.textScale
    let nativeScale = self.textScale * UIScreen.main.scale

    textView.layer.contentsScale = nativeScale
    highlightLayer.contentsScale = nativeScale
    textInputView.layer.contentsScale = nativeScale

    textInputView.layer.sublayers?.forEach { layer in
      layer.contentsScale = nativeScale
    }

  }


  var tapRecognizer: UITapGestureRecognizer? = nil

  var rctTextView : RCTUITextView {
    return self.backedTextInputView as! RCTUITextView
  }

  var textView: UITextView {
    return self.backedTextInputView as! UITextView
  }

  @objc(handleTap:)
  func handleTap(_ gesture: UIGestureRecognizer) {
    self.reactFocus()
  }

  var bridge: RCTBridge? = nil

  override init(bridge: RCTBridge) {
    self.bridge = bridge
    super.init(bridge: bridge)

    self.highlightLayer = CAShapeLayer()
    self.highlightLayer.masksToBounds = false
    highlightSubview.clipsToBounds = false
    highlightSubview.isOpaque = false

    self.highlightLayer.isOpaque = false
//    self.highl
    
    self.highlightLayer.edgeAntialiasingMask = CAEdgeAntialiasingMask(rawValue: 15)
    self.highlightLayer.allowsEdgeAntialiasing = true
    self.highlightLayer.cornerRadius = YeetTextInputView.DEFAULT_HIGHLIGHT_CORNER_RADIUS
    self.highlightLayer.lineCap = .round
    self.highlightLayer.lineJoin = .bevel


//    self.textView.contentMode = .center
    self.highlightLayer.fillColor = YeetTextInputView.DEFAULT_HIGHLIGHT_COLOR.cgColor
//    self.highlightLayer.fillColor = YeetTextInputView.DEFAULT_HIGHLIGHT_COLOR.cgColor


//    textView.textContainer.lineBreakMode = .byWordWrapping

    self.adjustFontSize(text: textView.text)
    backedTextInputView.textInputDelegate = self
    backedTextInputView.clipsToBounds = false
    textView.layer.masksToBounds = false
  }

  @objc (isSticker) var isSticker: Bool = false

  var movableViewTag: NSNumber? = nil
  var movableView : MovableView? {
    guard let tag = movableViewTag else {
      return nil
    }

    return self.bridge?.uiManager.view(forReactTag: tag) as? MovableView
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    self.tapRecognizer?.isEnabled = false
    self.tapRecognizer = nil

    if superview != nil && isSticker && movableView != nil {
      let movableView = self.movableView!
      tapRecognizer = UITapGestureRecognizer(target: self, action: #selector(YeetTextInputView.handleTap(_:)))
      movableView.addGestureRecognizer(tapRecognizer!)
    } else if superview != nil {
      tapRecognizer = UITapGestureRecognizer(target: self, action: #selector(YeetTextInputView.handleTap(_:)))
      self.addGestureRecognizer(tapRecognizer!)
    }
  }


  override func reactFocus() {
    if isSticker {
      self.enableSelection()
    }

    super.reactFocus()
  }

  func enableSelection() {
    self.textView.isSelectable = true
    self.textView.isEditable = true
  }

  func disableSelection() {
    self.textView.isSelectable = false
    self.textView.isEditable = false
  }

  @objc(selectable) var isSelectable: Bool = true {
    didSet {
      self.textView.isSelectable = isSelectable
    }
  }

  override func textInputDidBeginEditing() {
    super.textInputDidBeginEditing()

    self.adjustFontSize(text: textView.text)
    UIView.setAnimationsEnabled(false)
    self.drawHighlight()
    UIView.setAnimationsEnabled(true)

    tapRecognizer?.isEnabled = false
  }

  func moveCursorToEnd() {
    textView.selectedRange = endRange
  }

  var endRange: NSRange {
    return NSMakeRange(textView.text.count, 0);
  }

  override func textInputDidReturn() {
    UIView.setAnimationsEnabled(false)
    self.drawHighlight()
    UIView.setAnimationsEnabled(true)
  }

  override func textInputDidEndEditing() {
    super.textInputDidEndEditing()
    self.disableSelection()
    self.adjustFontSize(text: textView.text)
    self.drawHighlight()

    if hasSetContentScale {
      self.updateTextScale()
    }

    tapRecognizer?.isEnabled = true
  }


  override func textInputShouldChangeText(in range: NSRange, replacementText string: String) -> Bool {
    let shouldReject = super.textInputShouldChangeText(in: range, replacementText: string)

    if let oldString = textView.text {
      guard let range = Range(range, in: oldString) else {
        return shouldReject
      }

      let newString = oldString.replacingCharacters(in: range, with: string)
      self.adjustFontSize(text: newString)

      UIView.setAnimationsEnabled(false)
      self.drawHighlight()
      UIView.setAnimationsEnabled(true)
    }

    return shouldReject
  }

  override func textInputDidChange() {
    super.textInputDidChange()

    self.adjustFontSize(text: textView.text)
    UIView.setAnimationsEnabled(false)
    self.drawHighlight()
    UIView.setAnimationsEnabled(true)
  }

  override func reactBlur() {
    super.reactBlur()

    if isSticker {
      self.disableSelection()
    }

    if self.textView.isFirstResponder && self.textView.canResignFirstResponder {
      self.textView.resignFirstResponder()
    }
  }

}


extension RCTConvert {

  @objc(YeetTextInputBorder:)
  static func textInputBorder(json: AnyObject) -> String {
    guard let border = self.nsString(json) else {
      return YeetTextInputView.Border.hidden.rawValue
    }

    return YeetTextInputView.Border.init(rawValue: border)?.rawValue ?? YeetTextInputView.Border.hidden.rawValue
  }
}
