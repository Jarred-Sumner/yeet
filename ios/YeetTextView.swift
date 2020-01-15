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


