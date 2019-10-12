//
//  NukeGIF.swift
//  yeet
//
//  Created by Jarred WSumner on 10/2/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import Nuke

public class GIFImageDecoder: Nuke.ImageDecoding {


    public init() {
    }

    public func decode(data: Data, isFinal: Bool) -> Image? {
      guard SDImageGIFCoder.shared.canDecode(from: data) else { return nil }
      guard !isFinal else { return _decode(data) }

      return SDImageGIFCoder.shared.decodedImage(with: data, options: nil)
    }

}

// MARK: - check GIF format data.
extension GIFImageDecoder {


    public static func enable() {
        Nuke.ImageDecoderRegistry.shared.register { (context) -> ImageDecoding? in
            GIFImageDecoder.enable(context: context)
        }
    }


    public static func enable(context: Nuke.ImageDecodingContext) -> Nuke.ImageDecoding? {
      return SDImageGIFCoder.shared.canDecode(from: context.data) ? GIFImageDecoder() : nil
    }

}

// MARK: - private
private let _queue = DispatchQueue(label: "com.github.ryokosuge.Nuke-GIF-Plugin.DataDecoder")
extension GIFImageDecoder {

    internal func _decode(_ data: Data) -> Image? {
        return _queue.sync {
          return SDImageGIFCoder.shared.decodedImage(with: data, options: nil)
        }
    }

}
