//
//  YeetMedia.swift
//  yeet
//
//  Created by Jarred WSumner on 12/27/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

class YeetMedia {
  let width: NSNumber;
  let height: NSNumber;
  let source: String;
  let mimeType: MimeType;
  let uri: String;
  let duration: NSNumber;


  init(width: NSNumber, height: NSNumber, source: String, mimeType: String, uri: String, duration: NSNumber) {
    self.width = width
    self.height = height
    self.source = source
    self.mimeType = MimeType.init(rawValue: mimeType) ?? MimeType.webp
    self.uri = uri
    self.duration = duration
  }
}
