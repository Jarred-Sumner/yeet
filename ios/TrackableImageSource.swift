//
//  TrackableImageSource.swift
//  yeet
//
//  Created by Jarred WSumner on 10/4/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import Repeat
import Nuke

class TrackableImageSource: TrackableMediaSource {
  var timer: Repeater? = nil
  var progressTimer: Repeater? = nil
  var task: ImageTask? = nil
  var progressTime: CMTime = .zero
  var bounds: CGRect

  init(mediaSource: MediaSource, bounds: CGRect) {
    self.bounds = bounds
    super.init(mediaSource: mediaSource)
  }

  func setupTimers() {
    if self.timer != nil {
      self.timer?.removeAllObservers(thenStop: true)
      self.timer = nil
    }

    self.timer = Repeater.init(interval: .seconds(duration), mode: .finite(1), tolerance: .milliseconds(8), queue: .main) { [weak self] timer in
      self?.handleEnd()
    }

    if self.progressTimer != nil {
      self.progressTimer?.removeAllObservers(thenStop: true)
      self.progressTimer = nil
    }

    self.progressTimer = Repeater.init(interval: .seconds(TrackableMediaSource.periodicInterval), mode: .infinite, tolerance: .milliseconds(16), queue: .main) { [weak self] _ in

      let progressTime = (self?.progressTime ?? .zero) + CMTime(seconds: TrackableMediaSource.periodicInterval, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
      self?.progressTime = progressTime

      self?.onProgress(elapsed: progressTime)
    }
  }

  func handleEnd() {
    self.onEnd()
  }

  

  override func load(onLoad callback: onLoadCallback? = nil) {
    _onLoadCallbacks.append(callback)
    if canPlay {
      onLoad()
      return
    }

    if task != nil && ImagePipeline.shared.cachedResponse(for: task!.request) != nil
    {
      return
    }

    if self.task == nil || self.task!.progress.isCancelled {
      self.task = YeetImageView.imageTask(source: mediaSource, bounds: bounds)
      self.status = .loading
    }
  }

  override func onLoad() {
    if self.progressTimer == nil || self.timer == nil {
      self.setupTimers()
    }

    super.onLoad()
  }

  override func play() {
    guard let timer = self.timer else {
      self.status = .error
      return
    }

    guard canPlay else {
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

    guard canPlay else {
      return
    }

    timer.pause()
    progressTimer?.pause()

    super.pause()
  }

  func resetTimers(restart: Bool = false) {
    timer?.reset(nil, restart: restart)
    progressTimer?.reset(nil, restart: restart)
    self.progressTime = .zero
  }

  override func reset() {
    super.reset()

    timer?.removeAllObservers(thenStop: true)
    progressTimer?.removeAllObservers(thenStop: true)
    self.progressTime = .zero

    self.setupTimers()
  }

  deinit {
    timer?.removeAllObservers(thenStop: true)
    progressTimer?.removeAllObservers(thenStop: true)

    if !(task?.progress.isFinished ?? false) {
      task?.cancel()
    }
  }
}

