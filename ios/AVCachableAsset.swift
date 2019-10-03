//
//  AVCachableAsset.swift
//  yeet
//
//  Created by Jarred WSumner on 10/1/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import AVFoundation


class AVCachableAsset : DVURLAsset, DVAssetLoaderDelegatesDelegate {


  static let videoAssetCacheURI = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).last!
  static func createCacheDir() {
    var isDir: ObjCBool = true

    if (!FileManager.default.fileExists(atPath: AVCachableAsset.videoAssetCacheURI.path, isDirectory: &isDir)) {
      try! FileManager.default.createDirectory(at: AVCachableAsset.videoAssetCacheURI, withIntermediateDirectories: true, attributes: nil)
    }
  }

  override init(url: URL!, options: [String : Any]! = [:], networkTimeout: TimeInterval) {
    let _url = AVCachableAsset.isCached(url: url) ? AVCachableAsset.cacheURI(url: url) : url

    super.init(url: _url, options: options, networkTimeout: networkTimeout)

    self.loaderDelegate = self
  }

  static func cacheURI(url: URL) -> URL {
    return AVCachableAsset.videoAssetCacheURI.appendingPathComponent(url.deletingPathExtension().path.slugify()! + "." + url.pathExtension )
  }

  static func isCached(url: URL) -> Bool {
    let path = AVCachableAsset.cacheURI(url: url).path
    return FileManager.default.fileExists(atPath: path)
  }

  func dvAssetLoaderDelegate(_ loaderDelegate: DVAssetLoaderDelegate!, didLoad data: Data!, for url: URL!) {
    let destination = AVCachableAsset.cacheURI(url: url)
    DispatchQueue.global(qos: .background).async {
      AVCachableAsset.createCacheDir()

      try! data.write(to: destination, options: .atomicWrite)
    }
  }

//  func dvAssetLoaderDelegate(_ loaderDelegate: DVAssetLoaderDelegate!, didLoad data: Data!, for range: NSRange, url: URL!) {
//    let destination = self.cacheURI
//    DispatchQueue.global(qos: .background).async {
//      AVCachableAsset.createCacheDir()
//
//
//      let handle = FileHandle(forUpdating: destination)
//      handle.seek(toFileOffset: range.lowerBound as uint64)
//    }
//  }

//  func dvAssetLoaderDelegate(_ loaderDelegate: DVAssetLoaderDelegate!, didLoad data: Data!, for url: URL!, withMIMEType mimeType: String!) {
//
//  }

  func dvAssetLoaderDelegate(_ loaderDelegate: DVAssetLoaderDelegate!, didRecieveLoadingError error: Error!, with dataTask: URLSessionDataTask!, for request: AVAssetResourceLoadingRequest!) {

  }
}

extension String {
    private static let slugSafeCharacters = CharacterSet(charactersIn: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-")

    public func slugify() -> String? {
        if let latin = self.applyingTransform(StringTransform("Any-Latin; Latin-ASCII; Lower;"), reverse: false) {
            let urlComponents = latin.components(separatedBy: String.slugSafeCharacters.inverted)
            let result = urlComponents.filter { $0 != "" }.joined(separator: "-")

            if result.count > 0 {
                return result
            }
        }

        return nil
    }
}
