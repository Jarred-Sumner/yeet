//
//  YeetColorSliderManager.swift
//  yeet
//
//  Created by Jarred WSumner on 12/9/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

@objc(YeetColorSliderViewManager)
class YeetColorSliderViewManager: RCTViewManager {
  override static func moduleName() -> String! {
    return "YeetColorSliderView";
  }

  override func view() -> YeetColorSliderView? {
   return YeetColorSliderView(bridge: self.bridge)
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  func withView(tag: NSNumber, block: @escaping (_ mediaPlayer: MediaPlayer) -> Void) {
    DispatchQueue.main.async { [weak self] in
      if let _view = (self?.bridge.uiManager.view(forReactTag: tag) as! MediaPlayer?) {
        block(_view)
      }
    }
  }
}
