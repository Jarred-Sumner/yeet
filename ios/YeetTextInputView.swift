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
  var fontSizeRange: Dictionary<String, Int> = [:]

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
  var highlightLayer: CAShapeLayer

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
      if oldValue != strokeWidth {
//        textView.textContainerInset.top -= oldValue
//        textView.textContainerInset.bottom -= oldValue
      }
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


  var textInset: UIEdgeInsets {
    return UIEdgeInsets.init(top: highlightInset + reactPaddingInsets.top + strokeWidth, left: highlightInset + reactPaddingInsets.left + strokeWidth, bottom: highlightInset + reactPaddingInsets.bottom + strokeWidth, right: highlightInset + reactPaddingInsets.right + strokeWidth )
  }

  func drawHighlight(async: Bool = false) {
    if (self.highlightLayer.superlayer == nil) {
      self.highlightSubview.layer.addSublayer(self.highlightLayer)
    }


    self.enforceTextAttributesIfNeeded()
    var _textRect = textRect
    textRect = UITextView.setHighlightPath(textView: self.textView as! UITextView, inset: textInset, radius: self.highlightCornerRadius, highlightLayer: self.highlightLayer, borderType: self.borderType, strokeWidth: strokeWidth, strokeColor: strokeColor ?? UIColor.clear, originalFont: backedTextInputView.reactTextAttributes?.effectiveFont() ?? UIFont.systemFont(ofSize: CGFloat(16), weight: .regular) , canAdjustInset: isSticker)



    if !showHighlight {
      self.highlightLayer.isHidden = true
    }

    if textRect != _textRect && textView.isFirstResponder {
      self.rctTextView.setSelectedTextRange(rctTextView.selectedTextRange, notifyDelegate: false)
    }
  }

  var isInitialMount = true
  @objc(didSetProps:)
  override func didSetProps(_ changedProps: Array<String>) {
    super.didSetProps(changedProps)


//    if changedProps.contains("maxContentWidth") {
//      textView.preferredMaxLayoutWidth = maxContentWidth?.cgFloatValue
//    }
    if isInitialMount && isSticker && !hasText && textView.isFirstResponder && !isFixedSize {
//      bridge?.uiManager.setSize(CGSize(width: UIScreen.main.bounds.width, height: .greatestFiniteMagnitude), for: self)
//      self.textView.invalidateIntrinsicContentSize()
    }

    let needsUpdateHighlight = changedProps.contains("borderType") || changedProps.contains("borderTypeString") || changedProps.contains("highlightInset") || changedProps.contains("highlightColor") || changedProps.contains("strokeColor") || changedProps.contains("strokeWidth") || changedProps.contains("highlightCornerRadius") ||  changedProps.contains("template") || changedProps.contains("textAlign")

    let forceLayout = changedProps.contains("template") || changedProps.contains("borderType") || changedProps.contains("highlightInset") || changedProps.contains("strokeWidth")

    if (needsUpdateHighlight) {
      if Thread.isMainThread {
        if forceLayout {
          self.setNeedsLayout()
          self.layoutIfNeeded()
        } else {
          self.updateHighlight()
        }
      } else {
        DispatchQueue.main.async { [weak self] in
          if forceLayout {
            self?.setNeedsLayout()
            self?.layoutIfNeeded()
          } else {
            self?.updateHighlight()
          }
        }
      }

      isInitialMount = false
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

  func invalidate() {
    bridge?.uiManager.observerCoordinator.remove(self)
    self.movableViewTag = nil
    self.bridge = nil

    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillHideNotification, object: nil)
    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillShowNotification, object: nil)
  }

  var highlightSubview = UIView()
  static var horizontalFocusOffset = CGFloat(16);

  private var size = CGSize.zero
  override func layoutSubviews() {
    let _transformRect = movableView?.transformRect
    super.layoutSubviews()

    if self.highlightSubview.superview == nil {
      highlightSubview.layer.addSublayer(highlightLayer)
      highlightLayer.isHidden = !showHighlight
      self.backedTextInputView.insertSubview(highlightSubview, at: 0)
    }



    if isSticker && hasText {

      var boundsSize = CGSize(width: max(bounds.width, _maxContentWidth), height: bounds.height)

      var _rect = CGRect(origin: bounds.origin, size: boundsSize).inset(by: textInset.negate).inset(by: reactPaddingInsets)
      var size = textView.sizeThatFits(_rect.size)
      var offset = _rect.origin
      let textAlign = textView.textAlignment

      if textView.isFirstResponder {
        offset.x = YeetTextInputView.horizontalFocusOffset
        if textAlign == .right {
          offset.x -= textInset.left - textInset.right
        }
//        size.width -= abs(offset.x) * 2
      }

      if textView.isFirstResponder && !isFixedSize {
        textView.contentOffset.x = offset.x
        textView.contentInset = UIEdgeInsets(top: textView.contentInset.top, left: offset.x, bottom: textView.contentInset.bottom, right: offset.x)

        self.bridge?.uiManager.setIntrinsicContentSize(size, for: self)

//        textView.invalidateIntrinsicContentSize()
//        textView.setNeedsLayout()
//        textView.layoutIfNeeded()

        self.size = boundsSize
      } else if hasText && !isFixedSize {
        textView.contentOffset = .zero
        textView.contentInset = .zero

        self.bridge?.uiManager.setIntrinsicContentSize(size, for: self)
      }
    }

    self.updateHighlight()

    if _transformRect != movableView?.transformRect {
      self.lastTransformRect = _transformRect

      if !self.textView.isFirstResponder && _transformRect != nil {
        self.movableView?.handleLayoutTransform(_transformRect!)
      }

    }
  }

  var hasText : Bool { attributedText?.length ?? 0 > 0 }

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
    highlightLayer.contentsScale = nativeScale

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

  override init(bridge: RCTBridge) {
    self.bridge = bridge
    highlightLayer = CAShapeLayer()
    super.init(bridge: bridge)


    NotificationCenter.default.addObserver(self, selector: #selector(handleKeyboardWillShow(notif:)), name: UIResponder.keyboardWillShowNotification, object: nil)

    textView.translatesAutoresizingMaskIntoConstraints = false
    let safeArea = safeAreaLayoutGuide
    NSLayoutConstraint.activate([
        textView.topAnchor.constraint(equalTo: safeArea.topAnchor),
        textView.leadingAnchor.constraint(equalTo: safeArea.leadingAnchor),
        textView.trailingAnchor.constraint(equalTo: safeArea.trailingAnchor),
//        textView.widthAnchor.constraint(equalTo: widthAnchor),
    ])

    bridge.uiManager.observerCoordinator.add(self)

    highlightLayer.contentsScale = UIScreen.main.scale
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

    self.highlightLayer.fillColor = YeetTextInputView.DEFAULT_HIGHLIGHT_COLOR.cgColor
    backedTextInputView.textInputDelegate = self
    backedTextInputView.clipsToBounds = false
    textView.layer.masksToBounds = false
    textView.layoutManager.allowsNonContiguousLayout = true

    tapRecognizer = UITapGestureRecognizer(target: self, action: #selector(YeetTextInputView.handleTap(_:)))
    self.addGestureRecognizer(tapRecognizer!)
    self.textView.isSelectable = true
    self.textView.isScrollEnabled = false
    self.textView.isEditable = false

    textView.keyboardAppearance = .dark
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
    }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    self.updateTapGestureRecognizer()

    if isDetached && YeetTextInputView.focusedReactTag == reactTag {
      YeetTextInputView.focusedReactTag = nil
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

  var firstResponderObservation: NSKeyValueObservation? = nil

  override func reactFocus() {
    guard !textView.isFirstResponder else {
      self.reactIsFocusNeeded = false
      return
    }

    self.enableSelection()

    YeetTextInputView.focusedReactTag = reactTag

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
    guard canFocus else {
      return false
    }
    enableSelection()
    let willBegin = super.textInputShouldBeginEditing()

    return willBegin
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

//    UIView.setAnimationsEnabled(false)
    self.drawHighlight()
//    UIView.setAnimationsEnabled(true)

    tapRecognizer?.isEnabled = false
    YeetTextInputView.focusedReactTag = reactTag

    NotificationCenter.default.addObserver(self, selector: #selector(handleKeyboardWillHide(notif:)), name: UIResponder.keyboardWillHideNotification, object: nil)


    self.textView.setNeedsLayout()
    self.textView.setNeedsDisplay()
    self.textView.layoutIfNeeded()

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
//    UIView.setAnimationsEnabled(false)
    self.drawHighlight()
//    UIView.setAnimationsEnabled(true)
  }

  @objc(onFinishEditing)
  var onFinishEditing: RCTDirectEventBlock? = nil

  override func textInputDidEndEditing() {
    super.textInputDidEndEditing()

    if isSticker {
      self.disableSelection()
    }


    self.drawHighlight()

    if hasSetContentScale {
      self.updateScale()
    }

    tapRecognizer?.isEnabled = true

    YeetTextInputView.focusedReactTag = nil

    if self.onFinishEditing != nil {
      onFinishEditing!([
        "value": self.textView.text ?? "",
        "startSize": self.beforeEditSize.dictionaryValue(),
        "endSize": self.editEndSize.dictionaryValue(),
      ])
    }

  }

  var hasFillColor : Bool {
    return [Border.solid, Border.highlight, Border.invert].contains(borderType)
  }
  var originalFrame = CGRect.zero
  var originalTransform = CGAffineTransform.identity

  @objc(handleKeyboardWillShow:)
  func handleKeyboardWillShow(notif: NSNotification) {
    guard isSticker else {
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

    guard !isFixedSize else {
      return
    }

    guard isShowingKeyboard == false else {
      return
    }

    let keyboard = KeyboardNotification(notif)


    var size = CGSize(width: UIScreen.main.bounds.width, height: .greatestFiniteMagnitude)
    self.bridge?.uiManager.setSize(size, for: self)

    UIView.setAnimationsEnabled(false)

    let containerView = movableView.superview!
    isShowingKeyboard = true

    var origin = keyboard.frameEndForView(view: containerView).topLeft
    let trans = movableView.layer.affineTransform()
    let bounds = self.bounds
    let textRect = self.textRect
    let textInset = self.textInset

    let textContainerInset = self.textView.textContainerInset

    let height = max(self.textRect.size.height, self.bounds.height)
    beforeEditSize = CGSize(width: self.bounds.width, height: height)
    hideYOffset = movableView.frame.y - movableView.unfocusedBottom!.cgFloatValue


    originalFrame = movableView.frame
    originalTransform = trans

//    var size = CGSize(width: UIScreen.main.bounds.width, height: .greatestFiniteMagnitude)

    self.bridge?.uiManager.setSize(size, for: self)



    self.isOpaque = false
    self.superview?.isOpaque = false

    var container: UIView? = UIView()

    container!.frame = CGRect(origin: movableView.frame.origin, size: CGSize(width: size.width, height: movableView.bounds.height))
    container!.bounds = CGRect(origin: movableView.bounds.origin, size: CGSize(width: size.width, height: movableView.bounds.height))

    let usedRect = self.textView.layoutManager.usedRect(for: self.textView.textContainer)
//    origin.y -= textRect.height
    Log.debug("""
      textInset: \(textInset)
      trans: \(trans.translation())
      padding: \(reactPaddingInsets)
      scale: \(trans.scaleXY())
      usedRect: \(usedRect)
      rotation: \(trans.rotationRadians())
      frame: \(movableView.frame)
      origin: \(movableView.frame.origin)
      bounds: \(self.bounds)
      compoundINset: \(reactCompoundInsets)
      textRect: \(textRect)
      textContainerInset: \(textView.textContainerInset)
    """)

    var snapshotView = movableView.subviews.first!
    var boundsRect = snapshotView.bounds



    var resizableSnapshot: UIView? = snapshotView.resizableSnapshotView(from: snapshotView.bounds, afterScreenUpdates: false, withCapInsets: textInset)!
    resizableSnapshot?.bounds = snapshotView.bounds
    resizableSnapshot?.transform = trans

    container!.frame.origin.y -= resizableSnapshot!.frame.origin.y
    container!.frame.origin.x -= resizableSnapshot!.frame.origin.x
    container!.frame.origin.y -= resizableSnapshot!.bounds.origin.y
    container!.frame.origin.x -= resizableSnapshot!.bounds.origin.x

    origin.y -= container!.frame.height
    origin.x = YeetTextInputView.horizontalFocusOffset
    origin.x -= textRect.x
    movableView.alpha = 0

//    resizableSnapshot?.backgroundColor = UIColor.init(red: 0.25, green: 0, blue: 0, alpha: 0.1)
//    movableView.backgroundColor = UIColor.init(red: 0, green: 0, blue: 0.25, alpha: 0.1)



    container!.addSubview(resizableSnapshot!)
    movableView.superview!.addSubview(container!)
    let textAlign = textView.textAlignment


    movableView.setNeedsLayout()
    movableView.layoutIfNeeded()



    UIView.setAnimationsEnabled(true)
    let template = self.textTemplate

    let hasFillColor = self.hasFillColor

    UIView.animate(keyboard, animations: {
      container?.frame = CGRect(origin: origin, size: container!.frame.size)


      var position = CGPoint.zero

      if hasFillColor {
        if template == .comic {
          position.y = (container!.frame.height - bounds.height) / 2 + textInset.top + (textContainerInset.top / 2)
        } else {
          position.y = container!.frame.height - bounds.height - textInset.top - textRect.y

          if template != .basic {
            position.y += textInset.top
          }
        }

        if textAlign == .left {
          position.x = textRect.x
        } else if textAlign == .right {
          position.x =  (container!.bounds.width - textRect.width)
          position.x += textInset.left
          position.x += textInset.right
          position.x -= origin.x
          position.x -= textRect.x
        } else if textAlign == .center {
          position.x = (container!.bounds.width - textRect.width) / 2 - origin.x
        }
      } else {
        position.y = container!.frame.height - bounds.height

        if template != .basic {
          position.y += textInset.top
          position.y += 1
        }

        if textAlign == .left {
          position.x = textRect.x * -1
        } else if textAlign == .right {
          position.x =  container!.bounds.width - YeetTextInputView.horizontalFocusOffset - textRect.width - origin.x
        // This works for:
          // position.x = (container!.bounds.width - usedRect.width) / 2 - origin.x + usedRect.x
        // - borderType hidden
        // - borderType stroke
        } else if textAlign == .center {
          position.x = (container!.bounds.width - usedRect.width) / 2 - origin.x + usedRect.x
        }
      }

      resizableSnapshot!.transform = .identity
      resizableSnapshot!.frame.origin = position
    }, completion: {_ in
      movableView.alpha = 1
      container?.removeFromSuperview()
      resizableSnapshot?.removeFromSuperview()
      container = nil
      resizableSnapshot = nil
    })
  }

  @objc(maxContentWidth)
  var maxContentWidth: NSNumber = NSNumber(value: 0)
  var _maxContentWidth : CGFloat {
    return maxContentWidth.cgFloatValue
  }

  var beforeEditSize: CGSize = .zero

  var editEndSize: CGSize {
    return CGSize(width: isFixedSize ? _maxContentWidth : self.textRect.size.width, height: max(self.textRect.size.height, self.bounds.height))
  }

  var isFixedSize: Bool { _maxContentWidth > .zero && isSticker }
  var hideYOffset = CGFloat.zero

  @objc(handleKeyboardWillHide:)
  func handleKeyboardWillHide(notif: NSNotification) {
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

    guard !isFixedSize else {
      return
    }



    var originalTintColor = textView.tintColor
    UIView.setAnimationsEnabled(false)
    self.bridge?.uiManager.setSize(editEndSize, for: self)

    textView.tintColor = .clear
    let containerView = movableView.superview!
    let keyboard = KeyboardNotification(notif)
    let trans = originalTransform
    let textRect = self.textRect
    let textInset = self.textInset

    var offset = CGRect.zero

    if let range = textView.selectedTextRange {
      if range.isEmpty && range.end == textView.endOfDocument {
        offset = textView.caretRect(for: range.end)
      }
    }


    let textContainerInset = self.textView.textContainerInset


    let size = CGSize(width: UIScreen.main.bounds.width, height: .greatestFiniteMagnitude)
    self.isOpaque = false
    self.superview?.isOpaque = false

    var container: UIView? = UIView()
    let originalFrame = self.originalFrame

    container!.frame = CGRect(origin: movableView.frame.origin, size: CGSize(width: size.width, height: movableView.bounds.height))
    container!.bounds = CGRect(origin: movableView.bounds.origin, size: CGSize(width: size.width, height: movableView.bounds.height))

    let usedRect = self.textView.layoutManager.usedRect(for: self.textView.textContainer)
    let bottom = movableView.unfocusedBottom?.cgFloatValue ?? .zero
//    origin.y -= textRect.height
    Log.debug("""
      textInset: \(textInset)
      trans: \(trans.translation())
      hideYOffset: \(hideYOffset)
      padding: \(reactPaddingInsets)
      scale: \(trans.scaleXY())
      usedRect: \(usedRect)
      rotation: \(trans.rotationRadians())
      frame: \(movableView.frame)
      origin: \(movableView.frame.origin)
      bounds: \(self.bounds)
      compoundINset: \(reactCompoundInsets)
      textRect: \(textRect)
      textContainerInset: \(textView.textContainerInset)
      bottom: \(bottom)
    """)

    let frame = originalFrame.applying(trans.inverted())

        let snapshotView = movableView
    var resizableSnapshot: UIView? = snapshotView.resizableSnapshotView(from: CGRect(origin: snapshotView.bounds.origin, size: CGSize(width: snapshotView.bounds.width, height : snapshotView.bounds.height)), afterScreenUpdates: false, withCapInsets: textInset)!
      resizableSnapshot?.transform = .identity
    resizableSnapshot?.bounds = snapshotView.bounds
    resizableSnapshot?.frame.origin = movableView.frame.origin

    resizableSnapshot?.isOpaque = false



//    self.bridge?.uiManager.setSize(editEndSize, for: self)


        movableView.alpha = 0

//        container!.addSubview(resizableSnapshot!)
        movableView.contentContainerView!.addSubview(resizableSnapshot!)
        let textAlign = textView.textAlignment


        movableView.setNeedsLayout()
        movableView.layoutIfNeeded()

        let containerViewFrame = movableView.contentContainerView!.bounds
        var contentOffset = textView.contentOffset
        contentOffset.x += offset.width / 2

        UIView.setAnimationsEnabled(true)
        let template = self.textTemplate

        let hasFillColor = self.hasFillColor



        UIView.animate(keyboard, animations: {
          resizableSnapshot?.frame.origin.y =  bottom * -1 - movableView.frame.height
          resizableSnapshot?.frame.origin.x = originalFrame.origin.x
//          container?.frame.origin.y -= (frame.y - originalFrame.origin.y)
//
//          container?.frame.origin.y += (frame.height - movableView.frame.height)

//         if hasFillColor {
//           container?.frame.origin.y += textInset.top
//           container?.frame.origin.y += textInset.bottom
//         }


         if textAlign == .center {
          resizableSnapshot?.frame.origin.x += (frame.width - movableView.frame.width) / 2 + contentOffset.x
         } else if textAlign == .right {
           resizableSnapshot?.frame.origin.x += (frame.width - movableView.frame.width) + contentOffset.x
         } else if textAlign == .left {
           resizableSnapshot?.frame.origin.x -= contentOffset.x
         }

        resizableSnapshot!.transform = trans



        }, completion: {_ in
          movableView.alpha = 1
          self.textView.tintColor = originalTintColor
//          container?.removeFromSuperview()
          resizableSnapshot?.removeFromSuperview()
          container = nil
          resizableSnapshot = nil
        })

    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillHideNotification, object: nil)
    isShowingKeyboard = false
  }

  @objc(onStartEditing)
  var onStartEditing: RCTDirectEventBlock? = nil

  override func textInputShouldChangeText(in range: NSRange, replacementText string: String) -> Bool {
    let shouldReject = super.textInputShouldChangeText(in: range, replacementText: string)

    if let oldString = textView.text {
      guard let range = Range(range, in: oldString) else {
        return shouldReject
      }

      let newString = oldString.replacingCharacters(in: range, with: string)

//      UIView.setAnimationsEnabled(false)
      self.drawHighlight()
//      UIView.setAnimationsEnabled(true)
    }

    return shouldReject
  }

  override func textInputDidChange() {
    super.textInputDidChange()




//    UIView.setAnimationsEnabled(false)
    self.drawHighlight()
//    UIView.setAnimationsEnabled(true)
  }


  override func reactBlur() {
    super.reactBlur()
    let didResign = !textView.isFirstResponder

    tapRecognizer?.isEnabled = true

    if didResign && isSticker {
      self.disableSelection()
    }


    if didResign && YeetTextInputView.focusedReactTag == reactTag {
      YeetTextInputView.focusedReactTag = nil
    }
  }

  override func reactFocusIfNeeded() {
    self.enableSelection()

    if reactIsFocusNeeded || textView.reactIsFocusNeeded {
      self.reactFocus()
    }
  }




  var textRect = CGRect.zero

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

extension NSNumber {
  var cgFloatValue: CGFloat {
    return CGFloat(self.doubleValue)
  }
}


