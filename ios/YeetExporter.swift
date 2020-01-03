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
import JGProgressHUD

@objc(YeetExporter)
class YeetExporter: NSObject, RCTBridgeModule  {
  static func moduleName() -> String! {
    return "YeetExporter";
  }


  var bridge: RCTBridge!

  var producer: VideoProducer? = nil
  var hud: JGProgressHUD? = nil
  var task: ContentExportTask? = nil
  var taskStepObserver: NSKeyValueObservation? = nil
  var taskProgressObserver: NSKeyValueObservation? = nil

  func dismissHUD(success: Bool, error: Error? = nil) {
    guard let hud = self.hud else {
      return
    }

    if success {
      let successView = JGProgressHUDSuccessIndicatorView()
      hud.indicatorView = successView
      hud.backgroundColor = hud.backgroundColor! + UIColor(red: CGFloat(0), green: CGFloat(0.15), blue: CGFloat(0), alpha: 0.0)

      hud.textLabel.text = "Created"
      hud.detailTextLabel.text = "Share your content"

      hud.dismiss(afterDelay: 1.0, animated: true)
      self.hud = nil
      self.taskProgressObserver?.invalidate()
      self.taskStepObserver?.invalidate()
    } else {
      hud.textLabel.text = "Something broke."
      hud.detailTextLabel.text = error?.localizedDescription ?? "Please try again."
      let errorView = JGProgressHUDErrorIndicatorView()
      hud.backgroundColor = hud.backgroundColor! + UIColor(red: CGFloat(0.1), green: CGFloat(0), blue: CGFloat(0), alpha: 0.0)
      hud.indicatorView = errorView
      hud.dismiss(afterDelay: error != nil ? 10.0 : 3, animated: true)
      self.hud = nil
      self.taskProgressObserver?.invalidate()
      self.taskStepObserver?.invalidate()
    }

  }

  func updateHUD() {
    guard let hud = self.hud else {
      return
    }

    guard bridge.isValid else {
      return
    }

    if hud.superview == nil {
      self.hud = nil
      return
    }

    if let task = task {
      hud.textLabel.text = task.step.rawValue
      hud.detailTextLabel.text = task.detailLabel
    }
  }

  func displayHUD(task: ContentExportTask, tag: NSNumber) {
    guard self.bridge.isValid ?? false else {
      return
    }

    guard let view = self.bridge.uiManager.view(forReactTag: tag) else {
      return
    }

    guard let task = self.task else {
      return
    }

    if let _hud = self.hud {
      _hud.dismiss()
    }


    let hud = JGProgressHUD(style: .dark)
    hud.backgroundColor = UIColor(white: 0, alpha: 0.9)
    hud.indicatorView = JGProgressHUDRingIndicatorView()

    hud.textLabel.text = task.step.rawValue
    hud.detailTextLabel.text = task.detailLabel

    let vc = view.reactViewController()
    let _view = vc?.navigationController?.view ?? vc!.view
    hud.show(in: _view!, animated: true)

    self.taskProgressObserver = task.totalProgress.observe(\Progress.fractionCompleted) { [weak hud, weak self] progress, change in
      if Thread.isMainThread {
        hud?.setProgress(Float(progress.fractionCompleted), animated: true)
        self?.updateHUD()
      } else {
        DispatchQueue.main.async { [weak self] in
          hud?.setProgress(Float(progress.fractionCompleted), animated: true)
          self?.updateHUD()
        }
      }

    }

    self.hud = hud

  }

  func hideHud() {

  }

  @objc(startExport:isServerOnly:callback:)
  func startExport(data: String, isServerOnly: Bool, callback: @escaping RCTResponseSenderBlock) -> Void {

      var task: ContentExportTask? = ContentExportTask()
      guard let dataObject = data.data(using: .utf8) else {
        callback([YeetError.init(code: .genericError, userInfo: nil)])
        return
      }

      guard let exportData = try? JSON(data: dataObject) else {
        callback([YeetError.init(code: .genericError, userInfo: nil)])
        return
      }

      let containerTag = exportData["containerNode"].numberValue

      let workItem =  DispatchWorkItem { [weak task, weak self] in
        guard let _task = task else {
          return
        }

        guard !_task.totalProgress.isFinished else {
          return
        }

        self?.task = task
        self?.displayHUD(task: task!, tag: containerTag)
      }

      DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + 0.1, execute: workItem)

      let start = CACurrentMediaTime()
      self.getImages(data: exportData, task: task!).then { images in
        let producer = VideoProducer(data: exportData, images: images)
        self.producer = producer

        let boundsDict = exportData["bounds"].dictionaryValue

        let bounds = CGRect(x: CGFloat(boundsDict["x"]!.doubleValue), y: CGFloat(boundsDict["y"]!.doubleValue), width: CGFloat(boundsDict["width"]!.doubleValue), height: CGFloat(boundsDict["height"]!.doubleValue))


        producer.start(estimatedBounds: bounds, isServerOnly: isServerOnly, scale: UIScreen.main.scale, task: task!).then(on: DispatchQueue.main) { [weak self] export in
            SwiftyBeaver.info("Completed ContentExport in \(CACurrentMediaTime() - start)")

            callback([nil, export.dictionaryValue()])
            self?.dismissHUD(success: true)

            task = nil
            self?.task = nil
            self?.taskProgressObserver?.invalidate()
            self?.taskStepObserver?.invalidate()


            workItem.cancel()
          }.catch { [weak self] error in
            callback([error, nil])
            task = nil
            self?.dismissHUD(success: false, error: error)
            self?.task = nil
            self?.taskProgressObserver?.invalidate()
            self?.taskStepObserver?.invalidate()

            workItem.cancel()
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

  func getImages(data: JSON, task: ContentExportTask) -> Promise<Dictionary<String, ExportableMediaSource>> {
    let nodeBlocks = data["nodes"].arrayValue.map { node in
      return node["block"]
    }

    var allBlocks = data["blocks"].arrayValue
    allBlocks.append(contentsOf: nodeBlocks)

    task.addComposeProgress(resourceCount: Int64(allBlocks.count))

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

          let imageSource = ExportableImageSource.init(screenshot: screenshot, id: block["id"].stringValue)
          if type(of: view) == MovableView.self {
            imageSource.nodeView = view  as! MovableView
          }

          imageSource.containerView = containerNode
          imageSource.view = YeetExporter.findTextInputView(view)
        
          dict[block["id"].stringValue] = imageSource
        } else if block["type"].stringValue == "image" || block["type"].stringValue == "video" {
            guard let mediaPlayer = YeetExporter.findMediaPlayer(view) else {
             return
           }

          let mediaSource = ExportableMediaSource.from(mediaPlayer: mediaPlayer, nodeView:nil)
          mediaSource?.containerView = containerNode

          if type(of: view) == MovableView.self {
            mediaSource?.nodeView = view  as! MovableView
          }

          mediaSource?.view = mediaPlayer



         dict[block["id"].stringValue] = mediaSource
        }

        task.incrementCompose()
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

  static func findMovableView(_ view: UIView) -> MovableView? {
    if type(of: view) == MovableView.self {
      return view as! MovableView;
    } else if type(of: view.superview) == MovableView.self {
      return view.superview as! MovableView;
    } else if view.superview != nil {
      return YeetExporter.findMovableView(view.superview!)
    } else {
      return nil
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
