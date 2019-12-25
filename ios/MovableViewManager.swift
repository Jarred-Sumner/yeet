//
//  MovableViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 12/23/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

@objc(MovableViewManager)
class MovableViewManager: RCTViewManager {

    override static func moduleName() -> String! {
      return "MovableView";
    }

    override func view() -> MovableView? {
      return MovableView(bridge: self.bridge)
    }

    @objc
    override static func requiresMainQueueSetup() -> Bool {
      return true
    }
}
