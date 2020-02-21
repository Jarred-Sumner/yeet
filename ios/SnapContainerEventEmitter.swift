//
//  SnapContainerEventEmitter.swift
//  yeet
//
//  Created by Jarred WSumner on 2/16/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

import UIKit

@objc(SnapContainerEventEmitter) class SnapContainerEventEmitter: RCTEventEmitter {
  enum EventName : String {
    case onMoveStart = "onMoveStart"
    case onMoveEnd = "onMoveEnd"
    case onDelete = "onDelete"
    case onTapBackground = "onTapBackground"
  }

  override static func moduleName() -> String! {
    return "SnapContainerEventEmitter";
  }


  var listenerCount = 0
  var hasListeners : Bool { listenerCount > 0 }
  override func startObserving() {
    super.startObserving()
    listenerCount += 1
  }

  override func stopObserving() {
    super.stopObserving()
    listenerCount -= 1
  }

  override func supportedEvents() -> [String]! {
    return [
      EventName.onMoveStart.rawValue,
      EventName.onMoveEnd.rawValue,
      EventName.onDelete.rawValue,
      EventName.onTapBackground.rawValue,
    ]
  }

  override func constantsToExport() -> [AnyHashable : Any]! {
    return ["events": supportedEvents()!]
  }

  func dispatchBackgroundTap(_ location: CGPoint) {
    guard hasListeners else {
      return
    }


    self.sendEvent(withName: EventName.onTapBackground.rawValue, body: ["x": location.x, "y": location.y])
  }

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  func dispatchMoveStart(_ view: MovableView, snapContainer: SnapContainerView) {
    guard hasListeners else {
      return
    }


    dispatchMoveEvent(name: .onMoveStart, view: view, snapContainer: snapContainer)
  }

  func dispatchMoveEvent (name: EventName, view: MovableView, snapContainer: SnapContainerView) {
    guard let uid = view.uid else {
      return
    }

    guard let reactTag = view.reactTag else {
      return
    }

    guard let containerReactTag = snapContainer.reactTag else {
      return
    }

    let transform = view.reactTransform

    let bounds = view.bounds
    let center = view.center


    RCTExecuteOnUIManagerQueue {
      self.sendEvent(withName: name.rawValue, body: self.moveEventBody(uid: uid, transform: transform, reactTag: reactTag, containerReactTag: containerReactTag, center: center, bounds: bounds))
    }
  }

  func dispatchMoveEnd(_ view: MovableView, snapContainer: SnapContainerView) {
    guard hasListeners else {
      return
    }

    dispatchMoveEvent(name: .onMoveEnd, view: view, snapContainer: snapContainer)
  }

  private func moveEventBody(uid: String, transform: CGAffineTransform, reactTag: NSNumber, containerReactTag: NSNumber, center: CGPoint, bounds: CGRect) -> Dictionary<String, Any> {
    guard let shadowView = bridge.uiManager.shadowView(forReactTag: reactTag) else {
      return [:]
    }

    guard let containerShadowView = bridge.uiManager.shadowView(forReactTag: containerReactTag) else {
      return [:]
    }

    let snapTransform = SnapTransform(transform: transform, center: center, containerShadowView: containerShadowView, shadowView: shadowView)
    return [
      "uid": uid,
      "transform": snapTransform.dictionaryValue,
      "bounds": bounds.dictionaryValue(),
      "center": ["x": center.x, "y": center.y]
    ]
  }


}
