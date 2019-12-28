// https://stackoverflow.com/questions/48088956/text-background-with-round-corner-like-instagram-does

import CoreGraphics


extension CGPath {

  static func makeUnion(of rects: [CGRect], cornerRadius: CGFloat) -> CGPath {
    let phase2 = AlgorithmPhase2(cornerRadius: cornerRadius)
    _ = AlgorithmPhase1(rects: rects, phase2: phase2)
    return phase2.makePath()
  }
}

extension UITextView {

  static fileprivate let minSize = " ".size(OfFont: UIFont.systemFont(ofSize: UIFont.smallSystemFontSize))

  static func setHighlightPath(textView: UITextView, inset: UIEdgeInsets, radius: CGFloat, highlightLayer: CAShapeLayer, borderType: YeetTextInputView.Border, strokeWidth: CGFloat, strokeColor: UIColor, originalFont: UIFont) {
    let textLayer = textView.layer
    let textContainerInset = textView.textContainerInset

    var layout = textView.layoutManager
  

    let range = NSMakeRange(0, layout.numberOfGlyphs)

    if borderType == .highlight || borderType == .invert {
      var rects = [CGRect]()

      layout.enumerateLineFragments(forGlyphRange: range) { (_, usedRect, _, currentRange, stop) in
        if usedRect.width > 0 && usedRect.height > 0 {
          var rect = usedRect
          if rect.size == .zero {
            rect.size = minSize
          }


          rect.origin.x += textContainerInset.left
          rect.origin.y += textContainerInset.top
          rect = highlightLayer.convert(rect, from: textLayer)
          rect = rect.inset(by: inset)
          rects.append(rect)
        }
      }

      highlightLayer.path = CGPath.makeUnion(of: rects, cornerRadius: radius)
      highlightLayer.cornerRadius = .zero
      highlightLayer.masksToBounds = false
      highlightLayer.lineJoin = .round
      highlightLayer.isHidden = false
      
    } else if borderType == .solid {
      let rect = layout.boundingRect(forGlyphRange: range, in: textView.textContainer).inset(by: inset)
      

      highlightLayer.path = CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil)
      highlightLayer.cornerRadius = 0
      highlightLayer.masksToBounds = false
      highlightLayer.lineJoin = .miter
      highlightLayer.isHidden = false
    } else if borderType == .ellipse {
      let rect = layout.boundingRect(forGlyphRange: range, in: textView.textContainer).inset(by: inset)

      highlightLayer.path = CGPath(ellipseIn: rect, transform: nil)
      highlightLayer.cornerRadius = .zero
      highlightLayer.masksToBounds = false
      highlightLayer.lineJoin = .round
      highlightLayer.isHidden = false
    }

    if borderType == .stroke {
      highlightLayer.isHidden = true

      let newString = NSMutableAttributedString(attributedString: textView.attributedText)
      var typingAttrs = textView.typingAttributes


      if newString.length > 0 {
        var range = (newString.string as NSString).range(of: newString.string)
        var attrs = newString.attributes(at: 0, effectiveRange: &range)
        attrs[NSAttributedString.Key.strokeWidth] = strokeWidth
        attrs[NSAttributedString.Key.strokeColor] = strokeColor

        let currentWeight = originalFont.weight


        var chosenFont = originalFont
        let possibleFonts = originalFont.otherVersions
        for currentFont in possibleFonts {
          if currentFont.weight.rawValue > currentWeight.rawValue && currentFont.isItalic == chosenFont.isItalic {
            chosenFont = currentFont
            break;
          }
        }

        attrs[NSAttributedString.Key.font] = chosenFont

        newString.setAttributes(attrs, range: range)

        textView.attributedText = newString
      }
    } else {
      let newString = NSMutableAttributedString(attributedString: textView.attributedText)
      if newString.length > 0 {
        var range = (newString.string as NSString).range(of: newString.string)
        var attrs = newString.attributes(at: 0, effectiveRange: &range)

        var needsChange = false

        if attrs.keys.contains(NSAttributedString.Key.strokeColor) {
          attrs.removeValue(forKey: NSAttributedString.Key.strokeColor)
          needsChange = true
        }

        if attrs.keys.contains(NSAttributedString.Key.strokeWidth) {
          attrs.removeValue(forKey: NSAttributedString.Key.strokeWidth)
          needsChange = true
        }

        if let setFont = attrs[NSAttributedString.Key.font] as? UIFont {
          if setFont != originalFont {
            attrs[NSAttributedString.Key.font] = originalFont
            needsChange = true
          }
        }


        if needsChange {
          newString.setAttributes(attrs, range: range)
          textView.attributedText = newString
        }

      }
    }


    if [.solid, .highlight, .invert, .ellipse].contains(borderType) {
      if highlightLayer.path?.isEmpty ?? true {
        var rect = CGRect(origin: .zero, size: minSize)
        rect.origin.x += textContainerInset.left
        rect.origin.y += textContainerInset.top
        rect = highlightLayer.convert(rect, from: textLayer)
        rect = rect.inset(by: inset)

        highlightLayer.path = CGPath(rect: rect, transform: nil)
      }
    }

  }
}

fileprivate func swapped<A, B>(_ pair: (A, B)) -> (B, A) { return (pair.1, pair.0) }

fileprivate class AlgorithmPhase1 {

  init(rects: [CGRect], phase2: AlgorithmPhase2) {
    self.phase2 = phase2
    xs = Array(Set(rects.map({ $0.origin.x})).union(rects.map({ $0.origin.x + $0.size.width }))).sorted()
    indexOfX = [CGFloat:Int](uniqueKeysWithValues: xs.enumerated().map(swapped))
    ys = Array(Set(rects.map({ $0.origin.y})).union(rects.map({ $0.origin.y + $0.size.height }))).sorted()
    indexOfY = [CGFloat:Int](uniqueKeysWithValues: ys.enumerated().map(swapped))
    segments.reserveCapacity(2 * ys.count)
    _ = makeSegment(y0: 0, y1: ys.count - 1)

    let sides = (rects.map({ makeSide(direction: .down, rect: $0) }) + rects.map({ makeSide(direction: .up, rect: $0)})).sorted()
    var priorX = 0
    var priorDirection = VerticalDirection.down
    for side in sides {
      if side.x != priorX || side.direction != priorDirection {
        convertStackToPhase2Sides(atX: priorX, direction: priorDirection)
        priorX = side.x
        priorDirection = side.direction
      }
      switch priorDirection {
      case .down:
        pushEmptySegmentsOfSegmentTree(atIndex: 0, thatOverlap: side)
        adjustInsertionCountsOfSegmentTree(atIndex: 0, by: 1, for: side)
      case .up:
        adjustInsertionCountsOfSegmentTree(atIndex: 0, by: -1, for: side)
        pushEmptySegmentsOfSegmentTree(atIndex: 0, thatOverlap: side)
      }
    }
    convertStackToPhase2Sides(atX: priorX, direction: priorDirection)

  }

  private let phase2: AlgorithmPhase2
  private let xs: [CGFloat]
  private let indexOfX: [CGFloat: Int]
  private let ys: [CGFloat]
  private let indexOfY: [CGFloat: Int]
  private var segments: [Segment] = []
  private var stack: [(Int, Int)] = []

  private struct Segment {
    var y0: Int
    var y1: Int
    var insertions = 0
    var status  = Status.empty
    var leftChildIndex: Int?
    var rightChildIndex: Int?

    var mid: Int { return (y0 + y1 + 1) / 2 }

    func withChildrenThatOverlap(_ side: Side, do body: (_ childIndex: Int) -> ()) {
      if side.y0 < mid, let l = leftChildIndex { body(l) }
      if mid < side.y1, let r = rightChildIndex { body(r) }
    }

    init(y0: Int, y1: Int) {
      self.y0 = y0
      self.y1 = y1
    }

    enum Status {
      case empty
      case partial
      case full
    }
  }

  private struct /*Vertical*/Side: Comparable {
    var x: Int
    var direction: VerticalDirection
    var y0: Int
    var y1: Int

    func fullyContains(_ segment: Segment) -> Bool {
      return y0 <= segment.y0 && segment.y1 <= y1
    }

    static func ==(lhs: Side, rhs: Side) -> Bool {
      return lhs.x == rhs.x && lhs.direction == rhs.direction && lhs.y0 == rhs.y0 && lhs.y1 == rhs.y1
    }

    static func <(lhs: Side, rhs: Side) -> Bool {
      if lhs.x < rhs.x { return true }
      if lhs.x > rhs.x { return false }
      if lhs.direction.rawValue < rhs.direction.rawValue { return true }
      if lhs.direction.rawValue > rhs.direction.rawValue { return false }
      if lhs.y0 < rhs.y0 { return true }
      if lhs.y0 > rhs.y0 { return false }
      return lhs.y1 < rhs.y1
    }
  }

  private func makeSegment(y0: Int, y1: Int) -> Int {
    let index = segments.count
    let segment: Segment = Segment(y0: y0, y1: y1)
    segments.append(segment)
    if y1 - y0 > 1 {
      let mid = segment.mid
      segments[index].leftChildIndex = makeSegment(y0: y0, y1: mid)
      segments[index].rightChildIndex = makeSegment(y0: mid, y1: y1)
    }
    return index
  }

  private func adjustInsertionCountsOfSegmentTree(atIndex i: Int, by delta: Int, for side: Side) {
    var segment = segments[i]
    if side.fullyContains(segment) {
      segment.insertions += delta
    } else {
      segment.withChildrenThatOverlap(side) { adjustInsertionCountsOfSegmentTree(atIndex: $0, by: delta, for: side) }
    }

    segment.status = uncachedStatus(of: segment)
    segments[i] = segment
  }

  private func uncachedStatus(of segment: Segment) -> Segment.Status {
    if segment.insertions > 0 { return .full }
    if let l = segment.leftChildIndex, let r = segment.rightChildIndex {
      return segments[l].status == .empty && segments[r].status == .empty ? .empty : .partial
    }
    return .empty
  }

  private func pushEmptySegmentsOfSegmentTree(atIndex i: Int, thatOverlap side: Side) {
    let segment = segments[i]
    switch segment.status {
    case .empty where side.fullyContains(segment):
      if let top = stack.last, segment.y0 == top.1 {
        // segment.y0 == prior segment.y1, so merge.
        stack[stack.count - 1] = (top.0, segment.y1)
      } else {
        stack.append((segment.y0, segment.y1))
      }
    case .partial, .empty:
      segment.withChildrenThatOverlap(side) { pushEmptySegmentsOfSegmentTree(atIndex: $0, thatOverlap: side) }
    case .full: break
    }
  }

  private func makeSide(direction: VerticalDirection, rect: CGRect) -> Side {
    let x: Int
    switch direction {
    case .down: x = indexOfX[rect.minX]!
    case .up: x = indexOfX[rect.maxX]!
    }
    return Side(x: x, direction: direction, y0: indexOfY[rect.minY]!, y1: indexOfY[rect.maxY]!)
  }

  private func convertStackToPhase2Sides(atX x: Int, direction: VerticalDirection) {
    guard stack.count > 0 else { return }
    let gx = xs[x]
    switch direction {
    case .up:
      for (y0, y1) in stack {
        phase2.addVerticalSide(atX: gx, fromY: ys[y0], toY: ys[y1])
      }
    case .down:
      for (y0, y1) in stack {
        phase2.addVerticalSide(atX: gx, fromY: ys[y1], toY: ys[y0])
      }
    }
    stack.removeAll(keepingCapacity: true)
  }

}

fileprivate class AlgorithmPhase2 {

  init(cornerRadius: CGFloat) {
    self.cornerRadius = cornerRadius
  }

  let cornerRadius: CGFloat

  func addVerticalSide(atX x: CGFloat, fromY y0: CGFloat, toY y1: CGFloat) {
    verticalSides.append(VerticalSide(x: x, y0: y0, y1: y1))
  }

  func makePath() -> CGPath {
    verticalSides.sort(by: { (a, b) in
      if a.x < b.x { return true }
      if a.x > b.x { return false }
      return a.y0 < b.y0
    })


    var vertexes: [Vertex] = []
    for (i, side) in verticalSides.enumerated() {
      vertexes.append(Vertex(x: side.x, y0: side.y0, y1: side.y1, sideIndex: i, representsEnd: false))
      vertexes.append(Vertex(x: side.x, y0: side.y1, y1: side.y0, sideIndex: i, representsEnd: true))
    }
    vertexes.sort(by: { (a, b) in
      if a.y0 < b.y0 { return true }
      if a.y0 > b.y0 { return false }
      return a.x < b.x
    })

    for i in stride(from: 0, to: vertexes.count, by: 2) {
      let v0 = vertexes[i]
      let v1 = vertexes[i+1]
      let startSideIndex: Int
      let endSideIndex: Int
      if v0.representsEnd {
        startSideIndex = v0.sideIndex
        endSideIndex = v1.sideIndex
      } else {
        startSideIndex = v1.sideIndex
        endSideIndex = v0.sideIndex
      }
      precondition(verticalSides[startSideIndex].nextIndex == -1)
      verticalSides[startSideIndex].nextIndex = endSideIndex
    }

    let path = CGMutablePath()
    for i in verticalSides.indices where !verticalSides[i].emitted {
      addLoop(startingAtSideIndex: i, to: path)
    }
    return path.copy()!
  }

  private var verticalSides: [VerticalSide] = []

  private struct VerticalSide {
    var x: CGFloat
    var y0: CGFloat
    var y1: CGFloat
    var nextIndex = -1
    var emitted = false

    var isDown: Bool { return y1 < y0 }

    var startPoint: CGPoint { return CGPoint(x: x, y: y0) }
    var midPoint: CGPoint { return CGPoint(x: x, y: 0.5 * (y0 + y1)) }
    var endPoint: CGPoint { return CGPoint(x: x, y: y1) }

    init(x: CGFloat, y0: CGFloat, y1: CGFloat) {
      self.x = x
      self.y0 = y0
      self.y1 = y1
    }
  }

  private struct Vertex {
    var x: CGFloat
    var y0: CGFloat
    var y1: CGFloat
    var sideIndex: Int
    var representsEnd: Bool
  }

  private func addLoop(startingAtSideIndex startIndex: Int, to path: CGMutablePath) {
    var point = verticalSides[startIndex].midPoint
    path.move(to: point)
    var fromIndex = startIndex
    repeat {
      let toIndex = verticalSides[fromIndex].nextIndex
      let horizontalMidpoint = CGPoint(x: 0.5 * (verticalSides[fromIndex].x + verticalSides[toIndex].x), y: verticalSides[fromIndex].y1)
      path.addCorner(from: point, toward: verticalSides[fromIndex].endPoint, to: horizontalMidpoint, maxRadius: cornerRadius)
      let nextPoint = verticalSides[toIndex].midPoint
      path.addCorner(from: horizontalMidpoint, toward: verticalSides[toIndex].startPoint, to: nextPoint, maxRadius: cornerRadius)
      verticalSides[fromIndex].emitted = true
      fromIndex = toIndex
      point = nextPoint
    } while fromIndex != startIndex
    path.closeSubpath()
  }

}

fileprivate extension CGMutablePath {
  func addCorner(from start: CGPoint, toward corner: CGPoint, to end: CGPoint, maxRadius: CGFloat) {
    let radius = min(maxRadius, min(abs(start.x - end.x), abs(start.y - end.y)))
    addArc(tangent1End: corner, tangent2End: end, radius: radius)
  }
}

fileprivate enum VerticalDirection: Int {
  case down = 0
  case up = 1
}


extension String {
    func size(OfFont font: UIFont) -> CGSize {
      return (self as NSString).size(withAttributes: [NSAttributedString.Key.font: font])
    }
}

extension UIEdgeInsets {
  var negate : UIEdgeInsets {
    return UIEdgeInsets.init(top: top * -1, left: left * -1, bottom: bottom * -1, right: right * -1)
  }
}

extension UIFont {
    var weight: UIFont.Weight {
        guard let weightNumber = traits[.weight] as? NSNumber else { return .regular }
        let weightRawValue = CGFloat(weightNumber.doubleValue)
        let weight = UIFont.Weight(rawValue: weightRawValue)
        return weight
    }

    private var traits: [UIFontDescriptor.TraitKey: Any] {
        return fontDescriptor.object(forKey: .traits) as? [UIFontDescriptor.TraitKey: Any]
            ?? [:]
    }

  var isItalic: Bool {
         return fontDescriptor.symbolicTraits.contains(.traitItalic)
     }

  var otherVersions: Array<UIFont> {
    return UIFont.fontNames(forFamilyName: familyName).map { fontName in
      return UIFont(name: fontName, size: self.pointSize)!
    }
  }
}
