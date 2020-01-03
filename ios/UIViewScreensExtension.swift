//
//  UIViewScreensExtension.swift
//  yeet
//
//  Created by Jarred WSumner on 12/31/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

extension UIView {
  var isAttached : Bool { superview != nil && window != nil }
  var isDetached : Bool { superview != nil && window == nil }

    /*
    // Only override draw() if you perform custom drawing.
    // An empty implementation adversely affects performance during animation.
    override func draw(_ rect: CGRect) {
        // Drawing code
    }
    */

}
