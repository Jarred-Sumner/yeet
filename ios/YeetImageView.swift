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
  private var _source: MediaSource? = nil
  @objc var source: MediaSource? {
    get {
      return _source
    }

    set (newValue) {
      let old = _source
      self._source = newValue

      if (newValue != old && newValue?.uri != old?.uri) {
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
  }



  func loadImage() {
    guard let source = self.source else {
      self.image = nil
      self.imageTask?.cancel()
      return
    }

    if self.imageTask != nil {
      self.imageTask?.cancel()
    }

    var loadOptions = ImageLoadingOptions.init(
      contentModes: .init(success: .center, failure: .center, placeholder: .center)
    )
//
//    Nuke.loadImage(with: <#T##ImageRequest#>, options: <#T##ImageLoadingOptions#>, into: <#T##ImageDisplayingView#>, progress: <#T##ImageTask.ProgressHandler?##ImageTask.ProgressHandler?##(ImageResponse?, Int64, Int64) -> Void#>, completion: <#T##ImageTask.Completion?##ImageTask.Completion?##(Result<ImageResponse, ImagePipeline.Error>) -> Void#>)
//
//

    let scale = bounds.size.width / CGFloat(truncating: source.width)

    let cropBounds = source.naturalBounds



    let cropMaxX = cropBounds.size.width - cropBounds.origin.x
    let cropMaxY = cropBounds.size.height - cropBounds.origin.y

    let maxX = min(
      cropMaxX, CGFloat(source.width.doubleValue * source.pixelRatio.doubleValue), bounds.size.width * UIScreen.main.nativeScale
    )

    var cropRect = [
      "cx": cropBounds.origin.x,
      "cy": cropBounds.origin.y,
//      "cw": cropMaxX,
//      "ch": cropMaxY
    ]

    let cropRectString = cropRect.map { key, value in
      return "\(key)\(Int(floor(value)))"
    }.joined(separator: ",")

    let imgUri = URL(string: "https://i.webthing.co/\(cropRectString),\(Int(floor(maxX)))x/\(source.uri.absoluteString)")!


    self.imageTask = Nuke.loadImage(
      with: imgUri,
      options: loadOptions,
      into: self,
      completion: {[weak self] response in
        self?.imageTask = nil
        guard let onLoad = self?.onLoadImage else {
          return
        }

        onLoad(response)
    })
  }

  deinit {
    self.imageTask?.cancel()
  }
}
