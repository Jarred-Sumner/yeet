//
//  FeatureDetector.swift
//  yeet
//
//  Created by Jarred WSumner on 12/14/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import UIKit

class FeatureDetector {

//  let image = CIImage(cgImage: UIImage(named: "rkxfmy06fl441.png")!.cgImage!)
//
//
//  let textDetector = CIDetector(ofType: CIDetectorTypeText, context: nil, options: nil)!
//  let rectangleDetector = CIDetector(ofType: CIDetectorTypeRectangle, context: nil, options: nil)!

  func detectText() -> Array<CGRect> {
     return []
  }

//  let image = UIImage(named: "xfqbg89beo441.png")
//  let image = UIImage(named: "123.png")
//  let image = UIImage(named: "vrynlmwfrn441.jpg")
//  let image = UIImage(named: "lq3lc5cquo441.jpg")

  func detectRectangles(image: UIImage) -> Array<CGRect> {
    return FindContours.findContours(in: image) as! Array<CGRect>
  }
  
}
