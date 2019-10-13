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

  var isFromCameraRoll: Bool {
    guard let scheme = uri.scheme else {
      return false
    }
    return scheme.starts(with: "ph") || scheme.starts(with: "assets-library")
  }

//  lazy var asset = AVURLAsset(url: uri)

  lazy var assetURI: URL = {
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
  }()

  private var _asset: AVURLAsset? = nil

  lazy var asset: AVURLAsset? = {
    if (!isVideo) {
      return nil
    }

    if (_asset == nil) {
      _asset = AVURLAsset(url: assetURI)
    }

    return _asset
  }()


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
        request.deliveryMode = .highQualityFormat

        guard let fetchReq = MediaSource.fetchRequest(url: uri) else {
          callback(nil)
          return
        }

        guard let asset = fetchReq.firstObject else {
          callback(nil)
          return
        }

        MediaSource.videoAssetManager.requestAVAsset(forVideo: asset, options: request) { [weak self] asset, _,_  in
          self?._asset = asset as! AVURLAsset

          self?.loadAVAsset()
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

  private var _playerItem: AVPlayerItem? = nil

  @objc var playerItem: AVPlayerItem? {
    get {
      return _playerItem
    }

    set (newValue) {
      _playerItem = newValue

      if let playerItem = _playerItem {
        let videoOutput = AVPlayerItemVideoOutput(pixelBufferAttributes: [kCVPixelBufferPixelFormatTypeKey as String : kCVPixelFormatType_32BGRA] )
        playerItem.add(videoOutput)
        playerItem.preferredForwardBufferDuration = TimeInterval(1)
        playerItem.canUseNetworkResourcesForLiveStreamingWhilePaused = false
        self.videoOutput = videoOutput
      } else {
        self.videoOutput = nil
      }

    }
  }
  
  var isVideo: Bool {
    return self.mimeType == MimeType.mp4
  }

  var isImage: Bool {
    return [MimeType.png, MimeType.webp, MimeType.jpg].contains(self.mimeType)
  }

  var naturalBounds: CGRect {
    return bounds.applying(.init(scaleX: CGFloat(pixelRatio.doubleValue), y: CGFloat(pixelRatio.doubleValue)))
  }

  init(_ uri: URL, _ mimeType: MimeType, _ duration: NSNumber, _ playDuration: NSNumber, _ id: String, _ width: NSNumber, _ height: NSNumber, _ bounds: CGRect, _ pixelRatio: NSNumber) {
    self.playDuration = playDuration
    self.mimeType = mimeType
    self.duration = duration
    self.id = id
    self.uri = uri
    self.width = width
    self.height = height
    self.bounds = bounds
    self.pixelRatio = pixelRatio
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

  static func from(uri: String, mimeType: MimeType, duration: NSNumber, playDuration: NSNumber, id: String, width: NSNumber, height: NSNumber, bounds: CGRect, pixelRatio: NSNumber) -> MediaSource {
    var mediaSource: MediaSource? = nil
    mediaSource = cached(uri: uri)

    if (mediaSource == nil) {
      mediaSource = MediaSource(URL(string: uri)!, mimeType, duration, playDuration, id, width, height, bounds, pixelRatio)
      cache.setObject(mediaSource!, forKey: uri as NSString)
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

    return MediaSource.from(uri: dictionary["url"] as! String, mimeType: MimeType.init(rawValue: dictionary["mimeType"] as! String)!, duration: dictionary["duration"] as! NSNumber, playDuration: dictionary["playDuration"] as! NSNumber, id: dictionary["id"] as! String, width: dictionary["width"] as! NSNumber, height: dictionary["height"] as! NSNumber, bounds: bounds, pixelRatio: dictionary["pixelRatio"] as! NSNumber)
  }

  @objc(MediaSourceArray:)
  static func mediaSourceArray(json: AnyObject) -> Array<MediaSource>  {
    return self.nsArray(json).map { json in
      return RCTConvert.mediaSource(json: json as AnyObject)
    }
  }
}

