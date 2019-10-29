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
//    MediaSource.clearCache()
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
      if let _view = (self?.bridge.uiManager.view(forReactTag: tag) as! MediaPlayer?) {
        block(_view)
      }
    }
  }

  @objc (startCachingMediaSources:bounds:contentMode:)
  func startCaching(mediaSources: AnyObject, bounds: CGRect, contentMode: UIView.ContentMode) {
    let _mediaSources = RCTConvert.mediaSourceArray(json: mediaSources)
    YeetImageView.startCaching(mediaSources: _mediaSources, bounds: bounds, contentMode: contentMode)
  }

  @objc (stopCachingMediaSources:bounds:contentMode:)
  func stopCaching(mediaSources: AnyObject, bounds: CGRect, contentMode: UIView.ContentMode) {
    let _mediaSources = RCTConvert.mediaSourceArray(json: mediaSources)
    YeetImageView.stopCaching(mediaSources: _mediaSources, bounds: bounds, contentMode: contentMode)
  }

  @objc (stopCachingAll)
  func stopCachingAll() {
    YeetImageView.stopCaching()
  }
    

  @objc(pause:)
  func pause(tag: NSNumber) {
    withView(tag: tag) { view in
      view.pause()
    }
  }

  @objc(play:)
  func play(tag: NSNumber) {
    withView(tag: tag) { [weak self] view in
      view.play()
    }
  }

  @objc(goNext::)
  func goNext(tag: NSNumber, cb: @escaping RCTResponseSenderBlock) {
    withView(tag: tag) { [weak self] view in
      view.goNext { tracker in
        cb([nil, tracker])
      }
    }
  }

  @objc(goNextWithResolver:::)
  func goNextWithResolver(tag: NSNumber, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    withView(tag: tag) { [weak self] view in
      view.goNext { tracker in
        resolver(tracker)
      }
    }
  }

  @objc(goBack::)
  func goBack(tag: NSNumber, cb: @escaping RCTResponseSenderBlock) {
    withView(tag: tag) { [weak self] view in
      view.goBack { tracker in
        cb([nil, tracker])
      }
    }
  }

  @objc(goBackWithResolver:::)
  func goBackWithResolver(tag: NSNumber, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    withView(tag: tag) { [weak self] view in
      view.goBack { tracker in
        resolver(tracker)
      }
    }
  }

  @objc(advance:index:callback:)
  func advance(_ tag: NSNumber, _ index: NSNumber, _ cb: @escaping RCTResponseSenderBlock) {
    withView(tag: tag) { view in
      view.advance(to: index.intValue) { tracker in
        cb([nil, tracker])
      }
    }
  }

  @objc(advance:index:resolve:rejecter:)
  func advance(_ tag: NSNumber, _ index: NSNumber, _ resolve: @escaping RCTPromiseResolveBlock, _ rejecter: @escaping RCTPromiseRejectBlock) {
     withView(tag: tag) { view in
       view.advance(to: index.intValue) { tracker in
         resolve(tracker)
       }
     }
   }

  @objc(advanceWithFrame:index:resolve:rejecter:)
  func advanceWithFrame(_ tag: NSNumber, _ index: NSNumber, _ resolve: @escaping RCTPromiseResolveBlock, _ rejecter: @escaping RCTPromiseRejectBlock) {
     withView(tag: tag) { view in
      view.advance(to: index.intValue, withFrame: true) { tracker in
         resolve(tracker)
       }
     }
   }


  static let cacheDelegate = MediaPlayerCacheDelegate()
 
}

class MediaPlayerCacheDelegate : NSObject, NSCacheDelegate {
  func cache(_ cache: NSCache<AnyObject, AnyObject>, willEvictObject obj: Any) {
    let mediaSource = obj as! MediaSource

    print("WILL EVICT \(mediaSource.id)")
  }
}
