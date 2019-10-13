//
//  NukeWebpToggler.swift
//  yeet
//
//  Created by Jarred WSumner on 10/2/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SwiftyBeaver

@objc(EnableWebpDecoder) class EnableWebpDecoder : NSObject {
  @objc static func enable() {
    SwiftyBeaver.addDestination(ConsoleDestination())

  }
}
