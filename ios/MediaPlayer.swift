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
import Promise
import Photos



@objc(MediaPlayer)
final class MediaPlayer : UIView, RCTUIManagerObserver, RCTInvalidating, TrackableMediaSourceDelegate, TransformableView {
  enum MediaPlayerContentType {
    case video
    case image
    case none
  }

  func onChangeStatus(status: TrackableMediaSource.Status, oldStatus: TrackableMediaSource.Status, mediaSource: TrackableMediaSource) {
    guard mediaSource == source && source != nil else {
      return
    }

    if let id = self.id {
      Log.debug("[\(mediaSource.mediaSource.mimeType.rawValue)] \(id): \(oldStatus.stringValue) -> \(status.stringValue)")
    }

    let item = mediaSource.mediaSource

    self.sendStatusUpdate(status: status, mediaSource: mediaSource)


    DispatchQueue.main.async { [weak self] in
      guard let this = self else {
        return
      }

      if this.halted {
        return
      }

      if this.allowSkeleton {
        this.updateSkeletonView(status: status)
      }



      let paused = this.paused

      if status == .ready && mediaSource.mediaSource.isVideo && (this.isWaitingToPlay || !paused) {
        this.play()
        this.isWaitingToPlay = false
      }

      if let imageView = this.imageView {
        let shouldPlay = !imageView.isPlaybackPaused && oldStatus == .paused && status == .playing
        let shouldPause = imageView.isPlaybackPaused && oldStatus == .playing && status != .playing
        if shouldPlay  {
           imageView.isPlaybackPaused = false
         } else if shouldPause {
           imageView.isPlaybackPaused = true
         }
      }

//      if status == .playing && this.videoView?.showCover ?? false {
//        this.videoView?.showCover = false
//      }

    }

  }

  var halted = false



  @objc(prefetch) var prefetch: Bool = false {
    didSet(newValue) {
//      self.mediaQueue?.allowPrefetching = newValue
    }
  }

  var hasContentView: Bool {
    guard let source = self.source else {
      return false
    }

    return (imageView != nil && source.mediaSource.isImage) || (videoView != nil && source.mediaSource.isVideo)
  }

  func handleInitialMount() {
//    self.isSkeletonable = self.allowSkeleton && isContentViewVideo

    if self.allowSkeleton {
      self.updateSkeletonView(status: source?.status ?? .pending)
    }

    if !paused {
      self.play()
    } else if self.source?.mediaSource.isVideo ?? false && self.source?.mediaSource.coverUri != nil {
      self.videoView?.showCover = true
    }

    self.isInitialMount = false
  }

  var movableViewTag: NSNumber? = nil
  var movableView : MovableView? {
    guard let tag = movableViewTag else {
      return nil
    }

    guard self.bridge?.isValid ?? false else {
      return nil
    }

    return self.bridge?.uiManager.view(forReactTag: tag) as? MovableView
  }


  @objc(didSetProps:)
  override func didSetProps(_ changedProps: Array<String>) {
    super.didSetProps(changedProps)

    guard hasContentView else {
      self.setNeedsLayout()
       return
     }

    if isInitialMount  {
      self.handleInitialMount()
    } else {
      if changedProps.contains("paused") {
        self.handleChangePaused()
      }

      if changedProps.contains("muted") {
        DispatchQueue.main.async { [weak self] in
          self?.videoSource?.player?.isMuted = (self?.muted ?? false)
        }
      }

//      if changedProps.contains("allowSkeleton") {
//        self.updateSkeletonView()
//      }

      if changedProps.contains("isActive") {
        self.handleChangeIsActive()
      }
    }

  }

  @objc(allowSkeleton)
  var allowSkeleton: Bool = false

  func updateSkeletonView(status: TrackableMediaSource.Status) {
//    if source?.mediaSource.mimeType.isAnimatable() ?? false {
//      return
//    }
//    guard source?.tonmediaSource.isVideo ?? false else {
//      return
//    }
//
//    let shouldShowSkeleton = [.loading, .pending].contains(status)
//
//    let canShowSkeleton = ((self.videoView?.showCover ?? false) == false && source?.mediaSource.coverUri == nil)
//
//    if self.allowSkeleton && shouldShowSkeleton && canShowSkeleton {
//      guard !self.isSkeletonActive else {
//        return
//      }
//      self.showAnimatedSkeleton(usingColor: UIColor.gray) // Solid
//    } else if self.allowSkeleton && !shouldShowSkeleton {
//      guard self.isSkeletonActive else {
//        return
//      }
//
//      self.hideSkeleton()
//    }
  }


  func handleChangePaused() {
//    DispatchQueue.main.throttle(deadline: DispatchTime.now() + 0.05) {
      self._handleChangePaused()
//    }
  }

  var isStaticMedia : Bool {
    return videoSource == nil && imageView?.animatedImage == nil
  }

  func _handleChangePaused() {
    guard hasContentView else {
      return
    }

    guard !isStaticMedia else {
      return
    }

    let paused = self.paused ?? true
    Log.debug("PAUSEWD? \(paused)")

    guard let current = self.source else {
      return
    }

    if !paused {
      Log.debug("WILL PLAY \(id)")
      self.play()
    } else if paused {
      isWaitingToPlay = false
      Log.debug("WILL PAUSE \(id)")
      self.pause()

    }

  }

  func handleChangeIsActive() {

  }

  func onMediaProgress(elapsed: Double, mediaSource: TrackableMediaSource) {
    let item = mediaSource.mediaSource

    guard item == currentItem else {
      return
    }

    guard self.canSendEvents else {
      return
    }



    if let onProgress = onProgress {
      onProgress([
        "index": 0,
        "id": item.id,
        "status": mediaSource.status.stringValue,
        "url": item.uri.absoluteString,
        "elapsed": elapsed * 1000,
        "duration": mediaSource.duration * 1000,
        "interval": TrackableMediaSource.periodicInterval * 1000,
      ])
    }
  }

  var imageView: YeetImageView? {
    let imageViewTag = self.imageViewTag
    return viewWithTag(imageViewTag) as? YeetImageView
  }

  var videoView: YeetVideoView? {
    let videoViewTag = self.videoViewTag
   return viewWithTag(videoViewTag) as? YeetVideoView
  }
  var bridge: RCTBridge? = nil
  var isInitialMount = true


  @objc(id) var id: NSString? {
    didSet(newValue) {

    }
  }

  @objc(sources)
  var sources: Array<MediaSource>? {
    get {
      if source == nil {
        return nil
      } else {
        return [source!.mediaSource]
      }
    }

    set (newValue) {
      if let first = newValue?.first {
        guard first.id != self.source?.mediaSource.id else {
          return
        }
        source = TrackableMediaSource.source(first, bounds: bounds)
        source?.alwaysLoop = true

       
      } else {
        if let source = source as? TrackableVideoSource {
          source.player?.pause()
          source.player = nil
        }
        source = nil
      }
    }
  }

  @objc(source)
  var source: TrackableMediaSource? {
    willSet (newValue) {
      guard let source = self.source else {
        return
      }

      if source.delegate.containsDelegate(self) {
        source.delegate.removeDelegate(self)
      }

      if let videoView = self.videoView {
        if source.delegate.containsDelegate(videoView) {
          source.delegate.removeDelegate(videoView)
        }
      }

    }
    didSet {
      guard let source = self.source else {
        return
      }

      source.delegate.addDelegate(self)
      if let videoView = videoView {
        source.delegate.addDelegate(videoView)
      }
    }
  }

  var currentItem: MediaSource? {
    return source?.mediaSource
  }

  @objc(paused)
  var paused: Bool = true

  @objc(autoPlay)
  var autoPlay = false

  @objc(onChangeItem)
  var onChangeItem: RCTDirectEventBlock? = nil

  @objc(onLoad)
  var onLoad: RCTDirectEventBlock? = nil

  @objc(onPlay)
  var onPlay: RCTDirectEventBlock? = nil

  @objc(onPause)
  var onPause: RCTDirectEventBlock? = nil

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

    if (self.layer.cornerRadius != borderRadius) {
      self.adjustCornerRadius()
    }

    if isInitialMount {
      self.handleInitialMount()
    }
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
    if (invalidated) {
      return
    }

    let contentViewShouldChange =  (isContentViewImage && !self.shouldShowImageView)  || (isContentViewVideo  && !self.shouldShowVideoView)

    if contentViewShouldChange {
      if contentView?.superview != nil {
        contentView?.removeFromSuperview()
        self.contentType = MediaPlayerContentType.none
      }
    }

    if shouldShowVideoView {
      var shouldAutoPlay =  videoView == nil && (self.autoPlay || !self.paused)
      let frame = CGRect(origin: .zero, size: self.bounds.size)

      if self.videoView == nil {
        let videoView = YeetVideoView(frame: reactContentFrame)
        videoView.bounds = self.bounds
        videoView.frame = reactContentFrame
        videoView.tag = self.videoViewTag

        self.addSubview(videoView)
        self.updateScale()
      } else {
        videoView!.bounds = self.bounds
        videoView!.frame = reactContentFrame
      }

      if let current = self.source as? TrackableVideoSource {
        if !current.delegate.containsDelegate(videoView!) {
          current.delegate.addDelegate(videoView!)
        }

        self.videoView?.mediaSource = current.mediaSource

        if current.mediaSource.coverUri != nil && !current.canPlay {
          self.videoView?.showCover = true
        }
      }

      self.contentType = MediaPlayerContentType.video
    } else if (shouldShowImageView) {
      if self.imageView == nil {
        let imageView = YeetImageView()
        imageView.tag = imageViewTag

        self.addSubview(imageView)
        self.updateScale()
      }
      guard let imageView = self.imageView else {
        return
      }

      imageView.bounds = self.bounds
      imageView.frame = reactContentFrame

      let imageSource = source as! TrackableImageSource?

      if imageView.source != imageSource {
        if paused && imageSource?.mediaSource.mimeType.isAnimatable() ?? false {
          imageView.isPlaybackPaused = true
        }

        imageView.source = imageSource
      }

      imageView.resizeMode = self.resizeMode

      self.contentType = MediaPlayerContentType.image
    }

//    self.isSkeletonable = allowSkeleton
  }

  required init(coder: NSCoder) {
    fatalError("Not implemented")
  }

  var canSendEvents: Bool {
    return bridge?.isValid ?? false && !halted && !invalidated
  }

  var hasSetContentScale = false
  var scale: CGFloat = CGFloat(1) {
    didSet {
      if self.scale != oldValue {
        self.updateScale()

         hasSetContentScale = true
      }
    }

  }

  func updateScale() {
    DispatchQueue.main.throttle(deadline: DispatchTime.now() + 0.1, context: self) { [weak self] in
      self?._updateScale()
    }
  }

  func _updateScale() {
    let nativeScale = self.scale * UIScreen.main.scale
    if let imageView = self.imageView {
      imageView.contentScaleFactor = scale
      imageView.layer.contentsScale = nativeScale
    } else if let videoView = self.videoView {
      videoView.contentScaleFactor = scale
      videoView.coverView.contentScaleFactor = scale
      videoView.coverView.layer.contentsScale = nativeScale
      videoView.playerLayer.contentsScale = nativeScale
    }


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
        this.setNeedsLayout()
      } else if this.shouldShowImageView {
        this.imageView?.source = this.source as! TrackableImageSource?
      }
    }


    if canSendEvents {
      onChangeItem?([
        "index": _index,
        "id": _mediaSource.id,
        "status": source!.status.rawValue,
        "url": _mediaSource.uri.absoluteString,
      ])
    }
  }

  @objc(pause)
  func pause() {
    if imageView != nil {
      imageView?.isPlaybackPaused = true
    }
    source?.pause()
    if let videoSource = self.videoSource {
      videoSource.elapsed = videoSource.player?.currentTime().seconds ?? videoSource.elapsed
    }
    self.playerLayerObserver?.invalidate()
    self.isWaitingToPlay = false
  }

  @objc(reset)
  func reset() {
      if self.videoSource != nil {
        if let videoSource = videoSource {
          videoSource.elapsed = videoSource.player?.currentTime().seconds ?? videoSource.elapsed
          videoSource.player?.pause()
          videoSource.looper?.disableLooping()
          videoSource.player = nil
        }

        self.isWaitingToPlay = false
      } else if let imageView = self.imageView {
        imageView.reset()
      }

  }

  @objc(containerTag) var containerTag: NSNumber? = nil
  var containerView : UIView? {
    guard let tag = containerTag else {
      return nil
    }

    guard self.bridge?.isValid ?? false else {
      return nil
    }

    return self.bridge?.uiManager.view(forReactTag: tag)
  }

  var _resizeMode: String = YeetImageView.YeetImageViewResizeMode.aspectFit.rawValue;

     @objc(resizeMode)
     var resizeMode: String {
       get {
        return _resizeMode
       }

       set (newValue) {
          _resizeMode = newValue
          self.imageView?.resizeMode = newValue
       }
     }

  func haltContent() {
    imageView?.isPlaybackPaused = true

    if let videoSource = self.videoSource {
      if videoSource.player != nil {

        videoSource.player?.pause()
        videoSource.looper?.disableLooping()
        videoSource.player?.currentItem?.cancelPendingSeeks()
        videoSource.player?.removeAllItems()
        videoSource.player = nil
        videoView?.showCover = true

        videoSource.status = .pending
      }
    }

  }

  func saveToCameraRoll() -> Promise<Bool> {
    return Promise(queue: .global(qos: .background)) { [weak self] resolve, reject in
      guard let current = self?.source else {
        reject(YeetError.init(code: .saveFailed))
        return
      }


      if let videoSource = current as? TrackableVideoSource {
        let uri = videoSource.mediaSource.getAssetURI()
        guard uri.scheme == "file" else {
          DispatchQueue.main.async { [weak self] in
            let alertController = UIAlertController(title: "Video is still downloading, please wait a little and try again.", message: nil, preferredStyle: .alert)
            let defaultAction = UIAlertAction(title: "OK", style: .default, handler: nil)
            alertController.addAction(defaultAction)
            self?.reactViewController().present(alertController, animated: true, completion: nil)
          }
          reject(YeetError.init(code: .saveFailed))
          return
        }

        PHPhotoLibrary.shared().performChanges({
          PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: uri)
          }) { [weak self] saved, error in
            if (error != nil || !saved) {
              reject(error ?? YeetError.init(code: .saveFailed))
              return
            }

            DispatchQueue.main.async { [weak self] in
              let alertController = UIAlertController(title: "Video was successfully saved", message: nil, preferredStyle: .alert)
              let defaultAction = UIAlertAction(title: "OK", style: .default, handler: nil)
              alertController.addAction(defaultAction)
              self?.reactViewController().present(alertController, animated: true, completion: nil)
            }
            resolve(true)
        }
      } else if let imageSource = current as? TrackableImageSource {
        DispatchQueue.main.async { [weak self] in
          guard let image = self?.imageView?.image else {
            let alertController = UIAlertController(title: "Image is still downloading, please wait a little and try again.", message: nil, preferredStyle: .alert)
            let defaultAction = UIAlertAction(title: "OK", style: .default, handler: nil)
            alertController.addAction(defaultAction)
            self?.reactViewController().present(alertController, animated: true, completion: nil)
            reject(YeetError.init(code: .saveFailed))
            return
          }

          PHPhotoLibrary.shared().performChanges({
            PHAssetChangeRequest.creationRequestForAsset(from: image)
            }) { [weak self] saved, error in

              if saved {
                DispatchQueue.main.async {
                  let alertController = UIAlertController(title: "Image was successfully saved", message: nil, preferredStyle: .alert)
                  let defaultAction = UIAlertAction(title: "OK", style: .default, handler: nil)
                  alertController.addAction(defaultAction)
                  self?.reactViewController().present(alertController, animated: true, completion: nil)
                }


                resolve(true)
              } else {
                reject(error ?? YeetError.init(code: .saveFailed))
            }

          }
        }
      } else {
        reject(YeetError.init(code: .saveFailed))
      }

    }
  }

  var isWaitingToPlay = false;
  var playerLayerObserver: NSKeyValueObservation? = nil
  @objc(play)
  func play() {
    guard let source = source else {
      return
    }

    weak var videoSource = source as? TrackableVideoSource

    if videoSource != nil {
//      guard !isWaitingToPlay else {
//        return
//      }

      do {
        try AVAudioSession.sharedInstance().setCategory(AVAudioSession.Category.playback, mode: AVAudioSession.Mode.default, options: .mixWithOthers)
        #if DEBUG

        #else
          try AVAudioSession.sharedInstance().setActive(true)
        #endif
      } catch {

      }


      if !videoSource!.canPlay || videoView?.playerView.superview == nil || videoSource?.player == nil {

        if videoSource?.mediaSource.coverUri != nil {
          self.videoView?.showCover = true
        }

        DispatchQueue.main.async { [weak self] in
          let player = videoSource?.player ?? AVQueuePlayer()
          player.isMuted = self?.muted ?? false

          if self?.videoView?.playerLayer.player != player {
             self?.videoView!.configurePlayer(player: player)
           }

          DispatchQueue.global(qos: .background).async { [weak self] in
            self?.videoSource?.start(player: player, autoPlay: true)
            self?.playWhenReady(player: player)
          }
        }
      } else {
        self.playWhenReady(player: videoSource!.player!)
      }
    } else {
      if imageView?.isPlaybackPaused ?? false {
        imageView?.isPlaybackPaused = false
      }
      source.play()
    }
  }

  func playWhenReady(player: AVPlayer) {
    if player.currentItem?.status == .readyToPlay {
      source?.play()
      isWaitingToPlay = false
    } else {
      isWaitingToPlay = true
    }
  }

  func goNext(cb: TrackableMediaSource.onLoadCallback? = nil) {
//    mediaQueue?.advanceToNextItem(cb: cb)
  }

  func goBack(cb: TrackableMediaSource.onLoadCallback? = nil) {
//    mediaQueue?.advanceToPreviousItem(cb: cb)
  }

  @objc(advance:::)
  func advance(to: Int, withFrame: Bool = false, cb: TrackableMediaSource.onLoadCallback? = nil) {

  }

  var hasAutoPlayed = false

  func sendStatusUpdate(status: TrackableMediaSource.Status, mediaSource: TrackableMediaSource) {
    guard canSendEvents else {
      return
    }

    guard mediaSource.mediaSource.id == source?.mediaSource.id else {
      return
    }

    var eventBlock: RCTDirectEventBlock? = nil

    if status == .loaded || status == .ready {
      eventBlock = onLoad
    } else if status == .playing {
      eventBlock = onPlay
    } else if status == .paused {
      eventBlock = onPause
    } else if status == .ended {
      eventBlock = onEnd
    } else if status == .error {
      eventBlock = onError
    }

    if eventBlock != nil {
      eventBlock!([
        "index": index,
        "id": mediaSource.mediaSource.id,
        "status": mediaSource.status.rawValue,
        "url": mediaSource.mediaSource.uri.absoluteString,
        "duration": mediaSource.duration,
        "interval": TrackableMediaSource.periodicInterval * 1000,
        "elapsed": mediaSource.elapsed,
        "error": mediaSource.error?.localizedDescription ?? nil
      ])
    }
  }

  @objc(isActive)
  var isActive: Bool = true

  @objc(muted)
  var muted: Bool = false

  private var invalidated = false
  @objc(invalidate)
  func invalidate() {
    invalidated = true
    bridgeObserver?.invalidate()
    bridgeObserver = nil
  }

  @objc(didMoveToWindow)
  override func didMoveToWindow() {
    super.didMoveToWindow()

    let isVisible = superview != nil && window != nil
    let isDetachedView = superview != nil && window == nil

    if (isVisible) {
      
    } else if (isDetachedView && !invalidated) {
      self.haltContent()
      self.halted = true
    } else if (isDetachedView && invalidated) {
      self.source?.stop()
      self.reset()
      videoView?.reset()
      self.imageView?.removeFromSuperview()
      self.videoView?.removeFromSuperview()
      self.source = nil
    }
  }

  override func willMove(toWindow newWindow: UIWindow?) {
    super.willMove(toWindow: newWindow)

    let wasDetached = superview != nil && window == nil && newWindow != nil
    if (wasDetached && halted) {
      self.unhaltContent()
      self.halted = false
    }
  }

  func unhaltContent() {
    if !self.paused {
      play()
    }

    if imageView?.isPlaybackPaused ?? false {
      imageView?.isPlaybackPaused = false
    }
  }

  var sharableMimeType : MimeType {
    if let image = imageView?.image {
      return image.sharableMimeType
    } else if let video = source as? TrackableVideoSource {
      if video.mediaSource.mimeType == .mp4 {
        return .mp4
      } else {
        return .mov
      }
    } else {
      return .jpg
    }
  }


  var sharableData : Data? {
    if let image = imageView?.image {
      return image.sharableData
    } else if let video = source as? TrackableVideoSource {
      guard let asset = video.mediaSource.asset else {
        return nil
      }

      do {
        return try Data.init(contentsOf: asset.url)
      } catch {
        Log.error(error)
        return nil
      }
    } else {
      return nil
    }
  }



  var videoSource: TrackableVideoSource? {
    return source as? TrackableVideoSource
  }

  var imageSource: TrackableImageSource? {
    return source as? TrackableImageSource
  }

  deinit {
    source?.stop()
    bridgeObserver?.invalidate()
    Log.debug("DEINIT \(source?.mediaSource.id)-\(id)")

    if let videoSource = self.videoSource {
      videoSource.player?.pause()
      videoSource.player = nil

      videoView?.playerLayer.player = nil
    }


  }
}
