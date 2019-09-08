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

  @objc(startExport:callback:)
  func startExport(data: String,  callback: RCTResponseSenderBlock) -> Void {
    if let dataObject = data.data(using: .utf8) {
      if let exportData = try? JSON(data: dataObject) {

        self.getImages(data: exportData) { images in
          DispatchQueue.global(qos: .userInitiated).async {
            self.producer = VideoProducer(data: exportData, images: images)

            let boundsDict = exportData["bounds"].dictionaryValue

            let bounds = CGRect(x: CGFloat(boundsDict["x"]!.doubleValue), y: CGFloat(boundsDict["y"]!.doubleValue), width: CGFloat(boundsDict["width"]!.doubleValue), height: CGFloat(boundsDict["height"]!.doubleValue))

            self.producer?.start(estimatedBounds: bounds)
          }

        }
      }
    }

  }



  func getImages(data: JSON, block: @escaping (_ images: Dictionary<String, ExportableImage>) -> Void) -> Void {
    var dict = Dictionary<String, ExportableImage>();


    RCTExecuteOnUIManagerQueue {
      self.bridge.uiManager.addUIBlock({ (manager, registry) in
        let nodeBlocks = data["nodes"].arrayValue.map { node in
          return node["block"]

        }

         var allBlocks = data["blocks"].arrayValue
        allBlocks.append(contentsOf: nodeBlocks)

       allBlocks.filter({ (block) -> Bool in
          return block["type"].stringValue == "image"
        }).forEach({ (block) in
          if let view = registry?[block["viewTag"].numberValue] {

            if let imageView = self.findImageView(view: view) {
              dict[block["id"].stringValue] = ExportableImage(image: imageView.image!)
            }

          }
        })

        block(dict)
      })
    }

  }

  func findImageView(view: UIView) -> FFFastImageView? {
    if type(of: view) == FFFastImageView.self {
      return view as! FFFastImageView;
    } else if (view.subviews.count > 0) {
      return view.subviews.first { (view) -> Bool in
        return findImageView(view: view) != nil
        } as! FFFastImageView?
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
