//
//  YeetExporter.swift
//  yeet
//
//  Created by Jarred WSumner on 9/5/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit
import SwiftyJSON




@objc(YeetExporter)
class YeetExporter: NSObject, RCTBridgeModule  {
  static func moduleName() -> String! {
    return "YeetExporter";
  }


  var bridge: RCTBridge!

  var producer: VideoProducer? = nil

  @objc(startExport:isServerOnly:callback:)
  func startExport(data: String, isServerOnly: Bool, callback: @escaping RCTResponseSenderBlock) -> Void {
    if let dataObject = data.data(using: .utf8) {
      if let exportData = try? JSON(data: dataObject) {

        self.getImages(data: exportData) { images in
          DispatchQueue.global(qos: .default).async { [weak self] in
            autoreleasepool { [weak self] in
              self?.producer = VideoProducer(data: exportData, images: images)

              let boundsDict = exportData["bounds"].dictionaryValue

              let bounds = CGRect(x: CGFloat(boundsDict["x"]!.doubleValue), y: CGFloat(boundsDict["y"]!.doubleValue), width: CGFloat(boundsDict["width"]!.doubleValue), height: CGFloat(boundsDict["height"]!.doubleValue))
              self?.producer?.start(estimatedBounds: bounds, isServerOnly: isServerOnly, callback: callback)
            }
          }

        }
      }
    }

  }

  func captureTextScreenshot(viewTag: NSNumber, registry: [NSNumber: UIView]) -> UIImage? {
    guard let view = registry[viewTag] else {
      return nil
    }

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

  func getImages(data: JSON, block: @escaping (_ images: Dictionary<String, ExportableMediaSource>) -> Void) -> Void {
    var dict = Dictionary<String, ExportableMediaSource>();


    RCTExecuteOnUIManagerQueue {
      self.bridge.uiManager.addUIBlock({ (manager, _registry) in
        let nodeBlocks = data["nodes"].arrayValue.map { node in
          return node["block"]

        }

        guard let registry = _registry else {
          return
        }

         var allBlocks = data["blocks"].arrayValue
        allBlocks.append(contentsOf: nodeBlocks)
        allBlocks.forEach { block in
          if block["type"].stringValue == "text" {
            let node = nodeBlocks.first(where: { node in
              return node["block"].dictionaryValue["id"]?.stringValue == block["id"].stringValue
            })

            var viewTag: NSNumber

            if let _node = node {
              viewTag = _node["viewTag"].numberValue
            } else {
              viewTag = block["viewTag"].numberValue
            }

            guard let screenshot = self.captureTextScreenshot(viewTag: viewTag, registry: registry) else {
              return
            }

            dict[block["id"].stringValue] = ExportableImageSource.init(screenshot: screenshot, id: block["id"].stringValue)
          } else if block["type"].stringValue == "image" || block["type"].stringValue == "video" {
            guard let view = registry[block["viewTag"].numberValue] else {
              return;
            }

            if let mediaPlayer = self.findMediaPlayer(view) {
              dict[block["id"].stringValue] = ExportableMediaSource.from(mediaPlayer: mediaPlayer)
            }

          }
        }

  

        block(dict)
      })
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
