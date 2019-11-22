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
import Promise
import SwiftyBeaver
import Photos
import NextLevelSessionExporter


extension AVURLAsset {
//  static func resolveCameraURL(cameraURL: URL) -> Promise<URL> {
//    return Promise<URL>() { resolve, reject in
//      let fetchOpts = PHFetchOptions.init()
//      fetchOpts.fetchLimit = 1
//
//      var fetchResult = PHAsset.fetchAssets(withALAssetURLs: [cameraURL], options: fetchOpts)
//      guard let videoAsset = fetchResult.firstObject else {
//        reject(NSError(domain: "com.codeblogcorp.yeet", code: -807, userInfo: nil))
//        return
//      }
//
//        let options: PHVideoRequestOptions = PHVideoRequestOptions()
//        options.version = .original
//
//        PHImageManager.default().requestAVAsset(forVideo: videoAsset, options: options, resultHandler: { (asset, audioMix, info) in
//          if let urlAsset = asset as? AVURLAsset {
//            resolve(urlAsset.url)
//          } else {
//            reject(NSError(domain: "com.codeblogcorp.yeet", code: -808, userInfo: nil))
//          }
//        })
//    }
//  }
//
  func load(forKeys: Array<String> = ["playable", "tracks", "duration"]) -> Promise<AVURLAsset> {
    var _error: NSError? = nil

    let status = self.statusOfValue(forKey: "playable", error: &_error)

    if status == .loaded && self.isPlayable {
      return Promise<AVURLAsset>() { [weak self] resolve, _ in
        resolve(self!)
      }
    }

    return Promise<AVURLAsset>() { [weak self] resolve, reject in
      self?.loadValuesAsynchronously(forKeys: forKeys) { [weak self] in
        guard let this = self else {
          return
        }
        var _error: NSError? = nil
        let status = this.statusOfValue(forKey: "playable", error: &_error)

        if status == .loaded && this.isPlayable {
          resolve(this)
        } else {
          reject(_error ?? NSError(domain: "com.codeblogcorp.yeet", code: -209))
        }
      }
    }
  }

  func crop(to: CGRect, dest: URL) -> Promise<AVURLAsset> {
    return AVURLAsset.crop(asset: self, to: to, dest: dest)
  }

  static func crop(asset: AVURLAsset, to: CGRect, dest: URL) -> Promise<AVURLAsset> {
      return Promise<AVURLAsset> { resolve, reject in
        let videoComposition = AVMutableVideoComposition()
        let composition = AVMutableComposition()

        guard let videoTrack = asset.tracks(withMediaType: .video).first else {
          reject(NSError(domain: "com.codeblogcorp.yeet", code: 404))
          return
        }

        guard let track = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
          reject(NSError(domain: "com.codeblogcorp.yeet", code: 999))
          return
        }
        try! track.insertTimeRange(videoTrack.timeRange, of: videoTrack, at: .zero)

        asset.tracks(withMediaType: .audio).forEach { audioTrack in
          if let track = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)  {
            try! track.insertTimeRange(audioTrack.timeRange, of: audioTrack, at: .zero)
          }
        }

        let instruction = AVMutableVideoCompositionInstruction()

        track.preferredTransform = videoTrack.preferredTransform
        track.naturalTimeScale = videoTrack.naturalTimeScale
        let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: track)
        videoComposition.frameDuration = videoTrack.minFrameDuration
        instruction.timeRange = videoTrack.timeRange


        instruction.layerInstructions = [layerInstruction]
        videoComposition.instructions = [instruction]

        var naturalSize = videoTrack.naturalSize

        var transform = videoTrack.preferredTransform

//        let rect = CGRect(x: 0, y: 0, width: naturalSize.width, height: naturalSize.height)
//        let transformedRect = rect.applying(transform)
//        // transformedRect should have origin at 0 if correct; otherwise add offset to correct it
//        transform.tx -= transformedRect.origin.x;
//        transform.ty -= transformedRect.origin.y;
//
//
//        let videoAngleInDegrees = atan2(transform.b, transform.a) * 180 / .pi
//        if videoAngleInDegrees == 90 || videoAngleInDegrees == -90 {
//            let tempWidth = naturalSize.width
//            naturalSize.width = naturalSize.height
//            naturalSize.height = tempWidth
//        }

        let _to = to.h264Friendly()

        let scaleX = to.width / _to.width
        let scaleY = to.height / _to.height

        videoComposition.renderSize = _to.size

        // center the video
//
//        var ratio: CGFloat = 0
//        let xRatio: CGFloat = targetSize.width / naturalSize.width
//        let yRatio: CGFloat = targetSize.height / naturalSize.height
//        ratio = min(xRatio, yRatio)
//
//        let postWidth = naturalSize.width * ratio
//        let postHeight = naturalSize.height * ratio
//        let transX = (targetSize.width - postWidth) * 0.5
//        let transY = (targetSize.height - postHeight) * 0.5
//
//        var matrix = CGAffineTransform(translationX: (transX / xRatio), y: (transY / yRatio))
//        matrix = matrix.scaledBy(x: (ratio / xRatio), y: (ratio / yRatio))
//        transform = transform.concatenating(matrix)



        let scaleTransform = CGAffineTransform.init(scaleX: scaleX, y: scaleY)
//        let scaleTransform = CGAffineTransform.init(scaleX: scaleX, y: scaleY)

        if to.origin != .zero {
          layerInstruction.setTransform(scaleTransform.translatedBy(x: _to.origin.x * -1, y: _to.origin.y * -1), at: .zero)
        } else {
          layerInstruction.setTransform(scaleTransform, at: .zero)
        }

        layerInstruction.setCropRectangle(_to, at: .zero)



        let duration = CMTimeGetSeconds(videoTrack.timeRange.duration)

        var presetName = AVAssetExportPresetMediumQuality

        if duration < 60.0 {
          if AVAssetExportSession.allExportPresets().contains(AVAssetExportPresetHEVCHighestQuality) {
            presetName = AVAssetExportPresetHEVCHighestQuality
          } else {
            presetName = AVAssetExportPresetHighestQuality
          }

//          if videoComposition.renderSize.width <= 640 && videoComposition.renderSize.height <= 480 {
//            presetName = AVAssetExportPreset640x480
//          } else if videoComposition.renderSize.width <= 960 && videoComposition.renderSize.height <= 540 {
//            presetName = AVAssetExportPreset960x540
//          } else if videoComposition.renderSize.width <= 1280 && videoComposition.renderSize.height <= 720 {
//            presetName = AVAssetExportPreset1280x720
//          } else if videoComposition.renderSize.width <= 1920 && videoComposition.renderSize.height <= 1080 {
//            presetName = AVAssetExportPreset1920x1080
//          } else if videoComposition.renderSize.width <= 3840 && videoComposition.renderSize.height <= 2160 {
//            presetName = AVAssetExportPreset3840x2160
//          }
        }

        guard let exportSession = AVAssetExportSession(asset: composition, presetName: presetName) else {
          reject(NSError(domain: "com.codeblogcorp.yeet", code: 999))
          return
        }

        exportSession.videoComposition = videoComposition
        exportSession.outputURL = dest
        exportSession.outputFileType = .he

        exportSession.shouldOptimizeForNetworkUse = true

          exportSession.exportAsynchronously {
             switch (exportSession.status) {
               case .completed:
                 let asset = AVURLAsset(url: dest)
                 resolve(asset)
               case .cancelled:
                 break
               case .waiting:
                 break
               default:
                 reject(exportSession.error ?? NSError(domain: "com.codeblogcorp.yeet", code: 999))
                 break
             }
           }





//        if let audioTrack = asset.tracks(withMediaType: .audio).first {
//          let track = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
//            reject(NSError(domain: "com.codeblogcorp.yeet", code: 999))
//            return
//          }
//          try! track.insertTimeRange(audioTrack.timeRange, of: audioTrack, at: .zero)
//
//        }


      }
    }
  }

//
//  static let resizeQueue = DispatchQueue(label: "com.codeblogcorp.resizeQueue", attributes: .initiallyInactive, autoreleaseFrequency: .workItem)
//
//  func resize(url: URL, to: CGRect, duration: Double, scale: CGFloat, transform: CGAffineTransform) -> Promise<AVURLAsset> {
//    return Promise<AVURLAsset>(queue: AVURLAsset.resizeQueue, work: { [weak self] resolve, reject in
//      let dest = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(url.pathExtension.contains("mov") ?  ".mov" : ".mp4"))
//
//
//      if !self!.isPlayable {
//        SwiftyBeaver.error("Video resize failed due to unplayable")
//        reject(NSError(domain: "com.codeblogcorp.yeet", code: 909, userInfo: ["url": dest]))
//        return
//       }
//
//      guard let videoTrack = self!.tracks(withMediaType: .video).first else {
//         // TADA!
//         SwiftyBeaver.error("Tried to resize AVURLAsset without a video track")
//        resolve(self!)
//        return
//       }
//      
//
//      let scaleTransform = CGAffineTransform.init(scaleX: scale, y: scale)
//      let originalSize = videoTrack.naturalSize
//      let size = to.applying(scaleTransform).standardized.size
//      
//      let width = Int(size.width)
//      let height = Int(size.height)
//
//      let exporter = NextLevelSessionExporter(withAsset: self!)
//      exporter.outputFileType = AVFileType.mp4
//      exporter.outputURL = dest
//
//      let compressionDict: [String: Any] = [
//          AVVideoAverageBitRateKey: NSNumber(value: videoTrack.estimatedDataRate),
//          AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel as String,
//      ]
//
//      exporter.videoOutputConfiguration = [
//        AVVideoCodecKey: AVVideoCodecType.h264,
//        AVVideoWidthKey: NSNumber(integerLiteral: width ),
//        AVVideoHeightKey: NSNumber(integerLiteral: height ),
//        AVVideoScalingModeKey: AVVideoScalingModeResize,
//        AVVideoCompressionPropertiesKey: compressionDict
//      ]
//
////        exporter.videoComposition = videoComposition
//
//      if let audioTrack = self!.tracks(withMediaType: .audio).first {
//        var layoutSize: Int = 0
//        var channelLayout: Data? = nil
//        var sampleRate: Double = 0.0
//        var numberOfChannels: Int = 0
//
//        audioTrack.formatDescriptions.forEach {formatDescription in
//          let _formatDescription = formatDescription as! CMAudioFormatDescription
//          if let currentChannelLayout = CMAudioFormatDescriptionGetChannelLayout(_formatDescription, sizeOut: &layoutSize) {
//              let currentChannelLayoutData = layoutSize > 0 ? Data(bytes: currentChannelLayout, count:layoutSize) : Data()
//              channelLayout = currentChannelLayoutData
//          }
//
//          if let streamBasicDescription = CMAudioFormatDescriptionGetStreamBasicDescription(_formatDescription) {
//              sampleRate = streamBasicDescription.pointee.mSampleRate
//              numberOfChannels = Int(streamBasicDescription.pointee.mChannelsPerFrame)
//          }
//
//        }
//
//        let isAudioSupported = numberOfChannels > 0 && numberOfChannels < 3
//        if (isAudioSupported) {
//          exporter.audioOutputConfiguration = [
//              AVFormatIDKey: kAudioFormatMPEG4AAC,
//              AVEncoderBitRateKey: NSNumber(value: audioTrack.estimatedDataRate),
//              AVNumberOfChannelsKey: NSNumber(integerLiteral: numberOfChannels),
//              AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
//              AVSampleRateKey: NSNumber(floatLiteral: sampleRate)
//          ]
//
//          if numberOfChannels > 1 {
//            exporter.audioOutputConfiguration![AVChannelLayoutKey] = channelLayout
//          }
//        } else {
//          exporter.audioOutputConfiguration = [
//              AVFormatIDKey: kAudioFormatMPEG4AAC,
//              AVEncoderBitRateKey: NSNumber(integerLiteral: 128000),
//              AVNumberOfChannelsKey: NSNumber(integerLiteral: 2),
//              AVSampleRateKey: NSNumber(value: Float(44100))
//          ]
//        }
//      }
//
//      exporter.timeRange = CMTimeRange(start: .zero, duration: CMTime(seconds: duration))
//
//      exporter.export() { result  in
//        switch (result) {
//        case .success( _):
//          AVURLAsset(url: dest).load().then { asset in
//            SwiftyBeaver.info("""
//Resized AVURLAsset
//\(originalSize.width)x\(originalSize.height) -> \(width)x\(height)
//""")
//            resolve(asset)
//          }.catch { error in
//            reject(error)
//          }
//        case .failure(let error):
//            SwiftyBeaver.error("Video resize failed. \(error)")
//            reject(error)
//        }
//      }
//    })
//}
//
//extension Double {
//    /// Rounds the double to decimal places value
//    func rounded(toPlaces places:Int) -> Double {
//        let divisor = pow(10.0, Double(places))
//        return (self * divisor).rounded() / divisor
//    }
//}


