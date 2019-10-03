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
class MediaPlayer : UIView, RCTUIManagerObserver, RCTInvalidating {
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
          onChange: { [weak self] newIndex, mediaSource in
            self?.handleChange(index: newIndex, mediaSource: mediaSource)
          },
          onProgress: { [weak self] newIndex, mediaSource, elapsed, totalElapsed, interval in
            guard let index = newIndex else {
              return
            }

            guard let item = mediaSource else {
              return
            }

            if self?.canSendEvents ?? false {
              self?.onProgress([
                "index": index,
                "id": item.id,
                "url": item.uri.absoluteString,
                "assetPosition": CMTimeGetSeconds(elapsed),
                "interval": interval,
                "elapsed": CMTimeGetSeconds(totalElapsed),
              ])
            }
        }) { [weak self] newIndex, mediaSource in
          if self?.canSendEvents ?? false {
            self?.onEnd([
              "index": newIndex!,
              "id": mediaSource!.id,
              "url": mediaSource!.uri.absoluteString,
            ])
          }
        }



        self.setNeedsLayout()
      } else {
        mediaQueue?.update(mediaSources: newValue)
        self.setNeedsLayout()
      }
    }
  }
  var mediaQueue: MediaQueuePlayer? = nil
  var playerLayer : AVPlayerLayer? {
    return mediaQueue?.playerLayer
  }

  var currentItem: MediaSource? {
    return mediaQueue?.currentItem
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
  var onChangeItem: RCTDirectEventBlock = { _ in }

  @objc(onLoad)
  var onLoad: RCTDirectEventBlock = { _ in }

  @objc(onEnd)
  var onEnd: RCTDirectEventBlock = { _ in }

  @objc(onError)
  var onError: RCTDirectEventBlock = { _ in }

  @objc(onProgress)
  var onProgress: RCTDirectEventBlock = { _ in }

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
        let videoView = YeetVideoView(frame: self.bounds, playerLayer: mediaQueue!.playerLayer)
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
        imageView.onLoadImage = { [weak self] response in
          

          self?.mediaQueue?.play()
        }
      }
      self.imageView?.frame = bounds

      self.imageView?.source = mediaQueue!.currentItem
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
        this.imageView?.source = mediaSource
      }
    }


    if canSendEvents {
      onChangeItem(["url": _mediaSource.uri.absoluteString, "index": _index])
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

  @objc(goNext)
  func goNext() {
    mediaQueue?.advanceToNextItem()
  }

  @objc(goBack)
  func goBack() {
    mediaQueue?.advanceToPreviousItem()
  }

  @objc(advance:)
  func advance(to: Int) {
    mediaQueue?.advance(to: to)
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

      guard this.hasAutoPlayed == false else {
        return
      }

      guard this.autoPlay else {
        return
      }

      if this.contentType == MediaPlayerContentType.video {
        this.mediaQueue?.videoPlayer.seek(to: .zero)
      }

      this.play()
      this.hasAutoPlayed = true
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


    self.onLoad([
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



    self.onLoad([
      "index": index,
      "id": item.id,
      "status": "error",
      "error": error,
      "url": item.uri.absoluteString,
    ])
  }

  @objc(invalidate)
  func invalidate() {
    mediaQueue?.stop()
    bridge?.uiManager.observerCoordinator.remove(self)
  }

  deinit {
    mediaQueue?.stop()
    bridge?.uiManager.observerCoordinator.remove(self)
  }
}
