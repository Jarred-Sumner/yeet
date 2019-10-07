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

//  lazy var asset = AVURLAsset(url: uri)

  lazy var assetURI: URL = {
    if !MediaSource.ENABLE_VIDE_CACHE || !self.isMP4 {
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


  lazy var asset: AVURLAsset? = {
    if (!isVideo) {
      return nil
    }

    return AVURLAsset(url: assetURI)
  }()


  enum AssetLoadStatus {
    case pending
    case loading
    case loaded
  }

  var assetStatus : AssetLoadStatus = .pending
  
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

      if let _asset = asset {
        _asset.loadValuesAsynchronously(forKeys: ["duration", "tracks"]) { [weak self] in
          guard let this = self else {
            return
          }

          this._onLoadAsset.forEach { [weak self] cb in
            cb(self?.asset)
          }

          this.assetStatus = .loaded
        }
      } else {
        self.assetStatus = .pending
      }

    } else if assetStatus == .loading {
      _onLoadAsset.append(callback)
    } else if assetStatus == .loaded {
      callback(asset)
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
        playerItem.canUseNetworkResourcesForLiveStreamingWhilePaused = true
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
//      cache.setObject(mediaSource!, forKey: uri as NSString)
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

