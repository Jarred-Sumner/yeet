//
//  YeetVideoView.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

@objc class YeetVideoView: UIView, TrackableMediaSourceDelegate {
  func onChangeStatus(status: TrackableMediaSource.Status, oldStatus: TrackableMediaSource.Status, mediaSource: TrackableMediaSource) {
    if mediaSource.mediaSource.isVideo {
      guard let trackableVideo = mediaSource as? TrackableVideoSource else {
        return
      }
      self.mediaSource = mediaSource.mediaSource

      DispatchQueue.main.async {
        if self.playerContainer != nil && trackableVideo.playerContainer != self.playerContainer {
          self.playerContainer?.reset()
        }

        self.playerContainer = trackableVideo.playerContainer

        self.configurePlayer()
      }
    } else {

    }
  }

  var mediaSource: MediaSource? = nil {
    didSet {
      if coverView.mediaSource != mediaSource?.coverMediaSource {
        self.coverView.mediaSource = mediaSource?.coverMediaSource
      }

      if oldValue != mediaSource {
        observer?.invalidate()
      }
    }
  }

  func onMediaProgress(elapsed: Double, mediaSource: TrackableMediaSource) {
  }

  dynamic var playerContainer: YeetPlayer? = nil {
    didSet {
      self.showCover = playerContainer == nil

      if oldValue != playerContainer {
        observer?.invalidate()

        if let playerLayer = playerLayer {
          observer = playerLayer.observe(\AVPlayerLayer.isReadyForDisplay, options: [.new, .initial] ) { [weak self] playerLayer, _ in
            guard playerLayer == self?.playerLayer else {
              self?.observer?.invalidate()
              return
            }

            if playerLayer.isReadyForDisplay && self?.showCover ?? false {
              self?.showCover = false
            }

          }
        } else {
          observer = nil
        }
      }


    }
  }

  var player: AVPlayer? {
    get {
      return playerContainer?.player
    }
  }
  var playerLayer: AVPlayerLayer? {
    get {
      return playerContainer?.videoLayer
    }
  }


  var showCover: Bool = false {
    didSet {
      DispatchQueue.main.async {
        if oldValue != self.showCover {
          if self.showCover && self.coverView.image == nil && self.coverView.mediaSource != nil && !self.coverView.isLoadingImage {
            self.coverView.loadImage(async: true)
          }

          self.coverView.isHidden = !self.showCover
        }
      }
    }
  }
  var coverView = YeetImageView()
  var playerView = UIView()

  var observer: NSKeyValueObservation? = nil

  func configurePlayer() {
    if let playerLayer = self.playerLayer {
      if playerLayer.superlayer != playerView.layer {

        let shouldAntiAlias = frame.size.width < UIScreen.main.bounds.size.width
         playerLayer.edgeAntialiasingMask = shouldAntiAlias ? [.layerBottomEdge, .layerTopEdge, .layerLeftEdge, .layerRightEdge] : []
         playerLayer.frame = frame
        playerLayer.isOpaque = false
          playerView.frame = frame
         playerLayer.needsDisplayOnBoundsChange = true
         playerLayer.bounds = bounds
        playerLayer.backgroundColor = UIColor.clear.cgColor
        playerView.bounds = bounds
         playerLayer.videoGravity = .resizeAspectFill

        if playerLayer.superlayer != nil {
          playerLayer.removeFromSuperlayer()
        }

        playerView.layer.addSublayer(playerLayer)


      }

      if playerLayer.isReadyForDisplay && showCover  {
        showCover = false
      }
    }
  }

  override init(frame: CGRect) {
    super.init(frame: frame)
    layer.needsDisplayOnBoundsChange = true
    playerView.layer.needsDisplayOnBoundsChange = true
    coverView.layer.needsDisplayOnBoundsChange = true
    playerView.bounds = frame
    playerView.isOpaque = false
    playerView.backgroundColor = UIColor.clear
    coverView.bounds = frame
    playerView.frame = bounds
    coverView.frame = bounds
    coverView.isOpaque = false


    self.addSubview(playerView)
    self.addSubview(coverView)

  }

  required init?(coder: NSCoder) {
    fatalError()
  }

  override func layoutSubviews() {
    super.layoutSubviews()

    if let playerLayer = playerLayer {
      if playerView.bounds != bounds {
        CATransaction.begin()
        CATransaction.setAnimationDuration(.zero)
        playerView.bounds = bounds
        playerLayer.bounds = bounds
        CATransaction.commit()
      }
    }

    if coverView.bounds != bounds {
      coverView.frame = bounds
      coverView.bounds = frame
    }
  }

  deinit {
    observer?.invalidate()
    player?.pause()

    if playerLayer?.superlayer != nil {
      playerLayer?.removeFromSuperlayer()
    }


  }
}

//
//import UIKit
//import AVKit
//import AVFoundation
//
//class YeetVideoView: UIView {
//    var player: AVPlayer? {
//        get {
//            return playerLayer.player
//        }
//        set {
//            playerLayer.player = newValue
//          playerLayer.videoGravity = .resizeAspectFill
//        }
//    }
//
//
//
//    var playerLayer: AVPlayerLayer {
//        return layer as! AVPlayerLayer
//    }
//
//    // Override UIView property
//    override static var layerClass: AnyClass {
//        return AVPlayerLayer.self
//    }
//}
