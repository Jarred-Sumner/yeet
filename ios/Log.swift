//
//  Log.swift
//  yeet
//
//  Created by Jarred WSumner on 11/26/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import SwiftyBeaver

class Log: SwiftyBeaver {

 override class func debug(_ message: @autoclosure () -> Any, _
  file: String = #file, _ function: String = #function, line: Int = #line, context: Any? = nil) {
    #if DEBUG
      custom(level: .debug, message: message(), file: file, function: function, line: line, context: context)
    #endif
  }

  
}
