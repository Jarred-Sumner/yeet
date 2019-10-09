//
//  YeetVideoView.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

@objc class YeetVideoView: UIView {
  var firstPlayerLayer: AVPlayerLayer
  var secondPlayerLayer: AVPlayerLayer
  var player: SwappablePlayer
  var observer: NSKeyValueObservation? = nil

  init(frame: CGRect, player: SwappablePlayer) {
    self.player = player
    self.firstPlayerLayer = player.firstPlayerLayer
    self.secondPlayerLayer = player.secondPlayerLayer
    firstPlayerLayer.videoGravity = .resizeAspectFill
    secondPlayerLayer.videoGravity = .resizeAspectFill

    super.init(frame: frame)

    firstPlayerLayer.needsDisplayOnBoundsChange = true
    firstPlayerLayer.frame = frame

    secondPlayerLayer.needsDisplayOnBoundsChange = true
    secondPlayerLayer.frame = frame

    layer.needsDisplayOnBoundsChange = true
    layer.addSublayer(firstPlayerLayer)
    layer.addSublayer(secondPlayerLayer)

    observer = player.observe(\SwappablePlayer.currentPlayer, options: .new) { [weak self] player, change in
      CATransaction.begin()
      CATransaction.setAnimationDuration(.zero)
      if change.newValue == self?.firstPlayerLayer.player {
        self?.firstPlayerLayer.isHidden = false
        self?.secondPlayerLayer.isHidden = true
      } else if change.newValue == self?.secondPlayerLayer.player {
        self?.firstPlayerLayer.isHidden = true
        self?.secondPlayerLayer.isHidden = false
      }
      CATransaction.commit()
    }
  }

  required init?(coder: NSCoder) {
    fatalError()
  }

  override func layoutSubviews() {
    super.layoutSubviews()

    CATransaction.begin()
    CATransaction.setAnimationDuration(.zero)
    firstPlayerLayer.frame = layer.bounds
    secondPlayerLayer.frame = layer.bounds
    CATransaction.commit()
  }

  deinit {
    observer?.invalidate()
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
