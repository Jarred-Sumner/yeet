//
//  MediaSourceObserver.swift
//  yeet
//
//  Created by Jarred WSumner on 10/3/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

protocol TrackableMediaSource {
  func play()
  func pause()
  func restart()

  func onProgress(mediaSource: MediaSource, elapsed: CMTime, loopCount: Int, totalElapsed: Int)
  func onLoad(mediaSource: MediaSource)
  func onError(mediaSource: MediaSource, error: Error?)
  func onEnd(mediaSource: MediaSource)
}

class TrackableVideoSource : NSObject, TrackableMediaSource {

}

class TrackableImageSource: NSObject, TrackableMediaSource {
  
}

