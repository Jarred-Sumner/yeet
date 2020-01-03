//
//  YeetTextInputView.swift
//  yeet
//
//  Created by Jarred WSumner on 9/12/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation



@objc(YeetTextInputView)
class YeetTextInputView : RCTMultilineTextInputView, TransformableView, RCTInvalidating, RCTUIManagerObserver {
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
    if isSticker {
      return [.solid, .stroke, .highlight, .ellipse, .invert].contains(borderType)
    } else {
      return [.solid, .stroke].contains(borderType)
    }

  }

//  override var intrinsicContentSize: CGSize {
//    if showHighlight {
//      return self.highlightLayer.path?.boundingBox.size ?? super.intrinsicContentSize
//    } else {
//      return super.intrinsicContentSize
//    }
//  }



  var textInset: UIEdgeInsets {
    return UIEdgeInsets.init(top: highlightInset + reactPaddingInsets.top + strokeWidth, left: highlightInset + reactPaddingInsets.left + strokeWidth, bottom: highlightInset + reactPaddingInsets.bottom + strokeWidth, right: highlightInset + reactPaddingInsets.right + strokeWidth )
  }

  var lastHighlightKey: String? = nil
  func highlightKey(text: String?) -> String {
    return "\(String(describing: text))-\(highlightInset)-\(highlightCornerRadius)-\(highlightColor)"
  }

  func drawHighlight(async: Bool = false) {
    if (self.highlightLayer.superlayer == nil) {
      self.highlightSubview.layer.addSublayer(self.highlightLayer)
    }


    self.enforceTextAttributesIfNeeded()
    UITextView.setHighlightPath(textView: self.textView as! UITextView, inset: textInset, radius: self.highlightCornerRadius, highlightLayer: self.highlightLayer, borderType: self.borderType, strokeWidth: strokeWidth, strokeColor: strokeColor ?? UIColor.clear, originalFont: backedTextInputView.reactTextAttributes?.effectiveFont() ?? UIFont.systemFont(ofSize: CGFloat(16), weight: .regular) , canAdjustInset: isSticker)


    if !showHighlight {
      self.highlightLayer.isHidden = true
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

  @objc(didSetProps:)
  override func didSetProps(_ changedProps: Array<String>) {
    super.didSetProps(changedProps)




    let needsUpdateHighlight = changedProps.contains("borderType") || changedProps.contains("borderTypeString") || changedProps.contains("highlightInset") || changedProps.contains("highlightColor") || changedProps.contains("strokeColor") || changedProps.contains("strokeWidth") || changedProps.contains("highlightCornerRadius") ||  changedProps.contains("template")

    let forceLayout = changedProps.contains("highlightInset") || changedProps.contains("template") || changedProps.contains("strokeWidth") || changedProps.contains("borderTypeString")
    if (needsUpdateHighlight) {
      if Thread.isMainThread {
        self.updateHighlight()
//        if forceLayout {
//          self.setNeedsLayout()
//        }
      } else {
        DispatchQueue.main.async { [weak self] in
         self?.updateHighlight()
//          if forceLayout {
//            self?.setNeedsLayout()
//          }
        }
      }
    }

    if (changedProps.contains("text") && !textView.isFirstResponder) {
      let _oldString = attributedText?.string

      DispatchQueue.main.async { [weak self] in
        guard let text = self?.attributedText
          else {
          return
        }

        guard _oldString != text.string else {
          return
        }

        self?.textView.attributedText = text
        self?.setNeedsLayout()
        self?.layoutIfNeeded()

        if let _rect = self?.lastTransformRect {
          self?.movableView?.handleLayoutTransform(_rect)
        }
      }
    }
  }


  func updateHighlight() {

      self.drawHighlight()

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
    self.highlightLayer.isHidden = true
  }

  func invalidate() {
    bridge?.uiManager.observerCoordinator.remove(self)
    
    self.movableViewTag = nil

    self.bridge = nil

  }

  var highlightSubview = UIView()


  override func layoutSubviews() {
    let _transformRect = movableView?.transformRect
    super.layoutSubviews()

    if self.highlightSubview.superview == nil {
      highlightSubview.layer.addSublayer(highlightLayer)
      highlightLayer.isHidden = !showHighlight

      self.backedTextInputView.insertSubview(highlightSubview, at: 0)

    }
    self.updateHighlight()
    self.adjustFontSize(text: textView.text)

    if isSticker && textView.text.count > 0 {
      textView.sizeToFit()
      textView.invalidateIntrinsicContentSize()
    }

    if _transformRect != movableView?.transformRect {
      self.lastTransformRect = _transformRect


      if !self.textView.isFirstResponder && _transformRect != nil {
        self.movableView?.handleLayoutTransform(_transformRect!)
      }

    }
  }

  enum TextTemplate : String {
    case basic = "basic"
    case bigWords = "bigWords"
    case post = "post"
    case comment = "comment"
    case comic = "comic"
    case gary = "gary"
    case terminal = "terminal"
    case pickaxe = "pickaxe"
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
  var scale: CGFloat {
    get {
      return textInputView.contentScaleFactor
    }

    set (newValue) {
      let oldValue = self.scale
      textInputView.contentScaleFactor = newValue

      if self.scale != oldValue {
        self.updateScale()
      }

      hasSetContentScale = true
    }

  }

  func updateScale() {
    DispatchQueue.main.throttle(deadline: DispatchTime.now() + 0.1, context: self) { [weak self] in
      self?._updateScale()
    }

  }

  func _updateScale() {

    self.textView.contentScaleFactor = self.scale
    let nativeScale = self.scale * UIScreen.main.scale

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


    bridge.uiManager.observerCoordinator.add(self)

    self.highlightLayer = CAShapeLayer()
    self.highlightLayer.masksToBounds = false
    self.clipsToBounds = false
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
    textView.layoutManager.allowsNonContiguousLayout = true

    tapRecognizer = UITapGestureRecognizer(target: self, action: #selector(YeetTextInputView.handleTap(_:)))
    self.addGestureRecognizer(tapRecognizer!)
    self.textView.isSelectable = true
    self.textView.isScrollEnabled = false
    self.textView.isEditable = false

  }

  @objc(handleInputBlur:)
  func handleInputBlur(notification: NSNotification) {
  }

  @objc(handleInputFocus:)
  func handleInputFocus(notification: NSNotification) {
  }

  var lastTransformRect: CGRect? = nil

  @objc (isSticker) var isSticker: Bool = false

  var movableViewTag: NSNumber? = nil
  var movableView : MovableView? {
    guard let tag = movableViewTag else {
      return nil
    }

    guard self.bridge?.isValid ?? false else {
      return nil
    }

    return self.bridge?.uiManager.view(forReactTag: tag) as? MovableView
  }



  @objc (singleFocus) var isSingleFocus: Bool = false

  override func didMoveToSuperview() {
    super.didMoveToSuperview()

    self.updateTapGestureRecognizer()
    if isDetached && YeetTextInputView.focusedReactTag == reactTag {
      YeetTextInputView.focusedReactTag = nil
    } else if isAttached && textView.isFirstResponder && YeetTextInputView.focusedReactTag != reactTag {
      YeetTextInputView.focusedReactTag = reactTag
    }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    self.updateTapGestureRecognizer()

    if isDetached && YeetTextInputView.focusedReactTag == reactTag {
      YeetTextInputView.focusedReactTag = nil
    } else if isAttached && textView.isFirstResponder && YeetTextInputView.focusedReactTag != reactTag {
      YeetTextInputView.focusedReactTag = reactTag
    }

    if isDetached && bridge?.isValid ?? false {
      bridge?.uiManager.observerCoordinator.remove(self)
    }
  }

  func updateTapGestureRecognizer() {
    if superview != nil && isSticker && movableView != nil {
      let movableView = self.movableView!

      if let tapRecognizer = self.tapRecognizer {
        if self.gestureRecognizers?.contains(tapRecognizer) ?? false {
          self.removeGestureRecognizer(tapRecognizer)
          self.tapRecognizer?.isEnabled = false
           self.tapRecognizer = nil
        } else if movableView.gestureRecognizers?.contains(tapRecognizer) ?? false{
          movableView.removeGestureRecognizer(tapRecognizer)
        }
      }
      tapRecognizer = UITapGestureRecognizer(target: self, action: #selector(YeetTextInputView.handleTap(_:)))
      movableView.addGestureRecognizer(tapRecognizer!)
    }
  }

  static var focusedReactTag: NSNumber? = nil

  override func reactFocus() {
    guard !textView.isFirstResponder else {
      self.reactIsFocusNeeded = false
      return
    }

    self.enableSelection()

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

  override func textInputShouldBeginEditing() -> Bool {
    enableSelection()
    let should = super.textInputShouldBeginEditing()

    if should {
      YeetTextInputView.focusedReactTag = reactTag
    }
    return should
  }

  private var _pointerEvents: RCTPointerEvents = .unspecified

  override var pointerEvents: RCTPointerEvents {
    get {
      return _pointerEvents
    }

    set (newValue) {
      _pointerEvents = newValue

      if (pointerEvents == .none) {
         self.accessibilityViewIsModal = false
       }
    }
  }

  override func textInputShouldEndEditing() -> Bool {
    let shouldEnd = super.textInputShouldEndEditing()

    if shouldEnd {
      Log.debug("SHOULd END?? WHY?? \(shouldEnd)")
    }

    return shouldEnd
  }

  override func textInputDidBeginEditing() {
    super.textInputDidBeginEditing()

    self.adjustFontSize(text: textView.text)
    UIView.setAnimationsEnabled(false)
    self.drawHighlight()
    UIView.setAnimationsEnabled(true)

    tapRecognizer?.isEnabled = false


    YeetTextInputView.focusedReactTag = reactTag

    if self.onStartEditing != nil {
      DispatchQueue.main.async { [weak self] in
        guard self?.bridge?.isValid ?? false else {
          return
        }

        if let onStartEditing = self?.onStartEditing {
          onStartEditing([
            "tag": self?.reactTag!,
            "value": self?.textView.text!,
          ])
        }
      }
    }
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

    if isSticker {
      self.disableSelection()
    }

    self.adjustFontSize(text: textView.text)
    self.drawHighlight()

    if hasSetContentScale {
      self.updateScale()
    }

    tapRecognizer?.isEnabled = true

    if (YeetTextInputView.focusedReactTag == reactTag) {
      YeetTextInputView.focusedReactTag = nil
    }


    if self.onEndEditing != nil {
      DispatchQueue.main.async { [weak self] in
        guard self?.bridge?.isValid ?? false else {
          return
        }

        if let onEndEditing = self?.onEndEditing {
          onEndEditing([
            "tag": self?.reactTag!,
            "value": self?.textView.text!,
          ])
        }
      }
    }

  }

  @objc(onStartEditing)
  var onStartEditing: RCTDirectEventBlock? = nil

  @objc(onEndEditing)
  var onEndEditing: RCTDirectEventBlock? = nil

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
    let didResign = !textView.isFirstResponder

    tapRecognizer?.isEnabled = true

    if didResign && isSticker {
      self.disableSelection()

      if YeetTextInputView.focusedReactTag == reactTag {
        YeetTextInputView.focusedReactTag = nil
      }
    }


  }

  override func reactFocusIfNeeded() {
    self.enableSelection()

    if reactIsFocusNeeded || textView.reactIsFocusNeeded {
      self.reactFocus()
    }
  }



  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let intended = super.hitTest(point, with: event)

    if (YeetTextInputView.focusedReactTag != nil && !textView.isFirstResponder && intended != nil && isSingleFocus) || pointerEvents == .none {
      return nil
    } else if (isSticker || textView.isFirstResponder) {
      return intended
    } else if frame.contains(point) {
      return self
    } else {
      return intended
    }
  }

  deinit {
    if YeetTextInputView.focusedReactTag == reactTag {
      YeetTextInputView.focusedReactTag = nil
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


extension Notification.Name {
    static let onAdjustYeetTextInput = Notification.Name("onAdjustYeetTextInput")
}
