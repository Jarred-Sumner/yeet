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

  @objc(assetCollections) static var assetCollections: [PHAssetCollection] = {
    let fetchOptions = PHFetchOptions()
    fetchOptions.sortDescriptors = [NSSortDescriptor(key: "localizedTitle", ascending: true)]
    fetchOptions.predicate = NSPredicate(format: "estimatedAssetCount > 0")

    let albums = PHAssetCollection.fetchAssetCollections(with: .album, subtype: .any, options: fetchOptions)
    let smartAlbums = PHAssetCollection.fetchAssetCollections(with: .smartAlbum, subtype: .any, options: fetchOptions)

    var result = Set<PHAssetCollection>()

    [albums, smartAlbums].forEach {
      $0.enumerateObjects { collection, index, stop in
        result.insert(collection)
      }
    }

    return Array(result)
  }()

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
//        collection = PHAssetCollection.fetchAssetCollections(with:.smartAlbum,subtype:.smartAlbumRecentlyAdded,options: nil).firstObject
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
      let timestamp = asset.creationDate != nil ? dateFormatter.string(from: asset.creationDate!) : nil

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
        "timestamp": timestamp != nil ? timestamp! : nil,
        "duration": asset.duration
      ])
    }

    return [
      "sessionId": cacheKey,
      "album": assetCollection?.dictionaryValue,
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
  @objc(dictionaryValue)
  var dictionaryValue: [String: Any] {
    return [
      "id": localIdentifier,
      "title": localizedTitle,
      "type": RCTConvert.phAssetCollectionTypeValuesReversed()[assetCollectionType.rawValue],
      "subtype": RCTConvert.phAssetCollectionTypeValuesReversed()[assetCollectionSubtype.rawValue],
      "count":  estimatedAssetCount != NSNotFound ? NSNumber(value: estimatedAssetCount) : NSNumber(value: -1),
      "__type": "CameraRollAlbum"
    ]
  }
}
