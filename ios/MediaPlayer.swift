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
final   class MediaPlayer : UIView, RCTUIManagerObserver, RCTInvalidating, TrackableMediaSourceDelegate {
  func onChangeStatus(status: TrackableMediaSource.Status, oldStatus: TrackableMediaSource.Status, mediaSource: TrackableMediaSource) {
    guard mediaSource == current && current != nil else {
      return
    }

    if let id = self.id {
      SwiftyBeaver.debug("\(id): \(oldStatus.stringValue) -> \(status.stringValue)")
    }

    let item = mediaSource.mediaSource

    self.sendStatusUpdate(status: status, mediaSource: mediaSource)


  }

  @objc(prefetch) var prefetch: Bool = false {
    didSet(newValue) {
      self.mediaQueue?.allowPrefetching = newValue
    }
  }

  @objc(didSetProps:)
  override func didSetProps(_ changedProps: Array<String>) {
    super.didSetProps(changedProps)

    if changedProps.contains("paused") {
      self.handleChangePaused()
    }

    if changedProps.contains("isActive") {
      self.handleChangeIsActive()
    }
  }

  func handleChangePaused() {
//    DispatchQueue.main.throttle(deadline: DispatchTime.now() + 0.05) {
      self._handleChangePaused()
//    }
  }

  func _handleChangePaused() {
    guard let mediaQueue = self.mediaQueue else {
      return
    }

    guard let current = self.current else {
      return
    }

    if !paused && current.status != .playing {
      mediaQueue.play()
    } else if paused && current.status != .paused {
      mediaQueue.pause()
    }

    imageView?.isPlaybackPaused = paused
  }

  func handleChangeIsActive() {
//    if isActive {
//      if let wasActive = inactiveStatus {
//        guard let current = self.current else {
//           self.inactiveStatus = nil
//          return
//        }
//
//        if wasActive == .playing {
//          current.load { media in
//            media.start()
//            media.play()
//          }
//        } else if wasActive == .paused {
//          current.load { media in
//            media.start()
//            media.pause()
//          }
//        } else if wasActive == .ready {
//          current.load()
//        }
//
//        inactiveStatus = nil
//      }
//    } else {
//      guard let current = self.current else {
//        self.inactiveStatus = nil
//       return
//     }
//
//      self.inactiveStatus = current.status
//
//      if current.status == .playing || current.status == .paused {
//        current.stop()
//      }
//    }
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

  var imageView: YeetImageView? = nil {
    didSet {
      self.imageView?.tag = self.imageViewTag
    }
  }
  var videoView: YeetVideoView? = nil {
    didSet {
      self.videoView?.tag = self.videoViewTag
    }
  }
  var bridge: RCTBridge? = nil
  var isInitialMount = true

  


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
        self.createMediaQueue(sources: newValue)
        self.setNeedsLayout()
      } else {
        mediaQueue?.update(mediaSources: newValue)
        self.setNeedsLayout()
      }
    }
  }
  var mediaQueue: MediaQueuePlayer? = nil

  func createMediaQueue(sources: Array<MediaSource>) {
    mediaQueue = MediaQueuePlayer(
      mediaSources: sources,
      bounds: bounds,
      id: id as String?,
      allowPrefetching: prefetch
    )  { [weak self] newMedia, oldMedia, index in
      guard let this = self else {
        return
      }

      if let old = oldMedia {
        if old.delegate.containsDelegate(this) {
          old.delegate.removeDelegate(this)
        }
        if old.delegate.containsDelegate(this) {
          old.delegate.removeDelegate(this)
        }

        if let videoView = this.videoView {
          if old.delegate.containsDelegate(videoView) {
            old.delegate.removeDelegate(videoView)
          }
        }
      }

      if let new = newMedia {
        if !new.delegate.containsDelegate(this) {
          new.delegate.addDelegate(this)
        }

        if let videoView = this.videoView {
           if !new.delegate.containsDelegate(videoView) {
             new.delegate.addDelegate(videoView)
           }
         }
      }

      guard let index = this.mediaQueue?.index else {
        return
      }

      this.handleChange(index: index, mediaSource: newMedia?.mediaSource)
    }
  }


  var currentItem: MediaSource? {
    return mediaQueue?.currentItem
  }

  var current: TrackableMediaSource? {
    return mediaQueue?.current
  }

  @objc(paused)
  var paused: Bool = true

  @objc(autoPlay)
  var autoPlay = false

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

    self.backgroundColor = .clear



    bridgeObserver = bridge?.observe(\RCTBridge.isValid) { [weak self] bridge, changes in
      if !bridge.isValid {
        self?.invalidate()
      }
    }


    bridge?.uiManager.observerCoordinator.add(self)
  }

  override init(frame: CGRect) {
    super.init(frame: frame)

  }

  var contentView: UIView? {
    if subviews.isEmpty {
      return nil
    }

    return subviews[0]
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

  @objc(borderRadius)
  var borderRadius = CGFloat.zero {
    didSet (newValue) {
      DispatchQueue.main.async { [weak self] in
        self?.adjustCornerRadius()
      }
    }
  }


  override func layoutSubviews() {
    super.layoutSubviews()

    layoutContentView()

    if bounds != mediaQueue?.bounds {
      mediaQueue?.bounds = bounds
    }

    self.adjustCornerRadius()
  }

  func adjustCornerRadius() {
    self.layer.cornerRadius = borderRadius
    self.clipsToBounds = borderRadius > .zero
    self.layer.masksToBounds = borderRadius > .zero
  }

  let imageViewTag = Int(arc4random())
  let videoViewTag = Int(arc4random())

  var isContentViewImage: Bool { return contentView?.tag == imageViewTag }
  var isContentViewVideo: Bool { return contentView?.tag == videoViewTag }
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
        let videoView = YeetVideoView(frame: self.bounds)

        self.videoView = videoView
        self.addSubview(videoView)
      } else {
        self.videoView?.frame = self.bounds
      }

      if let current = self.current {
        if !current.delegate.containsDelegate(videoView!) {
          current.delegate.addDelegate(videoView!)
        }
        videoView?.mediaSource = current.mediaSource

        videoView!.configurePlayer()
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

//  @objc(uiManagerDidPerformLayout:)
//  func uiManagerDidPerformLayout(_ manager: RCTUIManager!) {
//    DispatchQueue.main.async { [weak self] in
//      self?.layoutContentView()
//    }
//  }

  var hasAutoPlayed = false

  @objc(uiManagerDidPerformMounting:)
  func uiManagerDidPerformMounting(_ manager: RCTUIManager!) {
    guard self.isActive else {
      return
    }


//    self.videoView?.showCover = true

    self.current?.load() { source in
      RCTExecuteOnUIManagerQueue { [weak self] in
        manager.addUIBlock { [weak self] _, _ in
          guard let this = self else {
            return
          }

          let shouldAutoplay = (!this.paused || this.autoPlay) && !this.hasAutoPlayed && this.isActive && source.status != .paused
          source.start()

          if (shouldAutoplay) {
            source.play()
            this.hasAutoPlayed = true
          }
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


    self.onLoad?([
      "index": index,
      "id": item.id,
      "status": "ready",
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


    self.onError?([
      "index": index,
      "id": item.id,
      "status": "error",
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

  var inactiveStatus: TrackableMediaSource.Status? = nil
  @objc(isActive)
  var isActive: Bool = true

  @objc(invalidate)
  func invalidate() {
    mediaQueue?.stop()
    bridge?.uiManager.observerCoordinator.remove(self)
  }

  deinit {
    mediaQueue?.stop()
  }
}
