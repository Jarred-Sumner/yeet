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
  @objc(textContainerInset) var textContainerInset: UIEdgeInsets = .zero
  @objc(highlightCornerRadius) var highlightCornerRadius: CGFloat = .zero
  @objc(border) var border: YeetTextBorder = .hidden
  @objc(format) var format: YeetTextFormat = .post
  @objc(attributedText) var attributedText: NSAttributedString? = nil
  @objc(textRect) var textRect: CGRect = .zero
  @objc(template) var template: YeetTextTemplate = .basic
  @objc(strokeWidth) var strokeWidth: CGFloat
  @objc(textColor) var textColor: UIColor? = .white
  @objc(font) var font: UIFont {
    didSet {
      _bolderFont = nil
    }
  }
  @objc(strokeColor) var strokeColor: UIColor
  @objc(highlightInset) var highlightInset: CGFloat

  var isSticker: Bool {
    return [.comment, .sticker].contains(format)
  }

  var showHighlight: Bool {
    if isSticker {
      return [.solid, .highlight, .ellipse, .invert].contains(border)
    } else {
      return [.solid, .stroke].contains(border)
    }
  }

@objc(initWithCopy:)
 init(_ other:YeetTextAttributes) {
   self.textContainerInset = other.textContainerInset
   self.highlightCornerRadius = other.highlightCornerRadius
   self.border = other.border
    self.attributedText = other.attributedText?.copy() as? NSAttributedString

    self.font = other.font.copy() as! UIFont

   self.template = other.template
    self.format = other.format
   self.strokeWidth = other.strokeWidth


   self.strokeColor = other.strokeColor
   self.highlightCornerRadius = other.highlightCornerRadius
   self.highlightInset = other.highlightInset
    super.init()
 }

  var highlightEdgeInsets: UIEdgeInsets {
    return UIEdgeInsets(top: highlightInset, left: highlightInset, bottom: highlightInset, right: highlightInset)
  }

@objc(clone)
 func copy() -> YeetTextAttributes {
    return YeetTextAttributes(self)
 }

  @objc(zero)
  static var zero: YeetTextAttributes {
    return YeetTextAttributes(strokeWidth: .zero, font: .systemFont(ofSize: 17), strokeColor: .clear, highlightInset: 0)
  }

  static public func == (lhs: YeetTextAttributes, rhs: YeetTextAttributes) -> Bool {
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

    guard lhs.font == rhs.font else {
      return false
    }

    guard lhs.strokeColor == rhs.strokeColor else {
      return false
    }

    guard lhs.highlightInset == rhs.highlightInset else {
      return false
    }

    return true
  }


  @objc (initWithTextContainerInset:
    highlightCornerRadius:
    border:
    attributedText:
    template:
    strokeWidth:
    font:
    strokeColor:
    highlightInset:
  )

  init(
    textContainerInset: UIEdgeInsets = .zero,
    highlightCornerRadius: CGFloat = .zero,
    border: YeetTextBorder = .hidden,
    attributedText: NSAttributedString? = nil,
    template: YeetTextTemplate = .basic,
    strokeWidth: CGFloat,
    font: UIFont,
    strokeColor: UIColor,
    highlightInset: CGFloat
  ) {
    self.textContainerInset = textContainerInset
    self.highlightCornerRadius = highlightCornerRadius
    self.border = border
    self.attributedText = attributedText
    self.template = template
    self.strokeWidth = strokeWidth
    self.font = font
    self.strokeColor = strokeColor
    self.highlightCornerRadius = highlightCornerRadius
    self.highlightInset = highlightInset
    super.init()
  }



  @objc(drawHighlightLayer:layout:textContainer:textLayer:)
  func drawHighlight(highlightLayer: CAShapeLayer, layout: YeetTextLayoutManager, textContainer: NSTextContainer, textLayer: CALayer) {
    guard let attributedText = self.attributedText else {
      return
    }

    var result = NSMutableAttributedString(attributedString: attributedText)

    var range = layout.glyphRange(for: textContainer)
    let font = self.font
    let textContainerInset = self.textContainerInset
    let highlightEdgeInsets = self.highlightEdgeInsets
    var hasAddedTrailingHeight = false
    let textColor = self.textColor

    if border == .stroke {
      layout.strokeWidth = strokeWidth
      layout.strokeColor = strokeColor
    } else {
      layout.strokeWidth = .zero
      layout.strokeColor = UIColor.clear
    }



    result.beginEditing()

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
            rect = result.emptySize
          }

          let _bezier = UIBezierPath(rect: rect)

          bezier.append(_bezier)
       }



      bezier.close()

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
      //    } else if border == .stroke {
//      var _range = layout.glyphRange(for: textContainer)
//      Log.debug("""
//        string: \(result.string)
//range: \(range)
//_range: \(_range)
//""")
//      var glyphs: [(CGGlyph, CGPoint, CGRect)] = []
//      var gylphIndices: [Int] = []
//
////      layout.enumerateLineFragments(forGlyphRange: _range) { (rect, usedReact, textContainer, glyphRange, _) in
////
////      }
//
//      for index in _range.location..._range.length {
//        if layout.isValidGlyphIndex(index) {
//          let glyph = layout.cgGlyph(at: index)
//          var point = CGPoint.zero
//          let location = layout.location(forGlyphAt: index)
//          var glyphRect =  layout.lineFragmentUsedRect(forGlyphAt: index, effectiveRange: nil, withoutAdditionalLayout: true)
//          glyphRect = glyphRect.insetBy(dx: .zero, dy: textContainerInset.top)
//          glyphRect = highlightLayer.convert(glyphRect, from: textLayer)
////          glyphRect = glyphRect.inset(by: highlightEdgeInsets.negate)
//
//          point.x = location.x
//          point.y = location.y + glyphRect.y
//          point.y = min(
//            max(glyphRect.topLeft.y, point.y),
//            glyphRect.bottomCenter.y
//          )
//
//          glyphs.append((glyph, point, glyphRect))
//
//        }
//      }
//
//              Log.debug("""
//       glyphs: \(glyphs)
//      """)
//
//      var bezier = UIBezierPath()
//      for (glyph, point, glyphRect) in glyphs {
//
//
//
//        if let cgpath = CTFontCreatePathForGlyph(font as CTFont, glyph, nil) {
//          var flip =  CGAffineTransform.init(translationX: cgpath.boundingBoxOfPath.center.x, y: cgpath.boundingBoxOfPath.center.y).concatenating(
//            CGAffineTransform.init(scaleX: 1, y: -1)).concatenating(CGAffineTransform.init(translationX: cgpath.boundingBoxOfPath.center.x * -1, y: cgpath.boundingBoxOfPath.center.y * -1))
//          var trans = CGAffineTransform.init(translationX: point.x, y: point.y)
//
//          var inverse = CGAffineTransform(translationX: .zero, y: cgpath.boundingBoxOfPath.y + cgpath.boundingBoxOfPath.height)
//          var offset = CGAffineTransform.identity
//
//          let strokeAblePath = cgpath.copy(strokingWithWidth: CGFloat(1), lineCap: .round, lineJoin: .round, miterLimit: 1)
//          let stroker = UIBezierPath(cgPath: strokeAblePath)
//
//          stroker.apply(flip)
//          stroker.apply(inverse)
//          stroker.apply(trans)
//
//
//          if stroker.bounds.y < glyphRect.y && stroker.bounds.height < glyphRect.height {
//            offset = offset.translatedBy(x: .zero, y: glyphRect.y - stroker.bounds.y - highlightInset)
//          } else if stroker.bounds.bottomLeft.y > glyphRect.bottomLeft.y && glyphRect.height > stroker.bounds.height {
//            offset = offset.translatedBy(x: .zero, y: highlightInset)
//          }
//
//          if stroker.bounds.x < glyphRect.x && stroker.bounds.width < glyphRect.width {
//            offset = offset.translatedBy(x: glyphRect.x - stroker.bounds.x - highlightInset, y: .zero)
//         } else if stroker.bounds.topRight.x > glyphRect.topRight.x && glyphRect.width > stroker.bounds.width {
//            offset = offset.translatedBy(x: highlightInset, y: .zero)
//         }
//
//
//
//          stroker.apply(offset)
//          stroker.stroke()
//
//
//           stroker.close()
//          bezier.append(stroker)
//
//
//        }
//      }
//
//
//      bezier.close()
//
//
//      highlightLayer.path = bezier.cgPath
//      highlightLayer.lineWidth = strokeWidth
//      highlightLayer.cornerRadius = .zero
//      highlightLayer.masksToBounds = false
//      highlightLayer.lineJoin = .round
////      highlightLayer.setAffineTransform(CGAffineTransform.init(scaleX: 1 + (highlightInset / bezier.bounds.width), y: (1.0 + (highlightInset / bezier.bounds.height)) * -1 ))
//
//      highlightLayer.strokeColor = strokeColor.cgColor
//      highlightLayer.fillColor = UIColor.clear.cgColor
//    }

//    if border == .stroke {
//      if result.length > 0 {
//        var range = (result.string as NSString).range(of: result.string)
//        var attrs = result.attributes(at: 0, effectiveRange: &range)
//        var needsSetAttributes = false
//
//        if attrs[NSAttributedString.Key.strokeColor] as? UIColor != strokeColor {
//          attrs[NSAttributedString.Key.strokeColor] = strokeColor
//          needsSetAttributes = true
//        }
//
//
//        if let foregroundColor = highlightLayer.fillColor {
//          let _color = UIColor(cgColor: foregroundColor)
//
//          if _color != .clear &&  attrs[NSAttributedString.Key.foregroundColor] as? UIColor != _color {
//            attrs[NSAttributedString.Key.foregroundColor] = _color
//            needsSetAttributes = true
//          }
//        }
//
//
//        let strokeValue = abs(strokeWidth) * -1
//        if attrs[NSAttributedString.Key.strokeWidth] as? CGFloat != strokeValue {
//          attrs[NSAttributedString.Key.strokeWidth] = strokeValue
//          needsSetAttributes = true
//        }
//
//        if attrs[NSAttributedString.Key.font] as? UIFont != bolderFont {
//          attrs[NSAttributedString.Key.font] = bolderFont
//          needsSetAttributes = true
//        }
//
//
//        if needsSetAttributes {
//          result.setAttributes(attrs, range: range)
//        }
//      }
//    } else {
//      let result = NSMutableAttributedString(attributedString: result)
//      if result.length > 0 {
//        var range = (result.string as NSString).range(of: result.string)
//        var attrs = result.attributes(at: 0, effectiveRange: &range)
//
//        var needsChange = false
//
//        if attrs.keys.contains(NSAttributedString.Key.strokeColor) {
//          attrs.removeValue(forKey: NSAttributedString.Key.strokeColor)
//          needsChange = true
//        }
//
//        if attrs.keys.contains(NSAttributedString.Key.strokeWidth) {
//          attrs.removeValue(forKey: NSAttributedString.Key.strokeWidth)
//          needsChange = true
//        }
//
//        if let setFont = attrs[NSAttributedString.Key.font] as? UIFont {
//          if setFont != font {
//            attrs[NSAttributedString.Key.font] = font
//            needsChange = true
//          }
//        }
//
//
//        if needsChange {
//          result.setAttributes(attrs, range: range)
//        }
//
//      }
//    }

    result.fixAttributes(in: result.fullRange)
    result.endEditing()


    if showHighlight {
      if highlightLayer.path?.isEmpty ?? true {
        var _range = range
        var rect = result.emptySize

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

      bezier.close()

      textRect = bezier.bounds
      self.attributedText = result
    } else {
      textRect = highlightLayer.path!.boundingBoxOfPath.inset(by: textContainerInset)
      self.attributedText = result
    }

    if !hasAddedTrailingHeight {
      textRect.size.height += layout.extraLineFragmentRect.height
    }


  }

  func getBolderFont() -> UIFont {
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
  var bolderFont : UIFont {
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

  private func screenSizeOf() -> CGRect {
    return self.boundingRect(with: CGSize(width: UIScreen.main.bounds.width, height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin, .usesFontLeading], context: nil)
  }



  var emptySize : CGRect {
    
      var fullRange = self.fullRange
      let hashValue = HashableStringAttributes(self.attributes(at: 0, effectiveRange: &fullRange)).hashValue
      if let cachedSize =  NSAttributedString.measureCache.object(forKey: NSNumber(value:hashValue))?.cgRectValue {
        return cachedSize
      } else {
        let size = screenSizeOf()
        NSAttributedString.measureCache.setObject(NSValue(cgRect: size), forKey: NSNumber(value:hashValue))
        return size
      }



  }

  var fullRange : NSRange {
    return NSRange(location: 0, length: length)
  }

}
