//
//  MediaPlayerViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SwiftyBeaver
import Vision

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
    return false
  }

  func withView(tag: NSNumber, block: @escaping (_ mediaPlayer: MediaPlayer) -> Void) {
    DispatchQueue.main.async { [weak self] in
      if let _view = (self?.bridge.uiManager.view(forReactTag: tag) as! MediaPlayer?) {
        block(_view)
      }
    }
  }


  override var bridge: RCTBridge! {
    get {
      return super.bridge
    }

    set (newValue) {
      super.bridge = newValue

      if newValue.isLoading {
        MediaPlayerJSIModuleInstaller.install(self)
      } else {
        newValue?.dispatchBlock({ [weak self] in
          guard let this = self else {
            return
          }


          MediaPlayerJSIModuleInstaller.install(this)
        }, queue: RCTJSThread)
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

        player.halted = true
        player.haltContent()
      }

      DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {

        players?.forEach { player in
          guard player.halted else {
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

  @objc(mediaSize:)
  func mediaSize(_ tag: NSNumber) -> NSDictionary {
    guard let mediaPlayer = bridge.uiManager.unsafeView(forReactTag: tag) as? MediaPlayer else {
      return [:]
    }

    return mediaPlayer.mediaSize.dictionaryValue() as NSDictionary
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

        if player.halted {
          player.halted = false

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

  @objc(editVideo: cb:)
  func editVideo(_ tag: NSNumber, _ cb: @escaping RCTResponseSenderBlock) {
    withView(tag: tag) { view in
      let didOpen = view.editVideo()
      guard didOpen else {
        cb([nil, ["success": false]])
        return
      }

      let _originalEditVideo = view.onEditVideo
      view.onEditVideo = { [weak view] value in
        cb([nil, value])
        view?.onEditVideo = _originalEditVideo
      }
    }
  }

  @objc(detectRectangles: cb:)
  func detectRectangles(_ tag: NSNumber, _ cb: @escaping RCTResponseSenderBlock) {
    withView(tag: tag) { view in
      guard self.bridge?.isValid == true else {
        return
      }

      guard let image = view.imageView?.image else {
        cb([nil, ["rectangles": []]])
        return
      }

      let imageSize = view.imageView!.bounds.size
      let scaleX = imageSize.width / (image.size.width * image.scale)
      let scaleY = imageSize.height / (image.size.height * image.scale)
      

      var rects: Array<[String: Any]> = []
      for rect in FeatureDetector().detectRectangles(image: image) {
        rects.append(rect.applying(.init(scaleX: scaleX, y: scaleY)).dictionaryValue())
      }
      cb([nil, ["rectangles": rects]])

//      let request = VNDetectRectanglesRequest(completionHandler: { request, error in
//        guard let observations = request.results as? [VNRectangleObservation]
//            else { fatalError("unexpected result type from VNDetectRectanglesRequest") }
//        guard observations.count > 0 else {
//            cb([nil, ["rectangles": []]])
//          return
//        }
//
//
//
//        var rects: Array<[String: Any]> = []
//        for observation in observations {
//          rects.append(observation.boundingBox.scaled(to: imageSize).dictionaryValue())
//        }
//        cb([nil, ["rectangles": rects]])
//
//
//
//        // Rectify the detected image and reduce it to inverted grayscale for applying model.
//
////        let correctedImage = inputImage
////            .cropping(to: boundingBox)
////            .applyingFilter("CIPerspectiveCorrection", withInputParameters: [
////                "inputTopLeft": CIVector(cgPoint: topLeft),
////                "inputTopRight": CIVector(cgPoint: topRight),
////                "inputBottomLeft": CIVector(cgPoint: bottomLeft),
////                "inputBottomRight": CIVector(cgPoint: bottomRight)
////            ])
////            .applyingFilter("CIColorControls", withInputParameters: [
////                kCIInputSaturationKey: 0,
////                kCIInputContrastKey: 32
////            ])
////            .applyingFilter("CIColorInvert", withInputParameters: nil)
//
//      })
//
//      request.minimumConfidence = 0.1
//      request.maximumObservations = 5
//      request.quadratureTolerance = 45
//      view.rectangleDetectRequest = request
//
//
//      do {
//        if let cgImage = image.cgImage {
//          let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
//          try requestHandler.perform([request])
//        } else if let ciImage = image.ciImage {
//          let requestHandler = VNImageRequestHandler(ciImage: ciImage, orientation: CGImagePropertyOrientation(image.imageOrientation), options: [:])
//          try requestHandler.perform([request])
//        } else {
//          cb([nil, ["rectangles": []]])
//          return
//        }
//      } catch {
//        cb([error, ["rectangles": [], "error": error.localizedDescription]])
//      }


    }
  }


  

  @objc(isRegistered:)
  func isRegistered(_ id: NSString) -> Bool {
    return MediaSource.cached(uri: id as String) != nil
  }


  @objc(share:network:callback:)
  func share(_ tag: NSNumber, _ network: String, _ cb: @escaping RCTResponseSenderBlock) {
    withView(tag: tag) { view in
      let success = MediaPlayerShare.share(network: MediaPlayerShare.Network.init(rawValue: network), mediaPlayer: view)
      cb([nil, success])
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

extension CGImagePropertyOrientation {
  init(_ uiOrientation: UIImage.Orientation) {
        switch uiOrientation {
            case .up: self = .up
            case .upMirrored: self = .upMirrored
            case .down: self = .down
            case .downMirrored: self = .downMirrored
            case .left: self = .left
            case .leftMirrored: self = .leftMirrored
            case .right: self = .right
            case .rightMirrored: self = .rightMirrored
        }
    }
}
