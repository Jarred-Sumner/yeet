//
//  Fixtures.swift
//  yeetTests
//
//  Created by Jarred WSumner on 10/22/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SwiftyJSON

@testable import yeet


class Fixtures {
  static let bundle = Bundle(for: Fixtures.self)

  static let moneyDirectory =  "Fixtures/money"
  static let moneyOutputPath = Fixtures.bundle.resourcePath! + "/" + Fixtures.moneyDirectory + "/test-video.mp4"
  static let moneyOutputPath2x = Fixtures.bundle.resourcePath! + "/" + Fixtures.moneyDirectory + "/test-video@2x.mp4"
  static let moneyOutputURL = URL(string: "file://" + Fixtures.moneyOutputPath)
  static let moneyOutputURL2x = URL(string: "file://" + Fixtures.moneyOutputPath2x)
  static let moneyJSONPath = Fixtures.bundle.resourceURL!.appendingPathComponent(Fixtures.moneyDirectory, isDirectory: true).appendingPathComponent("export.json")
  static let moneyJSON = JSON(parseJSON: try! String(contentsOf: Fixtures.moneyJSONPath, encoding: .utf8))

  static let twoVideosDirectory =  "Fixtures/twoVideos"
  static let twoVideosTransparentPNGOutputPath = Fixtures.bundle.resourcePath! + "/" + Fixtures.twoVideosDirectory + "/test-video.mp4"
  static let twoVideosTransparentPNGOutputPath2x = Fixtures.bundle.resourcePath! + "/" + Fixtures.twoVideosDirectory + "/test-video@2x.mp4"
  static let twoVideosTransparentPNGOutputURL = URL(string: "file://" + Fixtures.twoVideosTransparentPNGOutputPath)
  static let twoVideosTransparentPNGOutputURL2x = URL(string: "file://" + Fixtures.twoVideosTransparentPNGOutputPath2x)
  static let twoVideosTransparentPNGJSONPath = Fixtures.bundle.resourceURL!.appendingPathComponent(Fixtures.twoVideosDirectory, isDirectory: true).appendingPathComponent("export.json")
  static let twoVideosTransparentPNGJSON = JSON(parseJSON: try! String(contentsOf: Fixtures.twoVideosTransparentPNGJSONPath, encoding: .utf8))

  static let hiGifDirectory =  "Fixtures/higif"
  static let hiGifTransparentPNGOutputPath = Fixtures.bundle.resourcePath! + "/" + Fixtures.hiGifDirectory + "/test-video.mp4"
  static let hiGifTransparentPNGOutputPath2x = Fixtures.bundle.resourcePath! + "/" + Fixtures.hiGifDirectory + "/test-video@2x.mp4"
  static let hiGifTransparentPNGOutputURL = URL(string: "file://" + Fixtures.hiGifTransparentPNGOutputPath)
  static let hiGifTransparentPNGOutputURL2x = URL(string: "file://" + Fixtures.hiGifTransparentPNGOutputPath2x)
  static let hiGifTransparentPNGJSONPath = Fixtures.bundle.resourceURL!.appendingPathComponent(Fixtures.hiGifDirectory, isDirectory: true).appendingPathComponent("export.json")
  static let hiGifTransparentPNGJSON = JSON(parseJSON: try! String(contentsOf: Fixtures.hiGifTransparentPNGJSONPath, encoding: .utf8))

  static func videoProducer(fixture: JSON) -> VideoProducer {
    let imagesDict = self.getImages(data: fixture)

    return VideoProducer(data: fixture, images: imagesDict)
  }

  private static func getImages(data: JSON) -> Dictionary<String, ExportableMediaSource>  {
    var dict = Dictionary<String, ExportableMediaSource>();
      let nodeBlocks = data["nodes"].arrayValue.map { node in
        return node["block"]
      }


       var allBlocks = data["blocks"].arrayValue
      allBlocks.append(contentsOf: nodeBlocks)
      for block in allBlocks {
        let node = data["nodes"].arrayValue.first { node in
          if let blockId = node["block"].dictionaryValue["id"]?.stringValue {
            return blockId == block["id"].stringValue
          } else {
            return false
          }
        }

        var nodeView: UIView? = nil

        if let node = node {
          let _nodeView = UIView()

          let frame = CGRect.from(json: node["frame"])
          _nodeView.frame = frame
          _nodeView.bounds = CGRect(origin: .zero, size: CGRect.from(json: node["block"].dictionaryValue["frame"]!).size)

          nodeView = _nodeView
        }

        if block["type"].stringValue == "text" {
          var viewTag: NSNumber

          if let _node = node {
            viewTag = _node["viewTag"].numberValue
          } else {
            viewTag = block["viewTag"].numberValue
          }


        } else if block["type"].stringValue == "image" || block["type"].stringValue == "video" {
          var mediaPlayer = MediaPlayer(bridge: nil)

          let id = block["id"].stringValue

          let values = block["value"].dictionaryValue
          let width = values["width"]!.numberValue
          let height = values["height"]!.numberValue
          let mimeType = MimeType.init(rawValue: values["mimeType"]!.stringValue)!
          let uri = values["uri"]!.stringValue
          let duration = values["duration"]!.numberValue
          let pixelRatio = NSNumber(value: 1)

          let bounds = CGRect.from(json: block["frame"])

          let mediaSource = MediaSource(URL(string: uri)!, mimeType, duration, duration, id, width, height, bounds, pixelRatio)


          mediaPlayer.bounds = CGRect(origin: .zero, size: bounds.size)
          mediaPlayer.frame = bounds
          mediaPlayer.autoPlay = true
          mediaPlayer.sources = [mediaSource]

          mediaPlayer.createMediaQueue(sources: mediaPlayer.sources)
          let mediaQueue = mediaPlayer.mediaQueue!
          mediaQueue.update(mediaSources: mediaPlayer.sources)

          mediaPlayer.layoutContentView()
          mediaQueue.current?.load()
//          mediaQueue.play()

          let item = mediaQueue.current!

          if mediaSource.isImage {
            let imageView = mediaPlayer.imageView!

            try! imageView.loadImage(async: false)
          } else if mediaSource.isVideo {
            mediaSource.assetStatus = .loaded
            mediaQueue.current!.start()
            let _item = item as! TrackableVideoSource
            _item.handleLoad(asset: mediaSource.asset!)
          }

          let exportableMedia = ExportableMediaSource.from(mediaPlayer: mediaPlayer, nodeView: nodeView)!
          
          dict[block["id"].stringValue] = exportableMedia
        }
      }

    return dict
  }
}
