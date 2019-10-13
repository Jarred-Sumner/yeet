//
//  YeetImageView.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import PINRemoteImage
import SwiftyBeaver
import Photos

enum YeetImageViewResizeMode : String {
  case aspectFit = "aspectFit"
  case aspectFill = "aspectFill"
}

typealias ImageFetchCompletionBlock = (_ image: UIImage?) -> Void

@objc(YeetImageView)
class YeetImageView : PINAnimatedImageView {
  @objc var sentOnLoadStart = false
  @objc var completed = false
  @objc var errored = false
  @objc var needsReload = false
  private var _source: TrackableImageSource? = nil
  var source: TrackableImageSource? {
    get {
      return _source
    }

    set (newValue) {
      let old = _source
      self._source = newValue
      self.mediaSource = newValue?.mediaSource

      if ((newValue != old && newValue?.mediaSource.uri != old?.mediaSource.uri)  || self.image == nil) {
        old?.hasLoaded = false
        old?.stop()

        if let imageRequestID = imageRequestID {
          YeetImageView.phImageManager.cancelImageRequest(imageRequestID)
          self.imageRequestID = nil
        }

        if self.pin_downloadImageOperationUUID() != nil {
          self.pin_cancelImageDownload()
        }

        self.loadImage()
      }
   }
  }

  static let phImageManager = PHCachingImageManager()


  var imageRequestID: PHImageRequestID? = nil

  static func fetchCameraRollAsset(mediaSource: MediaSource, bounds: CGRect, contentMode: UIView.ContentMode, completion: @escaping ImageFetchCompletionBlock) -> PHImageRequestID? {
    let request = PHImageRequestOptions()
    request.isNetworkAccessAllowed = true
    request.deliveryMode = .opportunistic

    phImageManager.allowsCachingHighQualityImages = false


    guard let fetchReq = MediaSource.fetchRequest(url: mediaSource.uri) else {
      completion(nil)
      return nil
    }

    guard let asset = fetchReq.firstObject else {
      completion(nil)
      return nil
    }

    let _contentMode = contentMode == .scaleAspectFit ? PHImageContentMode.aspectFit : PHImageContentMode.aspectFill

    return phImageManager.requestImage(for: asset, targetSize: bounds.size, contentMode: _contentMode, options: request) { image, _ in
      completion(image)
    }
  }

  @objc(source) var mediaSource: MediaSource? = nil

  var _resizeMode: YeetImageViewResizeMode = .aspectFill
  @objc(resizeMode)
  var resizeMode: String {
    get {
      return _resizeMode.rawValue
    }

    set (newValue) {
      if YeetImageViewResizeMode.aspectFill.rawValue == newValue {
        _resizeMode = .aspectFill
        self.contentMode = .scaleAspectFill
      } else if YeetImageViewResizeMode.aspectFit.rawValue == newValue {
        _resizeMode = .aspectFit
        self.contentMode = .scaleAspectFit
      }
    }
  }

  init() {
    super.init(frame: .zero)
    self.contentMode = .scaleAspectFit
    let shouldAntiAlias = frame.size.width < UIScreen.main.bounds.size.width
    layer.allowsEdgeAntialiasing = shouldAntiAlias
    layer.edgeAntialiasingMask = [.layerBottomEdge, .layerTopEdge, .layerLeftEdge, .layerRightEdge]


    self.clipsToBounds = true
    self.pin_updateWithProgress = true
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    
    let shouldAntiAlias = frame.size.width < UIScreen.main.bounds.size.width
    layer.allowsEdgeAntialiasing = shouldAntiAlias
  }


  required init?(coder: NSCoder) {
    fatalError("not implemented")
  }

  var isAnimatedImage: Bool = false

  @objc (animated) var animated: Bool {
    get {
      return self.isAnimating
    }

    set (newValue) {
      if (newValue == self.isAnimatedImage) {
        return
      }

      DispatchQueue.main.async { [weak self] in
        if (self?.isAnimating ?? false) {
            self?.stopAnimating()
          } else {
            self?.startAnimating()
          }
      }

    }
  }

  func loadImage() {
    guard let mediaSource = self.mediaSource else {
      self.image = nil
      return
    }

    if mediaSource.isHTTProtocol {
      let (url, scale) = YeetImageView.imageUri(source: mediaSource, bounds: bounds)

      self.pin_setImage(from: url, processorKey: nil, processor: nil) { [weak self] result in
        self?.handleImageLoad(image: result.image, scale: scale, error: result.error)
      }
    } else if mediaSource.isFromCameraRoll {
      self.imageRequestID = YeetImageView.fetchCameraRollAsset(mediaSource: mediaSource, bounds: bounds.applying(.init(scaleX: UIScreen.main.nativeScale, y: UIScreen.main.nativeScale)), contentMode: self.contentMode) { [weak self] image in
        if self?.imageRequestID != nil {
          self?.imageRequestID = nil
        }

        self?.handleImageLoad(image: image, scale: UIScreen.main.nativeScale)
      }
    }

    onLoadStartEvent?(["id": mediaSource.id])
  }

  func handleImageLoad(image: UIImage?, scale: CGFloat, error: Error? = nil) {
    if let image = image {
      if image.scale != scale {
        self.image = UIImage(cgImage: image.cgImage!, scale: scale, orientation: image.imageOrientation)
      } else {
        self.image = image
      }
    } else {
      self.image = nil
    }

    self.handleLoad(success: image != nil, error: error)
  }


  @objc (onLoadStart) var onLoadStartEvent: RCTDirectEventBlock? = nil
  @objc (onLoad) var onLoadEvent: RCTDirectEventBlock? = nil
  @objc (onError) var onErrorEvent: RCTDirectEventBlock? = nil

  func handleLoad(success: Bool, error: Error? = nil) {
    if (success) {
      DispatchQueue.main.async { [weak self] in
        self?._source?.onLoad()
      }

      guard let mediaSource = self.mediaSource else {
        onLoadEvent?([:])
        return
      }


      onLoadEvent?([ "id": mediaSource.id ])
    } else {
      guard let mediaSource = self.mediaSource else {
        return
      }

      onErrorEvent?([ "id": mediaSource.id, "error": error!.localizedDescription ])
      if error != nil {
        DispatchQueue.main.async { [weak self] in
          if let error = error {
            self?._source?.onError(error: error)
          }
        }
      }

    }

  }

  static let imageUriCache = NSCache<NSString, AnyObject>()

  static func imageUri(source: MediaSource, bounds: CGRect) -> (URL, CGFloat) {
    let cacheKey = "\(source.id)-\(bounds.size.width)-\(bounds.size.height)-\(bounds.origin.y)-\(bounds.origin.x)" as NSString

    if let cachedURI = imageUriCache.object(forKey: cacheKey) as! URL? {
      return (cachedURI, imageScale(source: source, bounds: bounds))
    } else {
      let url = _imageUri(source: source, bounds: bounds)
      imageUriCache.setObject(url as AnyObject, forKey: cacheKey)
      return (url, imageScale(source: source, bounds: bounds))
    }
  }

  static func imageWidth(source: MediaSource, bounds: CGRect) -> CGFloat {
    let cropBounds = source.naturalBounds

    let cropMaxX = cropBounds.size.width - cropBounds.origin.x

    let boundsWidth = bounds.size.width > .zero ? bounds.size.width : UIScreen.main.bounds.width

    let _maxX =  [
      [cropMaxX, CGFloat(source.width.doubleValue * source.pixelRatio.doubleValue)].filter { number in
       return number > CGFloat(1)
      }.max() ?? .zero,
      boundsWidth * UIScreen.main.nativeScale
    ].min() ?? .zero


    return _maxX
  }

  static func imageScale(source: MediaSource, bounds: CGRect) -> CGFloat {
    let maxX = imageWidth(source: source, bounds: bounds)
    let boundsWidth = bounds.size.width > .zero ? bounds.size.width : UIScreen.main.bounds.width

    return maxX < CGFloat(1) ? CGFloat(1) : maxX / boundsWidth
  }

  static func _imageUri(source: MediaSource, bounds: CGRect) -> URL {
    if (!source.isHTTProtocol) {
      return source.uri
    }

    let maxX = imageWidth(source: source, bounds: bounds)

    if (maxX == 0) {
      return source.uri
    }


    let cropRect = [
      "cx": source.naturalBounds.origin.x,
      "cy": source.naturalBounds.origin.y,
//      "cw": cropMaxX,
//      "ch": cropMaxY
    ]

    let cropRectString = cropRect.compactMap { key, value in
      if (value > .zero) {
        return "\(key)\(Int(floor(value)))"
      } else {
        return nil
      }
    }.joined(separator: ",")

    let urlString = "https://i.webthing.co/\(cropRectString.count > 0 ? cropRectString + "," : "")\(maxX)x/\(source.uri.absoluteString)"

    return URL(string: urlString)!
  }


  deinit {
    self.pin_cancelImageDownload()

    if let imageRequest = self.imageRequestID {
      YeetImageView.phImageManager.cancelImageRequest(imageRequest)
      self.imageRequestID = nil
    }
  }
}
