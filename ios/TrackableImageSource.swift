//
//  TrackableImageSource.swift
//  yeet
//
//  Created by Jarred WSumner on 10/4/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SwiftyTimer

class TrackableImageSource: TrackableMediaSource {
  var timer: Timer? = nil
  var timerElapsed: TimeInterval = 0.0
  var progressTimer: Timer? = nil
  var progressTime: CMTime = .zero
  var bounds: CGRect

  init(mediaSource: MediaSource, bounds: CGRect) {
    self.bounds = bounds
    super.init(mediaSource: mediaSource)
  }

  func setupTimers() {
    self.timer?.invalidate()

    self.timer = Timer.new(after: mediaSource.playDuration.doubleValue - timerElapsed) { [weak self] in
      if let timerElapsed = self?.timer?.timeInterval ?? nil {
        self?.timerElapsed = timerElapsed
      }

      self?.handleEnd()
    }

    self.progressTimer?.invalidate()
    self.progressTimer = Timer.new(every: TrackableMediaSource.periodicInterval) { [weak self] in
      let progressTime = (self?.progressTime ?? .zero) + CMTime(seconds: TrackableMediaSource.periodicInterval, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
      self?.progressTime = progressTime

      self?.onProgress(elapsed: progressTime)
    }
  }

  func handleEnd() {
    self.timer?.invalidate()
    self.progressTimer?.invalidate()

    self.onEnd()
  }

  override func load(onLoad callback: onLoadCallback? = nil) {
    if let callback = callback {
      _onLoadCallbacks.append(callback)
    }

    if canPlay {
      onLoad()
      return
    }

    self.status = .loading
  }

  override func onLoad() {
    super.onLoad()
    self.start()
  }

  var needsTimers : Bool {
    return mediaSource.duration.doubleValue > 0.0 && !alwaysLoop
  }

  override func play() {
//    if needsTimers {
//      if self.progressTimer == nil || self.timer == nil {
//        self.setupTimers()
//      }
//    }

    guard canPlay else {
      return
    }

//    if needsTimers {
//      timer?.start()
//      progressTimer?.start()
//    }

    super.play()
  }


  override func pause() {
    guard let timer = self.timer else {
      return
    }

    guard canPlay else {
      return
    }

//    if needsTimers {
//      timerElapsed = timer.timeInterval
//      timer.invalidate()
//      progressTimer?.invalidate()
//    }


    super.pause()
  }

  func resetTimers(restart: Bool = false) {
    timerElapsed = 0.0
    timer?.invalidate()
    progressTimer?.invalidate()
    self.elapsed = .zero
    self.progressTime = .zero
  }

  override func reset() {
    super.reset()

    self.elapsed = .zero
    timerElapsed = 0.0
    self.progressTime = .zero
    timer?.invalidate()
    progressTimer?.invalidate()
    self.setupTimers()
  }

  deinit {
    timer?.invalidate()
    progressTimer?.invalidate()
  }
}

