//
//  YeetExporter.swift
//  yeet
//
//  Created by Jarred WSumner on 9/5/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit
import SwiftyJSON
import SwiftyBeaver
import Promise

@objc(YeetExporter)
class YeetExporter: NSObject, RCTBridgeModule  {
  static func moduleName() -> String! {
    return "YeetExporter";
  }


  var bridge: RCTBridge!

  var producer: VideoProducer? = nil

  @objc(startExport:isServerOnly:callback:)
  func startExport(data: String, isServerOnly: Bool, callback: @escaping RCTResponseSenderBlock) -> Void {
    autoreleasepool {
      guard let dataObject = data.data(using: .utf8) else {
        callback([YeetError.init(code: .genericError, userInfo: nil)])
        return
      }

      guard let exportData = try? JSON(data: dataObject) else {
        callback([YeetError.init(code: .genericError, userInfo: nil)])
        return
      }

      let start = CACurrentMediaTime()
      self.getImages(data: exportData).then { images in
        let producer = VideoProducer(data: exportData, images: images)
        self.producer = producer

        let boundsDict = exportData["bounds"].dictionaryValue

        let bounds = CGRect(x: CGFloat(boundsDict["x"]!.doubleValue), y: CGFloat(boundsDict["y"]!.doubleValue), width: CGFloat(boundsDict["width"]!.doubleValue), height: CGFloat(boundsDict["height"]!.doubleValue))

        producer.start(estimatedBounds: bounds, isServerOnly: isServerOnly, scale: UIScreen.main.scale).then(on: DispatchQueue.main) { export in
            SwiftyBeaver.info("Completed ContentExport in \(CACurrentMediaTime() - start)")

            callback([nil, export.dictionaryValue()])
          }.catch { error in
            callback([error, nil])
          }
      }

    }

  }

  func captureScreenshot(view: UIView, bounds: CGRect) -> UIImage? {
    let textInputView: YeetTextInputView? = YeetExporter.findTextInputView(view)


    let renderer = UIGraphicsImageRenderer(bounds: CGRect(origin: .zero, size: CGSize(width: abs(bounds.origin.x) + bounds.width, height: abs(bounds.origin.y) + bounds.height)))
    return renderer.image { rendererContext in
      view.layer.render(in: rendererContext.cgContext)
    }
  }


  @objc(requiresMainQueueSetup)
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  func getImages(data: JSON) -> Promise<Dictionary<String, ExportableMediaSource>> {
    let nodeBlocks = data["nodes"].arrayValue.map { node in
      return node["block"]
    }

    var allBlocks = data["blocks"].arrayValue
    allBlocks.append(contentsOf: nodeBlocks)

    return Promise<Dictionary<String, (UIView, CGRect)>>.init(queue: .main) { resolve, reject in
      var views: Dictionary<String, (UIView, CGRect)> = [:]
      allBlocks.forEach { block in
        let node = data["nodes"].arrayValue.first { node in
          if let blockId = node["block"].dictionaryValue["id"]?.stringValue {
            return blockId == block["id"].stringValue
          } else {
            return false
          }

        }

        var viewTag: NSNumber
        var rect: CGRect
        if let _node = node {
           viewTag = _node["viewTag"].numberValue
            rect = CGRect.from(json: _node["frame"])
         } else {
           viewTag = block["viewTag"].numberValue
          rect = CGRect.from(json: block["frame"])
         }

        guard let view = self.bridge.uiManager.view(forReactTag: viewTag) else {
          return;
        }

        views[block["id"].stringValue] = (view, rect)
      }

      resolve(views)
    }.then { views in
      let containerNode = self.bridge.uiManager.view(forReactTag:  data["containerNode"].numberValue)
      var dict = Dictionary<String, ExportableMediaSource>();
      allBlocks.forEach { block in
        guard let (view, rect) = views[block["id"].stringValue] else {
          return
        }

        if block["type"].stringValue == "text" {
          guard let screenshot = self.captureScreenshot(view: view, bounds: view.bounds ) else {
            return
          }

          dict[block["id"].stringValue] = ExportableImageSource.init(screenshot: screenshot, id: block["id"].stringValue)
        } else if block["type"].stringValue == "image" || block["type"].stringValue == "video" {
            guard let mediaPlayer = YeetExporter.findMediaPlayer(view) else {
             return
           }

            let mediaSource = ExportableMediaSource.from(mediaPlayer: mediaPlayer, nodeView: view)
          SwiftyBeaver.info("HEre! \(block["id"].stringValue)")
           dict[block["id"].stringValue] = mediaSource
        }
      }
      SwiftyBeaver.info("FIN")

      return Promise.init(value: dict)
    }
  }

  static func findMediaPlayer(_ view: UIView) -> MediaPlayer? {
    if type(of: view) == MediaPlayer.self {
      return view as! MediaPlayer;
    } else if (view.subviews.count > 0) {
      for subview in view.subviews {
        if (type(of: subview) == MediaPlayer.self) {
          return subview as! MediaPlayer
        } else if (subview.subviews.count > 0) {
          if let player = findMediaPlayer(subview) {
            return player
          }
        }

      }
      return nil

    } else {
      return nil;
    }
  }

  static func findTextInputView(_ view: UIView) -> YeetTextInputView? {
    if type(of: view) == YeetTextInputView.self {
      return view as! YeetTextInputView;
    } else if (view.subviews.count > 0) {
      for subview in view.subviews {
        if (type(of: subview) == YeetTextInputView.self) {
          return subview as! YeetTextInputView
        } else if (subview.subviews.count > 0) {
          if let player = findTextInputView(subview) {
            return player
          }
        }

      }
      return nil

    } else {
      return nil;
    }
  }


  @objc(startExportWithResolver:resolver:rejecter:)
  func startExportWithResolver(data: Dictionary<String, AnyObject>,  resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) -> Void {


  }


//  func methodQueue() -> DispatchQueue
//  {
//    return DispatchQueue.main;
//  }

  
}
