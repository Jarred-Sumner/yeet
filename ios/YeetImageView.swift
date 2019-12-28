//
//  YeetImageView.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import PINRemoteImage
import Photos
import Promise
import UIKit

@objc(YeetImageView)
class YeetImageView : PINAnimatedImageView {
  typealias ImageFetchCompletionBlock = (_ image: UIImage?) -> Void

  enum YeetImageViewResizeMode : String {
    case aspectFit = "aspectFit"
    case aspectFill = "aspectFill"
  }
  
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

      if ((newValue != old && newValue?.mediaSource.uri != old?.mediaSource.uri) ) {
        old?.hasLoaded = false
        old?.stop()

        if let videoCover = self.videoCover {
          videoCover.stop()
        }

        if let imageRequestID = imageRequestID {
          YeetImageView.phImageManager.cancelImageRequest(imageRequestID)
          self.imageRequestID = nil
        }

        if newValue != nil {
          self.loadImage()
        }

      }
   }
  }

  static let phImageManager = PHCachingImageManager()


  var imageRequestID: PHImageRequestID? = nil
  var livePhotoRequestID: PHLivePhotoRequestID? = nil

  @objc (startCachingMediaSources:bounds:contentMode:)
  static func startCaching(mediaSources: Array<MediaSource>, bounds: CGRect, contentMode: UIView.ContentMode) {

    let urls = mediaSources.filter { mediaSource in
      return mediaSource.isFromCameraRoll
    }.map { mediaSource in
      return mediaSource.uri
    }

    guard let fetchReq = MediaSource.fetchRequest(urls: urls) else {
      return
    }


    let request = PHImageRequestOptions()
    request.isNetworkAccessAllowed = true
    request.deliveryMode = .opportunistic


    let _contentMode = contentMode == .scaleAspectFit ? PHImageContentMode.aspectFit : PHImageContentMode.aspectFill


    phImageManager.startCachingImages(for: fetchReq.objects(at: IndexSet.init(integersIn: 0...fetchReq.count - 1)), targetSize: bounds.size, contentMode: _contentMode, options: request)
  }

  @objc (stopCachingMediaSources:bounds:contentMode:)
  static func stopCaching(mediaSources: Array<MediaSource>, bounds: CGRect, contentMode: UIView.ContentMode) {
    let urls = mediaSources.filter { mediaSource in
      return mediaSource.isFromCameraRoll
    }.map { mediaSource in
      return mediaSource.uri
    }

    guard let fetchReq = MediaSource.fetchRequest(urls: urls) else {
      return
    }


    let request = PHImageRequestOptions()
    request.isNetworkAccessAllowed = true
    request.deliveryMode = .opportunistic


    let _contentMode = contentMode == .scaleAspectFit ? PHImageContentMode.aspectFit : PHImageContentMode.aspectFill

    phImageManager.stopCachingImages(for: fetchReq.objects(at: IndexSet.init(integersIn: 0...fetchReq.count - 1)), targetSize: bounds.size, contentMode: _contentMode, options: request)
  }

  @objc (stopCaching)
  static func stopCaching() {
    phImageManager.stopCachingImagesForAllAssets()
  }


  static func fetchCameraRollAsset(mediaSource: MediaSource, size: CGSize, cropRect: CGRect = .zero, contentMode: UIView.ContentMode, deliveryMode: PHImageRequestOptionsDeliveryMode = .opportunistic, completion: @escaping ImageFetchCompletionBlock) -> (PHImageRequestID?, PHLivePhotoRequestID?) {
    guard let fetchReq = MediaSource.fetchRequest(url: mediaSource.uri) else {
      completion(nil)
      return (nil, nil)
    }

    guard let asset = fetchReq.firstObject else {
      completion(nil)
      return (nil, nil)
    }

    let _contentMode = contentMode == .scaleAspectFit ? PHImageContentMode.aspectFit : PHImageContentMode.aspectFill

    phImageManager.allowsCachingHighQualityImages = false

    var livePhotoRequestID: PHLivePhotoRequestID? = nil
    var imageRequestID: PHImageRequestID? = nil

//    if asset.mediaSubtypes.contains(.photoLive) {
//      let request = PHLivePhotoRequestOptions()
//      request.isNetworkAccessAllowed = true
//      request.deliveryMode = .opportunistic
//
//      livePhotoRequestID = phImageManager.requestLivePhoto(for: asset, targetSize: bounds.size, contentMode: _contentMode, options: request) { livePhoto, _ in
//        guard let livePhoto = livePhoto else {
//          return
//        }
//
//        let assetResources = PHAssetResource.assetResources(for: livePhoto)
//
//        let photoResource = assetResources.first { resource in
//          return resource.type == .photo
//        }
//
//        phImageManager.
//      }
//    } else {
      let request = PHImageRequestOptions()
      request.isNetworkAccessAllowed = true
      if cropRect != .zero {
        request.normalizedCropRect = cropRect.integral
        request.resizeMode = .exact
      }

      request.deliveryMode = deliveryMode

       imageRequestID = phImageManager.requestImage(for: asset, targetSize: size, contentMode: _contentMode, options: request) { image, _ in
        completion(image)
      }
//    }


    return (imageRequestID, livePhotoRequestID)
  }

  @objc(source) var mediaSource: MediaSource? = nil

  var _resizeMode: YeetImageView.YeetImageViewResizeMode = .aspectFit
  @objc(resizeMode)
  var resizeMode: String {
    get {
      return _resizeMode.rawValue
    }

    set (newValue) {
      if YeetImageView.YeetImageViewResizeMode.aspectFill.rawValue == newValue {
        _resizeMode = .aspectFill
        self.contentMode = .scaleAspectFill
      } else if YeetImageView.YeetImageViewResizeMode.aspectFit.rawValue == newValue {
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
    self.backgroundColor = .clear


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


  func loadFullSizeImage(contentMode: UIView.ContentMode, size: CGSize, cropRect: CGRect = .zero) -> Promise<UIImage> {
    return Promise<UIImage>() { resolve, reject in
      guard let mediaSource = self.mediaSource else {
        reject(YeetError.init(code: .invalidMediaSource))
        return
      }

      if mediaSource.isHTTProtocol {
        let (url, _) = YeetImageView.imageUri(source: mediaSource, bounds: CGRect(origin: .zero, size: size))

        PINRemoteImageManager.shared().downloadImage(with: url) { result in
          if let image = result.image {
            resolve(image)
          } else {
            reject(result.error ?? YeetError.init(code: .fetchMediaFailed))
          }
        }
      } else if mediaSource.isFromCameraRoll {
        let (_, _) = YeetImageView.fetchCameraRollAsset(mediaSource: mediaSource, size: size, cropRect: cropRect, contentMode: contentMode, deliveryMode: .highQualityFormat) {  image in
          if let image = image {
            resolve(image)
          } else {
            reject(YeetError.init(code: .fetchMediaFailed))
          }
        }
      } else if mediaSource.isFileProtocol {
        var image: UIImage? = nil

        do {
          if mediaSource.mimeType == MimeType.gif || mediaSource.mimeType == MimeType.webp {
            image = try PINCachedAnimatedImage.init(animatedImageData: Data.init(contentsOf: mediaSource.uri)) as! UIImage?
          } else {
            image = try UIImage.init(data: Data.init(contentsOf: mediaSource.uri))
          }
        } catch {
          reject(error)
          return
        }

        if let _image = image {
          resolve(_image)
        } else {
          reject(YeetError.init(code: .fetchMediaFailed))
        }
      }
    }

  }

  var videoCover: MediaSourceVideoCover? = nil

  func handleImageResult(result: PINRemoteImageManagerResult, scale: CGFloat) {
    let success = self.image != nil || self.animatedImage != nil
    self.handleLoad(success: success, error: result.error)
  }

  var lastURL: URL? = nil

  func loadImage(async: Bool = true) {
    guard let mediaSource = self.mediaSource else {
//      self.image = nil
      return
    }

    if mediaSource.isFromCameraRoll {
      let (imageRequestID, livePhotoRequestID) = YeetImageView.fetchCameraRollAsset(mediaSource: mediaSource, size: bounds.applying(.init(scaleX: UIScreen.main.nativeScale, y: UIScreen.main.nativeScale)).size, contentMode: self.contentMode) { [weak self] image in
        if self?.imageRequestID != nil {
          self?.imageRequestID = nil
        }

        self?.handleImageLoad(image: image, scale: UIScreen.main.nativeScale)
      }

      self.imageRequestID = imageRequestID
    } else if mediaSource.isVideoCover && mediaSource.coverUri == nil {
      mediaSource.loadAsset { [weak self] asset in
        guard let _asset = asset else {
          self?.handleLoad(success: false)
          return
        }

        guard _asset.tracks(withMediaType: .video).count > 0 else {
          self?.handleLoad(success: false)
           return
        }

        // To get the bounds
        DispatchQueue.main.async { [weak self]  in
          guard let bounds = self?.bounds else {
            self?.handleLoad(success: false)
            return
          }

          let maximumSize = bounds.applying(self!.transform.concatenating(.init(scaleX: UIScreen.main.nativeScale, y: UIScreen.main.nativeScale))).standardized.size
          self?.videoCover = MediaSourceVideoCover(mediaSource: mediaSource, size: maximumSize)

          self?.videoCover?.load().then(on: DispatchQueue.main) { [weak self] image in
            self?.handleImageLoad(image: image, scale: CGFloat(1.0), async: false)
          }.catch { error in
            self?.handleImageLoad(image: nil, scale: CGFloat(1.0), error: error)
          }
        }

      }
    } else if mediaSource.isHTTProtocol {
      let (url, scale) = YeetImageView.imageUri(source: mediaSource, bounds: bounds)
      let needsChange = lastURL != url || ((image == nil && animatedImage == nil) && pin_downloadImageOperationUUID() == nil)

      guard needsChange else {
        if (pin_downloadImageOperationUUID() == nil) {
          self.handleLoad(success: true, error: nil)
        }
        return
      }

      self.pin_setImage(from: url, placeholderImage: nil) { [weak self] result in
        self?.handleImageResult(result: result, scale: scale)
      }
      lastURL = url
    } else if mediaSource.isFileProtocol {
     do {
      try self.loadFileImage(async: async)
     }  catch {
       self.handleImageLoad(image: nil, scale: CGFloat(1), error: error)
       return
     }

    }

    onLoadStartEvent?(["id": mediaSource.id])
  }

  var isLoadingImage: Bool {
    guard let mediaSource = mediaSource else {
      return false
    }

    if mediaSource.isFromCameraRoll {
      return imageRequestID != nil
    } else if mediaSource.isHTTProtocol {
      return pin_downloadImageOperationUUID() != nil
    } else {
      return false
    }
  }

  func _loadFileImage(async: Bool = true) throws {
    let data = try Data.init(contentsOf: mediaSource!.uri) as NSData

    var image: UIImage? = nil
    if data.pin_isAnimatedGIF() || data.pin_isAnimatedWebP() {
      image = PINCachedAnimatedImage.init(animatedImageData: data as Data) as! UIImage?
    } else {
      image = UIImage.pin_decodedImage(with: data as Data)
    }

    self.handleImageLoad(image: image, scale: image?.scale ?? CGFloat(1), error: nil, async: async)
  }
  func loadFileImage(async: Bool = true) throws {
    if async {
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          try self._loadFileImage(async: async)
        } catch {
          self.handleLoad(success: false, error: error)
        }
      }
    } else {
      do {
        try self._loadFileImage(async: async)
      } catch {
        self.handleLoad(success: false, error: error)
      }
    }
  }

  func handleImageLoad(image: UIImage?, scale: CGFloat, error: Error? = nil, async: Bool = true) {
    if async {
      DispatchQueue.main.async { [weak self] in
        self?._handleImageLoad(image: image, scale: scale, error: error)
      }
    } else {
        self._handleImageLoad(image: image, scale: scale, error: error)
    }

  }

  func _handleImageLoad(image: UIImage?, scale: CGFloat, error: Error? = nil) {
    if animatedImage != nil && image == nil {
      self.handleLoad(success: true, error: error)
      return
    }

    if let image = image {
      if image != self.image {
        if image.scale != scale {
          self.image = UIImage(cgImage: image.cgImage!, scale: scale, orientation: image.imageOrientation)
        } else {
          self.image = image
        }
      }
    } else {
      self.image = nil
    }


    self.handleLoad(success: image != nil || animatedImage != nil, error: error)
  }



  @objc (onLoadStart) var onLoadStartEvent: RCTDirectEventBlock? = nil
  @objc (onLoad) var onLoadEvent: RCTDirectEventBlock? = nil
  @objc (onError) var onErrorEvent: RCTDirectEventBlock? = nil

  var imageSize: CGSize {
    if let animatedImage = self.animatedImage {
      return animatedImage.coverImage.size
    } else if let image = self.image {
      return image.size.applying(CGAffineTransform.init(scaleX: 1 / image.scale, y: 1 / image.scale))
    } else {
      return .zero
    }
  }

  func handleLoad(success: Bool, error: Error? = nil) {
    if (success) {
      self._source?.onLoad()
      if self.animatedImage != nil {
        self._source?.play()
      }

      guard let mediaSource = self.mediaSource else {
        onLoadEvent?([:])
        return
      }


      let size = imageSize
      onLoadEvent?([ "id": mediaSource.id, "width": size.width, "height": size.height ])
    } else {
      guard let mediaSource = self.mediaSource else {
        return
      }

      Log.debug(error, context: self.mediaSource)
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

    if let host = source.uri.host {
      if host.contains("giphy") || host.contains("mux") || host.contains("webthing") || source.width.doubleValue < 1 || source.height.doubleValue < 1 {
        return source.uri
      }
    }

    let maxX = Int(imageWidth(source: source, bounds: bounds))

    if (maxX == 0) {
      return source.uri
    }


//    let cropRect = [
//      "cx": source.naturalBounds.origin.x,
//      "cy": source.naturalBounds.origin.y,
////      "cw": cropMaxX,
////      "ch": cropMaxY
//    ]

//    let cropRectString = cropRect.compactMap { key, value in
//      if (value > .zero) {
//        return "\(key)\(Int(floor(value)))"
//      } else {
//        return nil
//      }
//    }.joined(separator: ",")

    var url = URL(string: "https://i.webthing.co/")!


    url = url.appendingPathComponent("\(maxX)x", isDirectory: true)
    url = url.appendingPathComponent(source.uri.absoluteString, isDirectory: false)

    return url
  }

  func reset() {
    self.source = nil
    self.pin_cancelImageDownload()

    if let imageRequest = self.imageRequestID {
      YeetImageView.phImageManager.cancelImageRequest(imageRequest)
      self.imageRequestID = nil
    }

    videoCover?.stop()
    videoCover = nil

    self.isPlaybackPaused = true
  }


  deinit {
    self.reset()
    self.animatedImage?.clearCache()
    self.animatedImage = nil
    videoCover?.stop()
  }
}
