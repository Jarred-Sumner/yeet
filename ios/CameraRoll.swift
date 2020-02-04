////
////  CameraRoll.swift
////  yeet
////
////  Created by Jarred WSumner on 1/31/20.
////  Copyright © 2020 Facebook. All rights reserved.
////
//
import UIKit
import Photos

@objc(CameraRoll) class CameraRoll: NSObject {
  private static var cameraRolls = NSCache<NSString, CameraRoll>()

  lazy var fetchOptions : PHFetchOptions = {
    let fetcher = PHFetchOptions()

    if self.assetCollection != nil {
       if let mediaType = self.mediaType {
        fetcher.predicate = NSPredicate(format: "mediaType == %d", mediaType.rawValue)
      }
    }


    return fetcher
  }()

  @objc(assetCollectionDictionaries) static func assetCollectionDictionaries() -> [Dictionary<String, Any>] {
    let fetchOptions = PHFetchOptions()
    fetchOptions

    let albums = PHAssetCollection.fetchAssetCollections(with: .album, subtype: .albumRegular, options: fetchOptions)
    let smartAlbums = PHAssetCollection.fetchAssetCollections(with: .smartAlbum, subtype: .any, options: fetchOptions)

    var result = Set<PHAssetCollection>()
    var counts: Dictionary<PHAssetCollection, Int> = [:]

    [albums, smartAlbums].forEach {
      $0.enumerateObjects { collection, index, stop in
        var count = collection.estimatedAssetCount

        var hasItems = collection.estimatedAssetCount > 0 && collection.estimatedAssetCount != NSNotFound

        if collection.estimatedAssetCount == NSNotFound {
          count = PHAsset.fetchAssets(in: collection, options: nil).count
          counts[collection] = count
          hasItems = count > 0
        } else {
          counts[collection] = count
        }

        if hasItems {
          result.insert(collection)
        }
      }
    }

    let results: [PHAssetCollection] = Array(result).sorted { $0.localizedTitle != nil && $1.localizedTitle != nil ? $0.localizedTitle!.lowercased() < $1.localizedTitle!.lowercased() : true }

    var dicts: [Dictionary<String, Any>] = []

    for result in results {
      dicts.append(result.dictionaryValueWithCount(count: counts[result] ?? 0 ))
    }

    return dicts
  }

  @objc(stopSession:)
  static func stopSession(_ cacheKey: NSString) {
    cameraRolls.removeObject(forKey: cacheKey)
  }

  let assetCollection: PHAssetCollection?

  lazy var result: PHFetchResult<PHAsset>? = {
    if let assetCollection = self.assetCollection {
      return PHAsset.fetchAssets(in: assetCollection, options: self.fetchOptions)
    } else if let mediaType = self.mediaType {
      return PHAsset.fetchAssets(with: mediaType, options: nil)
    } else {
      let fetchOptions = PHFetchOptions()
      fetchOptions.includeHiddenAssets = false
      fetchOptions.predicate = NSPredicate(format:"(mediaType == %d) || (mediaType == %d)", PHAssetMediaType.image.rawValue, PHAssetMediaType.video.rawValue)

      var collection: PHAssetCollection?  = PHAssetCollection.fetchAssetCollections(with:.smartAlbum,subtype:.smartAlbumUserLibrary,options: nil).firstObject
//      if #available(iOS 13.0, *) {
//        collection = PHAssetCollection.fetchAssetCollectio  ns(with:.smartAlbum,subtype:.smartAlbumRecentlyAdded,options: nil).firstObject
//      } else {
//        collection = PHAssetCollection.fetchAssetCollections(with:.smartAlbum,subtype:.smartAlbumUserLibrary,options: nil).firstObject
//      }

      if let _collection = collection {
        return PHAsset.fetchAssets(in: _collection, options: fetchOptions)
      } else {
        return PHAsset.fetchAssets(with: fetchOptions)
      }
    }
  }()

  let mediaType: PHAssetMediaType?
  var cacheKey: String {
    return CameraRoll.cacheKey(assetCollection: assetCollection, mediaType: mediaType, size: size, contentMode: contentMode, cache: cache)
  }

  static private func cacheKey(assetCollection: PHAssetCollection?, mediaType: PHAssetMediaType? = nil, size: CGSize = .zero, contentMode: PHImageContentMode = .aspectFill, cache: Bool = true) -> String {
    return "CameraRoll/\(assetCollection?.localIdentifier ?? "generic")/\(String(describing: mediaType))-\(size.width)\(size.height)-\(cache)-\(contentMode.rawValue)"
  }

  @objc(withAlbumID:mediaType:size:contentMode:cache:)
  static func with(assetCollectionID: String? = nil, mediaType: String? = nil, size: CGSize = .zero, contentMode: PHImageContentMode = .aspectFill, cache: Bool = true) -> CameraRoll {
    var assetCollection: PHAssetCollection? = nil

    if let localId = assetCollectionID {
      if let _assetCollection = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [localId], options: nil).firstObject {
        assetCollection = _assetCollection
      }
    }

    var _mediaType: PHAssetMediaType? = nil
    if mediaType == "photos" {
       _mediaType = PHAssetMediaType.image
     } else if mediaType == "videos" {
       _mediaType = PHAssetMediaType.video
     }

    if cache {
      let cacheKey = self.cacheKey(assetCollection: assetCollection, mediaType: _mediaType, size: size, contentMode: contentMode, cache: cache)

      if let cameraRoll = CameraRoll.cameraRolls.object(forKey: cacheKey as NSString) {
        return cameraRoll
      }
    }

    return CameraRoll(assetCollection: assetCollection, mediaType: _mediaType, size: size, contentMode: contentMode, cache: cache)
  }

  init(assetCollection: PHAssetCollection?, mediaType: PHAssetMediaType? = nil, size: CGSize = .zero, contentMode: PHImageContentMode = .aspectFill, cache: Bool = true) {
    self.mediaType = mediaType
    self.assetCollection = assetCollection
    self.contentMode = contentMode
    self.size = size
    self.cache = cache
    super.init()

    if cache {
      CameraRoll.cameraRolls.setObject(self, forKey: cacheKey as NSString)
    }
  }

  @objc(count) lazy var count: NSInteger = {
    if let mediaType = mediaType {
      return result?.countOfAssets(with: mediaType) ?? 0
    } else {
      return result?.count ?? 0
    }
  }()

  let dateFormatter = ISO8601DateFormatter()
  @objc(size) let size: CGSize
  @objc(contentMode) let contentMode: PHImageContentMode

  private func response(data: [PHAsset], error: Error? = nil, offset: Int) -> Dictionary<String, Any> {
    let length = data.count
    let dateFormatter = self.dateFormatter
    let remaining = count - offset + length

    var values: [Dictionary<String, Any>] = []
    for asset in data {
      var timestamp: Date? = nil

      if asset.modificationDate != nil {
        timestamp = asset.modificationDate
      }

      if timestamp == nil {
        timestamp = asset.creationDate
      }

      var mimeType: MimeType? = nil

      let filename = asset.value(forKey: "filename") as? String

      if let _filename = asset.value(forKey: "filename")  {
        if let pathExtension = URL(string: "file://blah/\(_filename)")?.pathExtension {
          mimeType = MimeType.fileExtension(pathExtension)
        }
      }

      values.append([
        "uri": "ph://\(asset.localIdentifier)",
        "width": asset.pixelWidth,
        "height": asset.pixelHeight,
        "filename": filename,
        "mimeType": mimeType?.rawValue,
        "timestamp": timestamp != nil ? dateFormatter.string(from: timestamp!) : nil,
        "duration": asset.duration
      ])
    }

    return [
      "sessionId": cacheKey,
      "album": assetCollection != nil ? assetCollection!.dictionaryValueWithCount(count: assetCollection!.estimatedAssetCount) : nil,
      "page_info": [
        "offset": offset,
        "limit": length,
        "count": count,
        "remaining": remaining,
        "has_next_page": remaining > 0,
      ],
      "data": values,
      "error": error?.localizedDescription
    ]
  }

  @objc(cache) let cache: Bool

  @objc(from:to:) func page(offset: NSInteger, length: NSInteger) -> Dictionary<String, Any> {
    if assetCollection != nil {
      return page(offset: offset, length: length, reversed: false)
    } else {
      return page(offset: offset, length: length, reversed: true)
    }
  }

  func page(offset: NSInteger, length: NSInteger, reversed: Bool) -> Dictionary<String, Any> {
    var results: [PHAsset] = []
    guard let result = self.result else {
      return response(data: [], error: nil, offset: offset)
    }

    let fetchResultCache = YeetImageView.fetchRequestCache


    if reversed {
      let _offset = NSInteger(max(count - offset - length, 0))
      let endOffset = max(min(_offset + length, count - 1), 1)

      guard endOffset > _offset else {
       return response(data: [], error: nil, offset: offset)
      }

      guard endOffset < count else {
       return response(data: [], error: nil, offset: offset)
      }

      result.enumerateObjects(at: IndexSet(integersIn: _offset...endOffset), options: .reverse) { asset, index, stopper in
        results.append(asset)
        if self.cache {
         if let _result = self.result {
          fetchResultCache.setObject(asset, forKey: asset.localIdentifier as NSString)
         }
        }
      }
    } else {
      let endOffset = max(min(offset + length, count - 1), min(1, count))
      guard endOffset > offset else {
       return response(data: [], error: nil, offset: offset)
      }

      guard endOffset < count else {
       return response(data: [], error: nil, offset: offset)
      }

      result.enumerateObjects(at: IndexSet(integersIn: offset...endOffset), options: .init(rawValue: 0)) { asset, index, stopper in
        results.append(asset)
        if self.cache {
         if let _result = self.result {
          fetchResultCache.setObject(asset, forKey: asset.localIdentifier as NSString)
         }
        }
      }
    }

    if cache && results.count > 0 {
     YeetImageView.phImageManager.startCachingImages(for: results, targetSize: size, contentMode: contentMode, options: nil)
    }

    return response(data: results, error: nil, offset: offset)
  }

  @objc(stop) func stop() {
    CameraRoll.cameraRolls.removeObject(forKey: cacheKey as NSString)
  }

}

@objc(PHAssetCollection)
extension PHAssetCollection {
  @objc(dictionaryValueWithCount:)
  func dictionaryValueWithCount(count: Int)  -> [String: Any] {
    return [
      "id": localIdentifier,
      "title": localizedTitle,
      "type": RCTConvert.phAssetCollectionTypeValuesReversed()[assetCollectionType.rawValue],
      "subtype": RCTConvert.phAssetCollectionTypeValuesReversed()[assetCollectionSubtype.rawValue],
      "count":  count,
      "__type": "CameraRollAlbum"
    ]
  }
}
