
public struct KeyboardNotification {

    let notification: NSNotification
    let userInfo: NSDictionary

    /// Initializer
    ///
    /// :param: notification Keyboard-related notification
    public init(_ notification: NSNotification) {
        self.notification = notification
        if let userInfo = notification.userInfo {
          self.userInfo = userInfo as NSDictionary
        }
        else {
            self.userInfo = NSDictionary()
        }
    }

    /// Start frame of the keyboard in screen coordinates
    public var screenFrameBegin: CGRect {
      if let value = userInfo[UIResponder.keyboardFrameBeginUserInfoKey] as? NSValue {
            return value.cgRectValue
        }
        else {
        return CGRect.zero
        }
    }

    /// End frame of the keyboard in screen coordinates
    public var screenFrameEnd: CGRect {
      if let value = userInfo[UIResponder.keyboardFrameEndUserInfoKey] as? NSValue {
            return value.cgRectValue
        }
        else {
        return CGRect.zero
        }
    }

    /// Keyboard animation duration
    public var animationDuration: Double {
      if let number = userInfo[UIResponder.keyboardAnimationDurationUserInfoKey] as? NSNumber {
            return number.doubleValue
        }
        else {
            return 0.25
        }
    }

    /// Keyboard animation curve
    ///
    /// Note that the value returned by this method may not correspond to a
    /// UIViewAnimationCurve enum value.  For example, in iOS 7 and iOS 8,
    /// this returns the value 7.
    public var animationCurve: Int {
      if let number = userInfo[UIResponder.keyboardAnimationCurveUserInfoKey] as? NSNumber {
        return number.intValue
        }
      return UIView.AnimationCurve.easeInOut.rawValue
    }

    /// Start frame of the keyboard in coordinates of specified view
    ///
    /// :param: view UIView to whose coordinate system the frame will be converted
    /// :returns: frame rectangle in view's coordinate system
    public func frameBeginForView(view: UIView) -> CGRect {
      return view.convert(screenFrameBegin, from: view.window)
    }

    /// End frame of the keyboard in coordinates of specified view
    ///
    /// :param: view UIView to whose coordinate system the frame will be converted
    /// :returns: frame rectangle in view's coordinate system
    public func frameEndForView(view: UIView) -> CGRect {
      return view.convert(screenFrameEnd, from: view.window)
    }
}

extension UIView {
  static func animate(_ n: KeyboardNotification, animations: @escaping () -> Void, completion: @escaping (_ finished: Bool) -> Void) {
    var opts = UIView.AnimationOptions(rawValue: UInt(n.animationCurve << 16))
    opts.insert(.allowUserInteraction)
    opts.insert(.layoutSubviews)
    opts.insert(.beginFromCurrentState)

    UIView.animate(withDuration: n.animationDuration,
      delay: 0,
      options: opts,
      animations: animations,
      completion: completion
    )
  }
}
