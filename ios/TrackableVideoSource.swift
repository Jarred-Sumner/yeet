//
//  TrackableVideoSource.swift
//  yeet
//
//  Created by Jarred WSumner on 10/4/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import AVFoundation
import SwiftyBeaver

class TrackableVideoSource : TrackableMediaSource {
  var _player: AVPlayer
  var player: AVPlayer {
    get {
      return _player
    }

    set(newValue) {
      if (newValue == _player) {
        return
      }

      let hadPlayerItemInside = self.playerItem != nil && _player.currentItem == self.playerItem!

      let restartObservers = newValue !== _player && isObserving
      if restartObservers {
        stopObservers()
      }



      _player = player

      if restartObservers {
        startObservers()
      }

      if hadPlayerItemInside {
        _player.replaceCurrentItem(with: nil)
      }

      if canPlay  {
        self.start()
      }
    }
  }
  var boundaryObserverToken: Any? = nil
  var periodicObserverToken: Any? = nil

  init(mediaSource: MediaSource, player: AVPlayer) {
    _player = player


    super.init(mediaSource: mediaSource)
  }

  func addBoundaryTimeObserver() {
    let timeScale = CMTimeScale(NSEC_PER_SEC)
    let times = [NSValue(time: CMTimeMakeWithSeconds(duration, preferredTimescale: timeScale))]

    boundaryObserverToken = player
      .addBoundaryTimeObserver(forTimes: times, queue: .main) { [weak self] in
        guard self?.player.currentItem == self?.playerItem else {
          return
        }

        self?.handleEnd()
    }
  }

  private func addPeroidicObserver() {
    let timeScale = CMTimeScale(NSEC_PER_SEC)
    let time = CMTime(seconds: TrackableVideoSource.periodicInterval, preferredTimescale: timeScale)

     periodicObserverToken = player
      .addPeriodicTimeObserver(
        forInterval: time,
        queue: .main) { [weak self] progress in
          guard self?.player.currentItem == self?.playerItem else {
            return
          }
          self?.onProgress(elapsed: progress)
    }
  }

  var playerItem : AVPlayerItem? {
    get {
      return mediaSource.playerItem
    }

    set (newValue) {
      mediaSource.playerItem = newValue
    }
  }


  

  var isAlreadyLoading = false
  override func load(onLoad callback: onLoadCallback? = nil) {
    if mediaSource.assetStatus == .loaded {
      self.hasLoaded = true
      self.isAlreadyLoading = false
      self.handleLoad(asset: mediaSource.asset!)
      callback?(self)
      return
    }

    self.hasLoaded = self.playerItem != nil
    super.load(onLoad: callback)

    guard !isAlreadyLoading else {
      return
    }

    if self.playerItem == nil {
      self.status = .loading



      mediaSource.loadAsset { [weak self] asset in
        guard let asset = asset else {
          self?.status = .error
          return
        }

        guard let this = self else {
          return
        }

        this.handleLoad(asset: asset)
      }

      self.isAlreadyLoading = true
    }
  }

  func handleLoad(asset: AVURLAsset) {
    self.isAlreadyLoading = false
    let playerItem = AVPlayerItem(asset: asset, automaticallyLoadedAssetKeys: ["duration", "tracks", "playable"])
    self.playerItem = playerItem
    self.hasLoaded = true
    self.onLoad()
  }

  override func prepare() {
    super.prepare()
    if playerItem == player.currentItem && playerItem != nil && player.status == .readyToPlay && mediaSource.isMP4 {
      player.preroll(atRate: 1.0, completionHandler: nil)
    }
  }

  var isObserving: Bool {
    return self.periodicObserverToken != nil || self.boundaryObserverToken != nil
  }

  override var canPlay: Bool {
    return super.canPlay && self.playerItem != nil && self.playerItem == player.currentItem
  }

  func startObservers() {
    stopObservers()

    guard let playerItem = self.playerItem else {
      return
    }

    self.addPeroidicObserver()
    self.addBoundaryTimeObserver()

    NotificationCenter.default.addObserver(self, selector: #selector(handlePlayerItemReachedEnd(notification:)), name:NSNotification.Name.AVPlayerItemDidPlayToEndTime, object: playerItem)
    NotificationCenter.default.addObserver(self, selector: #selector(handlePlayerItemStalled(notification:)), name:NSNotification.Name.AVPlayerItemPlaybackStalled, object: playerItem)
  }

  func stopObservers() {
     NotificationCenter.default.removeObserver(self)

    if let periodicObserver = self.periodicObserverToken {
      player.removeTimeObserver(periodicObserver)
      self.periodicObserverToken = nil
    }

    if let boundaryObserver = self.boundaryObserverToken {
      player.removeTimeObserver(boundaryObserver)
      self.boundaryObserverToken = nil
    }
  }

  override func onLoad() {
    guard self.playerItem != nil else {
      self.status = .error
      return
    }

    startObservers()

    super.onLoad()
  }

  override func start() {
    super.start()
    if !isActive {
      return
    }

    guard let playerItem = self.playerItem else {
      self.status = .error
       return
     }

    if !isObserving {
      startObservers()
    }

    if player.currentItem != playerItem {
      player.replaceCurrentItem(with: playerItem)
      player.seek(to: .zero)

//      player.seek(to: .zero)
      
      self.status = .ready
    }

  }

  override func play() {
    guard canPlay else {
      SwiftyBeaver.warning("[TrackableVideoSource] \(mediaSource.id) Tried to play before being ready")
      return
    }

    if !self.isObserving {
      self.startObservers()
    }

    player.play()
    super.play()
  }

  override func pause() {
    guard canPlay else {
       SwiftyBeaver.warning("[TrackableVideoSource] \(mediaSource.id) Tried to pause before being ready")
       return
     }

    if !self.isObserving {
      self.startObservers()
    }

    player.pause()
    super.pause()
  }

  @objc(handlePlayerItemReachedEnd:)
  func handlePlayerItemReachedEnd(notification: NSNotification) {
    self.handleEnd()
  }

  @objc(handlePlayerItemStalled:)
  func handlePlayerItemStalled(notification: NSNotification) {
    if status == .playing {
      self.player.play()
    }
  }

  override func reset() {
    super.reset()


    if self.playerItem == self.player.currentItem && playerItem != nil {
      self.player.seek(to: .zero)
    }
  }

  func handleEnd() {
    self.onEnd()
  }

  override func stop() {
    super.stop()

    if isObserving {
      stopObservers()
    }
  }

  deinit {
    stopObservers()
    print("DEINIT \(mediaSource.id)")
  }
}
