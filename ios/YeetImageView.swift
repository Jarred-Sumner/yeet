//
//  YeetImageView.swift
//  yeet
//
//  Created by Jarred WSumner on 9/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SDWebImage
import Nuke
import SwiftyBeaver

enum YeetImageViewResizeMode : String {
  case aspectFit = "aspectFit"
  case aspectFill = "aspectFill"
}

@objc(YeetImageView)
class YeetImageView : SDAnimatedImageView {
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

      if (newValue != old && newValue?.mediaSource.uri != old?.mediaSource.uri) {
        old?.hasLoaded = false
        old?.stop()
        self.loadImage()
      }
   }
  }

  @objc(source) var mediaSource: MediaSource? = nil
  var imageTask: ImageTask? = nil

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
    super.init(image: nil)
    self.contentMode = .scaleAspectFit
    self.clipsToBounds = true
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

      if (isAnimating) {
        self.stopAnimating()
      } else {
        self.startAnimating()
      }
    }
  }

  @objc open override func nuke_display(image: Image?) {
    self.image = image

    if (image?.sd_isAnimated ?? false) {
      self.isAnimatedImage = true
    }
  }

  func loadImage() {
    guard let mediaSource = self.mediaSource else {
      self.image = nil
      return
    }

    let url = YeetImageView.imageUri(source: mediaSource, bounds: bounds)

    if self.imageTask != nil && self.imageTask!.request.urlRequest.url == url && !(self.imageTask!.progress.isCancelled) {
      return
    }

    let processors = [
      ImageProcessor.Resize(size: bounds.size, contentMode: contentMode == .scaleAspectFit ? .aspectFit : .aspectFill)
    ]

    let imageRequest = ImageRequest.init(url: url, processors: processors, priority: .normal, options: ImageRequestOptions())

    let completionBlock: ImageTask.Completion = { [weak self] resp in
      self?.handleLoad(resp)
    }

    self.imageTask = Nuke.loadImage(with: imageRequest, options: .shared,  into: self, progress: nil, completion: completionBlock)
    onLoadStartEvent?(["id": mediaSource.id])
  }

  @objc (onLoadStart) var onLoadStartEvent: RCTDirectEventBlock? = nil
  @objc (onLoad) var onLoadEvent: RCTDirectEventBlock? = nil
  @objc (onError) var onErrorEvent: RCTDirectEventBlock? = nil

  func handleLoad(_ response: Result<ImageResponse, ImagePipeline.Error>) {
    do {
      try response.get()
      DispatchQueue.main.async { [weak self] in
        self?._source?.onLoad()
      }

      guard let mediaSource = self.mediaSource else {
        onLoadEvent?([:])
        return
      }


      onLoadEvent?([ "id": mediaSource.id ])
    } catch {
      guard let mediaSource = self.mediaSource else {
        return
      }

      onErrorEvent?([ "id": mediaSource.id, "error": error.localizedDescription ])
      DispatchQueue.main.async { [weak self] in
        self?._source?.onError(error: error)
      }

    }
  }

  static let imageUriCache = NSCache<NSString, AnyObject>()

  static func imageUri(source: MediaSource, bounds: CGRect) -> URL {
    let cacheKey = "\(source.id)-\(bounds.size.width)-\(bounds.size.height)-\(bounds.origin.y)-\(bounds.origin.x)" as NSString

    if let cachedURI = imageUriCache.object(forKey: cacheKey) as! URL? {
      return cachedURI
    } else {
      let url = _imageUri(source: source, bounds: bounds)
      imageUriCache.setObject(url as AnyObject, forKey: cacheKey)
      return url
    }
  }

  static func _imageUri(source: MediaSource, bounds: CGRect) -> URL {
    let cropBounds = source.naturalBounds

    let cropMaxX = cropBounds.size.width - cropBounds.origin.x

    let boundsWidth = bounds.size.width > .zero ? bounds.size.width : UIScreen.main.bounds.width

    let _maxX =  [
      [cropMaxX, CGFloat(source.width.doubleValue * source.pixelRatio.doubleValue)].filter { number in
       return number > CGFloat(1)
      }.max() ?? .zero,
      boundsWidth * UIScreen.main.nativeScale
    ].min() ?? .zero


    let maxX = Int(floor(_maxX))
    if (maxX == 0) {
      return source.uri
    }


    let cropRect = [
      "cx": cropBounds.origin.x,
      "cy": cropBounds.origin.y,
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

  static func imageTask(source: MediaSource, bounds: CGRect, progress: ImageTask.ProgressHandler? = nil, completion: ImageTask.Completion? = nil) -> ImageTask? {
    return ImagePipeline.shared.loadImage(with: imageUri(source: source, bounds: bounds), progress: progress, completion: completion)
  }

  deinit {
    self.imageTask?.cancel()
  }
}
