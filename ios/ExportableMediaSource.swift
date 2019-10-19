//
//  ExportableMediaSource.swift
//  yeet
//
//  Created by Jarred WSumner on 10/13/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import PINRemoteImage
import Promises

class ExportableMediaSource {
  var mediaSource: MediaSource

  open var duration: NSNumber {
    return mediaSource.duration
  }

  var isImage: Bool {
    return mediaSource.isImage
  }

  var isVideo: Bool {
    return mediaSource.isVideo
  }

  init(mediaSource: MediaSource) {
    self.mediaSource = mediaSource
  }
}

class ExportableVideoSource : ExportableMediaSource {
  var playerItem: AVPlayerItem
  var asset: AVAsset

  func generateThumbnail(size: CGSize, scale: CGFloat = CGFloat(1)) -> Promise<ExportableImageSource> {
    return Promise.init(on: .global(qos: .background)) { [weak self] resolve, reject in
      guard let asset = self?.asset else {
        return
      }

      let imageGenerator = AVAssetImageGenerator(asset: asset)
      imageGenerator.generateCGImagesAsynchronously(forTimes: [NSValue(time: CMTime.zero)]) { [weak self] time, cgImage, otherTime, status, error  in
        if status == .succeeded && cgImage != nil {
          guard let image = UIImage(cgImage: cgImage!).sd_resizedImage(with: size.applying(CGAffineTransform.init(scaleX: scale, y: scale)), scaleMode: .aspectFill) else {
             reject(NSError(domain: "com.codeblogcorp.yeet", code: 400, userInfo: nil))
            return
          }
          guard let mediaSource = self?.mediaSource else {
            reject(NSError(domain: "com.codeblogcorp.yeet", code: 400, userInfo: nil))
            return
          }
        
          resolve(ExportableImageSource(thumbnail: image, id: mediaSource.id))
        } else {
          reject(error ?? NSError(domain: "com.codeblogcorp.yeet", code: 404, userInfo: nil))
        }

      }
    }
  }

  init(mediaSource: MediaSource, asset: AVAsset, playerItem: AVPlayerItem) {
    self.asset = asset
    self.playerItem = playerItem

    super.init(mediaSource: mediaSource)
  }
}

class ExportableImageSource : ExportableMediaSource {
  var animatedImage: PINCachedAnimatedImage? = nil
  var staticImage: UIImage? = nil

  var isAnimated: Bool {
    return self.animatedImage != nil
  }

  var animatedImageFrameCount: Int {
    if let image = self.animatedImage {
      return image.frameCount;
    } else {
      return 0;
    }
  }


  var firstFrame: UIImage {
    if (self.animatedImage != nil) {
      return self.animatedImage!.coverImage
    } else {
      return self.staticImage!
    }
  }

  func animatedImageDuration(at: UInt) -> TimeInterval {
    if let image = self.animatedImage {
      return image.duration(at: at);
    } else {
      return 0;
    }
  }

  func animatedImageFrame(at: UInt) -> CGImage {
    if let image = self.animatedImage {
      return image.image(at: at)!.takeRetainedValue()
    } else {
      return staticImage!.cgImage!
    }
  }

  func preloadAllFrames() {
  }


  init(mediaSource: MediaSource, animatedImage: PINCachedAnimatedImage?, staticImage: UIImage?)  {
    self.animatedImage = animatedImage
    self.staticImage = staticImage

    super.init(mediaSource: mediaSource)
  }

  init(screenshot: UIImage, id: String) {
    staticImage = screenshot
    animatedImage = nil

    super.init(mediaSource: MediaSource.from(uri: "temp-screenshot://\(id).png", mimeType: MimeType.png, duration: NSNumber(0), playDuration: NSNumber(0), id: id, width: NSNumber(nonretainedObject: screenshot.size.width), height: NSNumber(nonretainedObject: screenshot.size.height), bounds: CGRect(origin: .zero, size: screenshot.size), pixelRatio: NSNumber(nonretainedObject: screenshot.scale)))
  }

  init(thumbnail: UIImage, id: String) {
    staticImage = thumbnail
    animatedImage = nil

    super.init(mediaSource: MediaSource.from(uri: "thumbnails://\(id).png", mimeType: MimeType.png, duration: NSNumber(0), playDuration: NSNumber(0), id: id, width: NSNumber(nonretainedObject: thumbnail.size.width), height: NSNumber(nonretainedObject: thumbnail.size.height), bounds: CGRect(origin: .zero, size: thumbnail.size), pixelRatio: NSNumber(nonretainedObject: thumbnail.scale)))
  }
}

extension ExportableMediaSource {
  static func from(mediaPlayer: MediaPlayer) -> ExportableMediaSource? {
    guard let current = mediaPlayer.current else {
      return nil
    }

    guard let mediaQueue = mediaPlayer.mediaQueue else {
      return nil
    }

    if current.mediaSource.isVideo {
      guard let playerItem = mediaQueue.videoPlayer.currentItem else {
        return nil
      }
      let asset = playerItem.asset

      return ExportableVideoSource(mediaSource: current.mediaSource, asset: asset, playerItem: playerItem)
    } else if current.mediaSource.isImage {
      guard let imageView = mediaPlayer.imageView else {
        return nil
      }


      return ExportableImageSource(mediaSource: current.mediaSource, animatedImage: imageView.isAnimatedImage ? imageView.animatedImage : nil, staticImage: imageView.isAnimatedImage ? imageView.animatedImage?.coverImage : imageView.image)
    } else {
      return nil
    }
  }

  var image: ExportableImageSource? {
    if isImage {
      return self as? ExportableImageSource
    } else {
      return nil
    }
  }

  var video: ExportableVideoSource? {
    if isVideo {
      return self as? ExportableVideoSource
    } else {
      return nil
    }
  }
}
