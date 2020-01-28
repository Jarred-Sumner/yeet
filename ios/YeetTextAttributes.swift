//
//  YeetTextAttributes.swift
//  yeet
//
//  Created by Jarred WSumner on 1/9/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import UIKit



@objc(YeetTextAttributes)
class YeetTextAttributes : NSObject {
  @objc(textAttributes) var textAttributes: RCTTextAttributes? = nil
  @objc(textContainerInset) var textContainerInset: UIEdgeInsets = .zero
  @objc(highlightCornerRadius) var highlightCornerRadius: CGFloat = .zero
  @objc(border) var border: YeetTextBorder = .hidden
  @objc(format) var format: YeetTextFormat = .post

  @objc(textRect) var textRect: CGRect = .zero
  @objc(template) var template: YeetTextTemplate = .basic
  @objc(strokeWidth) var strokeWidth: CGFloat = .zero

  @objc(strokeColor) var strokeColor: UIColor = .clear
  @objc(highlightInset) var highlightInset: CGFloat = .zero

  var isSticker: Bool {
    return [.comment, .sticker].contains(format)
  }

  var showHighlight: Bool {
    if isSticker {
      return [.solid, .highlight, .ellipse, .invert].contains(border)
    } else {
      return [.solid].contains(border)
    }
  }

  @objc(init)
  override init() {
    strokeWidth = .zero
    strokeColor = UIColor.clear
    super.init()
  }

@objc(initWithCopy:)
  init(other: YeetTextAttributes) {
    super.init()
  self.apply(other)
 }

  var highlightEdgeInsets: UIEdgeInsets {
    return UIEdgeInsets(top: highlightInset, left: highlightInset, bottom: highlightInset, right: highlightInset)
  }

  @objc(effectiveTextAttributes)
  func effectiveTextAttributes() -> [NSAttributedString.Key : Any] {
    var attrs = textAttributes?.effectiveTextAttributes() ?? [:]

    if baselineOffset != .zero {
      attrs[.baselineOffset] = baselineOffset
    }

    return attrs
  }

  @objc(apply:)
  func apply(_ other: YeetTextAttributes) {
    if let textAttributes = other.textAttributes {
      self.textAttributes?.apply(textAttributes)
    }

    self.textRect = other.textRect
    self.textContainerInset = other.textContainerInset
    self.highlightCornerRadius = other.highlightCornerRadius
    self.border = other.border
    self.template = other.template
    self.format = other.format
    self.strokeWidth = other.strokeWidth
    self.strokeColor = other.strokeColor
    self.highlightCornerRadius = other.highlightCornerRadius
    self.highlightInset = other.highlightInset

  }

  func copy(with zone: NSZone? = nil) -> Any {
    return YeetTextAttributes(other: self)
  }

  override func copy() -> Any {
    return YeetTextAttributes(other: self)
  } 


  @objc(zero)
  static var zero: YeetTextAttributes {
    return YeetTextAttributes.init()
  }

  static public func == (lhs: YeetTextAttributes, rhs: YeetTextAttributes) -> Bool {
    return lhs.isEqual(rhs)
  }

  @objc(baselineOffset)
  var baselineOffset: CGFloat {
    if template == .bigWords {
      return abs(strokeWidth) * 2 * -1
    } else {
      return .zero
    }
  }

  var emptySizeString: NSAttributedString {
    return NSAttributedString(string: "I", attributes: effectiveTextAttributes())
  }

  var emptySize : CGRect {
    let hash = HashableStringAttributes(effectiveTextAttributes()).hashValue

    if let cachedSize = NSAttributedString.measureCache.object(forKey: NSNumber(value:hash))?.cgRectValue {
      return cachedSize
    } else {
      let size = emptySizeString.screenSizeOf()
      NSAttributedString.measureCache.setObject(NSValue(cgRect: size), forKey: NSNumber(value:hash))
      return size
    }
  }

  override func isEqual(_ _rhs: Any?) -> Bool {
    if let rhs = _rhs as? YeetTextAttributes {
      let lhs = self

      guard lhs.textAttributes?.isEqual(rhs.textAttributes) ?? false else {
        return false
      }

      guard lhs.textContainerInset == rhs.textContainerInset else {
        return false
      }

      guard lhs.highlightCornerRadius == rhs.highlightCornerRadius else {
        return false
      }

      guard lhs.border == rhs.border else {
        return false
      }

      guard lhs.template == rhs.template else {
        return false
      }

      guard lhs.strokeWidth == rhs.strokeWidth else {
        return false
      }

      guard lhs.strokeColor == rhs.strokeColor else {
        return false
      }

      guard lhs.highlightInset == rhs.highlightInset else {
        return false
      }

      return true
    } else {
      return super.isEqual(_rhs)
    }
  }

  

  @objc(drawHighlightLayer:layout:textContainer:textLayer:)
  func drawHighlight(highlightLayer: CAShapeLayer, layout: YeetTextLayoutManager, textContainer: NSTextContainer, textLayer: CALayer) {
    var range = layout.glyphRange(for: textContainer)

    let textContainerInset = self.textContainerInset
    let highlightEdgeInsets = self.highlightEdgeInsets
    var hasAddedTrailingHeight = false

    
    if border == .stroke {
      layout.strokeWidth = strokeWidth
      layout.strokeColor = strokeColor
    } else {
      layout.strokeWidth = .zero
      layout.strokeColor = UIColor.clear
    }

    if border == .highlight || border == .invert {
      var rects = [CGRect]()

      layout.enumerateLineFragments(forGlyphRange: range) { (_, usedRect, _, currentRange, stop) in
        var rect = usedRect
        if rect.size == .zero {
          return
        }

        rect = rect.inset(by: textContainerInset)
        rect = highlightLayer.convert(rect, from: textLayer)
        rect = rect.inset(by: highlightEdgeInsets)
        rects.append(rect)
      }

      highlightLayer.path = CGPath.makeUnion(of: rects, cornerRadius: highlightCornerRadius)

      highlightLayer.cornerRadius = .zero
      highlightLayer.masksToBounds = false
      highlightLayer.lineJoin = .round

      highlightLayer.lineWidth = .zero
      highlightLayer.strokeColor = UIColor.clear.cgColor

    } else if border == .solid {
       let bezier = UIBezierPath()

       layout.enumerateLineFragments(forGlyphRange: range) { (_, usedRect, _, currentRange, stop) in
          var rect = usedRect
          if rect.height == .zero || rect.width == .zero {
            var _range = range
            rect = self.emptySize
          }

          let _bezier = UIBezierPath(rect: rect)

          bezier.append(_bezier)
       }


      var bounds = bezier.bounds
      bounds.size.height += layout.extraLineFragmentRect.height
      hasAddedTrailingHeight = true
      bounds = bounds.inset(by: textContainerInset)
      bounds = highlightLayer.convert(bounds, from: textLayer)
      bounds = bounds.inset(by: highlightEdgeInsets)

      highlightLayer.path = CGPath(roundedRect: bounds, cornerWidth: highlightCornerRadius, cornerHeight: highlightCornerRadius, transform: nil)
      highlightLayer.cornerRadius = 0
      highlightLayer.masksToBounds = false
      highlightLayer.strokeColor = strokeColor.cgColor
      highlightLayer.strokeColor = strokeColor.cgColor
      highlightLayer.lineWidth = strokeWidth
      highlightLayer.lineJoin = .miter


    } else if border == .ellipse {
      let rect = layout.boundingRect(forGlyphRange: range, in: textContainer)

      highlightLayer.path = CGPath(ellipseIn: rect, transform: nil)
      highlightLayer.cornerRadius = .zero
      highlightLayer.masksToBounds = false
      highlightLayer.lineJoin = .round

      highlightLayer.lineWidth = .zero
      highlightLayer.strokeColor = UIColor.clear.cgColor
    }


    if showHighlight {
      if highlightLayer.path?.isEmpty ?? true {
        var _range = range
        var rect = self.emptySize

        rect.origin.x += textContainerInset.left
        rect.origin.y += textContainerInset.top
        rect.width += textContainerInset.right
        rect.height += textContainerInset.bottom
        rect = highlightLayer.convert(rect, from: textLayer)
        rect = rect.insetBy(dx: highlightInset, dy: highlightInset)

        highlightLayer.path = CGPath(rect: rect, transform: nil)
      }
    }

    if !showHighlight {
      let bezier = UIBezierPath()

       layout.enumerateLineFragments(forGlyphRange: range) { (_, usedRect, _, currentRange, stop) in
          var rect = usedRect

          rect = rect.inset(by: textContainerInset)
          rect = highlightLayer.convert(rect, from: textLayer)
          rect = rect.inset(by: highlightEdgeInsets)

          let _bezier = UIBezierPath(rect: rect)
          bezier.append(_bezier)

       }

      textRect = bezier.bounds
    } else {
      textRect = highlightLayer.path!.boundingBoxOfPath.inset(by: textContainerInset)
    }

    if !hasAddedTrailingHeight {
      let extraHeight = layout.extraLineFragmentRect.height

      if extraHeight > .zero {
        textRect.size.height += layout.extraLineFragmentRect.height - baselineOffset
      }
    }
  }

  func effectiveFont() -> UIFont? {
    return textAttributes?.effectiveFont()
  }

  func getBolderFont() -> UIFont? {
    guard let font = effectiveFont() else {
      return nil
    }

    let currentWeight = font.weight
    var chosenFont = font
    let possibleFonts = font.otherVersions
    for currentFont in possibleFonts {
      if currentFont.weight.rawValue > currentWeight.rawValue && currentFont.isItalic == chosenFont.isItalic {
        return currentFont.withSize(font.pointSize * 1.25)
      }
    }

    return font
  }

  var _bolderFont: UIFont? = nil
  var bolderFont : UIFont? {
    guard let font = _bolderFont else {
      let bolder = getBolderFont()
      _bolderFont = bolder

      return bolder
    }

    return font
  }
}

struct HashableStringAttributes : Hashable {
  let foregroundColor: UIColor?
  let backgroundColor: UIColor?
  let strokeColor: UIColor?
  let lineHeight: CGFloat?
  let strokeWidth: CGFloat?
  let font: UIFont?
  let shadow: NSShadow?

  init(_ attrs: [NSAttributedString.Key: Any]) {
    foregroundColor = attrs[.foregroundColor] as! UIColor?
    backgroundColor = attrs[.backgroundColor] as! UIColor?
    strokeColor = attrs[.strokeColor] as! UIColor?
    strokeWidth = attrs[.strokeWidth] as! CGFloat?
    lineHeight = attrs[.baselineOffset] as! CGFloat?
    font = attrs[.font] as! UIFont?
    shadow = attrs[.shadow] as! NSShadow?
  }

  func hash(into hasher: inout Hasher) {
    hasher.combine(foregroundColor)
    hasher.combine(backgroundColor)
    hasher.combine(strokeColor)
    hasher.combine(strokeWidth)
    hasher.combine(font)
    hasher.combine(shadow)
    hasher.combine(lineHeight)
  }
}

extension NSAttributedString {
  static fileprivate var measureCache = NSCache<NSNumber, NSValue>()

  func screenSizeOf() -> CGRect {
    return self.boundingRect(with: CGSize(width: UIScreen.main.bounds.width, height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin, .usesFontLeading], context: nil)
  }


  var fullRange : NSRange {
    return NSRange(location: 0, length: length)
  }

}

extension NSRange {
  var isEmpty: Bool {
    return location == 0 && length == 0
  }
}


