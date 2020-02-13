//
//  ReactNativePanViewController.swift
//  yeet
//
//  Created by Jarred WSumner on 2/11/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

import Foundation
import PanModal

@objc(PanViewController)
class PanViewController : UIViewController, PanModalPresentable {
  weak var bridge: RCTBridge? = nil
  var panViewTag: NSNumber? = nil
  var panView: PanViewSheet? {
    guard panViewTag != nil else {
      return nil
    }

    return bridge?.uiManager?.view(forReactTag: panViewTag) as? PanViewSheet
  }
  init(bridge: RCTBridge?) {
    self.bridge = bridge


    super.init(nibName: nil, bundle: nil)
    self.view = UIView(frame: UIScreen.main.bounds)
    self.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    self.modalPresentationStyle = .custom

  }

  override func loadView() {
    super.loadView()

  }



  override var preferredInterfaceOrientationForPresentation: UIInterfaceOrientation { get { return .portrait } }


  func supportedInterfaceOrientations(for window: UIWindow?) -> UIInterfaceOrientationMask {
    return .portrait
  }



  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override var supportedInterfaceOrientations : UIInterfaceOrientationMask {
    get {
      return .portrait
    }

    set {

    }
  }



  @objc(longHeight) var longHeight : CGFloat = UIScreen.main.bounds.height {
    didSet {
      self.panModalSetNeedsLayoutUpdate()
    }
  }
  @objc(shortHeight) var shortHeight : CGFloat = UIScreen.main.bounds.height - 100 {
     didSet {
       self.panModalSetNeedsLayoutUpdate()
     }
  }


  var panScrollView : UIScrollView? {
    get {
      let view = bridge?.uiManager.view(forReactTag: panScrollTag)

      if let _view = view as? RCTScrollView {
        return _view.scrollView
      } else if type(of: view) == UIScrollView.self {
        return view as! UIScrollView
      } else {
        return nil
      }
    }
  }

  var panScrollTag: NSNumber? = nil
  var panScrollable: UIScrollView? {
    get {
      if let scrollView = self.panScrollView {
        return scrollView
      } else {
        return nil
      }
    }
  }

  var hasLoaded = false

  override func viewDidLoad() {
    super.viewDidLoad()
    hasLoaded = true


    panModalSetNeedsLayoutUpdate()
    panModalTransition(to: panPresentationState)
  }



  var _topOffset = CGFloat(0)

  var topOffset: CGFloat {
    get {
      return _topOffset
    }

    set (newValue) {
      _topOffset = newValue

      panModalSetNeedsLayoutUpdate()
    }
  }



//   var panScrollable: UIScrollView? {
//         return nil
//     }

 var longFormHeight: PanModalHeight {
  return .contentHeightIgnoringSafeArea(longHeight)
 }

  var shortFormHeight: PanModalHeight {
   return .contentHeightIgnoringSafeArea(shortHeight)
  }

  var transitionAnimationOptions: UIView.AnimationOptions {
      return [.allowUserInteraction, .beginFromCurrentState]
  }

 var anchorModalToLongForm: Bool {
  get { return panView?.defaultPresentationState == .longForm }
 }

 var shouldRoundTopCorners: Bool {
     return true
 }


  var minY: CGFloat = 0

 var allowsExtendedPanScrolling: Bool { true }

 /**
  A flag to determine if dismissal should be initiated when swiping down on the presented view.

  Return false to fallback to the short form state instead of dismissing.

  Default value is true.
  */
 var allowsDragToDismiss: Bool { true }

 /**
  A flag to determine if dismissal should be initiated when tapping on the dimmed background view.

  Default value is true.
  */
 var allowsTapToDismiss: Bool { true }

  /**
   Notifies the delegate when the pan modal gesture recognizer state is either
   `began` or `changed`. This method gives the delegate a chance to prepare
   for the gesture recognizer state change.

   For example, when the pan modal view is about to scroll.

   Default value is an empty implementation.
   */
  func willRespond(to panModalGestureRecognizer: UIPanGestureRecognizer) {

  }


  /**
   Asks the delegate if the pan modal gesture recognizer should be prioritized.

   For example, you can use this to define a region
   where you would like to restrict where the pan gesture can start.

   If false, then we rely solely on the internal conditions of when a pan gesture
   should succeed or fail, such as, if we're actively scrolling on the scrollView.

   Default return value is false.
   */
  func shouldPrioritize(panModalGestureRecognizer: UIPanGestureRecognizer) -> Bool {
    return false
  }

  /**
   Asks the delegate if the pan modal should transition to a new state.

   Default value is true.
   */
  func shouldTransition(to state: PanModalPresentationController.PresentationState) -> Bool {
    return true
  }

  var panPresentationState = PanModalPresentationController.PresentationState.shortForm
  /**
   Notifies the delegate that the pan modal is about to transition to a new state.

   Default value is an empty implementation.
   */
  func willTransition(to state: PanModalPresentationController.PresentationState) {
    panPresentationState = state
  }

  var showDragIndicator: Bool {
    return panPresentationState == .shortForm
  }
  /**
   Notifies the delegate that the pan modal is about to be dismissed.

   Default value is an empty implementation.
   */
  func panModalWillDismiss() {
    panView?.onWillDismiss?([:])

  }

  /**
   Notifies the delegate after the pan modal is dismissed.

   Default value is an empty implementation.
   */
  func panModalDidDismiss() {

    if let reactSubview = panView?.reactSubview {
      panView?.touchHandler?.detach(from: reactSubview)
      panView?.panViewController = nil
      panView?.reactSubview = nil
    }


    panView?.onDismiss?([:])
  }

}
