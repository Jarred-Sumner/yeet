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

    self.view.clipsToBounds = false
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


//    panModalSetNeedsLayoutUpdate()
//    panModalTransition(to: panPresentationState)
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
  get { return panView?._defaultPresentationState == .longForm }
 }

 var shouldRoundTopCorners: Bool {
     return false
 }

  func reloadHeader() {
    RCTExecuteOnMainQueue {
      guard let headerView = self.headerView else {
         return
      }

      guard let reactSubview = self.panView?.reactSubview ?? nil else {
        return
      }

      self.view.insertSubview(headerView, belowSubview: reactSubview)
    }
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
    guard let reactSubview = panView?.reactSubview else {
          return
        }

        guard let headerView = self.headerView else {
          return
        }

    guard let superview  =  view.superview else {
      return
    }

    guard let window = UIApplication.shared.keyWindow else {
      return
    }

    let dist = panModalGestureRecognizer.translation(in: window)


    let totalDistance = dist.y + (headerView.frame.size.height - superview.frame.y)

    let endY = totalDistance > 0 ? totalDistance : 0

    if let dragIndicatorView = self.dragIndicatorView {
      let endValue: Float = endY == 0 ? 1 : 0

      if endValue != dragIndicatorView.layer.opacity {
        panModalAnimate({
          dragIndicatorView.layer.opacity = endValue
        })
      }
    }

    headerView.transform = CGAffineTransform.identity.translatedBy(x: .zero, y: endY)
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
  func adjustHeaderPosition(state: PanModalPresentationController.PresentationState) {
    if let headerView = self.headerView {
      if state == .longForm {
        panModalAnimate({
          headerView.transform = CGAffineTransform.init(translationX: 0, y: (self.longHeight - self.shortHeight) )
        })
      } else {
        panModalAnimate({
          headerView.transform = .identity
        })
      }
    }
  }
  func willTransition(to state: PanModalPresentationController.PresentationState) {
     adjustHeaderPosition(state: state)
    panView?.willTransition(to: state)
    panPresentationState = state
    panModalSetNeedsLayoutUpdate()


    if let dragIndicatorView = self.dragIndicatorView {
      let _alpha: Float = state == .longForm ? 0.0 : 1.0
      if _alpha != dragIndicatorView.layer.opacity {
        panModalAnimate({
          dragIndicatorView.layer.opacity = _alpha
        })
      }
    }
  }

  var dragIndicatorView: UIView? {
    guard let panPresentationController = self.panPresentationController else {
      return nil
    }

    return view.superview?.subviews.first(where: { view -> Bool in
      return view.backgroundColor == self.dragIndicatorBackgroundColor
    })
  }

  var panPresentationController: PanModalPresentationController?  { return presentationController as? PanModalPresentationController }
  var showDragIndicator: Bool {
    return headerTag == nil
  }

  var headerTag: NSNumber? = nil  {
    didSet {
      reloadHeader()
    }
  }
  var headerView: UIView? {
    guard let headerTag = self.headerTag else {
      return nil
    }

    guard bridge?.isValid ?? false else {
      return nil
    }

    guard let uiManager = bridge?.uiManager else {
      return nil
    }

    return uiManager.view(forReactTag: headerTag)
  }
  /**
   Notifies the delegate that the pan modal is about to be dismissed.

   Default value is an empty implementation.
   */
  func panModalWillDismiss() {
    panView?.resetTouch()
    panView?.onWillDismiss?([:])

    if let headerView = self.headerView {
        panModalAnimate({
          self.headerView?.layer.opacity = 0
        })
      }
  }



  override func viewWillAppear(_ animated: Bool) {
     super.viewWillAppear(animated)

    reloadHeader()

    if let headerView = self.headerView {
      headerView.layer.opacity = 0
      panModalAnimate({
        self.headerView?.layer.opacity = 1
      })
    }

    // Force it to start in the long form
    if panView?._defaultPresentationState == .longForm {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
        self.transition(to: .longForm)
      }
    }

   }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    panView?.didAppear?([:])
    reloadHeader()
    headerView?.layer.opacity = 1
  }


  override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)

    if let headerView = self.headerView {
       panModalAnimate({
         self.headerView?.layer.opacity = 0
       })
     }
  }


  func transition(to: PanModalPresentationController.PresentationState) {
    panModalTransition(to: to)
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    panView?.presented = false
    panView?.resetTouch()
  }


  /**
   Notifies the delegate after the pan modal is dismissed.

   Default value is an empty implementation.
   */
  func panModalDidDismiss() {

    panView?.onDismiss?([:])
  }

}
