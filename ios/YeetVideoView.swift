//
//  YeetVideoView.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

@objc  class YeetVideoView: UIView {
  var swapPlayer = AVPlayer()
  var swapPlayerLayer: AVPlayerLayer

  var playerLayer: AVPlayerLayer {
    didSet {
      self.setNeedsLayout()
    }
  }

  init(frame: CGRect, playerLayer: AVPlayerLayer) {
    self.playerLayer = playerLayer
    playerLayer.videoGravity = .resizeAspectFill
    swapPlayerLayer = AVPlayerLayer(player: swapPlayer)


    super.init(frame: frame)

    playerLayer.needsDisplayOnBoundsChange = true
    playerLayer.frame = frame

    swapPlayerLayer.needsDisplayOnBoundsChange = true
    swapPlayerLayer.frame = frame
    swapPlayerLayer.isHidden = true

    layer.needsDisplayOnBoundsChange = true
    layer.addSublayer(playerLayer)
    layer.addSublayer(swapPlayerLayer)
  }

  func swapCurrentItem(playerItem: AVPlayerItem, time: CMTime) {
    guard let player = playerLayer.player else {
      return
    }

    swapPlayer.seek(to: time)
    swapPlayer.replaceCurrentItem(with: playerItem)
    swapPlayer.play()

    swapPlayerLayer.isHidden = false
  }

  func unswap() {
    swapPlayerLayer.isHidden = true
    swapPlayer.pause()
    swapPlayer.replaceCurrentItem(with: nil)
    swapPlayer.cancelPendingPrerolls()
  }

  required init?(coder: NSCoder) {
    fatalError()
  }

  override func layoutSubviews() {
    super.layoutSubviews()


    CATransaction.begin()
    CATransaction.setAnimationDuration(.zero)
    playerLayer.frame = layer.bounds
    swapPlayerLayer.frame = layer.bounds
    CATransaction.commit()

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
