//
//  MediaSource.swift
//  yeet
//
//  Created by Jarred WSumner on 9/28/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import AVFoundation
import SwiftyBeaver
import SwiftyJSON
import Photos

@objc(MediaSource)
class MediaSource : NSObject  {
  let mimeType: MimeType
  let duration: NSNumber
  let playDuration: NSNumber
  let id: String
  let uri: URL
  let width: NSNumber
  let height: NSNumber
  let pixelRatio: NSNumber
  let bounds: CGRect
  let coverUri: URL?

  static let ENABLE_VIDE_CACHE = true


  static var cache: NSCache<NSString, MediaSource> = {
    let cache = NSCache<NSString, MediaSource>()

    cache.totalCostLimit = 99999999
    cache.delegate = MediaPlayerViewManager.cacheDelegate
    cache.evictsObjectsWithDiscardedContent = false

    return cache
  }()

  static func clearCache() {
    self.cache.removeAllObjects()
  }

  var isHTTProtocol: Bool {
    return uri.scheme == "http" || uri.scheme == "https"
  }

  var isFileProtocol: Bool {
    return uri.scheme == "file"
  }

  var isFromCameraRoll: Bool {
    guard let scheme = uri.scheme else {
      return false
    }
    return scheme.starts(with: "ph") || scheme.starts(with: "assets-library")
  }

//  lazy var asset = AVURLAsset(url: uri)

  func getAssetURI() -> URL {
    if !MediaSource.ENABLE_VIDE_CACHE || !self.isMP4 || !self.isHTTProtocol {
      return uri
    }

    if let cacheCompleteURL = KTVHTTPCache.cacheCompleteFileURL(with: self.uri) {
      return cacheCompleteURL
    } else if KTVHTTPCache.proxyIsRunning() {
      return KTVHTTPCache.proxyURL(withOriginalURL: self.uri)
    } else {
      return self.uri
    }
  }

  lazy var assetURI: URL = {
    return self.getAssetURI()
  }()

  private var _asset: AVURLAsset? = nil

  var asset: AVURLAsset? {
    guard isVideo else {
      return _asset
    }

    if (_asset == nil && isHTTProtocol) {
      _asset = AVURLAsset(url: self.assetURI)
      self.assetStatus = .pending
    }

    return _asset
  }

  enum AssetLoadStatus {
    case pending
    case loading
    case loaded
  }

  var assetStatus : AssetLoadStatus = .pending
  private var _phAsset: PHAsset? = nil
  static let videoAssetManager = PHImageManager()

  static func fetchRequest(url: URL) -> PHFetchResult<PHAsset>? {
    let fetchOptions = PHFetchOptions()
    fetchOptions.fetchLimit = 1
    guard let scheme = url.scheme else {
      return nil
    }

    if scheme.starts(with: "ph") {
      return PHAsset.fetchAssets(withLocalIdentifiers: [url.path], options:fetchOptions )
    } else if scheme.starts(with: "assets-library") {
      return PHAsset.fetchAssets(withALAssetURLs: [url], options: fetchOptions)
    } else {
      return nil
    }
  }

  static func fetchRequest(urls: [URL]) -> PHFetchResult<PHAsset>? {
     let fetchOptions = PHFetchOptions()
      fetchOptions.fetchLimit = urls.count

      guard let firstURL = urls.first else {
        return nil
      }

      guard let scheme = firstURL.scheme else {
       return nil
     }

     if scheme.starts(with: "ph") {
      return PHAsset.fetchAssets(withLocalIdentifiers: urls.map { url in url.path }, options:fetchOptions )
     } else if scheme.starts(with: "assets-library") {
       return PHAsset.fetchAssets(withALAssetURLs: urls, options: fetchOptions)
     } else {
       return nil
     }
   }
  
  typealias LoadAssetCallback = (_ asset: AVURLAsset?) -> Void
  private var _onLoadAsset: Array<LoadAssetCallback> = []
  func loadAsset(callback: @escaping LoadAssetCallback) {
    guard isVideo else {
      callback(nil)
      return
    }

    if assetStatus == .pending {
      assetStatus = .loading
      _onLoadAsset.append(callback)
      if isFromCameraRoll {
        let request = PHVideoRequestOptions()
        request.isNetworkAccessAllowed = true
        request.deliveryMode = .automatic

        guard let fetchReq = MediaSource.fetchRequest(url: uri) else {
          callback(nil)
          return
        }

        guard let asset = fetchReq.firstObject else {
          callback(nil)
          return
        }

        if asset.mediaSubtypes.contains(.photoLive) {
          let videoResource = PHAssetResource.assetResources(for: asset).first { resource in
            return resource.type == .pairedVideo
          }

          guard videoResource != nil else {
            callback(nil)
            return
          }

        } else if asset.mediaType == .video || asset.mediaType == .audio {
          MediaSource.videoAssetManager.requestAVAsset(forVideo: asset, options: request) { [weak self] _asset, _,error  in
            if let __asset = _asset {
              self?._asset = __asset as! AVURLAsset
              self?.loadAVAsset()
            } else {
              SwiftyBeaver.error("Loading AVAsset failed.\n\(error!)")
            }
          }
        }


      } else {
        self.loadAVAsset()
      }

    } else if assetStatus == .loading {
      _onLoadAsset.append(callback)
    } else if assetStatus == .loaded {
      callback(asset)
    }
  }

  private func loadAVAsset() {
    if let _asset = asset {
     _asset.loadValuesAsynchronously(forKeys: ["duration", "tracks", "playable"]) { [weak self] in
       guard let this = self else {
         return
       }

      guard _asset == this.asset else {
        this.assetStatus = .pending
        return
      }

       this._onLoadAsset.forEach { [weak self] cb in
         cb(self?._asset)
       }

       this.assetStatus = .loaded
     }
   } else {
     self.assetStatus = .pending
   }
  }

  var videoOutput: AVPlayerItemVideoOutput? = nil
  
  var isVideo: Bool {
    return (self.mimeType == .mp4 || self.mimeType == .mov) && !isLivePhoto
  }

  lazy var isLivePhoto: Bool = {
    guard self.isFromCameraRoll else {
      return false
    }

    guard let phAsset = MediaSource.fetchRequest(url: uri)?.firstObject else {
      return false
    }

    return phAsset.mediaSubtypes.contains(.photoLive)
  }()

  var isImage: Bool {
    let isImageMimeType = [MimeType.png, MimeType.webp, MimeType.jpg, MimeType.heic, MimeType.heif, MimeType.tiff, MimeType.gif, MimeType.bmp].contains(self.mimeType)

    if isImageMimeType {
      return true
    } else if isFromCameraRoll {
      return isLivePhoto
    } else {
      return false
    }
  }

  var naturalBounds: CGRect {
    return bounds.applying(.init(scaleX: CGFloat(pixelRatio.doubleValue), y: CGFloat(pixelRatio.doubleValue)))
  }

  lazy var coverMediaSource: MediaSource? = {
    guard self.isVideo else {
      return nil
    }

    guard let cover = self.coverUri else {
      return nil
    }

    let mimeType = MimeType.url(cover)!

    return MediaSource(cover, mimeType, NSNumber(value: Double.zero), NSNumber(value: Double.zero), self.id + "-cover", self.width, self.height, self.bounds, pixelRatio)
  }()

  init(_ uri: URL, _ mimeType: MimeType, _ duration: NSNumber, _ playDuration: NSNumber, _ id: String, _ width: NSNumber, _ height: NSNumber, _ bounds: CGRect, _ pixelRatio: NSNumber, _ cover: URL? = nil) {
    self.playDuration = playDuration
    self.mimeType = mimeType
    self.duration = duration
    self.id = id
    self.uri = uri
    self.width = width
    self.height = height
    self.bounds = bounds
    self.pixelRatio = pixelRatio
    self.coverUri = cover
    super.init()
  }

  deinit {
    if (self.isVideo) {
      self.asset?.cancelLoading()
//      self.videoAsset?.cancel()
    }
  }

  var isMP4 : Bool {
    return isVideo && uri.pathExtension == "mp4"
  }

  static func from(uri: String, mimeType: MimeType, duration: NSNumber, playDuration: NSNumber, id: String, width: NSNumber, height: NSNumber, bounds: CGRect, pixelRatio: NSNumber, cover: String?) -> MediaSource {
    var mediaSource: MediaSource? = nil

    let cacheKey = "\(uri)-\(id)-\(width.intValue)-\(height.intValue)"
    mediaSource = cached(uri: cacheKey)

    if (mediaSource == nil) {
      let coverURL = cover != nil ? URL(string: cover!) : nil

      mediaSource = MediaSource(URL(string: uri)!, mimeType, duration, playDuration, id, width, height, bounds, pixelRatio, coverURL )
      cache.setObject(mediaSource!, forKey: cacheKey as NSString)
    }

    return mediaSource!
  }

  static func cached(uri: String) -> MediaSource? {
    return self.cache.object(forKey: uri as NSString)
  }
}


extension RCTConvert {
  @objc(MediaSource:)
  static func mediaSource(json: AnyObject) -> MediaSource  {
    let dictionary = self.nsDictionary(json) as! Dictionary<String, Any>

    let bounds = CGRect.from(json: JSON(dictionary["bounds"]) )
    let uri =  dictionary["url"] as! String

    let mimeType = MimeType.init(rawValue: dictionary["mimeType"] as! String)!
    let duration = dictionary["duration"] as? NSNumber ?? NSNumber(value: 0)
    let playDuration = dictionary["playDuration"] as? NSNumber ?? NSNumber(value: 0)
    let id = dictionary["id"] as? String ?? uri
    let width = dictionary["width"] as! NSNumber
    let cover = dictionary["cover"] as? String
    let height = dictionary["height"] as! NSNumber
    let pixelRatio = dictionary["pixelRatio"] as? NSNumber ?? NSNumber(value: 1)

    return MediaSource.from(uri: uri, mimeType: mimeType, duration: duration, playDuration: playDuration, id: id, width: width, height: height, bounds: bounds, pixelRatio: pixelRatio, cover: cover)
  }

  @objc(MediaSourceArray:)
  static func mediaSourceArray(json: AnyObject) -> Array<MediaSource>  {
    return self.nsArray(json).map { json in
      return RCTConvert.mediaSource(json: json as AnyObject)
    }
  }
}

