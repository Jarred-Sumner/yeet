//
//  SnapContainerViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 2/15/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

import UIKit

@objc(SnapContainerViewManager) class SnapContainerViewManager: RCTViewManager {
  override static func moduleName() -> String! {
    return "SnapContainerView";
  }

  override func view() -> SnapContainerView? {
    return SnapContainerView(bridge: self.bridge)
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
