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
    private weak var weakGestureView: UIView?
    private weak var weakTransformView: UIView?

    private var panGesture: UIPanGestureRecognizer?
    private var pinchGesture: UIPinchGestureRecognizer?
    private var rotationGesture: UIRotationGestureRecognizer?

    private func addGestures(v: UIView) {
      v.isUserInteractionEnabled = true
      let gestureRecognizers = v.gestureRecognizers ?? []

      if panGesture == nil || !gestureRecognizers.contains(panGesture!) {
        panGesture = UIPanGestureRecognizer(target: self, action: #selector(handleGesture(_:)))
        panGesture?.cancelsTouchesInView = false

        panGesture?.minimumNumberOfTouches = 1
        panGesture?.delegate = self     // for simultaneous recog
        v.addGestureRecognizer(panGesture!)
      }

      if pinchGesture == nil || !gestureRecognizers.contains(pinchGesture!) {
        pinchGesture = UIPinchGestureRecognizer(target: self, action: #selector(handleGesture(_:)))
        pinchGesture?.delegate = self   // for simultaneous recog
        pinchGesture?.cancelsTouchesInView = false
        v.addGestureRecognizer(pinchGesture!)
      }


      if rotationGesture == nil || !gestureRecognizers.contains(rotationGesture!) {
        rotationGesture = UIRotationGestureRecognizer(target: self, action: #selector(handleGesture(_:)))
        rotationGesture?.delegate = self

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

    @objc func handleGesture(_ gesture: UIGestureRecognizer) {
      guard isGestureEnabled else {
        return
      }

      guard let view = self.weakTransformView else {
        return
      }
      var isPan = gesture == panGesture
      var isPinch = gesture == pinchGesture
      var isRotate = gesture == rotationGesture


      if isPan && panGesture?.numberOfTouches ?? 0 > 1 {
        panGesture?.setTranslation(.zero, in: view)
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
    }




    //MARK:- UIGestureRecognizerDelegate Methods
  func gestureRecognizer(_ first: UIGestureRecognizer,
                           shouldRecognizeSimultaneouslyWith second:UIGestureRecognizer) -> Bool {
      return true
    }

}
