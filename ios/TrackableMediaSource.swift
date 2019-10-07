//
//  MediaSourceObserver.swift
//  yeet
//
//  Created by Jarred WSumner on 10/3/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import Repeat
import Nuke
import AVFoundation
import MulticastDelegateSwift

protocol TrackableMediaSourceDelegate {
  func onChangeStatus(status: TrackableMediaSource.Status, oldStatus: TrackableMediaSource.Status, mediaSource: TrackableMediaSource)
  func onMediaProgress(elapsed: Double, mediaSource: TrackableMediaSource)
}

class TrackableMediaSource : NSObject {
  static let periodicInterval = 0.15
  var delegate = MulticastDelegate<TrackableMediaSourceDelegate>()
  typealias onLoadCallback = (_ tracker: TrackableMediaSource) -> Void
  var isActive = false
  var hasLoaded = false

  let mediaSource: MediaSource
  open var alwaysLoop: Bool = false
  enum Status : String {
    case pending = "pending"
    case loading = "loading"
    case loaded = "loaded"
    case ready = "ready"
    case playing = "playing"
    case paused = "paused"
    case ended = "ended"
    case error = "error"
  }

  var assetDuration : Double {
    get {
      return mediaSource.duration.doubleValue
    }
  }

  var duration : Double {
    get {
      return mediaSource.playDuration.doubleValue
    }
  }

  var _onLoadCallbacks: Array<onLoadCallback?> = []


  var status: Status = Status.pending {
    didSet {
      if (oldValue != status) {

        self.delegate.invokeDelegates { [weak self] delegate in
          guard let this = self else {
            return
          }

          guard let status = self?.status else {
            return
          }

          guard let mediaSource = self?.mediaSource else {
            return
          }

          delegate.onChangeStatus(status: status,  oldStatus:  oldValue, mediaSource: this)
        }

      }
    }
  }

  init(mediaSource: MediaSource) {
    self.mediaSource = mediaSource
  }

  open func play() {
    self.status = .playing
  }

  open func pause() {
    self.status = .paused
  }

  open var canPlay: Bool {
    return isActive && hasLoaded
  }

  open func start() {

  }

  open func reset() {

  }

  open func prepare() {}


  open func load(onLoad: onLoadCallback? = nil) {
    guard !hasLoaded else {
      onLoad?(self)
      return
    }

    _onLoadCallbacks.append(onLoad)
    self.status = .loading
  }

  func stop() {
  }

  
  public func onProgress(elapsed: CMTime) {
    self.delegate.invokeDelegates { [weak self] delegate in
      guard let this = self else {
        return
      }

      delegate.onMediaProgress(elapsed: CMTimeGetSeconds(elapsed), mediaSource: this)
    }
  }

  public func onLoad() {
    self.hasLoaded = true

    _onLoadCallbacks.forEach { [weak self] cb in
      guard let this = self else {
        return
      }
      cb?(this)
    }

    _onLoadCallbacks = []
    self.status = .loaded
  }

  public func onError(error: Error?) {

  }

  public func onEnd() {
    if self.alwaysLoop {
      self.reset()
      self.play()
    } else {
      self.status = .ended
    }
  }

  deinit {
    stop()
  }
}
