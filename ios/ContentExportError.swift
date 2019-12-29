//
//  ContentExportError.swift
//  yeet
//
//  Created by Jarred WSumner on 12/28/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

class ContentExportError : NSError {
  enum ErrorCode : Int {
    case exportCancelled = -1
    case insertVideoTrackFailed = -2
    case resourceMissingBlock = -3
    case assetUnplayable = -4
    case videoTrackUnplayable = -5
    case renderSizeIsZero = -6
    case failedToCreateExportSession = -7
    case videoMissingFromResource = -8
    case unknownError = 0

  }

  static let ERROR_MESAGES: [ErrorCode : String] = [
    ErrorCode.unknownError: "Something went wrong. Please try again.",
    ErrorCode.videoMissingFromResource: "Something went wrong. Please try again.",
    ErrorCode.insertVideoTrackFailed: "Something went wrong. Please try again.",
    ErrorCode.resourceMissingBlock: "Something went wrong. Please try again.",
    ErrorCode.assetUnplayable: "One of the videos might be broken. Please try again.",
    ErrorCode.videoTrackUnplayable: "One of the videos might be broken. Please try again.",
    ErrorCode.renderSizeIsZero: "Can't save an empty screen.",
    ErrorCode.failedToCreateExportSession: "Can't export an empty screen.",
  ]

  let errorCode: ErrorCode


  required init?(coder: NSCoder) {
    fatalError()
  }

  override var localizedDescription: String {
    return ContentExportError.ERROR_MESAGES[self.errorCode] ?? "Something went wrong. Please try again."
  }

  init(_ errorCode: ErrorCode, userInfo: [String: Any]? = nil) {
    self.errorCode = errorCode

    super.init(domain: "com.codeblogcorp.ContentExportError", code: errorCode.rawValue,  userInfo: userInfo)
  }
}
