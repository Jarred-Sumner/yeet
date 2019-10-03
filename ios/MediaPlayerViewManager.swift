//
//  MediaPlayerViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

@objc(MediaPlayerViewManager)
class MediaPlayerViewManager: RCTViewManager, RCTInvalidating {

  func invalidate() {
    MediaSource.clearCache()
  }

  override static func moduleName() -> String! {
    return "MediaPlayerView";
  }

  override func view() -> MediaPlayer? {
   return MediaPlayer(bridge: self.bridge)
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  func withView(tag: NSNumber, block: @escaping (_ mediaPlayer: MediaPlayer) -> Void) {
     DispatchQueue.main.async { [weak self] in
      if let view = self?.bridge.uiManager.view(forReactTag: tag) {
        block(view as! MediaPlayer)
      }
    }
  }

  @objc(pause:)
  func pause(tag: NSNumber) {
    withView(tag: tag) { [weak self] view in
      view.pause()
    }
  }

  @objc(play:)
  func play(tag: NSNumber) {
    withView(tag: tag) { [weak self] view in
      view.play()
    }
  }

  @objc(goNext:)
  func goNext(tag: NSNumber) {
    withView(tag: tag) { [weak self] view in
      view.goNext()
    }
  }

  @objc(goBack:)
  func goBack(tag: NSNumber) {
    withView(tag: tag) { [weak self] view in
      view.goBack()
    }
  }

  @objc(advance::)
  func advance(tag: NSNumber, index: NSNumber) {
    withView(tag: tag) { [weak self] view in
      view.advance(to: index.intValue)
    }
  }


  
}
