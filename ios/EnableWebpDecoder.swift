//
//  NukeWebpToggler.swift
//  yeet
//
//  Created by Jarred WSumner on 10/2/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import Nuke
import SwiftyBeaver

@objc(EnableWebpDecoder) class EnableWebpDecoder : NSObject {
  @objc static func enable() {
    SwiftyBeaver.addDestination(ConsoleDestination())

    Nuke.ImagePipeline.Configuration.isAnimatedImageDataEnabled = true
    Nuke.ImagePipeline.Configuration.isSignpostLoggingEnabled = true
    Nuke.ImageDecoderRegistry.shared.register { (context) -> ImageDecoding? in
        WebPImageDecoder.enable(context: context)
    }

    Nuke.ImageDecoderRegistry.shared.register { (context) -> ImageDecoding? in
        GIFImageDecoder.enable(context: context)
    }
  }
}
