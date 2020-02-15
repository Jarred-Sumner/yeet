
//
//  YeetClipboard.swift
//  yeet
//
//  Created by Jarred WSumner on 12/13/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

import UIKit
import SwiftyJSON
import SwiftyBeaver
import Promise

@objc(YeetClipboard)
class YeetClipboard: RCTEventEmitter  {
  static let clipboardOperationQueue: OperationQueue = {
    var queue = OperationQueue()
    queue.name = "YeetClipboard"
    queue.maxConcurrentOperationCount = 1

    return queue
  }()

  enum EventNames : String {
    case change = "YeetClipboardChange"
    case remove = "YeetClipboardRemove"
  }

  static var changeCount = UIPasteboard.general.changeCount
  var listenerCount = 0

  @objc (onApplicationBecomeActive) static func onApplicationBecomeActive() {
    if changeCount != UIPasteboard.general.changeCount {
      NotificationCenter.default.post(name: UIPasteboard.changedNotification, object: nil)
      changeCount = UIPasteboard.general.changeCount
    }
  }

  override func startObserving() {
    super.startObserving()

    let needsSubscription = !hasListeners
    listenerCount += 1

    if needsSubscription {
      self.observePasteboardChange()
    }

  }

  override func stopObserving() {
    super.stopObserving()
    listenerCount -= 1

    let needsUnsubscription = !hasListeners

    if needsUnsubscription {
      self.stopObservingPasteboardChange()
    }
  }

  func observePasteboardChange() {
    NotificationCenter.default.addObserver(self, selector: #selector(handleChangeEvent(_:)), name: UIPasteboard.changedNotification, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(handleRemoveEvent(_:)), name: UIPasteboard.removedNotification, object: nil)
  }

  func stopObservingPasteboardChange() {
    NotificationCenter.default.removeObserver(self, name: UIPasteboard.changedNotification, object: nil)
    NotificationCenter.default.removeObserver(self, name: UIPasteboard.removedNotification, object: nil)
  }

  @objc func handleChangeEvent(_ notification: NSNotification) {
    lastMediaSource = nil
    self.sendChangeEvent()
    YeetClipboard.changeCount = UIPasteboard.general.changeCount
  }

  @objc func handleRemoveEvent(_ notification: NSNotification) {
    lastMediaSource = nil
    self.sendChangeEvent()
    YeetClipboard.changeCount = UIPasteboard.general.changeCount
  }

  var hasListeners: Bool {
    return listenerCount > 0
  }

  override init() {
    super.init()
  }

  override var bridge: RCTBridge! {
    get {
      return super.bridge
    }

    set (newValue) {
      super.bridge = newValue
      
      newValue?._run(afterLoad: { [weak self] in
        guard let this = self else {
          return
        }

        MediaPlayerJSIModuleInstaller.installClipboard(this)
      })
    }
  }


  func sendChangeEvent() {
    guard hasListeners else {
      return
    }

    sendEvent(withName: EventNames.change.rawValue, body: YeetClipboard.serializeContents())
  }

  func sendRemoveEvent() {
    guard hasListeners else {
      return
    }

    sendEvent(withName: EventNames.remove.rawValue, body: YeetClipboard.serializeContents())
  }

  override static func moduleName() -> String! {
    return "YeetClipboard";
  }

  @objc(serializeContents)
  static func serializeContents() -> [String: Any] {
    var contents = [
      "urls": [],
      "strings": [],
      "hasImages": hasImagesInClipboard,
      "hasURLs": UIPasteboard.general.hasURLs,
      "hasStrings": UIPasteboard.general.hasStrings
      ] as [String : Any]

    if UIPasteboard.general.hasURLs {
      contents["urls"] = UIPasteboard.general.urls?.map { url in
        return url.absoluteString
      }
    }

    if UIPasteboard.general.hasStrings {
      let strings = UIPasteboard.general.strings?.filter { string in
        guard let urls = contents["urls"] as? Array<String> else {
          return true
        }

        return !urls.contains(string)
      }

      if (strings?.count ?? 0) > 0  {
        contents["strings"] = strings
      } else {
        contents["hasStrings"] = false
      }
    }

    return contents
  }


  override func supportedEvents() -> [String]! {
    return [
      EventNames.change.rawValue,
      EventNames.remove.rawValue
    ]
  }

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func constantsToExport() -> [AnyHashable : Any]! {
    return ["clipboard": YeetClipboard.serializeContents(), "mediaSource": self.lastMediaSource?.toDictionary ?? nil]
  }

  @objc(getContent:)
  func getContent(_ callback: @escaping RCTResponseSenderBlock) {
    callback([nil, YeetClipboard.serializeContents()])
  }

  @objc(lastMediaSource)
  var lastMediaSource: MediaSource? = nil
  var lastSavedImage: UIImage? = nil

  @objc(hasImagesInClipboard)
  static var hasImagesInClipboard: Bool {
    let imageUTIs = MimeType.images().map {image in
      return image.utiType()
    }

    return UIPasteboard.general.contains(pasteboardTypes: imageUTIs)
  }

  @objc(clipboardMediaSource:)
  func clipboardMediaSource(_ callback: @escaping RCTResponseSenderBlock) {
    guard YeetClipboard.hasImagesInClipboard else {
      callback([nil, [:]])
      return
    }

    let image = UIPasteboard.general.image

    if lastSavedImage != nil && lastSavedImage == image && lastMediaSource != nil {
      callback([nil, lastMediaSource!.toDictionary])
    }

    var exportType: ExportType? = nil
    if UIPasteboard.general.contains(pasteboardTypes: [MimeType.jpg.utiType()]) {
      exportType = ExportType.jpg
    } else if UIPasteboard.general.contains(pasteboardTypes: [MimeType.png.utiType()]) {
      exportType = ExportType.png
    }
    

    guard exportType != nil else {
      callback([YeetError.init(code: .genericError)])
      return
    }

    DispatchQueue.global(qos: .background).async {
      guard let image = image else {
        callback([YeetError.init(code: .genericError)])
        return
      }

      guard let exportType = exportType else {
        callback([YeetError.init(code: .genericError)])
        return
      }

      let url = VideoProducer.generateExportURL(type: exportType)
      var data: Data? = nil

      if exportType == .jpg {
        data = image.jpegData(compressionQuality: CGFloat(1.0))
      } else if exportType == .png {
         data = image.pngData()
      }

      guard data != nil else {
        callback([YeetError.init(code: .writingDataFailure)])
        return
      }

       do {
          try data?.write(to: url)
       } catch {
          callback([YeetError.init(code: .writingDataFailure)])
         return
       }

      let size = image.size

      let mediaSource = MediaSource(url, exportType.mimeType(), .init(value: 0), .init(value: 0), url.absoluteString, .init(value: Double(size.width)), .init(value: Double(size.height)), CGRect(origin: .zero, size: size), NSNumber(value: Double(image.scale)))

      self.lastMediaSource = mediaSource
      self.lastSavedImage = image

      callback([nil, mediaSource.toDictionary])
    }
  }

  deinit {
    stopObservingPasteboardChange()
  }
  
}


