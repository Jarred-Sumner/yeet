//
//  YeetError.swift
//  yeet
//
//  Created by Jarred WSumner on 10/30/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

class YeetError : NSError {
  enum ErrorCode : String {
    case genericError = "genericError"
    case invalidTag = "invalidTag"
    case invalidMediaSource = "invalidMediaSource"
    case fetchMediaFailed = "fetchMediaFailed"
    case imageEncodingFailure = "imageEncodingFailure"
    case writingDataFailure = "writingDataFailure"
    case imageCropFailure = "imageCropFailure"
    case loadAVAssetFailure = "loadAVAssetFailure"
    case localImageFailedToLoad = "localImageFailedToLoad"
  }

  static let ERROR_CODE_MAP: Dictionary<ErrorCode, Int> = [
    ErrorCode.genericError: 990,
    ErrorCode.invalidMediaSource: 991,
    ErrorCode.fetchMediaFailed: 992,
    ErrorCode.invalidTag: 993,
    ErrorCode.imageEncodingFailure: 994,
    ErrorCode.writingDataFailure: 995,
    ErrorCode.imageCropFailure: 996,
    ErrorCode.loadAVAssetFailure: 997,
    ErrorCode.localImageFailedToLoad: 998
  ]

  required init?(coder: NSCoder) {
    fatalError()
  }

  init(code: ErrorCode, userInfo: Dictionary<String, AnyObject>? = [:]) {
    super.init(domain: code.rawValue, code: YeetError.ERROR_CODE_MAP[code]!, userInfo: userInfo)
  }

  static func reject(code: ErrorCode, userInfo: Dictionary<String, AnyObject>? = [:], block: RCTPromiseRejectBlock) {
    let error = YeetError.init(code: code, userInfo: userInfo)
    block(error.localizedDescription, code.rawValue, error)
  }
}
