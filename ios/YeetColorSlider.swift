//
//  YeetColorSlider.swift
//  yeet
//
//  Created by Jarred WSumner on 12/9/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit
import ColorSlider
import Foundation


@objc (YeetColorSliderView)
class YeetColorSliderView: UIView {
  var colorSlider : ColorSlider = ColorSlider(orientation: .vertical, previewSide: .left)
  var textColorObserver : NSKeyValueObservation? = nil

  @objc (onChange) var onChange: RCTBubblingEventBlock? = nil
  @objc (onCancel) var onCancel: RCTBubblingEventBlock? = nil
  @objc (onPress) var onPress: RCTBubblingEventBlock? = nil
  @objc (inputRef) var inputRef: NSNumber? = nil {
    willSet (newValue) {
      textColorObserver?.invalidate()
    }
  }
  @objc (colorType) var colorType: String? = "textColor"


  var bridge: RCTBridge? = nil

  @objc(color) var color: UIColor = .black

  override func didSetProps(_ changedProps: [String]!) {

    if changedProps.contains("color") {
      DispatchQueue.main.async { [weak self] in
        guard let color = self?.color else {
          return
        }

        guard let colorSlider = self?.colorSlider else {
          return
        }



        colorSlider.color = color
      }
    }

  }

  init(bridge: RCTBridge) {
    self.bridge = bridge
    super.init(frame: .zero)
    isUserInteractionEnabled = true

//    colorSlider.gradientView.whiteInset = 0.2
//    colorSlider.gradientView.blackInset = 0.2
    colorSlider.addTarget(self, action: #selector(YeetColorSliderView.handleChange(_:)), for: .valueChanged)
    colorSlider.addTarget(self, action: #selector(YeetColorSliderView.handlePress(_:)), for: .touchUpInside)
    colorSlider.addTarget(self, action: #selector(YeetColorSliderView.handleCancel(_:)), for: .touchCancel)


    self.addSubview(colorSlider)
    
  }

  override init(frame: CGRect) {
    super.init(frame: frame)
  }

  @objc(handleChange:)
  func handleChange(_ colorSlider: ColorSlider) {
    onChange?(["color": colorSlider.color.rgbaString])
  }

  var textInput: YeetTextInputView? {
    guard let inputRef = self.inputRef else {
      return nil
    }

    return self.bridge?.uiManager?.view(forReactTag: inputRef) as? YeetTextInputView
  }

  @objc(handleCancel:)
  func handleCancel(_ colorSlider: ColorSlider) {
    onPress?(["color": colorSlider.color.rgbaString])
  }

  @objc(handlePressDown:)
  func handlePress(_ colorSlider: ColorSlider) {
    onPress?(["color": colorSlider.color.rgbaString])
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }


  override func layoutSubviews() {
    super.layoutSubviews()

    colorSlider.frame = reactContentFrame
    colorSlider.bounds = CGRect(origin: .zero, size: reactContentFrame.size)
  }

  var tappableArea : CGRect {
    let inset = reactCompoundInsets.negate

    return CGRect(
      origin: .zero,
      size: superview!.bounds.size
    ).inset(by: inset)
  }

  override public func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let convertedPoint = colorSlider.convert(point, from: self)

    return colorSlider.hitTest(convertedPoint, with: event)
  }
}



extension ColorSlider {
  /// Increase the tappable area of `ColorSlider` to a minimum of 44 points on either edge.
  override public func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    // If hidden, don't customize behavior
    guard !isHidden else { return super.hitTest(point, with: event) }

    // Determine the delta between the width / height and 44, the iOS HIG minimum tap target size.
    // If a side is already longer than 44, add 10 points of padding to either side of the slider along that axis.
    let minimumSideLength: CGFloat = 44
    let padding: CGFloat = -100
    let dx: CGFloat = padding
    let dy: CGFloat = padding

    // If an increased tappable area is needed, respond appropriately
    let increasedTapAreaNeeded = (dx < 0 || dy < 0)
    let expandedBounds = bounds.insetBy(dx: dx / 2, dy: dy / 2)

    if increasedTapAreaNeeded && expandedBounds.contains(point) {
      for subview in subviews.reversed() {
        let convertedPoint = subview.convert(point, from: self)
        if let hitTestView = subview.hitTest(convertedPoint, with: event) {
          return hitTestView
        }
      }
      return self
    } else {
      return super.hitTest(point, with: event)
    }
  }
}
