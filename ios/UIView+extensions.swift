//
//  UIView+extensions.swift
//  yeet
//
//  Created by Jarred WSumner on 12/27/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

extension UIView {

   public func snapshot(scale: CGFloat = 0, isOpaque: Bool = false, afterScreenUpdates: Bool = true) -> UIImage? {
      UIGraphicsBeginImageContextWithOptions(bounds.size, isOpaque, scale)
      drawHierarchy(in: bounds, afterScreenUpdates: afterScreenUpdates)
      let image = UIGraphicsGetImageFromCurrentImageContext()
      UIGraphicsEndImageContext()
      return image
   }


   public enum CASnapshotLayer: Int {
      case `default`, presentation, model
   }

   /// The method drawViewHierarchyInRect:afterScreenUpdates: performs its operations on the GPU as much as possible
   /// In comparison, the method renderInContext: performs its operations inside of your app’s address space and does
   /// not use the GPU based process for performing the work.
   /// https://stackoverflow.com/a/25704861/1418981
   public func caSnapshot(scale: CGFloat = 0, isOpaque: Bool = false,
                          layer layerToUse: CASnapshotLayer = .default) -> UIImage? {
      var isSuccess = false
      UIGraphicsBeginImageContextWithOptions(bounds.size, isOpaque, scale)
      if let context = UIGraphicsGetCurrentContext() {
         isSuccess = true
         switch layerToUse {
         case .default:
            layer.render(in: context)
         case .model:
            layer.model().render(in: context)
         case .presentation:
            layer.presentation()?.render(in: context)
         }
      }
      let image = UIGraphicsGetImageFromCurrentImageContext()
      UIGraphicsEndImageContext()
      return isSuccess ? image : nil
   }
}
