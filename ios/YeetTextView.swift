//
//  Yeetswift
//  yeet
//
//  Created by Jarred WSumner on 1/9/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import UIKit

@objc(YeetTextView)
class YeetTextView: _RCTUITextView {
  override required init(frame: CGRect, textContainer: NSTextContainer?) {
    yeetTextAttributes = YeetTextAttributes()
    super.init(frame: frame, textContainer: textContainer)
    self.highlightLayer.isOpaque = false
    self.backgroundColor = .clear

    self.textContainer.lineFragmentPadding = lineFragmentPadding

    highlightLayer.contentsScale = UIScreen.main.scale
    self.highlightLayer.masksToBounds = false
    self.highlightLayer.edgeAntialiasingMask = CAEdgeAntialiasingMask(rawValue: 15)
    self.highlightLayer.allowsEdgeAntialiasing = true
    self.highlightLayer.cornerRadius = YeetTextView.DEFAULT_HIGHLIGHT_CORNER_RADIUS
    self.highlightLayer.lineCap = .round
    self.highlightLayer.lineJoin = .bevel
    self.highlightLayer.fillColor = YeetTextView.DEFAULT_HIGHLIGHT_COLOR.cgColor

    self.isSelectable = true
    self.isScrollEnabled = false
    self.isEditable = false
    clipsToBounds = false
    layer.masksToBounds = false
    
    keyboardAppearance = .dark
    highlightSubview.frame = bounds
    highlightSubview.layer.addSublayer(highlightLayer)
    self.insertSubview(highlightSubview, belowSubview: self.subviews.first!)
  }



  override var intrinsicContentSize: CGSize {
    var size = super.intrinsicContentSize

    if size.height == UIView.noIntrinsicMetric {
      size.height = yeetTextAttributes.textRect.height
    }

    return size
  }


  
  @objc(strokeColor)
  var strokeColor: UIColor {
    get {
      return yeetTextAttributes.strokeColor
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    drawHighlight()
    highlightSubview.isHidden = !yeetTextAttributes.showHighlight
  }


  @objc(isSticker)
  var isSticker : Bool {
    return yeetTextAttributes.isSticker
  }

  

  var highlightSubview = UIView()

  var scale: CGFloat {
    get {
      return textInputView.contentScaleFactor
    }

    set (newValue) {
      for subview in subviews {
        subview.contentScaleFactor = newValue * UIScreen.main.scale

        subview.layer.contentsScale = newValue * UIScreen.main.scale

        for sublayer in subview.layer.sublayers ?? [] {
          sublayer.contentsScale = newValue * UIScreen.main.scale
        }
      }

      textInputView.contentScaleFactor = newValue * UIScreen.main.scale
      highlightLayer.contentsScale = newValue * UIScreen.main.scale
    }

  }


  var parentInputView: YeetTextInputView? {
    return superview as! YeetTextInputView?
  }




 


  var textTemplate: YeetTextTemplate {
    get {
      return self.yeetTextAttributes.template ?? .basic
    }
  }

  var lineFragmentPadding : CGFloat {
    return .zero
  }

    var border: YeetTextBorder {
      get {
        return self.yeetTextAttributes.border ?? .hidden
      }
    }



  @objc(highlightLayer)
  var highlightLayer = CAShapeLayer()

  @objc(highlightColor)
  var highlightColor = YeetTextView.DEFAULT_HIGHLIGHT_COLOR {
    didSet {
      highlightLayer.fillColor = self.highlightColor.cgColor
      self.setNeedsLayout()
    }
  }



  var hasFillColor : Bool {
    return [YeetTextBorder.solid, YeetTextBorder.highlight, YeetTextBorder.invert].contains(border)
  }

  @objc(highlightCornerRadius)
  var highlightCornerRadius : CGFloat {
    get {
      return yeetTextAttributes.highlightCornerRadius
    }
  }

  @objc(strokeWidth)
  var strokeWidth: CGFloat = 0.0 {
    didSet {
      highlightLayer.lineWidth = strokeWidth
      if oldValue != strokeWidth {
        self.textContainer.lineFragmentPadding = lineFragmentPadding
        self.setNeedsLayout()
      }
    }
  }

  @objc(highlightInset)
  var highlightInset : CGFloat {
    get {
      return yeetTextAttributes.highlightInset
    }
  }

  static var DEFAULT_HIGHLIGHT_CORNER_RADIUS = CGFloat(4)
  static var DEFAULT_HIGHLIGHT_INSET = CGFloat(2)
  static var DEFAULT_HIGHLIGHT_COLOR = UIColor.blue

  @objc(yeetTextAttributes)
  var yeetTextAttributes: YeetTextAttributes

  var _layoutManager: YeetTextLayoutManager {
    get {
      return layoutManager as! YeetTextLayoutManager
    }
  }


  override var reactTextAttributes: RCTTextAttributes? {
    get {
      return super.reactTextAttributes
    }

    set (newValue) {
      let oldValue = super.reactTextAttributes
      super.reactTextAttributes = newValue

      if (oldValue != super.reactTextAttributes) {
        self.yeetTextAttributes.textAttributes = super.reactTextAttributes
        self.typingAttributes = self.yeetTextAttributes.effectiveTextAttributes()
        self.setNeedsLayout()
      }
    }

  }


  var isTruncating: Bool {
    var isTruncating = false
    // Make a range that encompases the entire text length.
    let maxRange = textStorage.fullRange
    // Use the layout manager to go through all of its line fragments within the range (entire text because of max range).
    // More in-depth information is available within the NSLayoutManager docs.
    layoutManager.enumerateLineFragments(forGlyphRange: maxRange) { _, _, _, glyphRange, stop in
      // Ask the layout manager to find the range of the truncation glyph (...) within this line fragment

      let truncatedRange = self.layoutManager.truncatedGlyphRange(inLineFragmentForGlyphAt: glyphRange.lowerBound)
      // If the truncatedRange has a valid location that means the layout manager has detected the truncation glyph.
      if truncatedRange.location != NSNotFound {
        isTruncating = true
        // NSLayoutManager uses a point to a boolean to know whether it should continue traversal.
        // Changing `stop` to point to a value of `true` halts the operation.
        stop.pointee = true
      }
    }

    return isTruncating
  }

  var remainingLineCount: NSInteger {
    guard textContainer.maximumNumberOfLines > 1 else {
      return NSIntegerMax
    }

    return textContainer.maximumNumberOfLines - _layoutManager.numberOfLines
  }

  func drawHighlight(_ canSetNeedsLayout: Bool = false) {
    textContainer.lineFragmentPadding = lineFragmentPadding
    highlightLayer.lineWidth = strokeWidth
    highlightLayer.fillColor = highlightColor.cgColor
    highlightLayer.strokeColor = strokeColor.cgColor
    highlightLayer.cornerRadius = highlightCornerRadius

    yeetTextAttributes.textContainerInset = self.textContainerInset
    yeetTextAttributes.textAttributes = self.reactTextAttributes
    yeetTextAttributes.drawHighlight(highlightLayer: highlightLayer, layout: _layoutManager, textContainer: textContainer, textLayer: layer)
  }

  @objc(maxContentWidth)
  var maxContentWidth : CGFloat = .zero

  override func sizeThatFits(_ size: CGSize) -> CGSize {
    guard hasText else {
      return super.sizeThatFits(size)
    }

    yeetTextAttributes.drawHighlight(highlightLayer: highlightLayer, layout: _layoutManager, textContainer: textContainer, textLayer: self.layer)

    return yeetTextAttributes.textRect.size
  }




  deinit {

  }
}



extension UIView {

  static func shake(view: UIView, for duration: TimeInterval = 0.5, withTranslation translation: CGFloat = 10) {
      let propertyAnimator = UIViewPropertyAnimator(duration: duration, dampingRatio: 0.3) {
          view.transform = CGAffineTransform(translationX: translation, y: 0)
      }

      propertyAnimator.addAnimations({
          view.transform = CGAffineTransform(translationX: 0, y: 0)
      }, delayFactor: 0.2)

      propertyAnimator.startAnimation()
  }
}
