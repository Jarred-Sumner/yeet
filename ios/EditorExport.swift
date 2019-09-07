//
//  EditorExport.swift
//  yeet
//
//  Created by Jarred WSumner on 9/5/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SwiftyJSON


class EditorExport : NSObject, NSCoding{

  var blocks : [Block]!
  var nodes : [Node]!

  /**
   * Instantiate the instance using the passed json values to set the properties values
   */
  init(fromJson json: JSON!){
    if json.isEmpty{
      return
    }
    blocks = [Block]()
    let blocksArray = json["blocks"].arrayValue
    for blocksJson in blocksArray{
      let value = Block(fromJson: blocksJson)
      blocks.append(value)
    }
    nodes = [Node]()
    let nodesArray = json["nodes"].arrayValue
    for nodesJson in nodesArray{
      let value = Node(fromJson: nodesJson)
      nodes.append(value)
    }
  }

  /**
   * Returns all the available property values in the form of [String:Any] object where the key is the approperiate json key and the value is the value of the corresponding property
   */
  func toDictionary() -> [String:Any]
  {
    var dictionary = [String:Any]()
    if blocks != nil{
      var dictionaryElements = [[String:Any]]()
      for blocksElement in blocks {
        dictionaryElements.append(blocksElement.toDictionary())
      }
      dictionary["blocks"] = dictionaryElements
    }
    if nodes != nil{
      var dictionaryElements = [[String:Any]]()
      for nodesElement in nodes {
        dictionaryElements.append(nodesElement.toDictionary())
      }
      dictionary["nodes"] = dictionaryElements
    }
    return dictionary
  }

  /**
   * NSCoding required initializer.
   * Fills the data from the passed decoder
   */
  @objc required init(coder aDecoder: NSCoder)
  {
    blocks = aDecoder.decodeObject(forKey: "blocks") as? [Block]
    nodes = aDecoder.decodeObject(forKey: "nodes") as? [Node]
  }

  /**
   * NSCoding required method.
   * Encodes mode properties into the decoder
   */
  func encode(with aCoder: NSCoder)
  {
    if blocks != nil{
      aCoder.encode(blocks, forKey: "blocks")
    }
    if nodes != nil{
      aCoder.encode(nodes, forKey: "nodes")
    }

  }

}




class Position : NSObject, NSCoding{

  var rotate : Int!
  var scale : Float!
  var x : Int!
  var y : Float!

  /**
   * Instantiate the instance using the passed json values to set the properties values
   */
  init(fromJson json: JSON!){
    if json.isEmpty{
      return
    }
    rotate = json["rotate"].intValue
    scale = json["scale"].floatValue
    x = json["x"].intValue
    y = json["y"].floatValue
  }

  /**
   * Returns all the available property values in the form of [String:Any] object where the key is the approperiate json key and the value is the value of the corresponding property
   */
  func toDictionary() -> [String:Any]
  {
    var dictionary = [String:Any]()
    if rotate != nil{
      dictionary["rotate"] = rotate
    }
    if scale != nil{
      dictionary["scale"] = scale
    }
    if x != nil{
      dictionary["x"] = x
    }
    if y != nil{
      dictionary["y"] = y
    }
    return dictionary
  }

  /**
   * NSCoding required initializer.
   * Fills the data from the passed decoder
   */
  @objc required init(coder aDecoder: NSCoder)
  {
    rotate = aDecoder.decodeObject(forKey: "rotate") as? Int
    scale = aDecoder.decodeObject(forKey: "scale") as? Float
    x = aDecoder.decodeObject(forKey: "x") as? Int
    y = aDecoder.decodeObject(forKey: "y") as? Float
  }

  /**
   * NSCoding required method.
   * Encodes mode properties into the decoder
   */
  func encode(with aCoder: NSCoder)
  {
    if rotate != nil{
      aCoder.encode(rotate, forKey: "rotate")
    }
    if scale != nil{
      aCoder.encode(scale, forKey: "scale")
    }
    if x != nil{
      aCoder.encode(x, forKey: "x")
    }
    if y != nil{
      aCoder.encode(y, forKey: "y")
    }

  }

}

class Node : NSObject, NSCoding{

  var block : Block!
  var position : Position!

  /**
   * Instantiate the instance using the passed json values to set the properties values
   */
  init(fromJson json: JSON!){
    if json.isEmpty{
      return
    }
    let blockJson = json["block"]
    if !blockJson.isEmpty{
      block = Block(fromJson: blockJson)
    }
    let positionJson = json["position"]
    if !positionJson.isEmpty{
      position = Position(fromJson: positionJson)
    }
  }

  /**
   * Returns all the available property values in the form of [String:Any] object where the key is the approperiate json key and the value is the value of the corresponding property
   */
  func toDictionary() -> [String:Any]
  {
    var dictionary = [String:Any]()
    if block != nil{
      dictionary["block"] = block.toDictionary()
    }
    if position != nil{
      dictionary["position"] = position.toDictionary()
    }
    return dictionary
  }

  /**
   * NSCoding required initializer.
   * Fills the data from the passed decoder
   */
  @objc required init(coder aDecoder: NSCoder)
  {
    block = aDecoder.decodeObject(forKey: "block") as? Block
    position = aDecoder.decodeObject(forKey: "position") as? Position
  }

  /**
   * NSCoding required method.
   * Encodes mode properties into the decoder
   */
  func encode(with aCoder: NSCoder)
  {
    if block != nil{
      aCoder.encode(block, forKey: "block")
    }
    if position != nil{
      aCoder.encode(position, forKey: "position")
    }

  }

}

class Dimension : NSObject, NSCoding{

  var height : Float!
  var maxX : Float!
  var maxY : Float!
  var width : Float!
  var x : Int!
  var y : Int!

  /**
   * Instantiate the instance using the passed json values to set the properties values
   */
  init(fromJson json: JSON!){
    if json.isEmpty{
      return
    }
    height = json["height"].floatValue
    maxX = json["maxX"].floatValue
    maxY = json["maxY"].floatValue
    width = json["width"].floatValue
    x = json["x"].intValue
    y = json["y"].intValue
  }

  /**
   * Returns all the available property values in the form of [String:Any] object where the key is the approperiate json key and the value is the value of the corresponding property
   */
  func toDictionary() -> [String:Any]
  {
    var dictionary = [String:Any]()
    if height != nil{
      dictionary["height"] = height
    }
    if maxX != nil{
      dictionary["maxX"] = maxX
    }
    if maxY != nil{
      dictionary["maxY"] = maxY
    }
    if width != nil{
      dictionary["width"] = width
    }
    if x != nil{
      dictionary["x"] = x
    }
    if y != nil{
      dictionary["y"] = y
    }
    return dictionary
  }

  /**
   * NSCoding required initializer.
   * Fills the data from the passed decoder
   */
  @objc required init(coder aDecoder: NSCoder)
  {
    height = aDecoder.decodeObject(forKey: "height") as? Float
    maxX = aDecoder.decodeObject(forKey: "maxX") as? Float
    maxY = aDecoder.decodeObject(forKey: "maxY") as? Float
    width = aDecoder.decodeObject(forKey: "width") as? Float
    x = aDecoder.decodeObject(forKey: "x") as? Int
    y = aDecoder.decodeObject(forKey: "y") as? Int
  }

  /**
   * NSCoding required method.
   * Encodes mode properties into the decoder
   */
  func encode(with aCoder: NSCoder)
  {
    if height != nil{
      aCoder.encode(height, forKey: "height")
    }
    if maxX != nil{
      aCoder.encode(maxX, forKey: "maxX")
    }
    if maxY != nil{
      aCoder.encode(maxY, forKey: "maxY")
    }
    if width != nil{
      aCoder.encode(width, forKey: "width")
    }
    if x != nil{
      aCoder.encode(x, forKey: "x")
    }
    if y != nil{
      aCoder.encode(y, forKey: "y")
    }

  }

}

class Block : NSObject, NSCoding{

  var dimensions : Dimension!
  var format : String!
  var type : String!
  var value : Value!
  var viewTag : Int!

  /**
   * Instantiate the instance using the passed json values to set the properties values
   */
  init(fromJson json: JSON!){
    if json.isEmpty{
      return
    }
    let dimensionsJson = json["dimensions"]
    if !dimensionsJson.isEmpty{
      dimensions = Dimension(fromJson: dimensionsJson)
    }
    format = json["format"].stringValue
    type = json["type"].stringValue
    let valueJson = json["value"]
    if !valueJson.isEmpty{
      value = Value(fromJson: valueJson)
    }
    viewTag = json["viewTag"].intValue
  }

  /**
   * Returns all the available property values in the form of [String:Any] object where the key is the approperiate json key and the value is the value of the corresponding property
   */
  func toDictionary() -> [String:Any]
  {
    var dictionary = [String:Any]()
    if dimensions != nil{
      dictionary["dimensions"] = dimensions.toDictionary()
    }
    if format != nil{
      dictionary["format"] = format
    }
    if type != nil{
      dictionary["type"] = type
    }
    if value != nil{
      dictionary["value"] = value.toDictionary()
    }
    if viewTag != nil{
      dictionary["viewTag"] = viewTag
    }
    return dictionary
  }

  /**
   * NSCoding required initializer.
   * Fills the data from the passed decoder
   */
  @objc required init(coder aDecoder: NSCoder)
  {
    dimensions = aDecoder.decodeObject(forKey: "dimensions") as? Dimension
    format = aDecoder.decodeObject(forKey: "format") as? String
    type = aDecoder.decodeObject(forKey: "type") as? String
    value = aDecoder.decodeObject(forKey: "value") as? Value
    viewTag = aDecoder.decodeObject(forKey: "viewTag") as? Int
  }

  /**
   * NSCoding required method.
   * Encodes mode properties into the decoder
   */
  func encode(with aCoder: NSCoder)
  {
    if dimensions != nil{
      aCoder.encode(dimensions, forKey: "dimensions")
    }
    if format != nil{
      aCoder.encode(format, forKey: "format")
    }
    if type != nil{
      aCoder.encode(type, forKey: "type")
    }
    if value != nil{
      aCoder.encode(value, forKey: "value")
    }
    if viewTag != nil{
      aCoder.encode(viewTag, forKey: "viewTag")
    }

  }

}

class Value : NSObject, NSCoding{

  var duration : Int!
  var height : Float!
  var mimeType : String!
  var source : String!
  var uri : String!
  var width : Float!

  /**
   * Instantiate the instance using the passed json values to set the properties values
   */
  init(fromJson json: JSON!){
    if json.isEmpty{
      return
    }
    duration = json["duration"].intValue
    height = json["height"].floatValue
    mimeType = json["mimeType"].stringValue
    source = json["source"].stringValue
    uri = json["uri"].stringValue
    width = json["width"].floatValue
  }

  /**
   * Returns all the available property values in the form of [String:Any] object where the key is the approperiate json key and the value is the value of the corresponding property
   */
  func toDictionary() -> [String:Any]
  {
    var dictionary = [String:Any]()
    if duration != nil{
      dictionary["duration"] = duration
    }
    if height != nil{
      dictionary["height"] = height
    }
    if mimeType != nil{
      dictionary["mimeType"] = mimeType
    }
    if source != nil{
      dictionary["source"] = source
    }
    if uri != nil{
      dictionary["uri"] = uri
    }
    if width != nil{
      dictionary["width"] = width
    }
    return dictionary
  }

  /**
   * NSCoding required initializer.
   * Fills the data from the passed decoder
   */
  @objc required init(coder aDecoder: NSCoder)
  {
    duration = aDecoder.decodeObject(forKey: "duration") as? Int
    height = aDecoder.decodeObject(forKey: "height") as? Float
    mimeType = aDecoder.decodeObject(forKey: "mimeType") as? String
    source = aDecoder.decodeObject(forKey: "source") as? String
    uri = aDecoder.decodeObject(forKey: "uri") as? String
    width = aDecoder.decodeObject(forKey: "width") as? Float
  }

  /**
   * NSCoding required method.
   * Encodes mode properties into the decoder
   */
  func encode(with aCoder: NSCoder)
  {
    if duration != nil{
      aCoder.encode(duration, forKey: "duration")
    }
    if height != nil{
      aCoder.encode(height, forKey: "height")
    }
    if mimeType != nil{
      aCoder.encode(mimeType, forKey: "mimeType")
    }
    if source != nil{
      aCoder.encode(source, forKey: "source")
    }
    if uri != nil{
      aCoder.encode(uri, forKey: "uri")
    }
    if width != nil{
      aCoder.encode(width, forKey: "width")
    }

  }

}

