//
//  VideoQueue.swift
//  yeet
//
//  Created by Jarred WSumner on 9/28/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import Nuke

class MediaQueuePlayer {
  var videoPlayer: AVPlayer = {
    let player = AVPlayer()
    player.automaticallyWaitsToMinimizeStalling = false

    return player
  }()
  lazy var playerLayer = AVPlayerLayer(player: self.videoPlayer)
  var imagePlayer = ImageQueuePlayer()
  var mediaSources: Array<MediaSource> = []
  var onEnd: (_ index: Int?, _ mediaSource: MediaSource?) -> Void
  var onChange: (_ index: Int?, _ mediaSource: MediaSource?) -> Void
  var onProgress: (_ index: Int?, _ mediaSource: MediaSource?, _ elapsed: CMTime, _ totalElapsed: CMTime, _ interval: Double) -> Void

  var index: Int = 0
  var looper: AVPlayerLooper? = nil
  var desiredLoopCount: Int {
    guard let currentItem = self.currentItem else { return 0}
    guard currentItem.isVideo else { return 0 }

    let duration = currentItem.playDuration.doubleValue
    let realDuration = currentItem.duration.doubleValue
    return Int(max(ceil(realDuration / duration),0))
  }

  var loopDuration: Double {
    guard let currentItem = self.currentItem else { return .zero }
    guard currentItem.isVideo else { return .zero }
    guard currentLoopCount > 0 else {return .zero }


    return currentItem.duration.doubleValue * Double(currentLoopCount)
  }
  var currentLoopCount = 0

  var videoTimeObserverToken: Any? = nil
  var videoEndObserver: Any? = nil
  static let periodicInterval = 0.15

  func addPeriodicTimeObserver() {
    if videoTimeObserverToken != nil {
      return
    }

    // Notify every half second
    let timeScale = CMTimeScale(NSEC_PER_SEC)
    let time = CMTime(seconds: MediaQueuePlayer.periodicInterval, preferredTimescale: timeScale)

    videoTimeObserverToken = videoPlayer
      .addPeriodicTimeObserver(
        forInterval: time,
        queue: .main) { [weak self] time in
        guard let playerItem = self?.videoPlayer.currentItem else {
          return
        }

        guard let item = self?.mediaSourceFromPlayerItem(playerItem: playerItem) else {
          return
        }
        guard let index = self?.mediaSources.firstIndex(of: item) else {
          return
        }

        self?.handleProgress(index: index, mediaSource: item, elapsed: time, interval: MediaQueuePlayer.periodicInterval)
    }
  }

  func addBoundaryTimeObserver() {
    if videoEndObserver != nil {
      videoPlayer.removeTimeObserver(videoEndObserver)
      videoEndObserver = nil
    }

    let timeScale = CMTimeScale(NSEC_PER_SEC)


    let times = [NSValue(time: CMTimeMakeWithSeconds(currentItem!.playDuration.doubleValue, preferredTimescale: timeScale))]
    let playerItemURL = self.currentItem?.asset?.url

    videoEndObserver = videoPlayer
      .addBoundaryTimeObserver(forTimes: times, queue: .main) { [weak self] in
        guard let playerItem = self?.videoPlayer.currentItem else {
          return
        }

        let urlAsset = playerItem.asset as! AVURLAsset
        if urlAsset.url != playerItemURL {
          return
        }

        guard let item = self?.mediaSourceFromPlayerItem(playerItem: playerItem) else {
               return
             }
         guard let index = self?.mediaSources.firstIndex(of: item) else {
           return
         }

        self?.handleEnd(index: index, mediaSource: item)
    }
  }


  init(mediaSources: Array<MediaSource> = [], onChange: @escaping (_ index: Int?, _ mediaSource: MediaSource?) -> Void, onProgress: @escaping (_ index: Int?, _ mediaSource: MediaSource?, _ elapsed: CMTime, _ totalElapsed: CMTime, _ interval: Double) -> Void, onEnd: @escaping (_ index: Int?, _ mediaSource: MediaSource?) -> Void) {
    self.onChange = onChange
    self.onProgress = onProgress
    self.onEnd = onEnd
    self.update(mediaSources: mediaSources)

    addPeriodicTimeObserver()
  }

  var videoMediaSources: Array<MediaSource> {
    return self.mediaSources.filter { mediaSource in
      return mediaSource.isVideo
    }
  }

  var imageMediaSources: Array<MediaSource> {
    return self.mediaSources.filter { mediaSource in
      return mediaSource.isImage
    }
  }

  var paused: Bool {

    guard let item = currentItem  else {
      return false
    }

    if item.isVideo {
      return videoPlayer.timeControlStatus == AVPlayer.TimeControlStatus.paused
    } else if (item.isImage) {
      return imagePlayer.paused
    } else {
      return false
    }
  }

  var playing: Bool {
    guard let item = currentItem  else {
      return false
    }

    if item.isVideo {
      return videoPlayer.timeControlStatus == AVPlayer.TimeControlStatus.playing || videoPlayer.timeControlStatus == AVPlayer.TimeControlStatus.waitingToPlayAtSpecifiedRate
    } else if (item.isImage) {
      return !imagePlayer.paused
    } else {
      return false
    }
  }



  func update(mediaSources: Array<MediaSource>) {
    let _mediaSources = self.mediaSources
    let removedItems = self.mediaSources.filter { mediaSource in
      return mediaSources.firstIndex(of: mediaSource) == nil
    }

    removedItems.forEach { item in
      stopObservingMediaSource(mediaSource: item)
    }

    var newIndex = 0
    let oldIndex = self.index
    let oldCurrentItem = self.currentItem

    if let _currentItem = currentItem {
      newIndex = mediaSources.firstIndex(of: _currentItem) ?? 0
    }

    self.mediaSources = mediaSources
    let newCurrentItem = self.currentItem
    imagePlayer.update(images: self.imageMediaSources)


    if (newIndex != oldIndex || newCurrentItem != oldCurrentItem) {
      if newCurrentItem != nil && newCurrentItem != oldCurrentItem {
        if let oldVideoPlayerItem = videoPlayer.currentItem {
           stopObservingPlayerItem(playerItem: oldVideoPlayerItem)
         }

        observeMediaSource(mediaSource: newCurrentItem!)
      }

      if newCurrentItem != nil && newCurrentItem!.isVideo && videoPlayer.currentItem != newCurrentItem!.playerItem {
        addPeriodicTimeObserver()

        let wasPlaying = playing
        if newCurrentItem?.id != oldCurrentItem?.id || videoPlayer.currentItem != newCurrentItem?.playerItem {
          videoPlayer.replaceCurrentItem(with: newCurrentItem!.playerItem!)
        }

        if playing != wasPlaying && wasPlaying {
          videoPlayer.seek(to: .zero)
          videoPlayer.play()
        }
      } else if (newCurrentItem != nil && newCurrentItem?.isImage ?? false && oldCurrentItem?.isVideo ?? false) {
        removePeriodicTimeObserver()
      }
      onChange(newIndex, newCurrentItem)
    }

//    if self.looper != nil {
//      self.looper?.disableLooping()
//      self.looper = nil
//    }

//
//    if let lastMediaSource = self.mediaSources.last {
//      if lastMediaSource.isVideo {
//        if let playerItem = lastMediaSource.playerItem {
//        }
//      }
//    }
  }

  func shouldLoopItem(mediaSource: MediaSource?) -> Bool {
    if mediaSource == nil {
      return false
    }

    return self.isLast(item: mediaSource!) || self.remainingLoopCount > 0
  }

  var remainingLoopCount: Int {
    return min(max(self.desiredLoopCount - self.currentLoopCount, 0), desiredLoopCount)
  }

  func observeMediaSource(mediaSource: MediaSource) {
    if mediaSource.isVideo {
      guard let playerItem = mediaSource.playerItem else {
        return
      }

      observePlayerItem(playerItem: playerItem)
    } else {

    }
  }

  func observePlayerItem(playerItem: AVPlayerItem) {
    NotificationCenter.default.addObserver(self, selector: #selector(handlePlayerItemReachedEnd(notification:)), name:NSNotification.Name.AVPlayerItemDidPlayToEndTime, object: playerItem)

    addBoundaryTimeObserver()
  }

  func stopObservingPlayerItem(playerItem: AVPlayerItem) {
     NotificationCenter.default.removeObserver(self, name: NSNotification.Name.AVPlayerItemDidPlayToEndTime, object: playerItem)

  }

  func stopObservingMediaSource(mediaSource: MediaSource) {
    if mediaSource.isVideo {
      guard let playerItem = mediaSource.playerItem else {
        return
      }

      stopObservingPlayerItem(playerItem: playerItem)
    } else {

    }
  }

  func mediaSourceFromPlayerItem(playerItem: AVPlayerItem) ->  MediaSource?  {
    return self.videoMediaSources.first { mediaSource in
      return mediaSource.playerItem == playerItem
    }
  }

  @objc(handlePlayerItemReachedEnd:)
  func handlePlayerItemReachedEnd(notification: NSNotification) {
    guard let mediaSource = self.mediaSourceFromPlayerItem(playerItem: notification.object as! AVPlayerItem) else {
      return
    }

    guard let mediaSourceIndex = self.mediaSources.firstIndex(of: mediaSource) else {
      return
    }

    if shouldLoopItem(mediaSource: mediaSource) {
      self.loopCurrentItem()
    } else {
      self.handleEnd(index: mediaSourceIndex, mediaSource: mediaSource)
    }
  }

  func isLast(index: Int) -> Bool {
    return index == max(mediaSources.count - 1, 0)
  }

  func isLast(item: MediaSource) -> Bool {
    return item == mediaSources.last
  }

  var currentItem: MediaSource? {
    if mediaSources.count > index {
      return mediaSources[index]
    } else {
      return nil
    }
  }

  var nextItem: MediaSource? {
    return mediaSources[min(index + 1, max(mediaSources.count - 1, 0))]
  }

  func play() {

    if let item = self.currentItem {
      if item.isVideo {
        addPeriodicTimeObserver()
        addBoundaryTimeObserver()
        videoPlayer.playImmediately(atRate: 1.0)
      } else if item.isImage {
        imagePlayer.play { [weak self] _ in
          self?.advanceToNextItem()
        }
      }
    }
  }

  func loopCurrentItem() {
    guard let item = currentItem else {
      return
    }

    if item.isVideo {
      videoPlayer.seek(to: .zero)
      if playing {
        videoPlayer.play()
      }

      currentLoopCount = currentLoopCount + 1
    }
  }

  func advance(to: Int) {
    let newIndex = min(to, max(mediaSources.count - 1, 0))
    if (newIndex == index) {
       guard let currentItem = self.currentItem else {
         return
       }

      if currentItem.isVideo {
        videoPlayer.seek(to: .zero)
      }
      return;
    }

    let oldItem = currentItem
    self.index = newIndex


    guard let currentItem = self.currentItem else {
      return
    }


    if let _oldItem = oldItem {
      stopObservingMediaSource(mediaSource: _oldItem)
    }

    if videoEndObserver != nil {
      videoPlayer.removeTimeObserver(videoEndObserver)
      videoEndObserver = nil
    }

    observeMediaSource(mediaSource: currentItem)

    if currentItem.isVideo {

      self.currentLoopCount = 0
      addPeriodicTimeObserver()
      addBoundaryTimeObserver()
      
      if let playerItem = currentItem.playerItem {
        videoPlayer.replaceCurrentItem(with: playerItem)
        videoPlayer.seek(to: .zero)
      }
    } else {
      removePeriodicTimeObserver()
      self.imagePlayer.advanceToNextItem { [weak self] _ in
        self?.handleEnd(index: newIndex, mediaSource: currentItem)
      }
    }

    onChange(self.index, self.currentItem)

    guard let nextItem = self.nextItem else {
      return
    }

    videoPlayer.actionAtItemEnd = .none
  }

  func advanceToNextItem() {
    self.advance(to: index + 1)
  }

  func advanceToPreviousItem() {
    var previousIndex = index - 1
    if previousIndex < 0 {
      previousIndex = mediaSources.count + previousIndex
    }
    self.advance(to: previousIndex)
  }

  func handleProgress(index: Int, mediaSource: MediaSource, elapsed: CMTime, interval: Double) {
    self.onProgress(index, mediaSource, CMTime(seconds: elapsed.seconds, preferredTimescale: CMTimeScale(NSEC_PER_SEC)), CMTime(seconds: elapsed.seconds + loopDuration, preferredTimescale: CMTimeScale(NSEC_PER_SEC)), interval)
  }

  func handleEnd(index: Int, mediaSource: MediaSource) {
    self.onEnd(index, mediaSource)
  }

  func pause() {
    removePeriodicTimeObserver()
    if playing {
      videoPlayer.pause()
    }

    if !imagePlayer.paused {
      imagePlayer.pause()
    }
  }

  func removePeriodicTimeObserver() {
      if let videoTimeObserverToken = videoTimeObserverToken {
        videoPlayer.removeTimeObserver(videoTimeObserverToken)
        self.videoTimeObserverToken = nil
      }
  }

  func stop() {
    videoPlayer.pause()
    videoPlayer.replaceCurrentItem(with: nil)
    removePeriodicTimeObserver()
    if currentItem != nil {
      stopObservingMediaSource(mediaSource: currentItem!)
    }
    imagePlayer.stop()
    playerLayer.removeFromSuperlayer()

    if videoEndObserver != nil {
      videoPlayer.removeTimeObserver(videoEndObserver)
      videoEndObserver = nil
    }
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
//    videoPlayer.removeAllItems()
    stop()
//    self.looper?.disableLooping()
  }
}
