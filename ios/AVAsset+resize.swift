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
import Photos
import NextLevelSessionExporter


extension AVURLAsset {
  static func resolveCameraURL(cameraURL: URL) -> Promise<URL?> {
    return Promise(on: .global(qos: .background)) { resolve, reject in
      let fetchOpts = PHFetchOptions.init()
      fetchOpts.fetchLimit = 1

      var fetchResult = PHAsset.fetchAssets(withALAssetURLs: [cameraURL], options: fetchOpts)
      guard let videoAsset = fetchResult.firstObject else {
        resolve(nil)
        return
      }

        let options: PHVideoRequestOptions = PHVideoRequestOptions()
        options.version = .original

        PHImageManager.default().requestAVAsset(forVideo: videoAsset, options: options, resultHandler: { (asset, audioMix, info) in
            if let urlAsset = asset as? AVURLAsset {
                let localVideoUrl = urlAsset.url
                resolve(localVideoUrl)
            } else {
                resolve(nil)
            }
        })
    }
  }

  func resize(url: URL, to: CGRect, duration: Double, scale: CGFloat) -> Promise<AVURLAsset> {
    let dest = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(url.pathExtension.contains("mov") ?  ".mov" : ".mp4"))

    let width = Int(floor(to.width - to.origin.x))
    let height = Int(floor(to.height - to.origin.y))

    return Promise(on: .global(qos: .background)) { [weak self] resolve, reject in
      let asset = AVURLAsset(url: url)

      asset.loadValuesAsynchronously(forKeys: ["tracks", "duration"]) {
        guard let videoTrack = asset.tracks(withMediaType: .video).first else {
          // TADA!
          SwiftyBeaver.error("Tried to resize AVURLAsset without a video track")
          resolve(self!)
          return
        }

        let exporter = NextLevelSessionExporter(withAsset: asset)
        exporter.outputFileType = AVFileType.mp4
        exporter.outputURL = dest

        let compressionDict: [String: Any] = [
            AVVideoAverageBitRateKey: NSNumber(value: videoTrack.estimatedDataRate),
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel as String,
        ]
        exporter.videoOutputConfiguration = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: NSNumber(integerLiteral: width),
            AVVideoHeightKey: NSNumber(integerLiteral: height),
            AVVideoScalingModeKey: AVVideoScalingModeResize,
            AVVideoCompressionPropertiesKey: compressionDict
        ]
        exporter.timeRange = CMTimeRange(start: .zero, duration: CMTime(seconds: duration))

        exporter.export { result  in
          let status = try! result.get()

          if status == .completed {
            resolve(AVURLAsset(url: dest))
          }
        }
      }


    }
  }
}

extension Double {
    /// Rounds the double to decimal places value
    func rounded(toPlaces places:Int) -> Double {
        let divisor = pow(10.0, Double(places))
        return (self * divisor).rounded() / divisor
    }
}
