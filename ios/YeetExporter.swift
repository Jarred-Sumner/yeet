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

      self.getImages(data: exportData).then { images in
        self.producer = VideoProducer(data: exportData, images: images)

        let boundsDict = exportData["bounds"].dictionaryValue

        let bounds = CGRect(x: CGFloat(boundsDict["x"]!.doubleValue), y: CGFloat(boundsDict["y"]!.doubleValue), width: CGFloat(boundsDict["width"]!.doubleValue), height: CGFloat(boundsDict["height"]!.doubleValue))
        self.producer?.start(estimatedBounds: bounds, isServerOnly: isServerOnly, callback: callback)
      }

    }

  }

  func captureTextScreenshot(view: UIView) -> UIImage? {
    let size = view.bounds.size

    UIGraphicsBeginImageContextWithOptions(size, false, 0);
    guard view.drawHierarchy(in: CGRect(origin: .zero, size: size), afterScreenUpdates: true) else {
      UIGraphicsEndImageContext()
      return nil
    }
    let screenshot = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()

    return screenshot
  }


  @objc(requiresMainQueueSetup)
  private func requiresMainQueueSetup() -> Bool {
    return true
  }

  func getImages(data: JSON) -> Promise<Dictionary<String, ExportableMediaSource>> {
    let nodeBlocks = data["nodes"].arrayValue.map { node in
      return node["block"]
    }

    var allBlocks = data["blocks"].arrayValue
    allBlocks.append(contentsOf: nodeBlocks)

    return Promise<Dictionary<String, UIView>>.init(queue: .main) { resolve, reject in
      var views: Dictionary<String, UIView> = [:]
      allBlocks.forEach { block in
        let node = data["nodes"].arrayValue.first { node in
          if let blockId = node["block"].dictionaryValue["id"]?.stringValue {
            return blockId == block["id"].stringValue
          } else {
            return false
          }

        }

        var viewTag: NSNumber
        if let _node = node {
           viewTag = _node["viewTag"].numberValue
         } else {
           viewTag = block["viewTag"].numberValue
         }

        guard let view = self.bridge.uiManager.view(forReactTag: viewTag) else {
          return;
        }

        views[block["id"].stringValue] = view
      }

      resolve(views)
    }.then { views in
      var dict = Dictionary<String, ExportableMediaSource>();
      allBlocks.forEach { block in
        guard let view = views[block["id"].stringValue] else {
          return
        }

        if block["type"].stringValue == "text" {
          guard let screenshot = self.captureTextScreenshot(view: view) else {
            return
          }

          dict[block["id"].stringValue] = ExportableImageSource.init(screenshot: screenshot, id: block["id"].stringValue)
        } else if block["type"].stringValue == "image" || block["type"].stringValue == "video" {
           guard let mediaPlayer = self.findMediaPlayer(view) else {
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

  func findMediaPlayer(_ view: UIView) -> MediaPlayer? {
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


  @objc(startExportWithResolver:resolver:rejecter:)
  func startExportWithResolver(data: Dictionary<String, AnyObject>,  resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) -> Void {


  }


//  func methodQueue() -> DispatchQueue
//  {
//    return DispatchQueue.main;
//  }

  
}
