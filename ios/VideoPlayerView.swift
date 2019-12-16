//
//  VideoPlayerView.swift
//  yeet
//
//  Created by Jarred WSumner on 11/15/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

class VideoPlayerView: UIView {
    var player: AVPlayer? {
        get {
            return playerLayer.player
        }
        set {
            playerLayer.player = newValue
        }
    }

    var playerLayer: AVPlayerLayer {
        return layer as! AVPlayerLayer
    }

    // Override UIView property
    override static var layerClass: AnyClass {
        return AVPlayerLayer.self
    }

  override init(frame: CGRect) {
    super.init(frame: frame)

    playerLayer.isOpaque = false
    playerLayer.backgroundColor = UIColor.clear.cgColor
    playerLayer.videoGravity = .resizeAspectFill
  }

  override func removeFromSuperview() {
    if playerLayer.player?.timeControlStatus != AVPlayer.TimeControlStatus.paused {
      playerLayer.player?.pause()
    }

    super.removeFromSuperview()
  }

  deinit {
    playerLayer.player = nil
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}
