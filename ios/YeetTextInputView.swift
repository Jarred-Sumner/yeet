//
//  YeetTextInputView.swift
//  yeet
//
//  Created by Jarred WSumner on 9/12/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation



@objc(YeetTextInputView)
class YeetTextInputView : RCTBaseTextInputView, TransformableView, RCTInvalidating, RCTUIManagerObserver {
  override var backedTextInputView: UIView & RCTBackedTextInputViewProtocol {
    return textView
  }

  @objc(fontSizeRange)
  var fontSizeRange: Dictionary<String, Int> = [:]


  var setPropsCount = 0
  var isInitialMount: Bool { setPropsCount == 0 }
  var isSecondMount: Bool { setPropsCount == 1 }



  @objc(didSetProps:)
  override func didSetProps(_ changedProps: Array<String>) {
    super.didSetProps(changedProps)



    let needsUpdateHighlight = changedProps.contains("borderType") || changedProps.contains("borderTypeString") || changedProps.contains("highlightInset") || changedProps.contains("highlightColor") || changedProps.contains("strokeColor") || changedProps.contains("strokeWidth") || changedProps.contains("highlightCornerRadius") ||  changedProps.contains("template") || changedProps.contains("textAlign")

    let forceLayout = changedProps.contains("template") || changedProps.contains("borderType") || changedProps.contains("highlightInset") || changedProps.contains("strokeWidth")

    if (needsUpdateHighlight && !isInitialMount) {
      if Thread.isMainThread {
        self.setNeedsLayout()
        self.layoutIfNeeded()
      } else {
        DispatchQueue.main.async { [weak self] in
          self?.setNeedsLayout()
          self?.layoutIfNeeded()

        }
      }
    }


    setPropsCount += 1
  }

  func invalidate() {
    bridge?.uiManager?.observerCoordinator.remove(self)
    self.movableViewTag = nil
    self.bridge = nil

    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillHideNotification, object: nil)
    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillShowNotification, object: nil)
    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardDidHideNotification, object: nil)
    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardDidShowNotification, object: nil)
  }


  @objc(containerTag) var containerTag: NSNumber? = nil
  var containerView : UIView? {
    guard let tag = containerTag else {
      return nil
    }

    guard self.bridge?.isValid ?? false else {
      return nil
    }

    return self.bridge?.uiManager.view(forReactTag: tag)
  }


  private var size = CGSize.zero
  override func layoutSubviews() {
    super.layoutSubviews()
  }

  var hasText : Bool { attributedText?.length ?? 0 > 0 }

  var textInputView : UIView {
    return self.textView.textInputView
  }

  var scale: CGFloat {
    get { textView.scale }
    set (newValue) {
      guard movableView?.canUpdateContentScale ?? true else {
        return
      }

      textView.scale = newValue
    }
  }

  var tapRecognizer: UITapGestureRecognizer? = nil
 @objc(textView) dynamic var textView: YeetTextView

  var canFocus: Bool {
    return true
//    guard pointerEvents != .none else {
//      return false
//    }
//
//    return !isSingleFocus || YeetTextInputView.focusedReactTag == nil || YeetTextInputView.focusedReactTag == self
  }
  @objc(handleTap:)
  func handleTap(_ gesture: UIGestureRecognizer) {
    self.reactFocus()
  }

  var bridge: RCTBridge? = nil
  var isShowingKeyboard: Bool = false
  var isManagingSize: Bool = false
  lazy var centerXConstraint = NSLayoutConstraint(
    // object that we want to constrain
    item: textView,
    // the attribute of the item we want to constraint
    attribute: NSLayoutConstraint.Attribute.centerX,
    // how we want to relate this item with another item so most likely its parent view
    relatedBy: NSLayoutConstraint.Relation.equal,
    // this is the item that we are setting up the relationship with
    toItem: self,
    attribute: NSLayoutConstraint.Attribute.centerX,
    // How much I want the CenterX of BlueView to Differ from the CenterX of the self
    multiplier: 1.0,
    constant: 0
  )
  lazy var centerYConstraint = NSLayoutConstraint(
    // object that we want to constrain
    item: textView,
    // the attribute of the item we want to constraint
    attribute: NSLayoutConstraint.Attribute.centerY,
    // how we want to relate this item with another item so most likely its parent view
    relatedBy: NSLayoutConstraint.Relation.equal,
    // this is the item that we are setting up the relationship with
    toItem: self,
    attribute: NSLayoutConstraint.Attribute.centerY,
    // How much I want the CenterX of BlueView to Differ from the CenterX of the self
    multiplier: 1.0,
    constant: 0
  )




  override init(bridge: RCTBridge) {
    let storage = NSTextStorage()
    let manager = YeetTextLayoutManager()
    let container = NSTextContainer(size: CGSize(width: 0, height: CGFloat.greatestFiniteMagnitude))
    container.widthTracksTextView = true
//    container.heightTracksTextView = true
    manager.addTextContainer(container)
    storage.addLayoutManager(manager)

    textView = YeetTextView(frame: .zero, textContainer: container)

    textView.contentInsetAdjustmentBehavior = .never
    if #available(iOS 13.0, *) {
      textView.automaticallyAdjustsScrollIndicatorInsets = false
    }

    super.init(bridge: bridge)

    self.bridge = bridge
    self.blurOnSubmit = false
    textView.frame = bounds
    textView.textInputDelegate = self
    textView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    textView.contentCompressionResistancePriority(for: .horizontal)
    textView.layoutManager.allowsNonContiguousLayout = false

    self.addSubview(textView)

    NSLayoutConstraint.activate([centerXConstraint, centerYConstraint])

    let safeArea = safeAreaLayoutGuide
    
    NotificationCenter.default.addObserver(self, selector: #selector(handleKeyboardWillShow(notif:)), name: UIResponder.keyboardWillShowNotification, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(handleKeyboardWillHide(notif:)), name: UIResponder.keyboardWillHideNotification, object: nil)

    bridge.uiManager.observerCoordinator.add(self)
    self.clipsToBounds = false

    tapRecognizer = UITapGestureRecognizer(target: self, action: #selector(YeetTextInputView.handleTap(_:)))
    self.addGestureRecognizer(tapRecognizer!)

  }



  

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
    }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    self.updateTapGestureRecognizer()

    if isDetached && YeetTextInputView.focusedReactTag == reactTag {
      YeetTextInputView.focusedReactTag = nil
    }

    if isDetached && bridge?.isValid ?? false {
      bridge?.uiManager?.observerCoordinator.remove(self)
    }
  }

  var isSticker : Bool { get { return textView.isSticker }}


  @objc (stickerContainerTag) var stickerContainerTag : NSNumber? = nil
  var stickerContainer : YeetView? {
    guard let tag = stickerContainerTag else {
      return nil
    }

    guard self.bridge?.isValid ?? false else {
      return nil
    }

    return self.bridge?.uiManager.view(forReactTag: tag) as? YeetView
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


  @objc(focusedReactTag) static var focusedReactTag: NSNumber? = nil {
    didSet {
      var userInfo: [String: NSNumber] = [:]


      if (oldValue != self.focusedReactTag) {
        if oldValue != nil {
          userInfo["oldValue"] = oldValue!
        }

        if self.focusedReactTag != nil {
          userInfo["newValue"] = focusedReactTag!
        }
      }

      if !userInfo.isEmpty {
        NotificationCenter.default.post(name: .onChangeTextInputFocus, object: nil, userInfo: userInfo)
      }

    }
  }



  func textInputReactSetFrame(_ frame: CGRect, _ _animator: UIViewPropertyAnimator? = nil) {
    guard isSticker else {
      super.yeetReactSetFrame(frame)
      return
    }

    guard let animator = _animator else {
      super.yeetReactSetFrame(frame)
      return
    }

    guard !isFixedSize else {
      super.yeetReactSetFrame(frame)
      return
    }

    
    Log.debug("""
      Set frame!
        To:   \(frame)
        From: \(self.frame)
    """)
    let position = CGPoint(x: frame.midX, y: frame.midY)
    let bounds = CGRect(origin: .zero, size: frame.size)
    let placeholder = UIView()
    placeholder.center = position
    placeholder.bounds = bounds
    placeholder.transform = layer.affineTransform()

    var sizeTranslation: CGAffineTransform = .identity
    let isGrowing = placeholder.frame.width > self.frame.width
    let isShrinking = placeholder.frame.width < self.frame.width

    var xMultiplier = CGFloat(1)

    let textAlign = textView.textAlignment
    if textAlign == .center {
      xMultiplier = -2
    } else if textAlign == .right {
      xMultiplier = 2
    } else if textAlign == .left {
      xMultiplier = -2
    }

    var sign = CGFloat(1)
    if isGrowing {
      sign = CGFloat(-1)
    }

    xMultiplier = xMultiplier * sign

    if textAlign == .center {
      sizeTranslation = CGAffineTransform.init(translationX: .zero, y: (self.frame.height - placeholder.frame.height) / 2)

//      if isGrowing {
//        sizeTranslation = sizeTranslation.translatedBy(x: frame.width * -0.5 , y: .zero)
//      } else if isShrinking {
//        sizeTranslation = sizeTranslation.translatedBy(x: frame.width 0, y: .zero)
//      }
    } else if isGrowing {
      sizeTranslation = CGAffineTransform.init(translationX: (self.frame.width - placeholder.frame.width) / xMultiplier, y: (self.frame.height - placeholder.frame.height) / 2)
    } else if isShrinking {
      sizeTranslation = CGAffineTransform.init(translationX: (placeholder.frame.width - self.frame.width) / xMultiplier, y: (placeholder.frame.height - self.frame.height) / -2)
    }

    let originalNeedsDisplayOnBoundsChange = self.layer.needsDisplayOnBoundsChange
    let originalContentMode = self.contentMode
    let originalClipsToBounds = self.clipsToBounds
    let originalContentOffset = self.textView.contentOffset

//    self.layer.needsDisplayOnBoundsChange = true
//    self.contentMode = .redraw
//    self.clipsToBounds = false

    let newOffset = textView.contentOffset.applying(sizeTranslation.inverted())


    animator.addAnimations { [unowned self] in
      self.center = position.applying(sizeTranslation)
    } 

    animator.addCompletion { [weak self] state in
      self?.yeetReactSetFrame(frame)

      if state == .end {
       self?.contentMode = originalContentMode
        self?.clipsToBounds = originalClipsToBounds
       self?.layer.needsDisplayOnBoundsChange = originalNeedsDisplayOnBoundsChange
     }
    }

    

    movableView?.incrementReadyCount()
  }

  override func reactSetFrame(_ frame: CGRect) {

    self.textInputReactSetFrame(frame, movableView?.animator)
  }

  var firstResponderObservation: NSKeyValueObservation? = nil

  override func reactFocus() {
    guard !textView.isFirstResponder else {
      self.reactIsFocusNeeded = false
      return
    }

    guard YeetTextInputView.focusedReactTag != reactTag else {
      self.reactIsFocusNeeded = false
      return
    }

    self.enableSelection()

    YeetTextInputView.focusedReactTag = reactTag

    super.reactFocus()

    DispatchQueue.main.async { [unowned self] in
      if self.textView.isFirstResponder && self.willAutoFocus {
          Log.debug("PRoBBLAYpaoskd")
        }
    }

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
    guard canFocus else {
      return false
    }
    enableSelection()
    let willBegin = super.textInputShouldBeginEditing()

    return willBegin
  }

  override func textInputDidReturn() {
    super.textInputDidReturn()

    self.textView.drawHighlight()
    self.setNeedsLayout()
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

  var hasEdited = true


  override func textInputShouldEndEditing() -> Bool {
    let shouldEnd = super.textInputShouldEndEditing()


    return shouldEnd
  }

  var managesSize: Bool {
    return isSticker
  }



  override func textInputDidBeginEditing() {
    super.textInputDidBeginEditing()

    textView.drawHighlight(true)
    tapRecognizer?.isEnabled = false
    YeetTextInputView.focusedReactTag = reactTag

    if isInitialMount {

    }

    if self.onStartEditing != nil {
      DispatchQueue.main.async { [weak self] in
        guard self?.bridge?.isValid ?? false else {
          return
        }

        if let onStartEditing = self?.onStartEditing {
          onStartEditing([
            "tag": self?.reactTag!,
            "value": self?.attributedText?.string,
          ])
        }
      }
    }

    movableView?.setNeedsLayout()
  }



  @objc(onFinishEditing)
  var onFinishEditing: RCTDirectEventBlock? = nil

  override func enforceTextAttributesIfNeeded() {
    super.enforceTextAttributesIfNeeded()
    self.setNeedsLayout()
  }

  override func updateLocalData() {
    self.enforceTextAttributesIfNeeded()
    bridge?.uiManager.setLocalData(textView.attributedText?.copy() as! NSAttributedString?, for: self)
  }

  override func textInputDidEndEditing() {
    super.textInputDidEndEditing()

    textView.drawHighlight(true)

    if isSticker {
      self.disableSelection()
    }

    tapRecognizer?.isEnabled = true



    YeetTextInputView.focusedReactTag = nil

    if onFinishEditing != nil {
      DispatchQueue.main.async { [weak self] in
        guard self?.bridge?.isValid ?? false else {
          return
        }

        guard let onFinishEditing = self?.onFinishEditing else {
         return
       }

        guard let startSize = self?.beforeEditSize.dictionaryValue() else {
          return
        }

        guard let endSize = self?.editEndSize.dictionaryValue() else {
          return
        }

        let text = self?.text ?? ""

        onFinishEditing([
          "value": text,
          "startSize": startSize,
          "endSize": endSize,
        ])
      }
    }

  }


  var textRect : CGRect {
    return textView.yeetTextAttributes.textRect
  }



  @objc(willAutoFocus)
  var willAutoFocus: Bool = false

  var keyboardNotification: KeyboardNotification? = nil
  var sentWillShowKeyboard = false

  var keyboardShowNotification: NSObjectProtocol? = nil
  var keyboardHideNotification: NSObjectProtocol? = nil
  @objc(handleKeyboardWillShow:)
  func handleKeyboardWillShow(notif: NSNotification) {
    guard isSticker || willAutoFocus else {
      return
    }

    guard textView.isFirstResponder else {
      return
    }

    guard let  movableView = self.movableView else {
      return
    }

    guard let  bridge = self.bridge else {
      return
    }

    guard bridge.isValid else {
      return
    }

    guard sentWillShowKeyboard == false else {
      return
    }

    isShowingKeyboard = true
    sentWillShowKeyboard = true

    keyboardNotification = KeyboardNotification(notif)
    stickerContainer?.textAlign = textView.textAlignment


    if willAutoFocus && movableView.animator != nil && movableView.animator?.state == UIViewAnimatingState.inactive {
//      let animator = movableView.animator!
      stickerContainer?.animator = movableView.animator

    } else {
      
      movableView.animator = keyboardNotification!.createPropertyAnimator()
      stickerContainer?.animator = movableView.animator
    }


    NotificationCenter.default.addObserver(self, selector: #selector(handleShowKeyboard), name: UIResponder.keyboardDidShowNotification, object: nil)
  }

  @objc(maxContentWidth)
  var maxContentWidth : Double {
    get {
      return textView.maxContentWidth
    }

    set (newValue) {
      textView.maxContentWidth = newValue
    }
  }


  var _maxContentWidth : CGFloat {
    return textView._maxContentWidth
  }

  var isFixedSize : Bool { textView.isFixedSize }
  

  var beforeEditSize: CGSize = .zero

  var editEndSize: CGSize {
    return CGSize(width: isFixedSize ? _maxContentWidth : self.textRect.size.width, height: max(self.textRect.size.height, self.bounds.height))
  }

  var textTemplate: YeetTextTemplate {
    return textView.textTemplate
  }

  var hasFillColor : Bool {
    return textView.hasFillColor
  }


  var hideYOffset = CGFloat.zero
  var isHidingKeyboard = false

  @objc(handleHideKeyboard)
  func handleHideKeyboard() {
    self.keyboardNotification = nil
    self.isHidingKeyboard = false

    if self.movableView?.animator?.state != UIViewAnimatingState.inactive {
      movableView?.animator?.stopAnimation(false)
      movableView?.animator?.finishAnimation(at: .end)
    } else {
      movableView?.animator = nil
    }

     self.stickerContainer?.animator = nil

    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardDidHideNotification, object: nil)
  }

  @objc(handleShowKeyboard)
  func handleShowKeyboard() {
    keyboardNotification = nil
    isShowingKeyboard = false
    sentWillShowKeyboard = false

    if movableView?.animator?.state != UIViewAnimatingState.inactive {
      movableView?.animator?.stopAnimation(false)
      movableView?.animator?.finishAnimation(at: .end)
    } else {
      movableView?.animator = nil
    }


    stickerContainer?.animator = nil
    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardDidShowNotification, object: nil)
  }


  @objc(handleKeyboardWillHide:)
  func handleKeyboardWillHide(notif: NSNotification) {
    guard YeetTextInputView.focusedReactTag == reactTag else {
      return
    }

    guard isSticker else {
      return
    }

    guard let movableView = self.movableView else {
      return
    }

    guard let bridge = self.bridge else {
      return
    }

    guard bridge.isValid else {
      return
    }

    isHidingKeyboard = true
    keyboardNotification = KeyboardNotification(notif)

    NotificationCenter.default.addObserver(self, selector: #selector(handleHideKeyboard), name: UIResponder.keyboardDidHideNotification, object: nil)

    movableView.animator = keyboardNotification!.createPropertyAnimator()
    stickerContainer?.textAlign = textView.textAlignment
    stickerContainer?.animator = movableView.animator!

    if YeetTextInputView.focusedReactTag == reactTag {
      YeetTextInputView.focusedReactTag = nil
      self.setNeedsLayout()
      self.layoutIfNeeded()
    }


    isShowingKeyboard = false
  }


  var text : String? {
    get {
      return self.attributedText?.string
    }
  }

  @objc(onStartEditing)
  var onStartEditing: RCTDirectEventBlock? = nil



  override func textInputShouldChangeText(in range: NSRange, replacementText string: String) -> Bool {
    let shouldChange = super.textInputShouldChangeText(in: range, replacementText: string)
    if shouldChange == false {
      return false
    }

//    var typingAttributes = textView.typingAttributes
//    if let currentFont = typingAttributes[.font] as? UIFont {
//      if let newSize = textView.lineFontSize {
//        typingAttributes[.font] = UIFont(descriptor: currentFont.fontDescriptor, size: newSize)
//        textView.typingAttributes = typingAttributes
//      }
//    }

    if textView.textContainer.maximumNumberOfLines > 0 {
      let remainingLines = textView.remainingLineCount
      if remainingLines == 0 && textView.isTruncating && string.count >= range.length
      {
        if let movableView = self.movableView {
          UIView.shake(view: movableView)
        }

        return false
      } else if string == "\n" && remainingLines < 1 {
        if let movableView = self.movableView {
          UIView.shake(view: movableView)
        }

        return false
      }
    }
    



    return true
  }

  override func textInputDidChange() {
    super.textInputDidChange()

//    let layoutManager = textView.layoutManager
//    var lineRanges: Array<NSValue> = []
//    layoutManager.enumerateLineFragments(forGlyphRange: NSRange(location: 0, length: layoutManager.numberOfGlyphs), using: { rect, usedRect, textContainer, glyphRange, stop in
//      lineRanges.append(NSValue(range: layoutManager.characterRange(forGlyphRange: glyphRange, actualGlyphRange: nil)))
//    })
//
//
//
//    if let font = textView.font {
//      textView.textStorage.beginEditing()
//
//      for valueRange in lineRanges {
//        let lineRange = valueRange.rangeValue
//        var _range = lineRange
//        if let fontSize = textView.fontSize(at: lineRange) {
//          let _font = UIFont(descriptor: font.fontDescriptor, size: fontSize)
//          var attrs = textView.textStorage.attributes(at: lineRange.location, effectiveRange: &_range)
//
//          attrs[.font] = _font
//          textView.textStorage.setAttributes(attrs, range: lineRange)
//        }
//      }
//
//      textView.textStorage.endEditing()
//
//    }

    self.textView.setNeedsLayout()
    self.setNeedsLayout()
    self.layoutIfNeeded()
  }

  override func reactBlur() {
    super.reactBlur()
    let didResign = !textView.isFirstResponder

    tapRecognizer?.isEnabled = true

    if didResign && isSticker {
      self.disableSelection()
    }
  }

  override func reactFocusIfNeeded() {
    if textView.isFirstResponder {
      reactIsFocusNeeded = false
      textView.reactIsFocusNeeded = false
    }

    self.enableSelection()

    if reactIsFocusNeeded || textView.reactIsFocusNeeded {
      self.reactFocus()
    }
  }



  @objc(yeetTextAttributes)
  var yeetTextAttributes: YeetTextAttributes {
    get {
      return textView.yeetTextAttributes
    }

    set (newValue) {
      textView.yeetTextAttributes = newValue
    }
  }



  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let intended = super.hitTest(point, with: event)

    if (YeetTextInputView.focusedReactTag != nil && YeetTextInputView.focusedReactTag != reactTag && !textView.isFirstResponder && intended != nil && isSingleFocus) || pointerEvents == .none {
      return nil
    } else if textView.isFirstResponder {
      return intended
    } else if frame.contains(point) {
      return self
    } else {
      return intended
    }
  }

  deinit {
    self.invalidate()

    if YeetTextInputView.focusedReactTag == reactTag {
      YeetTextInputView.focusedReactTag = nil
    }
  }
}


extension Notification.Name {
    static let onChangeTextInputFocus = Notification.Name("onChangeTextInputFocus")
}




