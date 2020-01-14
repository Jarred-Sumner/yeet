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

  func didMountSticker() {
    if textView.isFirstResponder {

    }
  }



  var isInitialMount = true
  @objc(didSetProps:)
  override func didSetProps(_ changedProps: Array<String>) {
    super.didSetProps(changedProps)

    if isInitialMount && isSticker {
      DispatchQueue.main.async { [weak self] in
        self?.didMountSticker()
      }

    }

    let needsUpdateHighlight = changedProps.contains("borderType") || changedProps.contains("borderTypeString") || changedProps.contains("highlightInset") || changedProps.contains("highlightColor") || changedProps.contains("strokeColor") || changedProps.contains("strokeWidth") || changedProps.contains("highlightCornerRadius") ||  changedProps.contains("template") || changedProps.contains("textAlign")

    let forceLayout = changedProps.contains("template") || changedProps.contains("borderType") || changedProps.contains("highlightInset") || changedProps.contains("strokeWidth")

    if (needsUpdateHighlight) {
      if Thread.isMainThread {
        self.setNeedsLayout()
        self.layoutIfNeeded()
      } else {
        DispatchQueue.main.async { [weak self] in

          self?.setNeedsLayout()
          self?.layoutIfNeeded()

        }
      }

      isInitialMount = false
    }


  }

  func invalidate() {
    bridge?.uiManager.observerCoordinator.remove(self)
    self.movableViewTag = nil
    self.bridge = nil

    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillHideNotification, object: nil)
    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillShowNotification, object: nil)
  }


  private var size = CGSize.zero
  override func layoutSubviews() {
    super.layoutSubviews()
  }

  

  @objc(yeetTextAttributes)
  var yeetTextAttributes : YeetTextAttributes {
    get {
      return textView.yeetTextAttributes
    }

    set (newValue) {
      textView.yeetTextAttributes = newValue
    }
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

  

  override init(bridge: RCTBridge) {
    let storage = NSTextStorage()
    let manager = YeetTextLayoutManager()
    let container = NSTextContainer(size: CGSize(width: 0, height: CGFloat.greatestFiniteMagnitude))
    container.widthTracksTextView = true
    manager.addTextContainer(container)
    storage.addLayoutManager(manager)

    textView = YeetTextView(frame: .zero, textContainer: container)

    super.init(bridge: bridge)

    self.bridge = bridge
    self.blurOnSubmit = false
    textView.frame = bounds
    textView.textInputDelegate = self
    textView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
//    textView.translatesAutoresizingMaskIntoConstraints = true
    textView.contentInsetAdjustmentBehavior = .never
    textView.contentCompressionResistancePriority(for: .horizontal)


    textView.observe(\YeetTextView.yeetTextAttributes) { [weak self] (textView, change) in
      self?.updateLocalData()
    }

    self.addSubview(textView)

    let safeArea = safeAreaLayoutGuide
    
    NotificationCenter.default.addObserver(self, selector: #selector(handleKeyboardWillShow(notif:)), name: UIResponder.keyboardWillShowNotification, object: nil)
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
      bridge?.uiManager.observerCoordinator.remove(self)
    }
  }

  var isSticker : Bool { get { textView.isSticker }}


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

    guard !isFixedSize else {
      super.yeetReactSetFrame(frame)
      return
    }

    guard let animator = _animator else {
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
      self.layoutIfNeeded()
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

    if isSticker {

    }


    if isSticker {
      NotificationCenter.default.addObserver(self, selector: #selector(handleKeyboardWillHide(notif:)), name: UIResponder.keyboardWillHideNotification, object: nil)
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
    self.textView.drawHighlight()
  }

  override func updateLocalData() {
    self.enforceTextAttributesIfNeeded()
    textView.yeetTextAttributes.attributedText = attributedText
    if let font = textAttributes?.effectiveFont() {
      textView.yeetTextAttributes.font = font
    }
    bridge?.uiManager.setLocalData(textView.yeetTextAttributes.copy(), for: self)
  }

  override func textInputDidEndEditing() {
    super.textInputDidEndEditing()

    textView.drawHighlight(true)



    if isSticker {
      self.disableSelection()

    }

    tapRecognizer?.isEnabled = true



//    YeetTextInputView.focusedReactTag = nil

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
    return textView.textRect
  }
  var originalFrame = CGRect.zero
  var originalTransform = CGAffineTransform.identity


  static var horizontalFocusOffset = CGFloat(16)
  var keyboardNotification: KeyboardNotification? = nil
  var sentWillShowKeyboard = false

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

    guard sentWillShowKeyboard == false else {
      return
    }

    keyboardNotification = KeyboardNotification(notif)
    movableView.animator = keyboardNotification!.createPropertyAnimator()
    isShowingKeyboard = true
    sentWillShowKeyboard = true

    NotificationCenter.default.addObserver(forName: UIResponder.keyboardDidShowNotification, object: nil, queue: .main) { [weak self] notification in
      guard let this = self else {
        return
      }

      this.keyboardNotification = nil
      this.isShowingKeyboard = false
      this.sentWillShowKeyboard = false
      NotificationCenter.default.removeObserver(this, name: UIResponder.keyboardDidShowNotification, object: nil)

      if this.movableView?.animator?.state == UIViewAnimatingState.active {
        this.movableView?.animator?.stopAnimation(false)
      }

      this.movableView?.animator = nil
    }



//
//    let containerView = movableView.superview!
//    isShowingKeyboard = true
//
//    var origin = keyboard.frameEndForView(view: containerView).topLeft
//    let trans = movableView.layer.affineTransform()
//    let bounds = self.bounds
//    var textRect = self.textRect
//    textRect.origin.x = 0
//    let textInset = self.textInset
//
//    let textContainerInset = self.textView.textContainerInset
//
//    let height = max(self.textRect.size.height, self.bounds.height)
//    beforeEditSize = CGSize(width: self.bounds.width, height: self.bounds.height)
//    hideYOffset = movableView.frame.y - movableView.unfocusedBottom!.cgFloatValue
//
//
//    originalFrame = movableView.frame
//    originalTransform = trans
//
////    var size = CGSize(width: UIScreen.main.bounds.width, height: .greatestFiniteMagnitude)
//
//
//
//
//
//    self.isOpaque = false
//    self.superview?.isOpaque = false
//
//    var container: UIView? = UIView()
//
//    container!.frame = CGRect(origin: movableView.frame.origin, size: CGSize(width: size.width, height: movableView.bounds.height))
//    container!.bounds = CGRect(origin: movableView.bounds.origin, size: CGSize(width: size.width, height: movableView.bounds.height))
//
//    let usedRect = textRect
////    origin.y -= textRect.height
//    Log.debug("""
//      textInset: \(textInset)
//      trans: \(trans.translation())
//      padding: \(reactPaddingInsets)
//      scale: \(trans.scaleXY())
//      usedRect: \(usedRect)
//      rotation: \(trans.rotationRadians())
//      frame: \(movableView.frame)
//      origin: \(movableView.frame.origin)
//      bounds: \(self.bounds)
//      compoundINset: \(reactCompoundInsets)
//      textRect: \(textRect)
//      textContainerInset: \(textView.textContainerInset)
//    """)
//
//    let snapshotView = movableView.subviews.first!
//
//
//
//
//    var resizableSnapshot: UIView? = snapshotView.resizableSnapshotView(from: snapshotView.bounds, afterScreenUpdates: false, withCapInsets: textInset)!
//    resizableSnapshot?.bounds = snapshotView.bounds
//    resizableSnapshot?.transform = trans
//
//    let caretRect = managesSize ? CGRect.zero : textView.caretRect(for: textView.endOfDocument)
//    container!.frame.origin.y -= resizableSnapshot!.frame.origin.y
//    container!.frame.origin.x -= resizableSnapshot!.frame.origin.x
//    container!.frame.origin.y -= resizableSnapshot!.bounds.origin.y
//    container!.frame.origin.x -= resizableSnapshot!.bounds.origin.x
//
//
//    origin.y -= container!.frame.height
//
//
//
//
//
////    textRect.x += YeetTextInputView.horizontalFocusOffset
//    movableView.alpha = 0
//
////    resizableSnapshot?.backgroundColor = UIColor.init(red: 0.25, green: 0, blue: 0, alpha: 0.1)
////    movableView.backgroundColor = UIColor.init(red: 0, green: 0, blue: 0.25, alpha: 0.1)
//
//
//
//    container!.addSubview(resizableSnapshot!)
//    movableView.superview!.addSubview(container!)
//    let textAlign = textView.textAlignment
//
//
//    origin.x =  YeetTextInputView.horizontalFocusOffset - textRect.x
//
//
//
//    movableView.setNeedsLayout()
//    movableView.layoutIfNeeded()
//
//    UIView.setAnimationsEnabled(true)
//    let template = textView.textTemplate
//
//    let hasFillColor = textView.hasFillColor
//
//    UIView.animate(keyboard, animations: {
//      container?.frame = CGRect(origin: origin, size: container!.frame.size)
//
//
//      var position = CGPoint.zero
//
////      if hasFillColor {
//        if template == .comic {
//          position.y = (container!.frame.height - bounds.height) / 2 + textInset.top + (textContainerInset.top / 2)
//        } else {
//          position.y = container!.frame.height - bounds.height - textInset.top
//
//          if template != .basic {
//            position.y += textInset.top
//          }
//        }
//
//        if textAlign == .left {
//          position.x = textRect.x
//
//        } else if textAlign == .right {
//          position.x =  (container!.bounds.width - textRect.width)
//          position.x += textInset.left
//          position.x += textInset.right
//          position.x += origin.x
//          position.x -= textRect.x
//          position.x -= caretRect.width
//        } else if textAlign == .center {
//          position.x = (container!.bounds.width - textRect.width) / 2 - origin.x - caretRect.width - caretRect.x
//        }
////      } else {
////        position.y = container!.frame.height - bounds.height
////
////        if template != .basic {
////          position.y += textInset.top
////          position.y += 1
////        }
////
////        if textAlign == .left {
////          position.x = textRect.x * -1
////        } else if textAlign == .right {
////          position.x =  container!.bounds.width - textRect.width - origin.x - caretRect.width
////        // This works for:
////          // position.x = (container!.bounds.width - usedRect.width) / 2 - origin.x + usedRect.x
////        // - borderType hidden
////        // - borderType stroke
////        } else if textAlign == .center {
////          position.x = (container!.bounds.width - usedRect.width) / 2 - origin.x + usedRect.x - (caretRect.width / 2)
////        }
////      }
//
//      resizableSnapshot!.transform = .identity
//      resizableSnapshot!.frame.origin = position
//    }, completion: {_ in
//      let resizeFrame = container!.convert(resizableSnapshot!.frame, to: movableView.superview!)
//      let movableFrame = movableView.frame
//      Log.debug("""
//        resizeFrame: \(resizeFrame)
//        movableFrame: \(movableFrame)
//      """)
//      movableView.alpha = 1
////      movableView.backgroundColor = UIColor.init(red: 0.25, green: 0.25, blue: 0, alpha: 0.5)
//
////      DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + 5.0) {
//        container?.removeFromSuperview()
////        movableView.backgroundColor = .clear
//        resizableSnapshot?.removeFromSuperview()
//        container = nil
//        resizableSnapshot = nil
////      }
//    })
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

  var textTemplate: YeetTextTemplate {
    return textView.textTemplate
  }

  var textInset: UIEdgeInsets {
    return yeetTextAttributes.textContainerInset
  }

  var hasFillColor : Bool {
    return textView.hasFillColor
  }

  var isFixedSize: Bool { _maxContentWidth > .zero && isSticker }
  var hideYOffset = CGFloat.zero
  var isHidingKeyboard = false


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

    isHidingKeyboard = true
    keyboardNotification = KeyboardNotification(notif)
    NotificationCenter.default.addObserver(forName: UIResponder.keyboardDidHideNotification, object: nil, queue: .main) { [weak self, weak movableView] notification in
      guard let this = self else {
        return
      }

      YeetTextInputView.focusedReactTag = nil
      this.keyboardNotification = nil
      this.isHidingKeyboard = false
      NotificationCenter.default.removeObserver(this, name: UIResponder.keyboardDidHideNotification, object: nil)
      if this.movableView?.animator?.state == UIViewAnimatingState.active {
        this.movableView?.animator?.stopAnimation(false)
      }

      this.movableView?.animator = nil
    }

//
//    var originalTintColor = textView.tintColor
//    UIView.setAnimationsEnabled(false)
//
//
//
//    textView.tintColor = .clear
//    let containerView = movableView.superview!
//    let keyboard = KeyboardNotification(notif)
//    let trans = originalTransform
//    let textRect = self.textRect
//    let textInset = self.textInset
//
//    var offset = CGRect.zero
//
//    if let range = textView.selectedTextRange {
//      if range.isEmpty && range.end == textView.endOfDocument {
//        offset = textView.caretRect(for: range.end)
//      }
//    }
//
//
//    let textContainerInset = self.textView.textContainerInset
//

//
//
//    self.isOpaque = false
//    self.superview?.isOpaque = false
//
//    var container: UIView? = UIView()
//    let originalFrame = self.originalFrame
//
//    container!.frame = CGRect(origin: movableView.frame.origin, size: movableView.bounds.size)
//    container!.bounds = CGRect(origin: movableView.bounds.origin, size: movableView.bounds.size)
//
//    let usedRect = self.textView.textRect
//    let bottom = movableView.unfocusedBottom?.cgFloatValue ?? .zero
//    let left = movableView.unfocusedLeft?.cgFloatValue ?? .zero
//
//
////    self.bridge?.uiManager.setSize(textRect.size, for: self)
//
////    origin.y -= textRect.height
//    Log.debug("""
//      textInset: \(textInset)
//      trans: \(trans.translation())
//      hideYOffset: \(hideYOffset)
//      padding: \(reactPaddingInsets)
//      scale: \(trans.scaleXY())
//      usedRect: \(usedRect)
//      rotation: \(trans.rotationRadians())
//      frame: \(movableView.frame)
//      origin: \(movableView.frame.origin)
//      bounds: \(self.bounds)
//      compoundINset: \(reactCompoundInsets)
//      textRect: \(textRect)
//      textContainerInset: \(textView.textContainerInset)
//      bottom: \(bottom)
//    """)
//
//    let frame = originalFrame.applying(trans.inverted())
//
//        let snapshotView = movableView
//    var resizableSnapshot: UIView? = snapshotView.resizableSnapshotView(from: CGRect(origin: snapshotView.bounds.origin, size: CGSize(width: snapshotView.bounds.width, height : snapshotView.bounds.height)), afterScreenUpdates: false, withCapInsets: textInset)!
//      resizableSnapshot?.transform = .identity
//    resizableSnapshot?.bounds = snapshotView.bounds
//    resizableSnapshot?.frame.origin = movableView.frame.origin
//
//    resizableSnapshot?.isOpaque = false
//
//
//
//        movableView.alpha = 0
//
////        container!.addSubview(resizableSnapshot!)
//        movableView.contentContainerView!.addSubview(resizableSnapshot!)
//        let textAlign = textView.textAlignment
//
//
//        movableView.setNeedsLayout()
//        movableView.layoutIfNeeded()
//
//        let containerViewFrame = movableView.contentContainerView!.bounds
//        var contentOffset = textView.contentOffset
//        contentOffset.x += offset.width / 2
//
//        UIView.setAnimationsEnabled(true)
//        let template = self.textTemplate
//
//        let hasFillColor = self.hasFillColor
//
//
//
//        UIView.animate(keyboard, animations: {
//          resizableSnapshot?.frame.origin.y =  bottom * -1 - movableView.frame.height
//          resizableSnapshot?.frame.origin.x = left
////          container?.frame.origin.y -= (frame.y - originalFrame.origin.y)
////
////          container?.frame.origin.y += (frame.height - movableView.frame.height)
//
////         if hasFillColor {
////           container?.frame.origin.y += textInset.top
////           container?.frame.origin.y += textInset.bottom
////         }
//
//
//         if textAlign == .center {
//          resizableSnapshot?.frame.origin.x += (frame.width - movableView.frame.width) / 2 + contentOffset.x
//         } else if textAlign == .right {
//           resizableSnapshot?.frame.origin.x += (frame.width - movableView.frame.width) + contentOffset.x
//         } else if textAlign == .left {
//           resizableSnapshot?.frame.origin.x -= contentOffset.x
//         }
//
//        resizableSnapshot!.transform = trans
//
//
//
//        }, completion: {_ in
//          movableView.alpha = 1
//          self.textView.tintColor = originalTintColor
////          container?.removeFromSuperview()
//          resizableSnapshot?.removeFromSuperview()
//          container = nil
//          resizableSnapshot = nil
//        })

    movableView.animator = keyboardNotification!.createPropertyAnimator()

    NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillHideNotification, object: nil)
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
    let shouldReject = super.textInputShouldChangeText(in: range, replacementText: string)

    guard shouldReject == false else {
      return shouldReject
    }

    if let oldString = text {
      guard let range = Range(range, in: oldString) else {
        return shouldReject
      }

      let newString = oldString.replacingCharacters(in: range, with: string)
    }

    return shouldReject
  }

  override func textInputDidChange() {
    super.textInputDidChange()

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


    if didResign && YeetTextInputView.focusedReactTag == reactTag {
      YeetTextInputView.focusedReactTag = nil
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

extension NSNumber {
  var cgFloatValue: CGFloat {
    return CGFloat(self.doubleValue)
  }
}


