//
//  NukeWebp.swift
//  yeet
//
//  Created by Jarred WSumner on 10/2/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import Nuke

public class WebPImageDecoder: Nuke.ImageDecoding {



    public init() {
    }

    public func decode(data: Data, isFinal: Bool) -> Image? {
      guard SDImageWebPCoder.shared.canDecode(from: data) else { return nil }
      guard !isFinal else { return _decode(data) }

      return SDImageWebPCoder.shared.decodedImage(with: data, options: nil)
    }

}

// MARK: - check webp format data.
extension WebPImageDecoder {


    public static func enable() {
        Nuke.ImageDecoderRegistry.shared.register { (context) -> ImageDecoding? in
            WebPImageDecoder.enable(context: context)
        }
    }


    public static func enable(context: Nuke.ImageDecodingContext) -> Nuke.ImageDecoding? {
      return SDImageWebPCoder.shared.canDecode(from: context.data) ? WebPImageDecoder() : nil
    }

}

// MARK: - private
private let _queue = DispatchQueue(label: "com.github.ryokosuge.Nuke-WebP-Plugin.DataDecoder")
extension WebPImageDecoder {

    internal func _decode(_ data: Data) -> Image? {
        return _queue.sync {
          return SDImageWebPCoder.shared.decodedImage(with: data, options: nil)
        }
    }

}
