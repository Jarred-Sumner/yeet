//
//  YeetViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 1/13/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import UIKit

@objc(YeetViewManager)
class YeetViewManager: RCTViewManager {
  override static func moduleName() -> String! {
    return "YeetView";
  }

  override func view() -> YeetView? {
    return YeetView()
  }

  @objc(requiresMainQueueSetup)
  static override func requiresMainQueueSetup() -> Bool {
    return false
  }
}
