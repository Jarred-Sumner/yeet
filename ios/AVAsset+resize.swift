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
import PromiseKit
import SwiftyBeaver
import Photos
import NextLevelSessionExporter


extension AVURLAsset {
  static func resolveCameraURL(cameraURL: URL) -> Promise<URL> {
    return Promise<URL>() { promise in
      let fetchOpts = PHFetchOptions.init()
      fetchOpts.fetchLimit = 1

      var fetchResult = PHAsset.fetchAssets(withALAssetURLs: [cameraURL], options: fetchOpts)
      guard let videoAsset = fetchResult.firstObject else {
        promise.reject(NSError(domain: "com.codeblogcorp.yeet", code: -807, userInfo: nil))
        return
      }

        let options: PHVideoRequestOptions = PHVideoRequestOptions()
        options.version = .original

        PHImageManager.default().requestAVAsset(forVideo: videoAsset, options: options, resultHandler: { (asset, audioMix, info) in
            if let urlAsset = asset as? AVURLAsset {
              promise.fulfill(urlAsset.url)
            } else {
              promise.reject(NSError(domain: "com.codeblogcorp.yeet", code: -808, userInfo: nil))
            }
        })
    }
  }

  func crop(dest: URL, bounds: CGRect) -> Promise<AVURLAsset> {
    return Promise<AVURLAsset>() { promise in
      if !self.isPlayable {
       SwiftyBeaver.error("Video resize failed due to unplayable")
        promise.reject(NSError(domain: "com.codeblogcorp.yeet", code: 909, userInfo: ["url": self.url]))
       return
      }

      let composition = AVMutableComposition()
      let videoComposition = AVMutableVideoComposition()

      guard let videoTrack = self.tracks(withMediaType: .video).first else {
         // TADA!
         SwiftyBeaver.error("Tried to resize AVURLAsset without a video track")
        promise.fulfill(self)
        return
       }

      let instruction = AVMutableVideoCompositionInstruction()
      let track = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!

      try! track.insertTimeRange(videoTrack.timeRange, of: videoTrack, at: .zero)
      let layerInstruction = AVMutableVideoCompositionLayerInstruction.init(assetTrack: track)
      layerInstruction.setCropRectangle(bounds, at: .zero)
      instruction.layerInstructions = [layerInstruction]

      if let audioTrack = self.tracks(withMediaType: .audio).first {
        let track = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!
        try! track.insertTimeRange(audioTrack.timeRange, of: audioTrack, at: .zero)
      }

      guard let exportSession = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHEVCHighestQuality) else {
        promise.reject(NSError(domain: "com.codeblogcorp.yeet", code: 9090, userInfo: ["url": self.url]))
        return
      }

      videoComposition.instructions = [instruction]
      exportSession.shouldOptimizeForNetworkUse = true
      exportSession.outputURL = dest
      exportSession.outputFileType = .mp4
      exportSession.videoComposition = videoComposition
      exportSession.timeRange = videoTrack.timeRange

      exportSession.exportAsynchronously {
        promise.fulfill(AVURLAsset(url: dest))
      }
    }
  }

  static let resizeQueue = DispatchQueue(label: "com.codeblogcorp.resizeQueue", attributes: .initiallyInactive, autoreleaseFrequency: .workItem)

  func resize(url: URL, to: CGRect, duration: Double, scale: CGFloat, transform: CGAffineTransform) -> Promise<AVURLAsset> {
    

    return Promise<AVURLAsset> { promise in

      let dest = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(url.pathExtension.contains("mov") ?  ".mov" : ".mp4"))


      if !self.isPlayable {
        SwiftyBeaver.error("Video resize failed due to unplayable")
        promise.reject(NSError(domain: "com.codeblogcorp.yeet", code: 909, userInfo: ["url": dest]))
        return
       }

      guard let videoTrack = self.tracks(withMediaType: .video).first else {
         // TADA!
         SwiftyBeaver.error("Tried to resize AVURLAsset without a video track")
        promise.fulfill(self)
        return
       }
      

      let scaleTransform = CGAffineTransform.init(scaleX: scale, y: scale)
      let originalSize = videoTrack.naturalSize
      let size = to.applying(scaleTransform).standardized.size
      
      let width = Int(size.width)
      let height = Int(size.height)

        let exporter = NextLevelSessionExporter(withAsset: self)
      exporter.outputFileType = AVFileType.mov
        exporter.outputURL = dest

        let compressionDict: [String: Any] = [
            AVVideoAverageBitRateKey: NSNumber(value: videoTrack.estimatedDataRate),
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel as String,
        ]

        exporter.videoOutputConfiguration = [
          AVVideoCodecKey: AVVideoCodecType.h264,
          AVVideoWidthKey: NSNumber(integerLiteral: width ),
          AVVideoHeightKey: NSNumber(integerLiteral: height ),
          AVVideoScalingModeKey: AVVideoScalingModeResize,
          AVVideoCompressionPropertiesKey: compressionDict
        ]

//        exporter.videoComposition = videoComposition
        
        if let audioTrack = self.tracks(withMediaType: .audio).first {
          var layoutSize: Int = 0
          var channelLayout: Data? = nil
          var sampleRate: Double = 0.0
          var numberOfChannels: Int = 0

          audioTrack.formatDescriptions.forEach {formatDescription in
            let _formatDescription = formatDescription as! CMAudioFormatDescription
            if let currentChannelLayout = CMAudioFormatDescriptionGetChannelLayout(_formatDescription, sizeOut: &layoutSize) {
                let currentChannelLayoutData = layoutSize > 0 ? Data(bytes: currentChannelLayout, count:layoutSize) : Data()
                channelLayout = currentChannelLayoutData
            }

            if let streamBasicDescription = CMAudioFormatDescriptionGetStreamBasicDescription(_formatDescription) {
                sampleRate = streamBasicDescription.pointee.mSampleRate
                numberOfChannels = Int(streamBasicDescription.pointee.mChannelsPerFrame)
            }

          }

          let isAudioSupported = numberOfChannels > 0 && numberOfChannels < 3
          if (isAudioSupported) {
            exporter.audioOutputConfiguration = [
                AVFormatIDKey: kAudioFormatMPEG4AAC,
                AVEncoderBitRateKey: NSNumber(value: audioTrack.estimatedDataRate),
                AVNumberOfChannelsKey: NSNumber(integerLiteral: numberOfChannels),
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
                AVSampleRateKey: NSNumber(floatLiteral: sampleRate)
            ]

            if numberOfChannels > 1 {
              exporter.audioOutputConfiguration![AVChannelLayoutKey] = channelLayout
            }
          } else {
            
            exporter.audioOutputConfiguration = [
                AVFormatIDKey: kAudioFormatMPEG4AAC,
                AVEncoderBitRateKey: NSNumber(integerLiteral: 128000),
                AVNumberOfChannelsKey: NSNumber(integerLiteral: 2),
                AVSampleRateKey: NSNumber(value: Float(44100))
            ]
          }
        }



        exporter.timeRange = CMTimeRange(start: .zero, duration: CMTime(seconds: duration))

        exporter.export { result  in
          switch (result) {
          case .success(let status):
            let _newAsset = AVURLAsset(url: dest)
            _newAsset.loadValuesAsynchronously(forKeys: ["playable", "duration", "tracks"]) {
              var _error: NSError? = nil
              let status = _newAsset.statusOfValue(forKey: "playable", error: &_error)

              if status == .loaded && _newAsset.isPlayable {
                SwiftyBeaver.info("""
                 Resized video successfully
                   \(originalSize.width)x\(originalSize.height) -> \(width)x\(height)
                   \(dest)
                 """)
                promise.fulfill(_newAsset)
              } else {
                promise.reject(_error ?? NSError(domain: "com.codeblogcorp.yeet", code: -209, userInfo: ["url": dest]))
              }
            }

          case .failure(let error):

              SwiftyBeaver.error("Video resize failed. \(error)")
              promise.reject(error)
          

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
