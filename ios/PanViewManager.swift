//
//  PanViewManager.swift
//  yeet
//
//  Created by Jarred WSumner on 2/11/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

import Foundation

protocol PanHostViewInteractor {
  func present(_ modalHostView: PanViewSheet!, with viewController: UIViewController!, animated: Bool)
  func dismiss(_ modalHostView: PanViewSheet!, with viewController: UIViewController!, animated: Bool)
}

@objc(PanViewManager)
class PanViewManager : RCTViewManager, PanHostViewInteractor  {
  func present(_ modalHostView: PanViewSheet!, with viewController: UIViewController!, animated: Bool) {

    let panView: PanViewSheet = modalHostView as! PanViewSheet

    guard let _viewController = panView.reactSuperview()?.reactViewController() else {
      return
    }

    guard !panView.presented else {
      return
    }

    guard panView.reactSubview != nil else {
      return
    }


    guard !(panView.panViewController?.isPanModalPresented ?? false) else {
      return
    }

    panView.panViewController?.panPresentationState = panView.defaultPresentationState
    _viewController.presentPanModal(panView.panViewController!)


    panView.presented = true
   panView.onPresent(_viewController)

  }

  func dismiss(_ modalHostView: PanViewSheet!, with viewController: UIViewController!, animated: Bool) {

    var panView: PanViewSheet = modalHostView as! PanViewSheet

    panView.panViewController?.dismiss(animated: animated)
  }


  override func view() -> UIView! {
    Log.debug("BEFORE")
    var _view = PanViewSheet(bridge: bridge)
    Log.debug("HERE")
    let panViewController = PanViewController(bridge: bridge)
    _view.panViewController = panViewController

    _view.delegate = self;


    hostViews.add(_view)

    return _view
  }

 override static func moduleName() -> String! {
   return "PanSheetView";
 }


  @objc(clearPanView:)
  func clearPanView(_ tag: NSNumber) {
    RCTExecuteOnMainQueue {
      guard let panView = self.bridge?.uiManager?.view(forReactTag: tag) as? PanViewSheet else {
        return
      }

      if panView.panViewController?.isPanModalPresented ?? false {
        panView.panViewController?.dismiss(animated: true)
      }
      panView.bridge = nil
    }
  }



  var hostViews = NSHashTable<PanViewSheet>(options: .weakMemory)


  override func shadowView() -> RCTShadowView! {
    return PanShadowView()
  }

  @objc(presentViewManagerFrom:to:) func presentViewManager(_ from: NSNumber, _ to: NSNumber) {
    guard var bridge = self.bridge else {
      return
    }


    RCTExecuteOnMainQueue {
      guard let panView = bridge.uiManager.view(forReactTag: to) as? PanViewSheet else {
        return
      }

      panView.presentIt()
    }

  }

  @objc(transition:to:) func transition(_ tag: NSNumber, _ to: String) {
    guard var bridge = self.bridge else {
      return
    }


    guard bridge.isValid && !bridge.isLoading else {
      return
    }

    let presentationState = PanViewSheet.PAN_PRESENTATION_STATE_CONVERTER[to] ?? .longForm

    RCTExecuteOnMainQueue { [weak bridge] in
      guard let panView = bridge?.uiManager?.view(forReactTag: tag) as? PanViewSheet else {
        return
      }

      guard let panViewController = panView.panViewController else {
        return
      }

      panViewController.panModalTransition(to: presentationState)
      panViewController.panModalSetNeedsLayoutUpdate()
    }

  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
