//
//  MediaPlayerViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
//import SkeletonView
import SwiftyBeaver

@objc(MediaPlayerViewManager)
class MediaPlayerViewManager: RCTViewManager, RCTInvalidating {

  func invalidate() {
//    MediaSource.clearCache()
  }

  override static func moduleName() -> String! {
    return "MediaPlayerView";
  }

  override func view() -> MediaPlayer? {
   return MediaPlayer(bridge: self.bridge)
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  func withView(tag: NSNumber, block: @escaping (_ mediaPlayer: MediaPlayer) -> Void) {
    DispatchQueue.main.async { [weak self] in
      if let _view = (self?.bridge.uiManager.view(forReactTag: tag) as! MediaPlayer?) {
        block(_view)
      }
    }
  }

  @objc(batchPause:IDs:)
  func batchPause(_ tag: NSNumber, _ IDs: Array<NSNumber>) {
    DispatchQueue.main.async {

      var players: Array<MediaPlayer>? = IDs.compactMap { id -> MediaPlayer? in
        if let player = self.bridge.uiManager.view(forReactTag: id) {
          return YeetExporter.findMediaPlayer(player)
        } else {
          return nil
        }
      }

      players?.forEach { player in
        guard let current = player.source else {
          return
        }

        player.batchPaused = true
        player.haltContent()
      }

      DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {

        players?.forEach { player in
          guard player.batchPaused else {
            return
          }

          if let videoView = player.videoView {
            player.videoView?.showCover = true
            player.videoView?.playerView.player = nil
          }
        }

        players = nil
      }
    }



  }

  @objc(batchPlay:IDs:)
  func batchPlay(_ tag: NSNumber, _ IDs: Array<NSNumber>) {
    DispatchQueue.main.async {
       let players = IDs.compactMap { id -> MediaPlayer? in
         if let player = self.bridge.uiManager.view(forReactTag: id) {
           return YeetExporter.findMediaPlayer(player)
         } else {
           return nil
         }
       }

      players.forEach { player in
        guard let current = player.source else {
          return
        }

        if player.batchPaused {
          player.batchPaused = false

          if !player.paused {
            player.play()
          }

        }

      }
    }
  }

  @objc (crop:bounds:originalSize:resolver:rejecter:)
  func crop(_ tag: NSNumber, bounds: CGRect, originalSize: CGSize, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {

    withView(tag: tag) { view in
      guard let mediaSource = view.currentItem else {
        YeetError.reject(code: .invalidMediaSource, block: rejecter)
        return
      }

      if mediaSource.isImage {
        guard let imageView = view.imageView else {
          YeetError.reject(code: .invalidTag, block: rejecter)
          return
        }

        imageView.loadFullSizeImage(contentMode: UIView.ContentMode.scaleToFill, size: originalSize, cropRect: bounds).then(on: DispatchQueue.global(qos: .userInitiated)) { image in
          autoreleasepool {
            var outputMimeType = MimeType.jpg
            if [MimeType.png, MimeType.tiff, MimeType.bmp].contains(mediaSource.mimeType) {
              outputMimeType = .png
            } else if [MimeType.gif, MimeType.webp].contains(mediaSource.mimeType) {
              outputMimeType = .webp
            }

            let filePath = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true).appendingPathComponent(UUID().uuidString).appendingPathExtension(outputMimeType.fileExtension())

             SwiftyBeaver.info("""
               Cropping image
                 \(image.size.width)x\(image.size.height) -> \(bounds)
                 \(filePath.absoluteString)
               """)

            var croppedImage: UIImage? = nil

            if let cgImage = image.cgImage {
              guard let croppedImageRef: CGImage = cgImage.cropping(to: bounds)
               else {
                  YeetError.reject(code: .imageCropFailure, block: rejecter)
                  return
               }

              croppedImage = UIImage.init(cgImage: croppedImageRef, scale: image.scale, orientation: image.imageOrientation)
            } else if let ciImage = image.ciImage {
              let croppedImageRef: CIImage = ciImage.cropped(to: bounds)

              croppedImage = UIImage.init(ciImage: croppedImageRef, scale: image.scale, orientation: image.imageOrientation)
            }

            var data: Data? = nil
            if outputMimeType == .webp {
              data = croppedImage?.sd_imageData(as: .webP, compressionQuality: 1.0, firstFrameOnly: false)
            } else if outputMimeType == .png {
              data = croppedImage?.pngData()
            } else {
              if (outputMimeType != .jpg) {
                SwiftyBeaver.warning("Attempted to crop to unimplemented format, cropping to jpeg instead")
              }
              data = croppedImage?.jpegData(compressionQuality: CGFloat(0.99))
            }

            guard let _data = data else {
              YeetError.reject(code: .imageEncodingFailure, block: rejecter)
              return
            }

            do {
              try _data.write(to: filePath)
            } catch {
              YeetError.reject(code: .writingDataFailure, block: rejecter)
              return
            }

            let scale = image.scale
            let size = croppedImage!.size.applying(CGAffineTransform.init(scaleX: CGFloat(1) / scale, y: CGFloat(1) / scale))

            resolver([
              "url": filePath.absoluteString,
              "width": NSNumber(value: Double(size.width)),
              "height": NSNumber(value: Double(size.height)),
              "mimeType": MimeType.webp.rawValue,
              "duration": NSNumber(value: 0),
              "playDuration": NSNumber(value: 0),
              "pixelRatio": NSNumber(value: Double(scale)),
              "id": mediaSource.id + "_cropped"
            ])

            SwiftyBeaver.info("Cropped successfully")
          }
        }.catch { error in
          rejecter(nil, nil, error)
        }
      } else if mediaSource.isVideo {
        mediaSource.loadAsset { asset in
          guard let asset = asset  else {
            YeetError.reject(code: .loadAVAssetFailure, block: rejecter)
            return
          }

          let filePath = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true).appendingPathComponent(UUID().uuidString).appendingPathExtension(".mp4")

          asset.crop(to: bounds.h264Friendly(), dest: filePath).then { newAsset in
            guard let videoTrack = newAsset.tracks(withMediaType: .video).first else {
              YeetError.reject(code: .loadAVAssetFailure, block: rejecter)
              return
            }

            let size = videoTrack.naturalSize

            SwiftyBeaver.info("""
              Cropped video
                \(originalSize.width)x\(originalSize.height) -> \(bounds)
                \(filePath.absoluteString)
              """)
            resolver([
              "url": filePath.absoluteString,
              "width": NSNumber(value: Double(size.width)),
              "height": NSNumber(value: Double(size.height)),
              "mimeType": MimeType.mp4.rawValue,
              "duration": NSNumber(value: CMTimeGetSeconds(newAsset.duration)),
              "playDuration": NSNumber(value: CMTimeGetSeconds(newAsset.duration)),
              "pixelRatio": NSNumber(value: 1),
              "id": mediaSource.id + "_cropped"
            ])
          }.catch { error in
            rejecter(YeetError.ErrorCode.videoCropFailure.rawValue, error.localizedDescription, error)
          }
        }
      } else {
        YeetError.reject(code: .invalidMediaSource, block: rejecter)
      }
    }
  }

  @objc (startCachingMediaSources:bounds:contentMode:)
  func startCaching(mediaSources: AnyObject, bounds: CGRect, contentMode: UIView.ContentMode) {
    let _mediaSources = RCTConvert.mediaSourceArray(json: mediaSources)
    YeetImageView.startCaching(mediaSources: _mediaSources, bounds: bounds, contentMode: contentMode)
  }

  @objc (stopCachingMediaSources:bounds:contentMode:)
  func stopCaching(mediaSources: AnyObject, bounds: CGRect, contentMode: UIView.ContentMode) {
    let _mediaSources = RCTConvert.mediaSourceArray(json: mediaSources)
    YeetImageView.stopCaching(mediaSources: _mediaSources, bounds: bounds, contentMode: contentMode)
  }

  @objc (stopCachingAll)
  func stopCachingAll() {
    YeetImageView.stopCaching()
  }

  @objc(save: cb:)
  func save(_ tag: NSNumber, _ cb: @escaping RCTResponseSenderBlock) {
    withView(tag: tag) { view in
      view.saveToCameraRoll().then { result in
        cb([nil, result])
      }.catch { error in
        cb([error, nil])
      }
    }
  }
    

  @objc(pause:)
  func pause(tag: NSNumber) {
    withView(tag: tag) { view in
      view.pause()
    }
  }

  @objc(play:)
  func play(tag: NSNumber) {
    withView(tag: tag) { [weak self] view in
      view.play()
    }
  }

  @objc(reset:)
  func reset(tag: NSNumber) {
    withView(tag: tag) { [weak self] view in
      view.reset()
    }
  }

  @objc(goNext::)
  func goNext(tag: NSNumber, cb: @escaping RCTResponseSenderBlock) {
    withView(tag: tag) { [weak self] view in
      view.goNext { tracker in
        cb([nil, tracker])
      }
    }
  }

  @objc(goNextWithResolver:::)
  func goNextWithResolver(tag: NSNumber, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    withView(tag: tag) { [weak self] view in
      view.goNext { tracker in
        resolver(tracker)
      }
    }
  }

  @objc(goBack::)
  func goBack(tag: NSNumber, cb: @escaping RCTResponseSenderBlock) {
    withView(tag: tag) { [weak self] view in
      view.goBack { tracker in
        cb([nil, tracker])
      }
    }
  }

  @objc(goBackWithResolver:::)
  func goBackWithResolver(tag: NSNumber, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    withView(tag: tag) { [weak self] view in
      view.goBack { tracker in
        resolver(tracker)
      }
    }
  }

  @objc(advance:index:callback:)
  func advance(_ tag: NSNumber, _ index: NSNumber, _ cb: @escaping RCTResponseSenderBlock) {
    withView(tag: tag) { view in
      view.advance(to: index.intValue) { tracker in
        cb([nil, tracker])
      }
    }
  }

  @objc(advance:index:resolve:rejecter:)
  func advance(_ tag: NSNumber, _ index: NSNumber, _ resolve: @escaping RCTPromiseResolveBlock, _ rejecter: @escaping RCTPromiseRejectBlock) {
     withView(tag: tag) { view in
       view.advance(to: index.intValue) { tracker in
         resolve(tracker)
       }
     }
   }

  @objc(advanceWithFrame:index:resolve:rejecter:)
  func advanceWithFrame(_ tag: NSNumber, _ index: NSNumber, _ resolve: @escaping RCTPromiseResolveBlock, _ rejecter: @escaping RCTPromiseRejectBlock) {
     withView(tag: tag) { view in
      view.advance(to: index.intValue, withFrame: true) { tracker in
         resolve(tracker)
       }
     }
   }


  static let cacheDelegate = MediaPlayerCacheDelegate()
 
}

class MediaPlayerCacheDelegate : NSObject, NSCacheDelegate {
  func cache(_ cache: NSCache<AnyObject, AnyObject>, willEvictObject obj: Any) {
    let mediaSource = obj as! MediaSource

    print("WILL EVICT \(mediaSource.id)")
  }
}
