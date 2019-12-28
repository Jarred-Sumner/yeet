//
//  AVAsset+videoCover.swift
//  yeet
//
//  Created by Jarred WSumner on 12/27/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit
import Promise
import PINCache

class MediaSourceVideoCover {
  var imageGenerator: AVAssetImageGenerator? = nil
  var size: CGSize
  var started: Bool = false
  var stopped: Bool = false
  var workItem: DispatchWorkItem? = nil
  static var cache = PINCache(name: "MediaSourceVideoCover")

  var mediaSource: MediaSource
  static var queue = DispatchQueue.init(label: "com.codeblogcorp.yeet.MediaSourceVideoCover", qos: .background, attributes: .concurrent, autoreleaseFrequency: .inherit, target: nil)

  required init(mediaSource: MediaSource, size: CGSize) {
    self.mediaSource = mediaSource
    self.size = size
  }

  private func download() -> Promise<UIImage?> {
    return Promise<UIImage?>(queue: MediaSourceVideoCover.queue) { [weak self] resolve, reject in
      self?.mediaSource.loadAsset { [weak self] asset in
        guard let size = self?.size else {
          reject(YeetError.init(code: .genericError))
          return
        }

        guard let _asset = asset else {
          reject(YeetError.init(code: .fetchMediaFailed))
          return
        }

        guard _asset.tracks(withMediaType: .video).count > 0 else {
          reject(YeetError.init(code: .fetchMediaFailed))
           return
        }

        self?.workItem?.cancel()

        let workItem = DispatchWorkItem { [weak self] in
          do {
            let imageGenerator = try AVAssetImageGenerator(asset: _asset)
           imageGenerator.maximumSize = size


            let _cgImage = try imageGenerator.copyCGImage(at: .zero, actualTime: nil)
            let image = UIImage(cgImage: _cgImage)
            self?.saveToCache(image: image)
            resolve(image)
          } catch {
            reject(YeetError.init(code: .fetchMediaFailed))
          }
        }

        MediaSourceVideoCover.queue.async(execute: workItem)
      }
    }
  }

  func load() -> Promise<UIImage?> {
    return self.cached.then { image in
      if let _image = image {
        return Promise<UIImage?>(value: _image)
      } else {
        return self.download()
      }
    }
  }



  static let ageLimit = Double(604800) // One week

  private func saveToCache(image: UIImage) {
    MediaSourceVideoCover.cache.setObjectAsync(image, forKey: cacheKey, completion: nil)
  }

  private var cached : Promise<UIImage?> {
    var key = cacheKey

    return Promise<UIImage?>(queue: .main) { resolve, reject in
      MediaSourceVideoCover.cache.object(forKeyAsync: key) { cache, key, object in
        MediaSourceVideoCover.queue.async {
          if let image = object as? UIImage {
             resolve(image)
           } else {
              resolve(nil)
          }
        }

      }
    }
  }

  func stop() {
    self.mediaSource.asset?.cancelLoading()
    workItem?.cancel()
  }

  var cacheKey : String {
    return "MediaSourceVideoCover/\(mediaSource.assetURI.absoluteString)-\(size.width)x\(size.height)"
  }

  deinit {
    self.stop()
  }

}
