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


  static fileprivate var _cache: NSCache<NSString, MediaSource>? = nil
  

  static fileprivate var cache: NSCache<NSString, MediaSource> {
    if (_cache == nil) {
      _cache =  NSCache<NSString, MediaSource>()
      _cache!.countLimit = 50
    }

    return _cache!;
  }

  static func clearCache() {
    self.cache.removeAllObjects()
  }

//  lazy var asset = AVURLAsset(url: uri)

  lazy var assetURI: URL = {
    if let cacheCompleteURL = KTVHTTPCache.cacheCompleteFileURL(with: self.uri) {
      return cacheCompleteURL
    } else if KTVHTTPCache.proxyIsRunning() {
      return KTVHTTPCache.proxyURL(withOriginalURL: self.uri)
    } else {
      return self.uri
    }
  }()

  private var _videoAsset: AVURLAsset? = nil
  var asset: AVURLAsset? {
    if (!self.isVideo) {
      return nil
    }

    if (_videoAsset == nil) {
      _videoAsset = AVURLAsset.init(url: assetURI)
    }

    return _videoAsset
  }

  lazy var playerItem: AVPlayerItem? = {
//    guard let asset = self.videoAsset else {
//      return nil
//    }


    let _playerItem = AVPlayerItem(asset: asset!)
    
    return _playerItem
  }()

  var isVideo: Bool {
    return self.mimeType == MimeType.mp4
  }

  var isImage: Bool {
    return [MimeType.png, MimeType.webp, MimeType.jpg].contains(self.mimeType)
  }

  var naturalBounds: CGRect {
    return bounds.applying(.init(scaleX: CGFloat(pixelRatio.doubleValue), y: CGFloat(pixelRatio.doubleValue)))
  }

  init(uri: URL, mimeType: MimeType, duration: NSNumber, playDuration: NSNumber, id: String, width: NSNumber, height: NSNumber, bounds: CGRect, pixelRatio: NSNumber) {
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
//      self.videoAsset?.cancel()
    }
  }

  static func from(uri: String, mimeType: MimeType, duration: NSNumber, playDuration: NSNumber, id: String, width: NSNumber, height: NSNumber, bounds: CGRect, pixelRatio: NSNumber) -> MediaSource {
    guard let cachedVersion = self.cached(uri: uri) else {
      return MediaSource(uri: URL(string: uri)!, mimeType: mimeType, duration: duration, playDuration: playDuration, id: id, width: width, height: height, bounds: bounds, pixelRatio: pixelRatio)
    }

    return cachedVersion
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
