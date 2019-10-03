//
//  YeetVideoView.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

@objc  class YeetVideoView: UIView {
  var playerLayer: AVPlayerLayer {
    didSet {
      self.setNeedsLayout()
    }
  }

  init(frame: CGRect, playerLayer: AVPlayerLayer) {
    self.playerLayer = playerLayer
    super.init(frame: frame)
  }

  required init?(coder: NSCoder) {
    fatalError()
  }

  override func layoutSublayers(of layer: CALayer) {
    super.layoutSublayers(of: layer)
    if playerLayer.superlayer == nil  && layer != playerLayer {
      playerLayer.frame = layer.bounds
      playerLayer.videoGravity = .resizeAspectFill
      self.layer.addSublayer(playerLayer  )
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
  }
}
