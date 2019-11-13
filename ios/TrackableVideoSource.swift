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

class TrackableVideoSource : TrackableMediaSource {
  var playerObserver: NSKeyValueObservation? = nil
  var player: AVPlayer? = nil
  

  init(mediaSource: MediaSource, player: AVPlayer? = nil) {
    super.init(mediaSource: mediaSource)
  }

  var timeScale: CMTimeScale {
    guard let asset = player?.currentItem?.asset else {
      return CMTimeScale(NSEC_PER_SEC)
    }

    guard let videoTrack = asset.tracks(withMediaType: .video).first else {
      return CMTimeScale(NSEC_PER_SEC)
    }

    return videoTrack.naturalTimeScale
  }


  var playerItem : AVPlayerItem? = nil {
    didSet {
//      if oldValue != playerItem {
//        if let playerItem = playerItem {
//          let pixBuffAttributes: [String : AnyObject] = [kCVPixelBufferPixelFormatTypeKey as String :  Int(kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange) as AnyObject]
//
//          let output = AVPlayerItemVideoOutput(pixelBufferAttributes: pixBuffAttributes)
//          playerItem.add(output)
//
//          mediaSource.videoOutput = output
//        } else {
//          mediaSource.videoOutput = nil
//        }
//      }
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


    super.load(onLoad: callback)

    guard !isAlreadyLoading else {
      return
    }

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

  func loadPlayer(playerContainer: YeetPlayer) {
    
  }

  func handleLoad(asset: AVURLAsset) {
    self.isAlreadyLoading = false

    if let playerItem = self.playerItem {
      NotificationCenter.default.removeObserver(self, name: NSNotification.Name.AVPlayerItemDidPlayToEndTime, object: playerItem)
      NotificationCenter.default.removeObserver(self, name: NSNotification.Name.AVPlayerItemPlaybackStalled, object: playerItem)
    }

    let playerItem = AVPlayerItem(asset: asset)


    NotificationCenter.default.addObserver(self, selector: #selector(handlePlayerItemReachedEnd(notification:)), name:NSNotification.Name.AVPlayerItemDidPlayToEndTime, object: playerItem)
    NotificationCenter.default.addObserver(self, selector: #selector(handlePlayerItemStalled(notification:)), name:NSNotification.Name.AVPlayerItemPlaybackStalled, object: playerItem)


    self.hasLoaded = true
    self.onLoad()
  }


  override var canPlay: Bool {
    return super.canPlay
  }


  override func onLoad() {
    guard self.playerItem != nil else {
      self.status = .error
      return
    }


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

    if self.status == .playing || self.status == .paused {
      return
    }

    self.status = .ready
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
    super.play()
  }

  override func pause() {
    guard let player = self.player else {
      return
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

    self.elapsed = 0.0

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
    _onLoadCallbacks = []
  }

  deinit {
    if let playerItem = self.playerItem {
      NotificationCenter.default.removeObserver(self, name: NSNotification.Name.AVPlayerItemDidPlayToEndTime, object: playerItem)
      NotificationCenter.default.removeObserver(self, name: NSNotification.Name.AVPlayerItemPlaybackStalled, object: playerItem)
    }

    _onLoadCallbacks = []

    playerObserver?.invalidate()


    print("DEINIT \(mediaSource.id)")

  }
}
