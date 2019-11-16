//
//  MediaPlayerFrameView.swift
//  yeet
//
//  Created by Jarred WSumner on 10/1/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import PINRemoteImage

@discardableResult
func measure<A>(name: String = "", _ block: () -> A) -> A {
    let startTime = CACurrentMediaTime()
    let result = block()
    let timeElapsed = CACurrentMediaTime() - startTime
    print("Time: \(name) - \(timeElapsed)")
    return result
}

@objc class MediaFrameView : UIImageView {
  init() {
    super.init(frame: .zero)

    self.isUserInteractionEnabled = false
    self.contentMode = .scaleAspectFill
    self.clipsToBounds =  true

    NotificationCenter.default.addObserver(forName: NSNotification.Name(rawValue: MediaQueuePlayer.Notification.willChangeCurrentItem.rawValue), object: nil, queue: .none) { [weak self] notification in
      guard let objects = notification.object as! Array<AnyObject?>? else {
        return
      }

      guard let mediaQueue = objects[0] as! MediaQueuePlayer? else {
        return
      }

      guard let trackableMedia = objects[1] as! TrackableMediaSource? else {
        return
      }

      guard mediaQueue.id == self?.id else {
        return
      }

      if trackableMedia.mediaSource.isVideo {
        let _trackableMedia = trackableMedia as! TrackableVideoSource
//        if let playerItem = _trackableMedia.player?.currentItem {
//
//          self?.image = self?.imageFrom(mediaId: _trackableMedia.mediaSource.id, playerItem: playerItem, output: _trackableMedia.player?.currentItem?.outputs.first! as! AVPlayerItemVideoOutput)
//        }

      }
    }
  }

  static var frameCache: NSCache<NSString, UIImage> = {
    let cache = NSCache<NSString, UIImage>()
    cache.countLimit = 3

    return cache

  }()


  required init?(coder: NSCoder) {
    fatalError()
  }

  var playerItemObserver: NSKeyValueObservation? = nil


  @objc var source: MediaSource? = nil {
    didSet {
      self.updateSource()
      self.observePlayerItem()
    }
  }

  @objc var percentage = 1.0
//    didSet {
//      self.updateSource()
//    }
//  }

  func observePlayerItem() {
    if playerItemObserver != nil {
      playerItemObserver?.invalidate()
      playerItemObserver = nil
    }

    if source?.isVideo ?? false {
//      playerItemObserver = source?.observe(\source.playerItem) {[weak self]  _,_ in
//        self?.updateSource()
//      }
    }
  }

  @objc(reload)
  func reload() {
    self.updateSource()
  }


  var imageGenerator: AVAssetImageGenerator? = nil {
    willSet (newValue) {
      self.imageGenerator?.cancelAllCGImageGeneration()
    }
  }

  var output: AVPlayerItemVideoOutput? = nil {
    willSet (newValue) {
      if let _output = self.output {
//        source?.playerItem?.remove(_output)
      }
    }
  }

  func imageFrom(mediaId: String, playerItem: AVPlayerItem, output: AVPlayerItemVideoOutput) -> UIImage? {
    var cachedImage = MediaFrameView.frameCache.object(forKey: mediaId as NSString)

    if cachedImage == nil {
      measure { [weak self] in
        cachedImage = self?._imageFrom(playerItem: playerItem, output: output)
      }
      if let _cachedImage = cachedImage {
        MediaFrameView.frameCache.setObject(_cachedImage, forKey: mediaId as NSString)
      }
    }

    return cachedImage
  }

  func _imageFrom(playerItem: AVPlayerItem, output: AVPlayerItemVideoOutput) -> UIImage? {
    guard playerItem.status == .readyToPlay else {
       return nil
     }

      let asset = playerItem.asset as! AVURLAsset
    let time = playerItem.currentTime()
    do {
      if asset.url.pathExtension == "mp4" {
        let imageGenerator = AVAssetImageGenerator(asset: asset)
        return try UIImage(cgImage: imageGenerator.copyCGImage(at: time, actualTime: nil))
      } else if output.hasNewPixelBuffer(forItemTime: time) {
        if let buffer = output.copyPixelBuffer(forItemTime: time, itemTimeForDisplay: nil) {
          return UIImage(ciImage: CIImage.init(cvPixelBuffer: buffer), scale: CGFloat(1), orientation: .up)
        }
      }
    } catch {
      return nil
    }

    return nil

  }

  func updateSource() {
    guard let source = self.source else {
      self.image = nil
      return
    }

   if source.isImage {
      let (url, scale) = YeetImageView.imageUri(source: source, bounds: bounds)
      self.contentMode = .center



      self.pin_setImage(from: url, processorKey: nil, processor: nil) { [weak self] result in
        guard let bounds = self?.bounds else {
          return
        }

        if let image = result.image {
          if image.scale != scale {
            self?.image = UIImage(cgImage: image.cgImage!, scale: scale, orientation: image.imageOrientation)
          } else {
            self?.image = image
          }
        }


      }
    }
  }


  @objc(id) var id: String? = nil

  deinit {
    self.imageGenerator?.cancelAllCGImageGeneration()
    self.pin_cancelImageDownload()
    NotificationCenter.default.removeObserver(self)
  }
}
