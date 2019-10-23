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

  func resize(url: URL, to: CGRect, duration: Double, scale: CGFloat, transform: CGAffineTransform) -> Promise<AVURLAsset> {


    return Promise<AVURLAsset>() { promise in
        let asset = AVMutableComposition()


      let dest = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(url.pathExtension.contains("mov") ?  ".mov" : ".mp4"))



      guard let videoTrack = self.tracks(withMediaType: .video).first else {
         // TADA!
         SwiftyBeaver.error("Tried to resize AVURLAsset without a video track")
        promise.fulfill(self)
        return
       }



      let scaleX = to.width / videoTrack.naturalSize.width
      let scaleY = to.height / videoTrack.naturalSize.height

      let _bounds = CGRect(origin: .zero, size: CGSize( width: videoTrack.naturalSize.width * scaleX, height: videoTrack.naturalSize.height * scaleY ))
      let bounds = _bounds.applying(transform)
//      let size = bounds.standardized.size
      let size = to.standardized.size
      
      let width = Int(size.width)
      let height = Int(size.height)




        guard let track = asset.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
          return
        }

        try! track.insertTimeRange(videoTrack.timeRange, of: videoTrack, at: .zero)

        let videoComposition = AVMutableVideoComposition()
        let instruction = AVMutableVideoCompositionInstruction()
        instruction.timeRange = videoTrack.timeRange
        instruction.backgroundColor = UIColor.black.cgColor

        let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: track)

      let scaleTransform = CGAffineTransform.init(scaleX: scaleX, y: scaleY)
      let _centerPoint = CGPoint(x: videoTrack.naturalSize.width / 2, y: videoTrack.naturalSize.height / 2)
      let centerPoint = _centerPoint.applying(scaleTransform)

      let translateTransform = CGAffineTransform.init(translationX: (centerPoint.x + _centerPoint.x) / 2, y: (centerPoint.y + _centerPoint.y) / 2)

      let layerTransform = CGAffineTransform.identity.concatenating(scaleTransform).concatenating(translateTransform).concatenating(transform)
      layerInstruction.setTransform(layerTransform, at: .zero)
//      layerInstruction.setTransform(CGAffineTransform.init(scaleX: scaleX, y: scaleY).translatedBy(x: abs( (bounds.size.width / 2) + abs(bounds.origin.x / 2) ) , y: abs( (bounds.size.height / 2) - abs(to.size.height / 2)) * -1  ).concatenating(transform), at: .zero)
        instruction.layerInstructions = [layerInstruction]

        videoComposition.instructions = [instruction]
        videoComposition.renderSize = size
        videoComposition.frameDuration = videoTrack.minFrameDuration


        let exporter = NextLevelSessionExporter(withAsset: self)
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
                AVChannelLayoutKey: channelLayout,
                AVEncoderBitRateKey: NSNumber(value: audioTrack.estimatedDataRate),
                AVNumberOfChannelsKey: NSNumber(value: numberOfChannels),
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
                AVSampleRateKey: NSNumber(value: sampleRate)
            ]
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
            var originalSize = CGSize.zero
            if let _track = self.tracks(withMediaType: .video).first {
              originalSize = _track.naturalSize
            }

            SwiftyBeaver.info("""
Resized video successfully
  \(originalSize.width)x\(originalSize.height) -> \(width)x\(height)
  \(dest)
""")
            let _newAsset = AVURLAsset(url: dest)
              if _newAsset.isPlayable {
                promise.fulfill(_newAsset)
              } else {
                promise.reject(NSError(domain: "com.codeblogcorp.yeet", code: -209, userInfo: ["url": dest]))
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
