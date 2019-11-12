//
//  MediaPlayerViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

@objc(MediaFrameViewManager)
class MediaFrameViewManager: RCTViewManager {

  override static func moduleName() -> String! {
    return "MediaFrameView";
  }

  override func view() -> MediaFrameView? {
   return MediaFrameView()
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }


  @objc(updateFrame:queueNode:async:)
  func updateFrame(node: NSNumber, queueNode: NSNumber, async: Bool = true) {
    if async {
      DispatchQueue.main.async { [weak self] in
        guard let queuePlayerView = (self?.bridge.uiManager.view(forReactTag: queueNode) as! MediaPlayer?) else {
          return
        }
        guard let frameView = (self?.bridge.uiManager.view(forReactTag: node) as! MediaFrameView?) else {
          return
        }

         guard let current = queuePlayerView.source as? TrackableVideoSource else {
           return
         }

         guard let playerItem = current.playerItem else {
           return
         }

          DispatchQueue.global(qos: .userInteractive).sync {
            weak var image = frameView.imageFrom(mediaId: current.mediaSource.id, playerItem: playerItem, output: current.mediaSource.videoOutput!)

            DispatchQueue.main.async {
              if frameView.image != image {
                frameView.image = image
              }
            }
          }

      }
    } else {
      DispatchQueue.main.sync { [weak self] in
        guard let queuePlayerView = (self?.bridge.uiManager.view(forReactTag: queueNode) as! MediaPlayer?) else {
          return
        }
        guard let frameView = (self?.bridge.uiManager.view(forReactTag: node) as! MediaFrameView?) else {
          return
        }

         guard let current = queuePlayerView.source as? TrackableVideoSource else {
           return
         }

         guard let playerItem = current.playerItem else {
           return
         }


          weak var image = frameView.imageFrom(mediaId: current.mediaSource.id, playerItem: playerItem, output: current.mediaSource.videoOutput!)

          if frameView.image != image {
            frameView.image = image
          }


      }
    }


  }
}
