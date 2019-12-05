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
import ModernAVPlayer

public struct YeetAVPlayerConfiguration: PlayerConfiguration {

    // Buffering State
    public let rateObservingTimeout: TimeInterval = 1.0
    public let rateObservingTickTime: TimeInterval = 0.33

    // General Audio preferences
    public let preferedTimeScale: CMTimeScale = CMTimeScale(NSEC_PER_SEC)
    public let periodicPlayingTime: CMTime
    public let audioSessionCategory = AVAudioSession.Category.playback

    // Reachability Service
    public let reachabilityURLSessionTimeout: TimeInterval = 3
    //swiftlint:disable:next force_unwrapping
    public let reachabilityNetworkTestingURL = URL(string: "https://www.google.com")!
    public let reachabilityNetworkTestingTickTime: TimeInterval = 3
    public let reachabilityNetworkTestingIteration: UInt = 10

    public var useDefaultRemoteCommand = true

    public let allowsExternalPlayback = false

    public init() {
        periodicPlayingTime = CMTime(seconds: 1, preferredTimescale: preferedTimeScale)
    }
}

class TrackableVideoSource : TrackableMediaSource, ModernAVPlayerDelegate {
  var playerStatusObserver: NSKeyValueObservation? = nil
  var timeControlObserver: NSKeyValueObservation? = nil
  var player: AVQueuePlayer? = nil {
    willSet(newValue) {
      if newValue != self.player && self.player != nil {
        if periodicObserver != nil {
          player?.removeTimeObserver(periodicObserver)
          periodicObserver = nil
        }

        itemObserver?.invalidate()
        looper?.disableLooping()
        playerStatusObserver?.invalidate()
        timeControlObserver?.invalidate()
        player?.currentItem?.cancelPendingSeeks()
        player?.removeAllItems()
        self.looper = nil
      }
    }
  }
  var periodicObserver: AnyObject? = nil

  init(mediaSource: MediaSource, player: AVPlayer? = nil) {
    self._duration = mediaSource.duration.doubleValue
    super.init(mediaSource: mediaSource)

  }

  var isAlreadyLoading = false
  override func load(onLoad callback: onLoadCallback? = nil) {
    super.load(onLoad: callback)
  }

  override var canPlay: Bool {
    return self.player != nil
  }


  private var _duration: Double
  override var duration: Double {
    return self._duration
  }

  var looper: AVPlayerLooper? = nil

  var hasAutoPlayed = false
  var itemObserver: NSKeyValueObservation? = nil

  func start(player: AVQueuePlayer, autoPlay: Bool = false) {
    let config = YeetAVPlayerConfiguration()

    self.player = player

    mediaSource.loadAsset { [unowned self] asset in
      guard self != nil else {
        return
      }

      guard let asset = asset else {
        self.status = .error
        return  
      }

      let playerItem = AVPlayerItem(asset: asset)

      if let error = playerItem.error {
        self.onError(error: error)
        return
      }

      guard let player = self.player else {
        return
      }

      let looper = AVPlayerLooper(player: player, templateItem: playerItem, timeRange: CMTimeRangeMake(start: .zero, duration: asset.duration))

      if let _looper = self.looper {
        _looper.disableLooping()
      }

      self.looper = looper

      self.periodicObserver = player.addPeriodicTimeObserver(forInterval: CMTime(seconds: TrackableMediaSource.periodicInterval), queue: .main) {  [weak self] time in
        self?.onProgress(elapsed: time)
        } as AnyObject

      self.timeControlObserver = player.observe(\AVQueuePlayer.timeControlStatus, options: [.new, .old]) { [weak self] player, changes in
        guard let this = self else {
          self?.timeControlObserver?.invalidate()
          return
        }

        if player.status != .readyToPlay {
          if let error = player.error {
            this.onError(error: error)
          }

          return
        }

        if player.timeControlStatus == .playing || player.timeControlStatus == .waitingToPlayAtSpecifiedRate {
          this.status = .playing
        } else if player.timeControlStatus == .paused {
          this.status = .paused
        }
      }

      self.itemObserver = player.observe(\.currentItem, options: [.new, .old]) { [weak self] player, changes in
        guard let playerItem = player.currentItem else {
          self?.playerStatusObserver = nil
          return
        }

        if (self?.playerStatusObserver != nil && changes.newValue == changes.oldValue) {
          return
        }

        self?.playerStatusObserver?.invalidate()

        self?.playerStatusObserver = playerItem.observe(\AVPlayerItem.status, options: [.new, .initial, .old]) { [weak self] playerItem, changes in
          guard let this = self else {
            return
          }

          if playerItem.status == .readyToPlay  {
            if changes.oldValue != changes.newValue {
              playerItem.preferredForwardBufferDuration = 1.0

               this._duration = playerItem.duration.seconds
               this.elapsed = 0
                if this.status != .playing {
                  this.status = .ready
                }
            }

           this.playerStatusObserver?.invalidate()
          } else if playerItem.status == .failed {
            this.onError(error: playerItem.error)
           this.playerStatusObserver?.invalidate()
          }
        }
      }

      if autoPlay {
        player.play()
      }

    }




  }

  override func play() {
//    if self.playerContainer == nil {
//      self.playerContainer = VideoPool.shared().use(key: mediaSource.id)
//    }

    guard let player = self.player else {
      self.status = .error
      return
    }


    player.play()
  }

  override func pause() {
    guard let player = self.player else {
      return
    }

    player.pause()
  }


  override func reset() {
    super.reset()


    guard let player = self.player else {
      return
    }

//    self.elapsed = 0.0
//    player.seek(offset: .zero)

//    if self.playerItem == player.currentItem && playerItem != nil {
//      let wasPlaying = player.timeControlStatus != .paused
//      player.seek(to: .zero)
//
//
//      if wasPlaying {
//        player.play()
//      }
//    }
  }

  func handleEnd() {
    self.onEnd()
  }

  override func stop() {
    super.stop()
    _onLoadCallbacks = []
  }

  deinit {
    player?.removeTimeObserver(periodicObserver)
    looper?.disableLooping()
    itemObserver?.invalidate()
    player?.removeAllItems()
    player?.pause()
    playerStatusObserver?.invalidate()
    timeControlObserver?.invalidate()
    player = nil
  }
}
