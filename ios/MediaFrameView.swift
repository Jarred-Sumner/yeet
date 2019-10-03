//
//  MediaPlayerFrameView.swift
//  yeet
//
//  Created by Jarred WSumner on 10/1/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import Nuke

@objc class MediaFrameView : UIImageView {

  @objc var source: MediaSource? = nil {
    didSet {
      self.updateSource()
    }
  }

  @objc var percentage = 1.0 {
    didSet {
      self.updateSource()
    }
  }

  @objc(reload)
  func reload() {
    self.updateSource()
  }



  func updateSource() {

    guard let source = self.source else {
      self.image = nil
      return
    }

    if source.isVideo {
      DispatchQueue.global(qos: .userInitiated).async { [weak self] in
        guard let asset = source.asset else {
          return
        }

        guard let percentage = self?.percentage else {
          return
        }

        let imageGenerator = AVAssetImageGenerator(asset: asset)
        imageGenerator.appliesPreferredTrackTransform = true

        let seconds = source.duration.doubleValue
        let time = CMTime(seconds: max(min(seconds * percentage, seconds), 0), preferredTimescale: .max)

        imageGenerator.generateCGImagesAsynchronously(forTimes: [NSValue(time: time)]) { [weak self] time, image, actualTime, result, error in
          DispatchQueue.main.async { [weak self] in
            guard result == AVAssetImageGenerator.Result.succeeded else {
              print("ERROR \(error)")
              return
            }

            if let _image = image {
              self?.image = UIImage(cgImage: _image)
            }

            self?.contentMode = .scaleAspectFill
            self?.clipsToBounds =  true
          }
        }
      }


    } else if source.isImage {
      Nuke.loadImage(with: source.uri, into: self)
    }
  }
}
