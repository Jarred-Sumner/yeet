//
//  YeetColorSlider.swift
//  yeet
//
//  Created by Jarred WSumner on 12/9/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit
import ColorSlider

@objc (YeetColorSliderView)
class YeetColorSliderView: UIView {
  var colorSlider : ColorSlider = ColorSlider(orientation: .vertical, previewSide: .left)
  var textColorObserver : NSKeyValueObservation? = nil

  @objc (onChange) var onChange: RCTBubblingEventBlock? = nil
  @objc (onCancel) var onCancel: RCTBubblingEventBlock? = nil
  @objc (onPress) var onPress: RCTBubblingEventBlock? = nil
  @objc (inputRef) var inputRef: NSNumber? = nil {
    didSet (newValue) {
      textColorObserver?.invalidate()

      if newValue != nil {
        guard let textInput = self.textInput else {
          return
        }

        textColorObserver = textInput.textView.observe(\UITextView.textColor) { textView, _ in
          self.colorSlider.color = textView.textColor ?? .white
        }
      }
    }
  }
  @objc (colorType) var colorType: String? = "textColor"


  var bridge: RCTBridge? = nil

  @objc(color) var color: UIColor {
    get {
      return self.colorSlider.color
    }

    set (newValue) {
      self.colorSlider.color = newValue
    }
  }

  init(bridge: RCTBridge) {
    self.bridge = bridge
    super.init(frame: .zero)


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


    guard let textInput = self.textInput else {
      return
    }

    guard let textAttributes = textInput.textAttributes else {
      return
    }

    let _textAttributes = textAttributes.copy(with: nil) as! RCTTextAttributes


    _textAttributes.foregroundColor = colorSlider.color
    textInput.textView.textColor = _textAttributes.effectiveForegroundColor()
  }

  var textInput: YeetTextInputView? {
    guard let inputRef = self.inputRef else {
      return nil
    }

    return self.bridge?.uiManager?.view(forReactTag: inputRef) as? YeetTextInputView
  }

  @objc(handleCancel:)
  func handleCancel(_ colorSlider: ColorSlider) {
    guard let textInput = self.textInput else {
      return
    }

    guard let textAttributes = textInput.textAttributes else {
      return
    }

    textInput.textView.textColor = textAttributes.effectiveForegroundColor()

    onCancel?(["color": textInput.textView.textColor])


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

    colorSlider.frame = bounds
    colorSlider.bounds = bounds
  }



}
