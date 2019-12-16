//
//  NukeWebpToggler.swift
//  yeet
//
//  Created by Jarred WSumner on 10/2/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import Vision
import SwiftyBeaver

@objc(EnableWebpDecoder) class EnableWebpDecoder : NSObject {
  @objc static func enable() {
    #if TEST
      let logPath = #file.replacingOccurrences(of: "EnableWebpDecoder.swift", with: "").appending("test.log")
      let logDest = FileDestination.init()
      logDest.logFileURL = URL(fileURLWithPath: logPath)
      SwiftyBeaver.addDestination(logDest)
    #else
      SwiftyBeaver.addDestination(ConsoleDestination())
    #endif

    NotificationCenter.default.addObserver(YeetClipboard.self,
                                           selector: #selector(YeetClipboard.onApplicationBecomeActive),
                                           name: UIApplication.didBecomeActiveNotification, // UIApplication.didBecomeActiveNotification for swift 4.2+
    object: nil)
  }
}
