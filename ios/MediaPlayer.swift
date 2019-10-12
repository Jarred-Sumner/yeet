//
//  MediaPlayer.swift
//  yeet
//
//  Created by Jarred WSumner on 9/28/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import AVFoundation
import UIKit
import SwiftyBeaver

enum MediaPlayerContentType {
  case video
  case image
  case none
}

@objc(MediaPlayer)
class MediaPlayer : UIView, RCTUIManagerObserver, RCTInvalidating, TrackableMediaSourceDelegate {
  func onChangeStatus(status: TrackableMediaSource.Status, oldStatus: TrackableMediaSource.Status, mediaSource: TrackableMediaSource) {
    guard mediaSource == current && current != nil else {
      return
    }

    let item = mediaSource.mediaSource

    self.sendStatusUpdate(status: status, mediaSource: mediaSource)

    imageView?.animated = status == .playing
  }

  @objc(prefetch) var prefetch: Bool = false {
    didSet(newValue) {
      self.mediaQueue?.allowPrefetching = newValue
    }
  }


  func onMediaProgress(elapsed: Double, mediaSource: TrackableMediaSource) {
    let item = mediaSource.mediaSource

    guard item == currentItem else {
      return
    }

    guard let index = mediaQueue?.index else {
      return
    }

    guard self.canSendEvents else {
      return
    }

    self.onProgress?([
      "index": index,
      "id": item.id,
      "status": mediaSource.status.stringValue,
      "url": item.uri.absoluteString,
      "elapsed": elapsed,
      "interval": TrackableMediaSource.periodicInterval,
    ])
  }

  @objc(muted) var muted: Bool {
    get {
      return mediaQueue?.player.muted ?? false
    }

    set (newValue) {
      mediaQueue?.player.muted = newValue
    }
  }

  var imageView: YeetImageView? = nil
  var videoView: YeetVideoView? = nil {
    didSet (newValue) {
      if newValue == nil && mediaQueueObserver != nil {
        mediaQueueObserver = nil
      } else if (newValue != nil) {
        mediaQueueObserver = mediaQueue!.videoPlayer.observe(\AVPlayer.status)  { [weak self] player, changes in
         if player.status == .readyToPlay {
           self?.handleReady()
         } else if player.status == .failed {
           self?.handleError()
         }
       }
      }
    }
  }
  var bridge: RCTBridge? = nil
  var isInitialMount = true

  var player = SwappablePlayer()


  @objc(id) var id: NSString? {
    didSet(newValue) {
      mediaQueue?.id = newValue as String?
    }
  }

  @objc(sources)
  var sources: Array<MediaSource> {
    get {
      return mediaQueue?.mediaSources ?? []
    }

    set (newValue) {
      if mediaQueue == nil && newValue.count == 0 {
        return
      } else if (mediaQueue != nil && newValue.count == 0) {
        mediaQueue = nil
        return
      }

      if mediaQueue == nil {
        mediaQueue = MediaQueuePlayer(
          mediaSources: newValue,
          bounds: bounds,
          id: id as String?,
          allowPrefetching: prefetch,
          player: player
        )  { [weak self] newMedia, oldMedia, index in
          guard let this = self else {
            return
          }

          if let old = oldMedia {
            if old.delegate.containsDelegate(this) {
              old.delegate.removeDelegate(this)
            }
          }

          if let new = newMedia {
            if !new.delegate.containsDelegate(this) {
              new.delegate.addDelegate(this)
            }
          }

          guard let index = this.mediaQueue?.index else {
            return
          }

          this.handleChange(index: index, mediaSource: newMedia?.mediaSource)
        }


        self.setNeedsLayout()
      } else {
        mediaQueue?.update(mediaSources: newValue)
        self.setNeedsLayout()
      }
    }
  }
  var mediaQueue: MediaQueuePlayer? = nil


  var currentItem: MediaSource? {
    return mediaQueue?.currentItem
  }

  var current: TrackableMediaSource? {
    return mediaQueue?.current
  }

  @objc(paused)
  var paused: Bool {
    get {
      return mediaQueue?.paused ?? true
    }

    set (newValue) {
      if (newValue == mediaQueue?.paused ?? true) {
        return
      }

      if (newValue == true) {
        mediaQueue?.pause()
      } else {
        mediaQueue?.play()
      }
    }
  }

  @objc(autoPlay)
  var autoPlay = true

  @objc(onChangeItem)
  var onChangeItem: RCTDirectEventBlock? = nil

  @objc(onLoad)
  var onLoad: RCTDirectEventBlock? = nil

  @objc(onEnd)
  var onEnd: RCTDirectEventBlock? = nil

  @objc(onError)
  var onError: RCTDirectEventBlock? = nil

  @objc(onProgress)
  var onProgress: RCTDirectEventBlock? = nil

  init(bridge: RCTBridge? = nil) {
    self.bridge = bridge

    super.init(frame: .zero)

    if (self.sources.count > 0) {
      DispatchQueue.main.async { [weak self] in
        self?.layoutContentView()
      }

    }

    bridgeObserver = bridge?.observe(\RCTBridge.isValid) { [weak self] bridge, changes in
      if !bridge.isValid {
        self?.invalidate()
      }
    }


    bridge?.uiManager.observerCoordinator.add(self)
  }

  override init(frame: CGRect) {
    super.init(frame: frame)

    if (self.sources.count > 0) {
      DispatchQueue.main.async { [weak self] in
        self?.layoutContentView()
      }
     }

  }

  var contentView: UIView? {
    return subviews.first
  }

  var contentType = MediaPlayerContentType.none
  var desiredContentType: MediaPlayerContentType {
    guard let currentItem = self.currentItem else {
      return MediaPlayerContentType.none
    }

    if currentItem.isVideo {
      return MediaPlayerContentType.video
    } else if currentItem.isImage {
      return MediaPlayerContentType.image
    } else {
      return MediaPlayerContentType.none
    }
  }

  var shouldShowVideoView: Bool {
    return desiredContentType == MediaPlayerContentType.video
  }

  var shouldShowImageView: Bool {
    return desiredContentType == MediaPlayerContentType.image
  }



  override func layoutSubviews() {
    super.layoutSubviews()

    layoutContentView()

    if bounds != mediaQueue?.bounds {
      mediaQueue?.bounds = bounds
    }
  }

  var isContentViewImage: Bool { return type(of: contentView) == YeetImageView.self }
  var isContentViewVideo: Bool { return type(of: contentView) == YeetVideoView.self }
  var mediaQueueObserver: NSKeyValueObservation? = nil
  var bridgeObserver: NSKeyValueObservation? = nil

  func layoutContentView() {
    let contentViewShouldChange =  (isContentViewImage && !self.shouldShowImageView)  || (isContentViewVideo  && !self.shouldShowVideoView)

    if contentViewShouldChange {
      if contentView?.superview != nil {
        contentView?.removeFromSuperview()
        self.contentType = MediaPlayerContentType.none
      }


      if isContentViewImage {
        self.imageView = nil
      } else if isContentViewVideo {
        self.videoView = nil
      }
    }

    if shouldShowVideoView {
      if self.videoView == nil {
        let videoView = YeetVideoView(frame: self.bounds, player: player)

        self.videoView = videoView
        self.addSubview(videoView)
      } else {
        self.videoView?.frame = self.bounds
      }

      self.contentType = MediaPlayerContentType.video
    } else if (shouldShowImageView) {
      if self.imageView == nil {
        let imageView = YeetImageView()

        self.imageView = imageView
        self.addSubview(imageView)
      }
      self.imageView?.frame = bounds

      self.imageView?.source = current as! TrackableImageSource?
      self.contentType = MediaPlayerContentType.image
    }
  }

  required init(coder: NSCoder) {
    fatalError("Not implemented")
  }

  var canSendEvents: Bool {
    return bridge?.isValid ?? false
  }

  func handleChange(index: Int?, mediaSource: MediaSource?) {
    guard let _mediaSource = mediaSource else {
      return
    }

    guard let _index = index else {
      return
    }

    DispatchQueue.main.async { [weak self] in
      guard let this = self else {
        return
      }
      let contentViewShouldChange = (this.isContentViewImage && !this.shouldShowImageView)  || (this.isContentViewVideo  && !this.shouldShowVideoView)
      if contentViewShouldChange {
        this.setNeedsDisplay()
      } else if this.shouldShowImageView {
        this.imageView?.source = this.current as! TrackableImageSource?
      }
    }


    if canSendEvents {
      onChangeItem?([
        "index": _index,
        "id": _mediaSource.id,
        "status": mediaQueue!.current!.status.rawValue,
        "url": _mediaSource.uri.absoluteString,
      ])
    }
  }

  @objc(pause)
  func pause() {
    mediaQueue?.pause()
  }

  @objc(play)
  func play() {
    mediaQueue?.play()
  }

  func goNext(cb: TrackableMediaSource.onLoadCallback? = nil) {
    mediaQueue?.advanceToNextItem(cb: cb)
  }

  func goBack(cb: TrackableMediaSource.onLoadCallback? = nil) {
    mediaQueue?.advanceToPreviousItem(cb: cb)
  }

  @objc(advance:::)
  func advance(to: Int, withFrame: Bool = false, cb: TrackableMediaSource.onLoadCallback? = nil) {
    var didPause = true


    let wasPlaying = mediaQueue?.playing == true

    let nextTrack = mediaQueue?.mediaSources[to]

    if withFrame {


    }

    if wasPlaying {
      mediaQueue?.pause()
    }
    mediaQueue?.advance(to: to) { [weak self] tracker in
      cb?(tracker)

      if wasPlaying {
        self?.mediaQueue?.play()
        
      }
    }
  }

  @objc(uiManagerDidPerformLayout:)
  func uiManagerDidPerformLayout(_ manager: RCTUIManager!) {
//    DispatchQueue.main.async { [weak self] in
//      self?.layoutContentView()
//    }
//    
  }

  var hasAutoPlayed = false
  
  @objc(uiManagerDidPerformMounting:)
  func uiManagerDidPerformMounting(_ manager: RCTUIManager!) {
    if (self.hasAutoPlayed || !self.autoPlay) {
      return
    }

    DispatchQueue.main.async {[weak self] in
      guard let this = self else {
        return
      }

      this.current?.load() { [weak self] source in
        guard let this = self else {
          return
        }

        guard source == this.current else {
          return
        }

        if (this.autoPlay && !this.hasAutoPlayed) {
          source.play()
          this.hasAutoPlayed = true
        } else {
          source.prepare()
        }

      }
    }

  }

  func handleReady() {
    guard self.canSendEvents else {
      return
    }

    guard let item = self.currentItem else {
      return
    }

    let index = mediaQueue!.index
    let error = item.isVideo ? mediaQueue!.videoPlayer.error : nil


    self.onLoad?([
      "index": index,
      "id": item.id,
      "status": "ready",
      "error": error,
      "url": item.uri.absoluteString,
    ])
  }

  func handleError() {
    guard self.canSendEvents else {
      return
    }

    guard let item = self.currentItem else {
      return
    }

    let index = mediaQueue!.index
    let error = item.isVideo ? mediaQueue!.videoPlayer.error : nil

    self.onError?([
      "index": index,
      "id": item.id,
      "status": "error",
      "error": error,
      "url": item.uri.absoluteString,
    ])
  }

  func sendStatusUpdate(status: TrackableMediaSource.Status, mediaSource: TrackableMediaSource) {
    guard canSendEvents else {
      return
    }

    guard mediaSource.mediaSource.id == current?.mediaSource.id else {
      return
    }

    if status == .loaded || status == .ready {
      self.onLoad?([
        "index": index,
        "id": mediaSource.mediaSource.id,
        "status": mediaSource.status.rawValue,
        "url": mediaSource.mediaSource.uri.absoluteString,
      ])
    } else if status == .ended {
      self.onEnd?([
        "index": index,
        "id": mediaSource.mediaSource.id,
        "status": mediaSource.status.rawValue,
        "url": mediaSource.mediaSource.uri.absoluteString,
      ])
    } else if status == .error {
      self.onError?([
        "index": index,
        "id": mediaSource.mediaSource.id,
        "status": mediaSource.status.rawValue,
        "url": mediaSource.mediaSource.uri.absoluteString,
      ])
    }

  }

  func handleLoad() {
    
  }

  @objc(invalidate)
  func invalidate() {
    mediaQueue?.stop()
    bridge?.uiManager.observerCoordinator.remove(self)
  }

  deinit {
    mediaQueue?.stop()
    player.firstPlayer.pause()
    player.secondPlayer.pause()
    bridge?.uiManager.observerCoordinator.remove(self)
  }
}
