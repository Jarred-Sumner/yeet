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
  private weak var _source: TrackableImageSource? = nil
  var source: TrackableImageSource? {
    get {
      return _source
    }

    set (newValue) {
      let old = _source
      self._source = newValue
      self.mediaSource = newValue?.mediaSource
      

      if ((newValue != old && newValue?.mediaSource.uri != old?.mediaSource.uri) || [.pending, .error].contains(loadStatus)) {
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

  static var phImageManager = PHCachingImageManager() {
    didSet {
      phImageManager.allowsCachingHighQualityImages = true
    }
  }


  var imageRequestID: PHImageRequestID? = nil
  var livePhotoRequestID: PHLivePhotoRequestID? = nil
  static var fetchRequestCache = NSCache<NSString, PHAsset>()

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
    request.deliveryMode = .highQualityFormat



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
    request.deliveryMode = .highQualityFormat


    let _contentMode = contentMode == .scaleAspectFit ? PHImageContentMode.aspectFit : PHImageContentMode.aspectFill

    phImageManager.stopCachingImages(for: fetchReq.objects(at: IndexSet.init(integersIn: 0...fetchReq.count - 1)), targetSize: bounds.size, contentMode: _contentMode, options: request)
  }

  @objc (stopCaching)
  static func stopCaching() {
    phImageManager.stopCachingImagesForAllAssets()
    fetchRequestCache.removeAllObjects()
  }


  static func fetchCameraRollAsset(mediaSource: MediaSource, size: CGSize, cropRect: CGRect = .zero, contentMode: UIView.ContentMode, deliveryMode: PHImageRequestOptionsDeliveryMode = .opportunistic, completion: @escaping ImageFetchCompletionBlock) -> (PHImageRequestID?, PHLivePhotoRequestID?) {

    guard let localIdentifier = mediaSource.uri.localIdentifier else {
      completion(nil)
      return (nil, nil)
    }

    var asset: PHAsset? = fetchRequestCache.object(forKey: localIdentifier as NSString)

    if asset == nil {
      guard let fetchReq = MediaSource.fetchRequest(url: mediaSource.uri) else {
        completion(nil)
        return (nil, nil)
      }

      asset = fetchReq.firstObject

      guard asset != nil else {
        completion(nil)
        return (nil, nil)
      }

      fetchRequestCache.setObject(asset!, forKey: localIdentifier as NSString)
    }

    let _contentMode = contentMode == .scaleAspectFit ? PHImageContentMode.aspectFit : PHImageContentMode.aspectFill


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

      request.resizeMode = .fast
      request.deliveryMode = deliveryMode

       imageRequestID = phImageManager.requestImage(for: asset!, targetSize: size, contentMode: _contentMode, options: request) { image, _ in
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
    layer.addSublayer(coverLayer)
    coverLayer.isHidden = false


    self.clipsToBounds = true
    self.pin_updateWithProgress = true
  }

  override func layoutSubviews() {
    super.layoutSubviews()

    self.pin_updateWithProgress = bounds.width > 200.0 || bounds.height > 200.0
    let shouldAntiAlias = frame.size.width < UIScreen.main.bounds.size.width
    layer.allowsEdgeAntialiasing = !isThumbnail
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
    self.canShowCoverImage = result.alternativeRepresentation != nil
    let success = self.image != nil || self.animatedImage != nil

    self.handleLoad(success: success, error: result.error)
  }

  var lastURL: URL? = nil
  var deliveryMode = PHImageRequestOptionsDeliveryMode.opportunistic
  var isThumbnail = false

  func loadImage(async: Bool = true) {
    guard let mediaSource = self.mediaSource else {
      self.handleLoad(success: false)
      return
    }

    var _id: String? = mediaSource.id

    if mediaSource.isFromCameraRoll {
      canShowCoverImage = false
      let contentMode = self.contentMode
      let bounds = self.bounds

      let (imageRequestID, _) = YeetImageView.fetchCameraRollAsset(mediaSource: mediaSource, size: bounds.applying(.init(scaleX: UIScreen.main.nativeScale, y: UIScreen.main.nativeScale)).size, contentMode: contentMode, deliveryMode: deliveryMode) { [weak self] image in
        if self?.imageRequestID != nil {
          self?.imageRequestID = nil
        }

        guard self?.mediaSource?.id == _id else {
          _id = nil
          return
        }

        self?.handleImageLoad(image: image, scale: UIScreen.main.nativeScale)
      }


      self.imageRequestID = imageRequestID
    } else if mediaSource.isVideoCover && mediaSource.coverUri == nil {
      canShowCoverImage = false
      mediaSource.loadAsset { [weak self] asset in
        guard let _asset = asset else {
          self?.handleLoad(success: false)
          return
        }

        guard _asset.tracks(withMediaType: .video).count > 0 else {
          self?.handleLoad(success: false)
           return
        }

        guard self?.mediaSource?.id == _id else {
          return
        }

        // To get the bounds
        DispatchQueue.main.async { [weak self]  in
          guard self?.mediaSource?.id == _id else {
            return
          }

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

      guard needsChange || loadStatus == .error else {
        if (pin_downloadImageOperationUUID() == nil) {
          self.handleLoad(success: true, error: nil)
        }
        return
      }


      // Only clear the old image if it might take a little while to get the new one
      if (self.image != nil || self.animatedImage != nil) && !PINRemoteImageManager.shared().cache.objectExists(forKey: PINRemoteImageManager.shared().cacheKey(for: url, processorKey: nil)) {
        self.pin_clearImages()
      }

      self.pin_setImage(from: url, placeholderImage: nil) { [weak self] result in
        guard self?.mediaSource?.id == _id else {
          return
        }

        self?.handleImageResult(result: result, scale: scale)
      }
      lastURL = url
    } else if mediaSource.isFileProtocol {
      canShowCoverImage = false
     do {
      try self.loadFileImage(async: async)
     }  catch {
       self.handleImageLoad(image: nil, scale: CGFloat(1), error: error)
       return
     }
    }

    self.loadStatus = .loading
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


  override func setCoverImage(_ coverImage: UIImage!) {
    super.setCoverImage(coverImage)

    if let _coverImage = coverImage {
      self.imageSize = _coverImage.size.applying(CGAffineTransform.init(scaleX: _coverImage.scale, y: _coverImage.scale))
    }
  }

  override var image: UIImage? {
    get {
      return super.image
    }

    set (newValue) {
      super.image = newValue

      self.imageSize = newValue?.size.applying(CGAffineTransform.init(scaleX: newValue?.scale ?? 1.0, y: newValue?.scale ?? 1.0)) ?? .zero
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
      self.imageSize = .zero
      self.pin_clearImages()
    }


    self.handleLoad(success: image != nil || animatedImage != nil, error: error)
  }



  @objc (onLoadStart) var onLoadStartEvent: RCTDirectEventBlock? = nil
  @objc (onLoad) var onLoadEvent: RCTDirectEventBlock? = nil
  @objc (onError) var onErrorEvent: RCTDirectEventBlock? = nil




  func handleLoad(success: Bool, error: Error? = nil) {
    if (success) {
      self._source?.onLoad()
      if self.animatedImage != nil {
        self._source?.play()
      }

      guard let mediaSource = self.mediaSource else {
        loadStatus = .error
        onLoadEvent?([:])
        return
      }


      let size = imageSize
      onLoadEvent?([ "id": mediaSource.id, "width": size.width, "height": size.height ])
      loadStatus = .success
    } else {
      loadStatus = .error
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

  enum LoadStatus {
    case pending
    case loading
    case error
    case success
  }
  var loadStatus = LoadStatus.pending

  @objc(imageSize) var imageSize = CGSize.zero

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
    loadStatus = .pending

  }

  var invalidated = false

  @objc(invalidate) func invalidate() {
    invalidated = true
  }

//  var isPaused = true
  var coverLayer = CALayer()
//
//  override func displayLinkFired(_ displayLink: CADisplayLink!) {
//
//
//    let wasPaused = displayLink.isPaused
//    var copiedImage = !wasPaused ? frameImage?.copy() : nil
//
//    super.displayLinkFired(displayLink)
//    let isPaused = displayLink.isPaused
//
//    if wasPaused != isPaused && isPaused && frameImage != nil {
//      coverLayer.isHidden = false
//      coverLayer.contents = frameImage?.copy()
//      copiedImage = nil
//
//    } else if wasPaused != isPaused && isPaused && frameImage == nil {
//      coverLayer.isHidden = false
//      coverLayer.contents = copiedImage
//    } else if !isPaused && !coverLayer.isHidden && frameImage != nil {
////      coverLayer.isHidden = true
//      copiedImage = nil
//    } else {
//      copiedImage = nil
//    }
//
//  }

//  override var animatedImage: PINCachedAnimatedImage? {
//    get {
//      return super.animatedImage
//    }
//
//    set (newValue) {
//
////      if canShowCoverImage {
////        if (newValue != nil && coverLayer.contents == nil && newValue != self.animatedImage) {
////          if let firstFrame = newValue?.image(at: 0)?.takeUnretainedValue().copy() {
////            coverLayer.contents = firstFrame
////            coverLayer.isHidden = false
////          }
////        }
////      }
//
//
//      super.animatedImage = newValue
//    }
//  }

  var canShowCoverImage : Bool = false

//  override func coverImageCompleted(_ coverImage: UIImage!) {
//    guard canShowCoverImage  else {
//      super.coverImageCompleted(coverImage)
//      return
//    }
//    guard animatedImage != nil else {
//      return
//    }
//
//    guard !invalidated else {
//      return
//    }
//
//    setCoverImage(coverImage)
//
//  }

//  override func setCoverImage(_ coverImage: UIImage!) {
//    super.setCoverImage(coverImage)
//
//    if canShowCoverImage {
//      if coverImage != nil && coverLayer.contents == nil {
//        coverLayer.contents = coverImage?.cgImage
//        coverLayer.isHidden = true
//      }
//    }
//  }

  override var isPlaybackPaused: Bool {
    get {
      return super.isPlaybackPaused
    }

    set (newValue) {
//      if canShowCoverImage {
//        if newValue && !invalidated {
//          if let frame = imageRef()?.takeUnretainedValue().copy() {
//            coverLayer.contents = frame
//            coverLayer.isHidden = false
//          }
//        }
//      }


      super.isPlaybackPaused = newValue
    }
  }

//  override func stopAnimating() {
//    guard canShowCoverImage else {
//      super.stopAnimating()
//      return
//    }
////    guard source != nil && !invalidated && animatedImage != nil && window != nil else {
////      super.stopAnimating()
////      return
////    }
//
//    displayLink?.isPaused = true
//    lastDisplayLinkFire = 0
//    if !invalidated && animatedImage != nil {
//      if let frame = imageRef()?.takeUnretainedValue().copy() {
//        coverLayer.contents = frame
//        coverLayer.isHidden = false
//      }
//    }
//
//    animatedImage?.clearCache()
//  }

  override func layoutSublayers(of layer: CALayer) {
    super.layoutSublayers(of: layer)

//    if (layer == self.layer && (coverLayer.bounds != layer.bounds || coverLayer.position != layer.position) && animatedImage != nil) {
//      UIView.setAnimationsEnabled(false)
//      coverLayer.bounds = layer.bounds
//      coverLayer.contentsScale = layer.contentsScale
//      coverLayer.position = layer.position
//      coverLayer.contentsGravity = layer.contentsGravity
//      UIView.setAnimationsEnabled(true)
//    } else if animatedImage == nil && image != nil && !coverLayer.isHidden {
//      coverLayer.isHidden = true
//    } else if !canShowCoverImage {
//      coverLayer.isHidden = true
//    }
  }



  deinit {

    invalidated = true
    self.reset()
//    self.animatedImage?.clearCache()
//    self.animatedImage = nil
    videoCover?.stop()
  }
}
