//
//  VideoQueue.swift
//  yeet
//
//  Created by Jarred WSumner on 9/28/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import Nuke



class MediaQueuePlayer : TrackableMediaSourceDelegate {
  enum Notification: String {
    case willChangeCurrentItem = "willChangeCurrentItem"
  }

  var id: String? = nil

  func onChangeStatus(status: TrackableMediaSource.Status, oldStatus: TrackableMediaSource.Status, mediaSource: TrackableMediaSource) {
    guard let _current = current else {
      return
    }

    guard mediaSource == _current else {
      return
    }

    let desiredStatus = self.status
    let shouldStartPlaying = desiredStatus == .playing && status == .ready

    if shouldStartPlaying {
      _current.play()
      self.status = _current.status
    }
    
  }

  func onMediaProgress(elapsed: Double, mediaSource: TrackableMediaSource) {

  }

  typealias ChangeMediaEventBlock = (_ newMedia: TrackableMediaSource?, _ oldMedia: TrackableMediaSource?, _ index: Int) -> Void
  var onChangeMedia: ChangeMediaEventBlock? = nil {
    didSet (newValue) {
      newValue?(self.current, nil, index)
    }
  }

  var videoPlayer: AVPlayer = {
    let player = AVPlayer()
     if #available(iOS 10.0, *) {
       player.automaticallyWaitsToMinimizeStalling = true
     }


    return player
  }()
  lazy var playerLayer: AVPlayerLayer  = AVPlayerLayer(player: self.videoPlayer)
  var mediaSources: Array<MediaSource> = []

  var index: Int = 0
  var bounds: CGRect {
    didSet(newValue) {
      [
        previous,
        current,
        next
        ].filter { tracker in
          return tracker != nil && tracker!.mediaSource.isImage
      }.forEach { _tracker in
        let tracker = _tracker as! TrackableImageSource

        tracker.bounds = newValue
      }

    }
  }

  var previous: TrackableMediaSource? = nil {
    willSet(newValue) {
       guard newValue == nil else {
         return
       }

       guard let tracker = previous else {
         return
       }

       if !tracker.delegate.containsDelegate(self) {
         tracker.delegate.removeDelegate(self)
       }
     }

     didSet (newValue) {
       guard let tracker = newValue else {
         return
       }

       if !tracker.delegate.containsDelegate(self) {
         tracker.delegate.addDelegate(self)
       }
     }
  }
  var current: TrackableMediaSource? = nil {
    willSet(newValue) {
       guard newValue == nil else {
         return
       }

       guard let tracker = current else {
         return
       }

       if !tracker.delegate.containsDelegate(self) {
         tracker.delegate.removeDelegate(self)
       }


     }

     didSet (newValue) {
      guard let tracker = newValue else {
        return
      }

      tracker.alwaysLoop = isLast(item: tracker.mediaSource)
     }
  }
  var next: TrackableMediaSource? = nil {
    willSet(newValue) {
      guard newValue == nil else {
        return
      }

      guard let tracker = next else {
        return
      }

      if !tracker.delegate.containsDelegate(self) {
        tracker.delegate.removeDelegate(self)
      }
    }

    didSet (newValue) {
      guard let tracker = newValue else {
        return
      }

      if !tracker.delegate.containsDelegate(self) {
        tracker.delegate.addDelegate(self)
      }
    }
  }


  init(mediaSources: Array<MediaSource> = [], bounds: CGRect, id: String? = nil, allowPrefetching: Bool = false, onChangeMedia: ChangeMediaEventBlock? = nil) {
    self.bounds = bounds
    self.mediaSources = mediaSources
    self.onChangeMedia = onChangeMedia
    self.id = id
    self.allowPrefetching = allowPrefetching
    self.update(mediaSources: mediaSources)
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

  var allowPrefetching = false

  var paused: Bool {
    return status == .paused
  }

  var playing: Bool {
    return status == .playing
  }

  private func trackable(mediaSource: MediaSource?) -> TrackableMediaSource? {
    guard let mediaSource = mediaSource else {
      return nil
    }

    if mediaSource.isVideo {
      return TrackableVideoSource(mediaSource: mediaSource, player: videoPlayer, playerLayer: playerLayer)
    } else if mediaSource.isImage {
      return TrackableImageSource(mediaSource: mediaSource, bounds: bounds)
    } else {
      return nil
    }
  }

  var status = TrackableMediaSource.Status.pending

  func update(mediaSources: Array<MediaSource>) {
    let _mediaSources = self.mediaSources

    var newIndex = 0
    let oldIndex = self.index
    let oldCurrentItem = self.currentItem
    let oldNextItem = self.nextItem
    let oldPreviousItem = self.previousItem

    if let _currentItem = currentItem {
      newIndex = mediaSources.firstIndex(of: _currentItem) ?? 0
    }

    if newIndex != oldIndex {
      self.index = newIndex
    }

    self.mediaSources = mediaSources

    let newCurrentItem = self.currentItem
    let newNextItem = self.nextItem
    let newPreviousItem = self.previousItem

    if newPreviousItem != oldPreviousItem {
      if newPreviousItem != nil && current?.mediaSource == newPreviousItem {
        previous = current
      } else if oldPreviousItem != nil && next?.mediaSource == newPreviousItem {
        previous = next
      } else {
        previous = trackable(mediaSource: newPreviousItem)
      }
    }

    let oldCurrent = current

    if newCurrentItem != oldCurrentItem {
      if newCurrentItem != nil && next?.mediaSource == newCurrentItem {
        current = next
      } else if newCurrentItem != nil && previous?.mediaSource == newCurrentItem {
        current = previous
      } else {
        current = trackable(mediaSource: newCurrentItem)
      }
    }

    if newNextItem != oldNextItem {
      if newNextItem != nil && current?.mediaSource == newNextItem {
        next = current
      } else if newNextItem != nil && previous?.mediaSource == newNextItem {
        next = previous
      } else {
        next = trackable(mediaSource: newNextItem)
      }
    }

    previous?.alwaysLoop = previousItem != nil && isLast(item: previousItem!)
    current?.alwaysLoop = currentItem != nil && isLast(item: currentItem!)
    next?.alwaysLoop = nextItem != nil && isLast(item: nextItem!)

    previous?.isActive = false
    next?.isActive = false
    current?.isActive = true

    if let _current = current {
      if !_current.delegate.containsDelegate(self) {
        _current.delegate.addDelegate(self)
      }

      if oldCurrent != current {
         onChangeMedia?(current, oldCurrent, index)
       }

      if _current.status == .pending {
        _current.load() { [weak self] tracker in
           guard let this = self else {
             return
           }

           guard tracker == this.current else {
             return
           }

           _current.start()

           if this.status == .playing {
             _current.play()
           }
        }
      } else if _current.status == .loaded && (status == .playing) {
        _current.start()
        _current.play()
      } else if _current.status == .playing && (status != .playing) {
        _current.pause()
      }
    }



    if allowPrefetching {
      self.prefetchNext()
    }
  }

  func prefetchNext() {
    if let _next = next {
      if (_next.status == .pending || _next.status == .error) {
        _next.load()
      }
    }
  }

  func isLast(index: Int) -> Bool {
    return index == max(mediaSources.count - 1, 0)
  }

  func isLast(item: MediaSource) -> Bool {
    return item == mediaSources.last
  }

  var previousItem: MediaSource? {
    if (index - 1 > 0) && mediaSources.count > 0 {
      return mediaSources[index - 1]
    } else {
      return nil
    }
  }

  var currentItem: MediaSource? {
    if mediaSources.count > index {
      return mediaSources[index]
    } else {
      return nil
    }
  }

  var nextItem: MediaSource? {
    if index + 1 < mediaSources.count {
      return mediaSources[index + 1]
    } else {
      return nil
    }
  }

  func play() {
    guard let _current = current else {
      return
    }
    if !_current.canPlay {
      _current.load() { [weak self] tracker in
        guard self?.current?.mediaSource.id == tracker.mediaSource.id else {
          return
        }

        _current.start()
        _current.play()
      }
    } else {
      _current.play()
    }

    self.status = _current.status
  }

  @objc func willEndSoon() {
//    NotificationCenter.default.post(name: NSNotification.Name(rawValue: MediaQueuePlayer.Notification.willChangeCurrentItem.rawValue), object: [self, current as Any])
  }

  func advance(to: Int, cb: TrackableMediaSource.onLoadCallback? = nil) {
    let newIndex = min(to, max(mediaSources.count - 1, 0))
    if (newIndex == index) {
       guard let current = self.current else {
         return
       }

      current.reset()
      return;
    }

    self.willEndSoon()

    var oldCurrent = current
    if newIndex == index - 1 {
      self.index = newIndex
      next = oldCurrent
      current = previous
      previous = trackable(mediaSource: previousItem)
    } else if newIndex == index + 1 {
      self.index = newIndex
      current = next
      previous = oldCurrent
      next = nil
    } else {
      self.index = newIndex
      previous = nil
      current = nil
      next = nil
    }

    if previous == nil {
      previous = trackable(mediaSource: previousItem)
    }

    if current == nil {
      current = trackable(mediaSource: currentItem)
    }

    if next == nil {
      next = trackable(mediaSource: nextItem)
    }

    let isVideoToVideo = oldCurrent?.mediaSource.isVideo ?? false && current?.mediaSource.isVideo ?? false

    current?.isActive = true
    next?.isActive = false
    previous?.isActive = false

    previous?.reset()
    next?.reset()
    current?.reset()


    if (videoPlayer.currentItem != nil && currentItem?.isVideo == false) {
      videoPlayer.cancelPendingPrerolls()
      videoPlayer.replaceCurrentItem(with: nil)
      videoPlayer.seek(to: .zero)
    }

    guard let current = self.current else {
      return
    }

    if !current.delegate.containsDelegate(self) {
      current.delegate.addDelegate(self)
    }


    if current.hasLoaded {
      if isVideoToVideo {
        self.videoPlayer.seek(to: .zero)
      }
      current.start()
      cb?(current)
    } else {
      current.load() { [weak self] tracker in
        guard tracker == current else {
          return
        }

        tracker.start()

        if isVideoToVideo {
          self?.videoPlayer.seek(to: .zero)
        }

        cb?(tracker)


      }
    }



    if allowPrefetching {
      self.prefetchNext()
    }

    current.alwaysLoop = currentItem != nil && isLast(item: currentItem!)

    onChangeMedia?(current, oldCurrent, index)
  }

  func advanceToNextItem(cb: TrackableMediaSource.onLoadCallback? = nil) {
    self.advance(to: index + 1, cb: cb)
  }

  func advanceToPreviousItem(cb: TrackableMediaSource.onLoadCallback? = nil) {
    var previousIndex = index - 1
    if previousIndex < 0 {
      previousIndex = mediaSources.count + previousIndex
    }
    self.advance(to: previousIndex, cb: cb)
  }

  func pause() {
    guard let _current = current else {
      return
    }
    _current.pause()
    self.status = _current.status
  }

  func stop() {
    videoPlayer.pause()
    videoPlayer.replaceCurrentItem(with: nil)
    current?.stop()
    previous?.stop()
    next?.stop()
//    playerLayer?.removeFromSuperlayer()
    status = .pending
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
//    videoPlayer.removeAllItems()
    stop()
//    self.looper?.disableLooping()
  }
}
