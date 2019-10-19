//
//  VideoResizer.swift
//  yeet
//
//  Created by Jarred WSumner on 10/15/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import UIKit
import AVFoundation
import Promises
import SwiftyBeaver

extension AVAsset {
  func resize(to: CGRect, transform: CGAffineTransform, duration: CMTime, backgroundColor: UIColor? = UIColor.systemPink, scale: Float = Float(UIScreen.main.nativeScale)) -> Promise<AVURLAsset> {
    return Promise(on: .global(qos: .background)) { [weak self] resolve, reject in
      self?.resize(to: to, bounds: to, transform: transform, duration: duration, backgroundColor: backgroundColor, scale: scale) { asset, error in
        if let asset = asset {
          resolve(asset)
        } else {
          reject(error ?? NSError(domain: "com.codeblogcorp.yeet.avasset-resize", code: 0, userInfo: nil))
        }

      }
    }
  }

  func resize(to: CGRect, bounds: CGRect, transform: CGAffineTransform, duration: CMTime, backgroundColor: UIColor? = UIColor.systemPink, scale: Float = Float(UIScreen.main.nativeScale)) -> Promise<AVURLAsset> {
    return Promise(on: .global(qos: .background)) { [weak self] resolve, reject in
      self?.resize(to: to, bounds: bounds, transform: transform, duration: duration, backgroundColor: backgroundColor, scale: scale) { asset, error in
           if let asset = asset {
             resolve(asset)
           } else {
             reject(error ?? NSError(domain: "com.codeblogcorp.yeet.avasset-resize", code: 0, userInfo: nil))
           }

      }
    }
  }

  func resize(to: CGRect, bounds: CGRect, transform: CGAffineTransform, duration: CMTime, backgroundColor: UIColor? = UIColor.systemPink, scale: Float = Float(UIScreen.main.nativeScale), completion: @escaping (_ asset: AVURLAsset?, _ error: Error?) -> Void) {
    let composition = AVMutableComposition()


    let videoComposition = AVMutableVideoComposition()
    videoComposition.renderSize = bounds.size.applying(CGAffineTransform(scaleX: CGFloat(scale), y: CGFloat(scale)))

    let videoTrack = tracks(withMediaType: .video).first!
    videoComposition.frameDuration = videoTrack.minFrameDuration

    var currentSize = CGSize.zero


    let instruction = AVMutableVideoCompositionInstruction()
    instruction.timeRange = videoTrack.timeRange
    instruction.backgroundColor = UIColor.clear.cgColor
    currentSize = videoTrack.naturalSize

    let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: videoTrack)

    let scaleX = to.size.width / currentSize.width
    layerInstruction.setTransform(transform.translatedBy(x: to.origin.x, y: to.origin.y).scaledBy(x: scaleX, y: scaleX).scaledBy(x: CGFloat(scale), y: CGFloat(scale)), at: .zero)

    let track = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)
    try! track?.insertTimeRange(videoTrack.timeRange, of: videoTrack, at: videoTrack.timeRange.start)

    instruction.layerInstructions.append(layerInstruction)
    videoComposition.instructions.append(instruction)


    var presetName = AVAssetExportPresetHighestQuality

    if #available(iOS 13.0, *) {
      presetName = AVAssetExportPresetHighestQuality
    }

    guard let session = AVAssetExportSession(asset: self, presetName: presetName) else {
      completion(nil, nil)
      return
    }


    session.timeRange = CMTimeRange(start: CMTime(seconds: 0, preferredTimescale: CMTimeScale(1)), duration: duration)
    session.shouldOptimizeForNetworkUse = false
    session.outputFileType = [AVFileType.mp4, AVFileType.mov].first { type in
      return session.supportedFileTypes.contains(type)
    }

    session.videoComposition = videoComposition
    session.outputURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(session.outputFileType == AVFileType.mp4 ?  ".mp4" : ".mov"))
    session.exportAsynchronously(completionHandler: { [weak self] in
    SwiftyBeaver.info("""
Resize Video
      \(currentSize) -> \(to)
      Render Size: \(videoComposition.renderSize)
      Success?: \(session.status == AVAssetExportSession.Status.completed)
      Path: \(session.outputURL!.absoluteString)
      Duration: \(CMTimeGetSeconds(duration))

""")
      if session.status == AVAssetExportSession.Status.completed {
        completion(AVURLAsset(url: session.outputURL!), nil)
      } else {
        completion(nil, session.error)
      }

    })
  }
}
