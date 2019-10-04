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
  func onProgress(elapsed: Double, mediaSource: TrackableMediaSource)
}

class TrackableMediaSource : NSObject {
  static let periodicInterval = 0.15
  var delegate = MulticastDelegate<TrackableMediaSourceDelegate>()
  typealias onLoadCallback = (_ tracker: TrackableMediaSource) -> Void

  let mediaSource: MediaSource
  var alwaysLoop = false
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


  var remainingLoopCount: Int {
    return min(max(self.desiredLoopCount - self.currentLoopCount, 0), desiredLoopCount)
  }

  var shouldLoop: Bool {
    return alwaysLoop || self.remainingLoopCount > 0
  }

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
  var desiredLoopCount: Int {
    return Int(max(ceil(assetDuration / duration),0))
  }

  var loopDuration: Double {
    guard currentLoopCount > 0 else {return .zero }

    return duration * Double(currentLoopCount)
  }
  var currentLoopCount = 0

  init(mediaSource: MediaSource) {
    self.mediaSource = mediaSource
  }

  open func play() {
    self.status = .playing
  }

  open func pause() {
    self.status = .paused
  }

  open func start() {

  }

  open func restart() {

  }

  open func loop() {
    currentLoopCount = currentLoopCount + 1
    self.restart()
  }

  open func load(onLoad: onLoadCallback? = nil) {

  }

  func stop() {

  }

  
  public func onProgress(elapsed: CMTime) {
    self.delegate.invokeDelegates { [weak self] delegate in
      guard let this = self else {
        return
      }

      delegate.onProgress(elapsed: CMTimeGetSeconds(elapsed), mediaSource: this)
    }
  }

  public func onLoad() {

  }

  public func onError(error: Error?) {

  }

  public func onEnd() {
    self.status = .ended
  }

  deinit {
    stop()
  }
}

class TrackableVideoSource : TrackableMediaSource {
  let player: AVPlayer

  let playerLayer: AVPlayerLayer
  var boundaryObserverToken: Any? = nil
  var periodicObserverToken: Any? = nil

  init(mediaSource: MediaSource, player: AVPlayer, playerLayer: AVPlayerLayer) {
    self.player = player
    self.playerLayer = playerLayer

    super.init(mediaSource: mediaSource)
  }

  func addBoundaryTimeObserver() {
    let timeScale = CMTimeScale(NSEC_PER_SEC)
    let times = [NSValue(time: CMTimeMakeWithSeconds(duration, preferredTimescale: timeScale))]

    boundaryObserverToken = player
      .addBoundaryTimeObserver(forTimes: times, queue: .main) { [weak self] in
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
          self?.onProgress(elapsed: progress + CMTime(seconds: self?.loopDuration ?? 0.0, preferredTimeScale: timeScale))
    }
  }

  var playerItem: AVPlayerItem? {
    get {
      return mediaSource.playerItem
    }

    set (newValue) {
      mediaSource.playerItem = newValue
    }
  }

  override func load(onLoad callback: onLoadCallback? = nil) {
    if self.playerItem == nil {
      self.playerItem = self.mediaSource.playerItem
    }

    if self.playerItem == nil {
      self.status = .loading
      guard let asset = self.mediaSource.asset else {
        self.status = .error
        return
      }

      asset.loadValuesAsynchronously(forKeys: ["duration", "tracks"]) { [weak self] in
        guard let this = self else {
          return
        }

        let playerItem = AVPlayerItem(asset: asset)
        this.playerItem = playerItem

        this.status = .loaded
        callback?(this)
      }
    } else {
      callback?(self)
    }
  }

  func startObservers() {
    stopObservers()

    guard let playerItem = self.playerItem else {
      return
    }

    self.addPeroidicObserver()
    self.addBoundaryTimeObserver()

    NotificationCenter.default.addObserver(self, selector: #selector(handlePlayerItemReachedEnd(notification:)), name:NSNotification.Name.AVPlayerItemDidPlayToEndTime, object: playerItem)
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
    super.onLoad()

    guard let playerItem = self.playerItem else {
      self.status = .error
       return
     }

     startObservers()

    self.status = .loaded
  }

  override func start() {
    guard let playerItem = self.playerItem else {
      self.status = .error
       return
     }

    if player.currentItem != playerItem {
      player.replaceCurrentItem(with: playerItem)
      player.seek(to: .zero)
    }

    self.status = .ready
  }

  override func play() {
    self.startObservers()
    
    if player.timeControlStatus == .paused || player.timeControlStatus == .waitingToPlayAtSpecifiedRate {
      player.playImmediately(atRate: 1.0)

      super.play()
    }
  }

  override func pause() {
    player.pause()
    super.pause()
  }

  @objc(handlePlayerItemReachedEnd:)
  func handlePlayerItemReachedEnd(notification: NSNotification) {
    self.handleEnd()
  }

  override func restart() {
    super.restart()

    if self.playerItem == self.player.currentItem {
      self.player.seek(to: .zero)
    } else if self.playerItem != nil && self.playerItem != self.player.currentItem && self.player.currentItem != nil {
      stopObservers()
    }

    if self.status == .playing {
      self.play()
    } else if self.status != .loading && self.playerItem == nil {
      self.status = .pending
    } else if self.status != .loading && self.playerItem != nil {
      self.status = .loaded
    }
  }

  func handleEnd() {
    if self.shouldLoop {
      self.loop()
    } else {
      self.onEnd()
    }
  }

  deinit {
    stopObservers()
    mediaSource.asset?.cancelLoading()
  }
}

class TrackableImageSource: TrackableMediaSource {
  var timer: Repeater? = nil
  var progressTimer: Repeater? = nil
  var task: ImageTask? = nil
  var progressTime: CMTime = .zero
  var bounds: CGRect

  init(mediaSource: MediaSource, bounds: CGRect) {
    self.bounds = bounds
    super.init(mediaSource: mediaSource)

    self.timer = Repeater.init(interval: .seconds(duration), mode: .finite(1), tolerance: .milliseconds(100), queue: .main) { [weak self] _ in
      self?.handleEnd()
    }

    self.progressTimer = Repeater.init(interval: .seconds(TrackableMediaSource.periodicInterval), mode: .infinite, tolerance: .milliseconds(100), queue: .main) { [weak self] _ in

      let progressTime = (self?.progressTime ?? .zero) + CMTime(seconds: TrackableMediaSource.periodicInterval, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
      self?.progressTime = progressTime

      self?.onProgress(elapsed: progressTime)
    }
  }

  func handleEnd() {
    if self.shouldLoop {
       self.loop()
     } else {
       self.onEnd()
     }
  }

  override func load(onLoad callback: onLoadCallback? = nil) {
    if task != nil && ImagePipeline.shared.cachedResponse(for: task!.request) != nil
    {
      self.status = .loaded
      self.onLoad()
      callback?(self)
      return
    }

    if self.task == nil || self.task!.progress.isCancelled {
      self.task = YeetImageView.imageTask(source: mediaSource, bounds: bounds) { [weak self] _ in
        guard let this = self else  {
          return
        }

        this.status = .loaded
        this.onLoad()
        callback?(this)
      }
      self.status = .loading
    }
  }

  override func play() {
    guard let timer = self.timer else {
      self.status = .error
      return
    }

    timer.start()
    progressTimer?.start()

    super.play()
  }

  override func pause() {
    guard let timer = self.timer else {
      return
    }

    timer.pause()
    progressTimer?.pause()

    super.pause()
  }

  override func restart() {
    timer?.reset(nil)
    progressTimer?.reset(nil)
    self.progressTime = .zero

    super.restart()
  }

  deinit {
    timer?.removeAllObservers(thenStop: true)
    progressTimer?.removeAllObservers(thenStop: true)

    if !(task?.progress.isFinished ?? false) {
      task?.cancel()
    }

  }
}

