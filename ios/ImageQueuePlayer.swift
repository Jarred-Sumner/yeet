//
//  ImageQueuePlayer.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import Nuke
import Repeat

class ImageQueuePlayer {
  private var timer: Repeater? = nil
  private var images: Array<MediaSource> = []
  var heater = ImagePreheater()
  var index: Int = 0
  var paused: Bool {
    return timer?.state == Repeater.State.paused || timer == nil
  }

  func pause() {
    self.timer?.pause()
  }

  func stop() {
    self.timer?.removeAllObservers(thenStop: true)
    self.timer = nil
  }

  func createTimer(mediaSource: MediaSource, completionBlock: @escaping (_ mediaSource: MediaSource) -> Void) {
    let time = mediaSource.playDuration.doubleValue

    weak var timerItem = mediaSource
    self.timer = Repeater.once(after: .seconds(time)) {_ in
      guard let item = timerItem else {
        return
      }

      completionBlock(item)
    }
  }

  func play(completionBlock: @escaping (_ mediaSource: MediaSource) -> Void) {
    guard let item = currentItem else {
      return
    }

    if self.timer == nil {
      self.createTimer(mediaSource: item) { item in
        completionBlock(item)
      }
    }

    self.timer?.start()
  }

  func advanceToNextItem(completionBlock: @escaping (_ mediaSource: MediaSource) -> Void) {
    let newIndex = max(min(images.count - 1, index + 1), 0)

    guard newIndex > index else {
      return
    }

    self.index = newIndex
    let nextIndex = max(min(images.count - 1, index + 1), 0)


    if nextIndex > newIndex {
      let nextItem = images[nextIndex]
      heater.startPreheating(with: [nextItem.uri])
    }
  }




  func update(images: Array<MediaSource>) {
    let removedImages = self.images.filter { image in
      return !images.contains(image)
    }

    let stopPreheatingThese = removedImages.map { image in
      return image.uri
    }

    if stopPreheatingThese.count > 0 {
      heater.stopPreheating(with: stopPreheatingThese)
    }

    if let currentItem = self.currentItem {
      let newIndex = images.firstIndex(of: currentItem)
      self.index = newIndex ?? 0
    }

    self.images = images
  }


  var currentItem: MediaSource? {
    if images.count > index {
      return images[index]
    } else {
      return nil
    }

  }

  deinit {
    self.timer?.removeAllObservers(thenStop: true)
    self.timer = nil
    self.heater.stopPreheating()
  }
}
