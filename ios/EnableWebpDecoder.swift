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
import Firebase
import SBObjectiveCWrapper

@objc(EnableWebpDecoder) class EnableWebpDecoder : NSObject {
  @objc static func enable() {
    FirebaseApp.initialize()
    #if TEST
      let logPath = #file.replacingOccurrences(of: "EnableWebpDecoder.swift", with: "").appending("test.log")
      let logDest = FileDestination.init()
      logDest.logFileURL = URL(fileURLWithPath: logPath)
      SwiftyBeaver.addDestination(logDest)
    #else
      SwiftyBeaver.addDestination(ConsoleDestination())
    #endif

//    Firebase
//    [FIRPerformance sharedInstance].dataCollectionEnabled = false;
//    [FIRPerformance sharedInstance].instrumentationEnabled = false;

    let titleTextAttributes = [NSAttributedString.Key.foregroundColor: UIColor.white, NSAttributedString.Key.font: UIFont(name: "Inter", size: 18)]
    UISegmentedControl.appearance().setTitleTextAttributes(titleTextAttributes, for: .normal)
    UISegmentedControl.appearance().setTitleTextAttributes(titleTextAttributes, for: .selected)


    NotificationCenter.default.addObserver(YeetClipboard.self,
                                           selector: #selector(YeetClipboard.onApplicationBecomeActive),
                                           name: UIApplication.didBecomeActiveNotification, // UIApplication.didBecomeActiveNotification for swift 4.2+
    object: nil)


  }
}

extension UILabel {

    var substituteFontName : String {
        get { return self.font.fontName }
        set { self.font = UIFont(name: newValue, size: self.font.pointSize) }
    }

}
