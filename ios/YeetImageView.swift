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

@objc(YeetImageView)
class YeetImageView : UIImageView {
  @objc var sentOnLoadStart = false
  @objc var completed = false
  @objc var errored = false
  @objc var needsReload = false
  @objc var onLoadEvent: [String: NSNumber] = [:]
  private var _source: TrackableImageSource? = nil
  @objc var source: TrackableImageSource? {
    get {
      return _source
    }

    set (newValue) {
      let old = _source
      self._source = newValue

      if (newValue != old && newValue?.mediaSource.uri != old?.mediaSource.uri) {
        old?.hasLoaded = false
        old?.stop()
        self.loadImage()
      }
   }
  }
  var imageTask: ImageTask? = nil

  init() {
    super.init(image: nil)
    self.clipsToBounds = true
    
  }

  var onLoadImage:ImageTask.Completion? = nil

  required init?(coder: NSCoder) {
    fatalError("not implemented")
  }

  @objc open override func nuke_display(image: Image?) {
    self.image = image

    DispatchQueue.main.async { [weak self] in
      self?._source?.onLoad()
    }
  }

  func loadImage() {
    guard let _source = source else {
      self.image = nil
      return
    }

    let url = YeetImageView.imageUri(source: _source.mediaSource, bounds: bounds)
    self.contentMode = .scaleAspectFit
    self.imageTask = Nuke.loadImage(with: ImageRequest(url: url, processors: [], priority: .normal, options: ImageRequestOptions()), into: self)
  }

  static func imageUri(source: MediaSource, bounds: CGRect) -> URL {
    let cropBounds = source.naturalBounds

    let cropMaxX = cropBounds.size.width - cropBounds.origin.x

    let maxX = min(
      cropMaxX, CGFloat(source.width.doubleValue * source.pixelRatio.doubleValue), bounds.size.width * UIScreen.main.nativeScale
    )

    let cropRect = [
      "cx": cropBounds.origin.x,
      "cy": cropBounds.origin.y,
//      "cw": cropMaxX,
//      "ch": cropMaxY
    ]

    let cropRectString = cropRect.map { key, value in
      return "\(key)\(Int(floor(value)))"
    }.joined(separator: ",")

    return URL(string: "https://i.webthing.co/\(cropRectString),\(Int(floor(maxX)))x/\(source.uri.absoluteString)")!
  }

  static func imageTask(source: MediaSource, bounds: CGRect, progress: ImageTask.ProgressHandler? = nil, completion: ImageTask.Completion? = nil) -> ImageTask? {
    return ImagePipeline.shared.loadImage(with: imageUri(source: source, bounds: bounds), progress: progress, completion: completion)
  }

  deinit {
    self.imageTask?.cancel()
  }
}
