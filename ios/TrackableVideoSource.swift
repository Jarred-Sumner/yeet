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
  var playerContainer: YeetPlayer? = nil {
    didSet {
      guard self.playerContainer != oldValue else {
        return
      }

      if let playerContainer = playerContainer {
        self.startObservers()

//        playerContainer.observe(\YeetPlayer.key, options: .new) { [weak self] _, _ in
//          if self?.playerContainer?.key != self?.mediaSource.id {
//            self?.playerContainer = nil
//          }
//        }
      } else {
        self.stopObservers()
      }


    }
  }
  var player: AVPlayer? {
    get {
      return playerContainer?.player
    }
  }

  var boundaryObserverToken: Any? = nil
  var periodicObserverToken: Any? = nil

  override init(mediaSource: MediaSource) {
    super.init(mediaSource: mediaSource)
  }

  func addBoundaryTimeObserver() {
    guard let player = self.player else {
      return
    }

    let timeScale = CMTimeScale(NSEC_PER_SEC)
    let times = [NSValue(time: mediaSource.asset!.duration)]


    boundaryObserverToken = player
      .addBoundaryTimeObserver(forTimes: times, queue: .main) { [weak self] in
        guard self?.player?.currentItem?.asset == self?.mediaSource.asset else {
          return
        }

        self?.handleEnd()
    }

  }

  private func addPeroidicObserver() {
    guard let player = self.player else {
      return
    }

    let timeScale = CMTimeScale(NSEC_PER_SEC)
    let time = CMTime(seconds: TrackableVideoSource.periodicInterval, preferredTimescale: timeScale)

     periodicObserverToken = player
      .addPeriodicTimeObserver(
        forInterval: time,
        queue: .main) { [weak self] progress in

          guard self?.player?.currentItem?.asset == self?.mediaSource.asset else {
            return
          }
          self?.onProgress(elapsed: progress)
    }
  }

  var playerItem : AVPlayerItem? = nil

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
    let playerItem = AVPlayerItem(asset: asset)
    self.playerItem = playerItem
    self.hasLoaded = true
    self.onLoad()
  }

  
  var isObserving: Bool {
    return self.periodicObserverToken != nil || self.boundaryObserverToken != nil
  }

  override var canPlay: Bool {
    return super.canPlay && self.playerItem != nil && self.playerItem == player?.currentItem
  }

  func startObservers() {
    stopObservers()

    self.addPeroidicObserver()
    self.addBoundaryTimeObserver()

    guard let playerItem = self.playerItem else {
      return
    }

    NotificationCenter.default.addObserver(self, selector: #selector(handlePlayerItemReachedEnd(notification:)), name:NSNotification.Name.AVPlayerItemDidPlayToEndTime, object: playerItem)
    NotificationCenter.default.addObserver(self, selector: #selector(handlePlayerItemStalled(notification:)), name:NSNotification.Name.AVPlayerItemPlaybackStalled, object: playerItem)
  }

  func stopObservers() {
     NotificationCenter.default.removeObserver(self)

    if let periodicObserver = self.periodicObserverToken {
      player?.removeTimeObserver(periodicObserver)
      self.periodicObserverToken = nil
    }

    if let boundaryObserver = self.boundaryObserverToken {
      player?.removeTimeObserver(boundaryObserver)
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

    self.status = .ready
  }

  override func play() {
    if player == nil && self.playerItem != nil {
      self.playerContainer = VideoPool.shared().use(key: mediaSource.id)
    }

    guard let player = player else {
      return
    }

    let isNewAsset = player.currentItem != playerItem

    if player.currentItem != playerItem {
      player.replaceCurrentItem(with: playerItem)
    }

    if player.currentItem?.duration == player.currentItem?.currentTime() || isNewAsset {
      player.seek(to: .zero)
    }

    if !self.isObserving && playerItem != nil {
      self.startObservers()
    }



    if !isNewAsset && player.timeControlStatus != .paused {
      return
    }




    guard canPlay else {
      SwiftyBeaver.warning("[TrackableVideoSource] \(mediaSource.id) Tried to play before being ready")
      return
    }



    player.play()
    super.play()
  }

  override func pause() {
    guard let player = self.player else {
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
      self.player?.play()
    }
  }

  override func reset() {
    super.reset()


    guard let player = self.player else {
      return
    }

    if self.playerItem == player.currentItem && playerItem != nil {
      let wasPlaying = player.timeControlStatus != .paused
      player.seek(to: .zero)

      if wasPlaying {
        player.play()
      }
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
    VideoPool.shared().release(key: mediaSource.id)
    print("DEINIT \(mediaSource.id)")
  }
}
