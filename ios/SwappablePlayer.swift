//
//  SwappablePlayer.swift
//  yeet
//
//  Created by Jarred WSumner on 10/6/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

class SwappablePlayer : NSObject {
  let firstPlayer = AVPlayer()
  var firstPlayerLayer: AVPlayerLayer
  var secondPlayer: AVPlayer
  var secondPlayerLayer: AVPlayerLayer

  var muted: Bool {
    get {
      return !firstPlayer.isMuted && !secondPlayer.isMuted
    }

    set (newValue) {
      firstPlayer.isMuted = newValue
      secondPlayer.isMuted = newValue
    }
  }


  func other(player: AVPlayer) -> AVPlayer {
    return player == firstPlayer ? secondPlayer : firstPlayer
  }

  @objc dynamic var currentPlayer: AVPlayer {
    willSet (newValue) {
      if (newValue !== self.currentPlayer) {
        if self.currentPlayer.timeControlStatus != .paused {
          self.currentPlayer.pause()
        }
      }
    }
  }

  override init() {
    self.currentPlayer = firstPlayer
    firstPlayer.automaticallyWaitsToMinimizeStalling = true
    firstPlayerLayer = AVPlayerLayer(player: self.firstPlayer)
    secondPlayer = AVPlayer()
    secondPlayer.automaticallyWaitsToMinimizeStalling = true
    secondPlayerLayer = AVPlayerLayer(player: self.secondPlayer)
    super.init()
  }

  var nextPlayer: AVPlayer {
    return firstPlayer == currentPlayer ? secondPlayer : firstPlayer
  }

  func swap() {
    weak var oldPlayer = currentPlayer
    self.currentPlayer = nextPlayer
//    oldPlayer?.cancelPendingPrerolls()
//    DispatchQueue.main.async {
//      oldPlayer?.currentItem?.cancelPendingSeeks()
//    }

  }
}
