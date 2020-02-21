//
//  YeetScrollViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 2/18/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

import UIKit

@objc(YeetScrollViewManager)
class YeetScrollViewManager: RCTViewManager {
  override static func moduleName() -> String! {
    return "YeetScrollView";
  }

  override func view() -> YeetScrollView? {
    return YeetScrollView(bridge: self.bridge)
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
