//
//  VideoPool.swift
//  yeet
//
//  Created by Jarred WSumner on 11/3/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

class YeetPlayer : NSObject {
  let player: AVPlayer
  let videoLayer: AVPlayerLayer
  dynamic var key: NSString

  init(player: AVPlayer, key: String) {
    self.key = key as NSString
    self.player = player
    self.videoLayer = AVPlayerLayer.init(player: player)
    super.init()
  }

  func reset() {
    player.currentItem?.cancelPendingSeeks()
  }

  deinit {
    reset()
  }
}

class VideoPool {
  static private var _shared: VideoPool? = nil

  static func shared() -> VideoPool {
    if _shared == nil {
      _shared = VideoPool()
    }

    return _shared!
  }

  var keys = NSMutableOrderedSet()
  var playerMap = NSMapTable<NSString, YeetPlayer>(keyOptions: .strongMemory, valueOptions: .weakMemory)
  var availablePlayers = Array<YeetPlayer>()
  let maxPlayerCount = 10

  var isFull : Bool {
    return playerMap.count >= maxPlayerCount
  }

  func evict(key: NSString) {
    if let player = playerMap.object(forKey: key) {
      player.reset()
    }
    playerMap.removeObject(forKey: key)
    
    if keys.contains(key) {
      let index = keys.index(of: key as String)

      if index > -1 {
        keys.removeObject(at: index)
      }
    }

  }

  func insert(key: String, player: YeetPlayer) {
    playerMap.setObject(player, forKey: key as NSString)
    if availablePlayers.contains(player) {
      player.reset()
      if let index = availablePlayers.firstIndex(of: player) {
        availablePlayers.remove(at: index)
      }
    }
    keys.insert(key, at: keys.count)
    player.key = key as NSString
  }

  func release(key: String) {
    let player = playerMap.object(forKey: key as NSString)
    evict(key: key as NSString)
    player?.reset()

    guard player != nil else {
      return
    }

    availablePlayers.append(player!)
  }

  func use(key: String) -> YeetPlayer {
    if let _player = playerMap.object(forKey: key as NSString) {
      return _player
    } else {
      var player: YeetPlayer? = nil
      if isFull {
        let key = keys.firstObject! as! NSString
        player = playerMap.object(forKey: key)
        evict(key: key)
      }

      if player == nil {
        player = YeetPlayer(player: AVPlayer(), key: key)
      }

      insert(key: key, player: player!)
      return player!
    }
  }
}
