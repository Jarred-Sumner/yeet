//
//  MediaPlayerViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

@objc(MediaFrameViewManager)
class MediaFrameViewManager: RCTViewManager {

  override static func moduleName() -> String! {
    return "MediaFrameView";
  }

  override func view() -> MediaFrameView? {
   return MediaFrameView()
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }


  @objc(reload:)
  func reload(idk: Any) {
    
  }
}
