//
//  YeetScrollView.swift
//  yeet
//
//  Created by Jarred WSumner on 2/18/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

import UIKit

@objc(YeetScrollView) class YeetScrollView: UIScrollView, UIScrollViewDelegate {
  @objc (headerHeight) var headerHeight: CGFloat = CGFloat(0)
  @objc (footerHeight) var footerHeight: CGFloat = CGFloat(0)

  var keyboardNotification: KeyboardNotification? = nil
  var _defaultContentInset : UIEdgeInsets {
    return UIEdgeInsets(top: headerHeight, left: contentInset.left, bottom: footerHeight, right: contentInset.right)
  }


  var bridge: RCTBridge? = nil

  @objc override func didSetProps(_ changedProps: [String]!) {
    super.didSetProps(changedProps)

    if changedProps.contains("headerHeight") || changedProps.contains("footerHeight") {
      DispatchQueue.main.async {
        self.updateSizes()
      }
    }
  }



  init(bridge: RCTBridge?) {
    self.bridge = bridge


    super.init(frame: UIScreen.main.bounds)
//    isUserInteractionEnabled = true
    self.keyboardDismissMode = .onDrag
    self.canCancelContentTouches = false
    self.delaysContentTouches = false
    

    self.backgroundColor = UIColor.clear
    self.contentInset = _defaultContentInset
    self.alwaysBounceVertical = true
    self.contentInsetAdjustmentBehavior = .never
    self.delegate = self
    translatesAutoresizingMaskIntoConstraints = false
    contentView.translatesAutoresizingMaskIntoConstraints = false

//    addSubview(contentView)
//
//    NSLayoutConstraint.activate([
//      contentView.topAnchor.constraint(equalTo: contentLayoutGuide.topAnchor),
//      contentView.leftAnchor.constraint(equalTo: contentLayoutGuide.leftAnchor),
//      contentView.rightAnchor.constraint(equalTo: contentLayoutGuide.rightAnchor),
//      contentView.bottomAnchor.constraint(equalTo: contentLayoutGuide.bottomAnchor),
//    ])

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(keyboardWillShow(_:)),
      name: UIResponder.keyboardWillShowNotification,
      object: nil)

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(keyboardDidShow),
      name: UIResponder.keyboardDidShowNotification,
      object: nil)

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(keyboardDidHide),
      name: UIResponder.keyboardDidHideNotification,
      object: nil)

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(keyboardWillHide(_:)),
      name: UIResponder.keyboardWillHideNotification,
      object: nil)
  }

  @objc func keyboardDidShow() {
    keyboardStatus = .shown
    keyboardNotification = nil

    
    animator?.stopAnimation(false)
    animator?.finishAnimation(at: .end)
  }

//  override var intrinsicContentSize: CGSize { .zero }

  @objc func keyboardDidHide() {
    keyboardNotification = nil
    keyboardStatus = .hidden

    animator?.stopAnimation(false)
    animator?.finishAnimation(at: .end)
    self.originalOffset = CGPoint.zero
  }

  var textInputView : YeetTextInputView? {
    guard let reactTag = YeetTextInputView.focusedReactTag else {
      return nil
    }

    guard bridge?.isValid ?? false else {
      return nil
    }

    guard let uiManager = self.bridge?.uiManager else {
      return nil
    }

    guard let textInputView = uiManager.view(forReactTag: reactTag) as? YeetTextInputView else {
      return nil
    }

    guard textInputView.isDescendant(of: self) else {
      return nil
    }

    return textInputView
  }

  var originalOffset = CGPoint.zero
  var isContentCentered : Bool {
    return contentSize.height < (frameLayoutGuide.layoutFrame.height - _defaultContentInset.top - _defaultContentInset.bottom)
  }

  var centeredContentInset : UIEdgeInsets {
    var _inset = _defaultContentInset
    guard isContentCentered else {
      return _inset
    }

    Log.debug("LAYOUT FRAME \(frameLayoutGuide.layoutFrame)")
    Log.debug("CONTENT FRAME \(contentLayoutGuide.layoutFrame)")

    let additional = (frameLayoutGuide.layoutFrame.height - (_defaultContentInset.bottom + _defaultContentInset.top) - contentSize.height) / 2


    _inset.top += additional
    _inset.bottom += additional

    return _inset
  }

  @objc func keyboardWillShow(_ notification: NSNotification) {
    guard isAttached else {
      return
    }

    var offset = self.contentOffset

    var scrollRect = CGRect.zero

    let keyboardNotification = KeyboardNotification(notification)
    let keyboardHeight = keyboardNotification.screenFrameEnd.height

    if let textInput = self.textInputView {
//      offset = CGPoint.zero
//      originalOffset = offset
//      offset.y = (visibleSize.height - keyboardHeight - textInput.superview!.convert(textInput.frame.bottomLeft, to: self.reactView!).y) * -1
      scrollRect = textInput.superview!.convert(textInput.frame, to: self.reactView!).insetBy(dx: .zero, dy: CGFloat(-20))
    }

    keyboardStatus = .showing
    self.keyboardNotification = keyboardNotification


    self.layoutIfNeeded()


    var inset = _defaultContentInset
    let newBottominset = keyboardHeight - centeredContentInset.bottom
    let isContentStillCentered = self.isContentCentered && intrinsicContentSize.height -  inset.top - keyboardHeight > contentSize.height

//    if !isContentStillCentered {
//      inset = centeredContentInset
//    }

    inset.bottom = max(keyboardHeight, inset.bottom)
//    inset.top = 0

    UIView.animate(keyboardNotification, animations: {

      if isContentStillCentered {
//        self.setContentOffset(CGPoint.zero, animated: true)
        self.contentInset = inset
      } else {
        self.contentInset = inset
        self.scrollRectToVisible(scrollRect, animated: true)
      }


//     self.updateSizes()
    }, completion: { _ in
    })
  }

  var contentView = UIView()

  @objc func keyboardWillHide(_ notification: NSNotification) {
    guard isAttached else {
      return
    }

    keyboardStatus = .hiding
    keyboardNotification = KeyboardNotification(notification)

    self.layoutIfNeeded()

     UIView.animate(keyboardNotification!, animations: {
//      self.setContentOffset(self.originalOffset, animated: true)
       self.updateSizes()
       self.layoutIfNeeded()
    }, completion: { _ in
    })
  }


  override var contentSize: CGSize {
    get {
      return super.contentSize
    }

    set (newValue) {
      super.contentSize = newValue
      isScrollEnabled = !isContentCentered
    }
  }

  override func setContentOffset(_ contentOffset: CGPoint, animated: Bool) {
    super.setContentOffset(contentOffset, animated: animated)
    isScrollEnabled = !isContentCentered
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }


  var subviewBoundsObserver: NSObject? = nil

  var _reactSubviews = NSHashTable<UIView>(options: .weakMemory)
  override func reactSubviews() -> [UIView]! {
    return _reactSubviews.allObjects
  }



  override func insertReactSubview(_ subview: UIView!, at atIndex: Int) {
    super.insertReactSubview(subview, at: atIndex)
    _reactSubviews.add(subview)


    updateContentInset()


    subviewBoundsObserver = subview.layer.observe(\CALayer.bounds) { [weak self] layer, changes in
      self?.updateContentInset()
    }

    
  }

  enum KeyboardStatus {
    case hiding
    case hidden
    case showing
    case shown
  }

  var keyboardStatus: KeyboardStatus = .hidden


  override var intrinsicContentSize: CGSize {
    return .zero
  }


  override func didMoveToSuperview() {
    super.didMoveToSuperview()

    if let view = self.superview {
      NSLayoutConstraint.activate([
        frameLayoutGuide.leadingAnchor.constraint(equalTo: view.leadingAnchor),
        frameLayoutGuide.topAnchor.constraint(equalTo: view.topAnchor),
        frameLayoutGuide.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        frameLayoutGuide.bottomAnchor.constraint(equalTo: view.bottomAnchor),
      ])

      updateContentInset()
      isInitialMount = true
    }
  }

  override func removeReactSubview(_ subview: UIView!) {
    super.removeReactSubview(subview)
    _reactSubviews.remove(subview)
    subview.removeFromSuperview()
    subviewBoundsObserver = nil
  }

  override func didUpdateReactSubviews() {
    super.didUpdateReactSubviews()


    if let subview = reactSubviews().first {
      NSLayoutConstraint.activate([
        contentLayoutGuide.leadingAnchor.constraint(equalTo: subview.leadingAnchor),
        contentLayoutGuide.widthAnchor.constraint(equalTo: subview.widthAnchor),
        contentLayoutGuide.trailingAnchor.constraint(equalTo: subview.trailingAnchor),
        contentLayoutGuide.heightAnchor.constraint(equalTo: subview.heightAnchor),
      ])
    }

  }

  var animator : UIViewPropertyAnimator? = nil


  func updateContentInset() {
    guard keyboardStatus == .hidden || keyboardStatus == .hiding else {
      return
    }

    self.contentInset = centeredContentInset
  }

  var isInitialMount = false



  func updateSizes() {
    updateContentInset()
  }

  var reactView : UIView? { reactSubviews()?.first }



  override func layoutSubviews() {
    super.layoutSubviews()

    Log.debug("CONTNET SIZE \(self.contentSize)")



    updateSizes()
  }



  func viewForZooming(in scrollView: UIScrollView) -> UIView? {
    return self.reactSubviews().first
  }

  deinit {
    NotificationCenter.default.removeObserver(
      self,
      name: UIResponder.keyboardWillShowNotification,
      object: nil)
    NotificationCenter.default.removeObserver(
      self,
      name: UIResponder.keyboardDidShowNotification,
      object: nil)
    NotificationCenter.default.removeObserver(
      self,
      name: UIResponder.keyboardWillHideNotification,
      object: nil)
    NotificationCenter.default.removeObserver(
      self,
      name: UIResponder.keyboardDidHideNotification,
      object: nil)
  }
}

