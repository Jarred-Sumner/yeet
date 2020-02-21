import UIKit

/*
 usage:

    add gesture:
        yourObjToStoreMe.snapGesture = SnapGesture(view: your_view)
    remove gesture:
        yourObjToStoreMe.snapGesture = nil
    disable gesture:
        yourObjToStoreMe.snapGesture.isGestureEnabled = false
    advanced usage:
        view to receive gesture(usually superview) is different from view to be transformed,
        thus you can zoom the view even if it is too small to be touched.
        yourObjToStoreMe.snapGesture = SnapGesture(transformView: your_view_to_transform, gestureView: your_view_to_recieve_gesture)

 */

class SnapGesture: NSObject, UIGestureRecognizerDelegate {

    // MARK: - init and deinit
    convenience init(view: UIView) {
        self.init(transformView: view, gestureView: view)
    }
    init(transformView: UIView, gestureView: UIView) {
        super.init()

        self.addGestures(v: gestureView)
        self.weakTransformView = transformView
    }
    deinit {
        self.cleanGesture()
    }

    // MARK: - private method
    weak var weakGestureView: UIView?
    weak var weakTransformView: UIView?

    private var panGesture: UIPanGestureRecognizer?
    private var pinchGesture: UIPinchGestureRecognizer?
    private var rotationGesture: UIRotationGestureRecognizer?
    private var backgroundGestureRecognizer : UITapGestureRecognizer?
    private var activationGestureHandler: UILongPressGestureRecognizer?

    var onGestureStart: ((_ location: CGPoint) -> Void)? = nil
    var onGestureStop: ((_ location: CGPoint) -> Void)? = nil
    var onPressBackground : ((_ location: CGPoint) -> Void)? = nil

    var hasSentPressInBackground = false
  @objc func handleActivationGesture(_ gesture: UILongPressGestureRecognizer) {
    if gesture.state == .began {
      hasSentPressInBackground = false
    }

    guard !isGestureEnabled else {
      return
    }

    guard !hasSentPressInBackground else {
      return
    }

    guard let gestureView = self.weakGestureView else {
      return
    }

    if gesture.state == .changed || gesture.state == .recognized {
      startTheGesturing(gesture.location(in: gestureView))
    }
  }


    private func addGestures(v: UIView) {
      v.isUserInteractionEnabled = true
      let gestureRecognizers = v.gestureRecognizers ?? []

      if backgroundGestureRecognizer == nil || !gestureRecognizers.contains(backgroundGestureRecognizer!) {
        let backgroundGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(handleBackgroundPress(_:)))
        backgroundGestureRecognizer.cancelsTouchesInView = true

//        backgroundGestureRecognizer.allowableMovement = 10
        backgroundGestureRecognizer.delaysTouchesBegan = true
        backgroundGestureRecognizer.delaysTouchesEnded = true
        backgroundGestureRecognizer.delegate = self
        v.addGestureRecognizer(backgroundGestureRecognizer)
        self.backgroundGestureRecognizer = backgroundGestureRecognizer
      }

      if activationGestureHandler == nil || !gestureRecognizers.contains(activationGestureHandler!) {
        let activationGestureHandler = UILongPressGestureRecognizer(target: self, action: #selector(handleActivationGesture(_:)))
        activationGestureHandler.cancelsTouchesInView = false
        activationGestureHandler.minimumPressDuration = 0.1
//        backgroundGestureRecognizer.allowableMovement = 10
        activationGestureHandler.delaysTouchesBegan = false
        activationGestureHandler.delaysTouchesEnded = false
        activationGestureHandler.delegate = self
        v.addGestureRecognizer(activationGestureHandler)
        self.activationGestureHandler = activationGestureHandler
      }

      if panGesture == nil || !gestureRecognizers.contains(panGesture!) {
        panGesture = UIPanGestureRecognizer(target: self, action: #selector(handleGesture(_:)))
        panGesture?.delaysTouchesBegan = false
        panGesture?.delaysTouchesEnded = false

        panGesture?.cancelsTouchesInView = false

        panGesture?.minimumNumberOfTouches = 1
        panGesture?.delegate = self     // for simultaneous recog
        v.addGestureRecognizer(panGesture!)
      }

      if pinchGesture == nil || !gestureRecognizers.contains(pinchGesture!) {
        pinchGesture = UIPinchGestureRecognizer(target: self, action: #selector(handleGesture(_:)))

        pinchGesture?.delegate = self   // for simultaneous recog
        pinchGesture?.cancelsTouchesInView = false
        pinchGesture?.delaysTouchesBegan = false
        pinchGesture?.delaysTouchesEnded = false
        v.addGestureRecognizer(pinchGesture!)
      }


      if rotationGesture == nil || !gestureRecognizers.contains(rotationGesture!) {
        rotationGesture = UIRotationGestureRecognizer(target: self, action: #selector(handleGesture(_:)))
        rotationGesture?.delegate = self
        rotationGesture?.delaysTouchesBegan = false
        rotationGesture?.delaysTouchesEnded = false

        rotationGesture?.cancelsTouchesInView = false
        v.addGestureRecognizer(rotationGesture!)
      }



      self.weakGestureView = v
    }

    private func cleanGesture() {
        if let view = self.weakGestureView {
            //for recognizer in view.gestureRecognizers ?? [] {
            //    view.removeGestureRecognizer(recognizer)
            //}
            if panGesture != nil {
                view.removeGestureRecognizer(panGesture!)
                panGesture = nil
            }
            if pinchGesture != nil {
                view.removeGestureRecognizer(pinchGesture!)
                pinchGesture = nil
            }
            if rotationGesture != nil {
                view.removeGestureRecognizer(rotationGesture!)
                rotationGesture = nil
            }

          if backgroundGestureRecognizer != nil {
              view.removeGestureRecognizer(backgroundGestureRecognizer!)
              backgroundGestureRecognizer = nil
          }

          if activationGestureHandler != nil {
               view.removeGestureRecognizer(activationGestureHandler!)
               activationGestureHandler = nil
           }

        }
        self.weakGestureView = nil
        self.weakTransformView = nil
    }




    // MARK: - API

    func setView(view:UIView?) {
        self.setTransformView(view, gestgureView: view)
    }

    func setTransformView(_ transformView: UIView?, gestgureView:UIView?) {
        if let v = gestgureView  {
          if v != self.weakGestureView {
            self.cleanGesture()
          }
            self.addGestures(v: v)
        }
        self.weakTransformView = transformView
    }

    open func resetViewPosition() {
        UIView.animate(withDuration: 0.4) {
          self.weakTransformView?.layer.setAffineTransform(CGAffineTransform.identity)
        }
    }

    open var isGestureEnabled = true
  open var maxScale = CGFloat(3.0)
  open var minScale = CGFloat(0.5)





    // MARK: - gesture handle

    // location will jump when finger number change
    private var initPanFingerNumber:Int = 1
    private var isPanFingerNumberChangedInThisSession = false
    private var lastPanPoint:CGPoint = CGPoint(x: 0, y: 0)
    private var lastScale:CGFloat = 1.0

   private var lastPinchPoint:CGPoint = CGPoint(x: 0, y: 0)
  var panStartPoint = CGPoint.zero

    @objc func handleGesture(_ gesture: UIGestureRecognizer) {
      guard let gestureView = self.weakGestureView as? YeetScrollView else {
        return
      }

      let isPan = gesture == panGesture
      let isPinch = gesture == pinchGesture
      let isRotate = gesture == rotationGesture

      guard isGestureEnabled else {
        if (isRotate || isPinch) && [UIGestureRecognizer.State.began, UIGestureRecognizer.State.changed, UIGestureRecognizer.State.recognized].contains(gesture.state) {
          startTheGesturing(gesture.location(in: gestureView))
        }
        return
      }

      guard let view = self.weakTransformView else {
        return
      }



      if isPan && panGesture?.numberOfTouches ?? 0 > 1 {
        panGesture?.setTranslation(.zero, in: view)
        panGesture!.setTranslation(.zero, in: gestureView)
        return
      }

//      if gesture.state == .began || gesture.state == .changed {
        let originalTransform = view.reactTransform
        var transform = view.reactTransform

        if isPan {
          let panner = panGesture!
          let point = panner.translation(in: view)
          transform = transform.translatedBy(x: point.x, y: point.y)
          panner.setTranslation(.zero, in: view)
          lastPanPoint = point
        } else if isPinch {
          let pincher = pinchGesture!
//          let scale = 1.0 - (lastScale - pincher.scale);
          let newScale = pincher.scale * transform.scaleX
          let scaledBounds = view.bounds.applying(CGAffineTransform.init(scaleX: newScale, y: newScale))

          if (newScale < maxScale && newScale > minScale) && scaledBounds.height > 14 {
            transform = transform.scaledBy(x: pincher.scale, y: pincher.scale)
          }
          lastScale = pincher.scale


//          let point = pincher.location(in: view)
//          transform = transform.translatedBy(x: point.x - lastPinchPoint.x, y: point.y - lastPinchPoint.y)
//          lastPinchPoint = pincher.location(in: view)

          pincher.scale = 1.0
        } else if isRotate {
          let rotater = rotationGesture!
          transform = transform.rotated(by: rotater.rotation)
          rotater.rotation = 0
        }

        if transform != originalTransform {
          view.reactTransform = transform
        }
//      }

      if isPan && (gesture.state == .ended || gesture.state == .failed) {
        panGesture!.setTranslation(.zero, in: gestureView)

        if [.ended, .failed].contains(rotationGesture?.state) && [.ended, .failed].contains(pinchGesture?.state) {
          stopTheGesturing(gesture.location(in: gestureView))
        }

      } else if (isRotate || isPinch) && [.ended, .failed].contains(rotationGesture?.state) && [.ended, .failed].contains(pinchGesture?.state) && !isPanGestureActive {
        stopTheGesturing(gesture.location(in: gestureView))
      }
    }

  func stopTheGesturing(_ location: CGPoint) {
    guard isGestureEnabled else {
      return
    }

    onGestureStop?(location)
  }

  func startTheGesturing(_ location: CGPoint) {
    guard !isGestureEnabled else {
      return
    }

    onGestureStart?(location)

    hasSentPressInBackground = true
  }

  var backgroundPressStartedAt: Int64? = nil
  var hasPressedLongEnough: Bool {
    return Int64(Date.timeIntervalSinceReferenceDate.rounded() * 1000) - (backgroundPressStartedAt ?? 0) > 50
  }

  var hasActiveGesture: Bool {
    guard !isPanGestureActive else {
      return true
    }

    return [rotationGesture!.state, pinchGesture!.state].contains(UIGestureRecognizer.State.recognized)
  }

  var isPanGestureActive : Bool {
    guard let gestureView = self.weakGestureView else {
      return false
    }

    let _trans = panGesture!.translation(in: gestureView)
    return abs(_trans.x) + abs(_trans.y) > 2
  }


  @objc func handleBackgroundPress(_ background: UITapGestureRecognizer) {
    if background.state == .failed && isGestureEnabled {
      stopTheGesturing(background.location(in: weakGestureView!))
    }

    if background.state == .ended {
      if let gestureView = self.weakGestureView {
        if isGestureEnabled {
          stopTheGesturing(background.location(in: weakGestureView!))
        } else {
          self.onPressBackground?(background.location(in: gestureView))
        }
      }
    }
  }

  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
    if gestureRecognizer == backgroundGestureRecognizer {
      return touch.view?.reactTag != YeetTextInputView.focusedReactTag && touch.view?.reactTag != YeetTextInputView.focusedMovableViewReactTag
    } else {
      return true
    }
//    return true
  }

//  func gestureRecognizer(_ first: UIGestureRecognizer, shouldRequireFailureOf second: UIGestureRecognizer) -> Bool {
//    guard let gestureView = weakGestureView else {
//      return false
//    }
//
//
//    if first == backgroundGestureRecognizer && (second.view is YeetTextInputView || second.view is UITextView || second.view is MovableView) {
//      return true
//    }
//
////    if  {
////      return true
////    } else {
//      return false
////    }
//  }

//  func gestureRecognizer(_ first: UIGestureRecognizer, shouldBeRequiredToFailBy second: UIGestureRecognizer) -> Bool {
//    guard let gestureView = self.weakGestureView else {
//      return false
//    }
//
//    var _scrollView: UIScrollView? = first.view as? UIScrollView
//
//    if _scrollView == nil {
//      _scrollView = second.view as? UIScrollView
//    }
//
//
//
//
//
////    else if (first == backgroundGestureRecognizer && [panGesture, rotationGesture, pinchGesture].contains(second) || second == backgroundGestureRecognizer && [panGesture, rotationGesture, pinchGesture].contains(first)) {
////      return true
////    } else {
//
//      return false
//
////    }
//  }


  var gestureRecognizers: [UIGestureRecognizer] {
    return [ panGesture,backgroundGestureRecognizer,rotationGesture,pinchGesture, activationGestureHandler].compactMap { $0 }
  }

    //MARK:- UIGestureRecognizerDelegate Methods
  func gestureRecognizer(_ first: UIGestureRecognizer,
                           shouldRecognizeSimultaneouslyWith second:UIGestureRecognizer) -> Bool {
    var _scrollView = first.view as? YeetScrollView

    if _scrollView == nil {
      _scrollView = second.view as? YeetScrollView
    }

    guard let gestureView = self.weakGestureView else {
      return true
    }

    return true

//    if first == activationGestureHandler {
//      return true
//    }
//
//    guard !(gestureRecognizers.contains(first) && gestureRecognizers.contains(second)) else  {
//      return true
//    }
//
//    return !isGestureEnabled
  }

}
