import Foundation
import AVKit
import AVFoundation
import SpriteKit
import Photos
import SDWebImage
import UIImageColors
import SwiftyBeaver
import Promise

class ContentExport {
  static func getCropScale(_ roundingRule: FloatingPointRoundingRule, _ multiple: CGFloat, _ contentsScale: CGFloat, _ cropWidth: CGFloat, _ cropHeight: CGFloat) -> CGFloat {
    let maxIterations = 100;
    var iterationCount = 0;
    var cropScale: CGFloat = contentsScale
    var cropRect = CGRect(origin: .zero, size: CGSize(width: cropWidth, height: cropHeight)).normalize(scale: cropScale)
    while !cropRect.size.width.isMultiple(multiple, roundingRule) || !cropRect.size.height.isMultiple(16, roundingRule) {
      if iterationCount > maxIterations {
        return .zero;
      }

      if (cropWidth.toClosestMultiple(multiple, roundingRule) != cropWidth) {
        cropScale = cropScale * (cropWidth.toClosestMultiple(multiple, roundingRule) / cropWidth)
      }


      if (cropHeight.toClosestMultiple(multiple, roundingRule) != cropHeight) {
        cropScale = cropScale * (cropHeight.toClosestMultiple(multiple, roundingRule) / cropHeight)
      }

      cropRect = CGRect(origin: .zero, size: CGSize(width: cropWidth, height: cropHeight)).normalize(scale: cropScale )
      iterationCount = iterationCount + 1
    }

    return cropScale
  }

  static func findCropScale(contentsScale: CGFloat, cropWidth: CGFloat, cropHeight: CGFloat) -> CGFloat? {
    var possibleScales: [CGFloat] = [
      getCropScale(.down, CGFloat(16), contentsScale, cropWidth, cropHeight),
      getCropScale(.awayFromZero, CGFloat(16), contentsScale, cropWidth, cropHeight),
      getCropScale(.toNearestOrAwayFromZero, CGFloat(16), contentsScale, cropWidth, cropHeight),
      getCropScale(.toNearestOrEven, CGFloat(16), contentsScale, cropWidth, cropHeight),
      getCropScale(.towardZero, CGFloat(16), contentsScale, cropWidth, cropHeight),
      getCropScale(.up, CGFloat(16), contentsScale, cropWidth, cropHeight)
    ].filter { (scale: CGFloat) -> Bool in
      return scale > (contentsScale / 2) && scale < (contentsScale * 2)
    }

    if possibleScales.count == .zero {
      possibleScales = [
        getCropScale(.down, CGFloat(8), contentsScale, cropWidth, cropHeight),
        getCropScale(.awayFromZero, CGFloat(8), contentsScale, cropWidth, cropHeight),
        getCropScale(.toNearestOrAwayFromZero, CGFloat(8), contentsScale, cropWidth, cropHeight),
        getCropScale(.toNearestOrEven, CGFloat(8), contentsScale, cropWidth, cropHeight),
        getCropScale(.towardZero, CGFloat(8), contentsScale, cropWidth, cropHeight),
        getCropScale(.up, CGFloat(8), contentsScale, cropWidth, cropHeight)
      ].filter { (scale: CGFloat) -> Bool in
        return scale > contentsScale / 2 && scale < contentsScale * 2
      }
    }

    if possibleScales.count == .zero {
      possibleScales = [
        getCropScale(.down, CGFloat(4), contentsScale, cropWidth, cropHeight),
        getCropScale(.awayFromZero, CGFloat(4), contentsScale, cropWidth, cropHeight),
        getCropScale(.toNearestOrAwayFromZero, CGFloat(4), contentsScale, cropWidth, cropHeight),
        getCropScale(.toNearestOrEven, CGFloat(4), contentsScale, cropWidth, cropHeight),
        getCropScale(.towardZero, CGFloat(4), contentsScale, cropWidth, cropHeight),
        getCropScale(.up, CGFloat(4), contentsScale, cropWidth, cropHeight)
      ].filter { (scale: CGFloat) -> Bool in
        return scale > contentsScale / 2 && scale < contentsScale * 2
      }
    }

    let scale = possibleScales.sorted { (a: CGFloat, b: CGFloat) -> Bool in
      return abs(a - contentsScale) < abs(b - contentsScale)
    }

    return scale.first
  }
  
  static let CONVERT_PNG_TO_WEBP = true

  #if DEBUG
    static let SHOW_BORDERS = false
  #else
    static let SHOW_BORDERS = false
  #endif

  private static func getFramesAnimation(frames: [CGImage], duration: CFTimeInterval) -> CAAnimation {
    let animation = CAKeyframeAnimation(keyPath:#keyPath(CALayer.contents))
    animation.calculationMode = CAAnimationCalculationMode.discrete
    animation.duration = duration
    animation.values =  frames
    animation.speed = 1.0
    animation.repeatCount = Float(ceil(Double(frames.count) / duration))
    animation.isRemovedOnCompletion = false
    animation.fillMode = CAMediaTimingFillMode.forwards
    animation.beginTime = AVCoreAnimationBeginTimeAtZero

    return animation
  }

  let url: URL
  let resolution: CGSize
  let type: ExportType
  let duration: TimeInterval
  let colors: UIImageColors?
  var thumbnail: ContentExportThumbnail? = nil

  init(url: URL, resolution: CGSize, type: ExportType, duration: TimeInterval, colors: UIImageColors?, thumbnail: ContentExportThumbnail? = nil) {
    self.url = url
    self.resolution = resolution
    self.type = type
    self.duration = duration
    self.colors = colors
    self.thumbnail = thumbnail
  }

  func dictionaryValue() -> [String: Any] {
    return [
      "uri": url.absoluteString as NSString,
      "width": NSNumber(value: Double(resolution.width)),
      "height": NSNumber(value: Double(resolution.height)),
      "type": NSString(string: type.rawValue),
      "duration": NSNumber(value: Double(duration)),
      "thumbnail": thumbnail?.dictionaryValue() ?? [
        "uri": url.absoluteString as NSString,
        "width": NSNumber(value: Double(resolution.width)),
        "height": NSNumber(value: Double(resolution.height)),
        "type": NSString(string: type.rawValue),
      ],
      "colors": [
        "background": colors?.background.rgbaString,
        "primary": colors?.primary.rgbaString,
        "secondary": colors?.secondary.rgbaString,
        "detail": colors?.detail.rgbaString,
        ] as [String: String?]
    ]
  }



  static func composeImageLayer(image: ExportableMediaSource, frame: CGRect, duration: TimeInterval, block: ContentBlock? = nil, scale: CGFloat, exportType: ExportType, rotation: CGFloat = .zero, estimatedBounds: CGRect, parentLayer: CALayer) -> CALayer {

    let _frame = frame


    if (image.image?.isAnimated ?? false) {
      let _image = image as! ExportableImageSource
      let layer = CALayer()
      layer.bounds = CGRect(origin: .zero, size: _frame.size)
      layer.setRotatableFrame(frame: frame, rotation: rotation)

      setupInnerLayer(layer: layer, block: block)

      layer.contents = _image.firstFrame
      var images: Array<CGImage> = []

      for frameIndex in 0..._image.animatedImageFrameCount - 1 {
        let frame = _image.animatedImageFrame(at: UInt(frameIndex))

        images.append(frame)
      }

      layer.add(getFramesAnimation(frames: images, duration: duration), forKey: nil)
      return layer
    } else {

      let layer = CALayer()


      let workBlock = {
        let view =  image.nodeView!
        let containerView = image.containerView!

        if let _ = view as? MovableView {
          // MovableView might be offset by the wrong amount!
//          let offset = _frame.normalize(scale: 1 / scale).origin
//          let transform = CGAffineTransform.init(translationX: offset.x, y: offset.y).translatedBy(x: view.transform.translation().x, y: view.transform.translation().y).scaledBy(x: view.transform.scaleX, y: view.transform.scaleY)

          let bounds = _frame


          Log.debug("""
            Frame: \(_frame)
            Bounds: \(bounds)

            Frame origins
              nodeView:  \(view.frame.origin)
              view:      \(image.view?.frame.origin)
              inputView: \(image.inputView?.frame.origin)
              container: \(image.containerView?.frame.origin)
            Origins
              nodeView:  \(view.bounds.origin)
              view:      \(image.view?.bounds.origin)
              inputView: \(image.inputView?.bounds.origin)
              container: \(image.containerView?.bounds.origin)
            Insets
              nodeView:  \(view.reactPaddingInsets)
              view:      \(image.view?.reactPaddingInsets)
              inputView: \(image.inputView?.reactPaddingInsets)
              container: \(image.containerView?.reactPaddingInsets)
            """)

          layer.bounds = CGRect(origin: bounds.origin, size: bounds.size)
          layer.setRotatableFrame(frame: layer.bounds, rotation: rotation)
        } else {
          layer.bounds = CGRect(origin: .zero, size: _frame.size)
          layer.setRotatableFrame(frame: _frame, rotation: rotation)
        }



        setupInnerLayer(layer: layer, block: block)

        layer.contentsGravity = .center

        if !image.isVideo {
          let _image = view.caSnapshot(scale: scale * CGFloat(block!.position.scale.doubleValue), isOpaque: false, layer: .default)!
          let image = _image.cgImage!

          let widthErrorMargin = (layer.bounds.width / scale - view.bounds.width).rounded(.toNearestOrEven)
          let heightErrorMargin = (layer.bounds.height / scale - view.bounds.height).rounded(.toNearestOrEven)

          if abs(widthErrorMargin) > 1 {
            layer.position.x = layer.position.x + widthErrorMargin * scale * -0.5
          }

          if abs(heightErrorMargin) > 1 {
            layer.position.y = layer.position.y + heightErrorMargin * scale * -0.5
          }


          layer.contents = image
          Log.info("""

            Bounds: \(view.bounds)
            Content Scale: \(layer.contentsScale)
            Frame: \(frame)
            Type: \(block!.format.rawValue)
            ID: \(block!.id)
            Image: \(image.width)x\(image.height)
          """)
        }



        layer.isOpaque = false
        layer.masksToBounds = false

        layer.contentsScale = CGFloat(1)


        layer.backgroundColor = UIColor.clear.cgColor
      }

      if Thread.isMainThread {
        workBlock()
      } else {
        let group = DispatchGroup()
        group.enter()
        DispatchQueue.main.async {
          workBlock()
          group.leave()
        }

        group.wait()
      }


      return layer
    }


  }

  static func composeAnimationLayer(parentLayer: CALayer, estimatedBounds: CGRect, duration: TimeInterval, resources: Array<ExportableBlock>, contentsScale: CGFloat, exportType: ExportType) -> (CGRect) {
    var maxY = CGFloat(0)
    var minY = estimatedBounds.size.height
    resources.forEach { resource in
      guard let block = resource.block else {
        return
      }

      let image = block.value.image
      
      let frame = (block.nodeFrame ?? block.frame).normalize(scale: contentsScale)

      if (frame.origin.y + frame.size.height > maxY) {
       maxY = frame.origin.y + frame.size.height
      }

      if (max(frame.origin.y, 0) < minY) {
       minY = max(frame.origin.y, 0)
      }

      let rotation = CGFloat(block.position.rotate.doubleValue)
      let layer = composeImageLayer(image: image, frame: frame, duration: duration, block: block, scale: contentsScale, exportType: exportType, rotation: rotation, estimatedBounds: estimatedBounds, parentLayer: parentLayer)


      parentLayer.addSublayer(layer)


    }

    return CGRect(x: estimatedBounds.origin.x, y: minY, width: estimatedBounds.size.width, height: maxY)
  }

  static var blankTrack: AVAssetTrack = AVURLAsset(url: Bundle.main.url(forResource: "blank_1080p", withExtension: ".mp4")!).tracks(withMediaType: AVMediaType.video)[0]



  static func setupInnerLayer(layer: CALayer, block: ContentBlock? = nil) {
    layer.masksToBounds = false
    layer.allowsEdgeAntialiasing = true
    layer.contentsScale = CGFloat(1)
    layer.isOpaque = false
    layer.backgroundColor = UIColor.clear.cgColor
    layer.contentsGravity = .resizeAspectFill

    layer.isGeometryFlipped = true
    layer.edgeAntialiasingMask = CAEdgeAntialiasingMask(rawValue: 15) // all sides


    if let block = block {
      layer.cornerRadius = CGFloat(block.dimensions.cornerRadius.doubleValue * block.position.scale.doubleValue)
      layer.setAffineTransform(layer.affineTransform().concatenating(CGAffineTransform.init(rotationAngle: CGFloat(block.position.rotate.doubleValue))))
    }
  }

  // The gist of how this works is as follows.
  // 1. How big is it?
  //    - AVFoundation accepts an array of layers to display the video into. This means that
  //    we can't just set the size & aspect ratio of the video like we would with an AVPlayerLayer.
  //    - Instead, we merge all the videos together in a straight line (at 0,0) going downward
  //    - When a user puts multiple videos into their video, then it plays the entire video in each of those boxes.
  //    - To do that...we need to figure out what the actual size is.
  //    - We figure out the size by seeing the height and width of each frame
  // 2. Lay out the videos & images
  //    - Every video & every image is rendered via a single CALayer object. Animations too.
  //    - Images are normal CALayer objects with frame and bounds and such. They're not interesting.
  //    - The videos contents (eventually) becomes the entire video that's rendered.
  //    - That means we need to crop it to only display the actual video we want.
  //    - so we set contentsRect to do that.
  //    - and we scale the video from it's natural size to whatever frame.size says it should be
  // 3. AVAssetExportSession does it's magic.
  // 4. We take the video output...and crop it.
  static func export(url: URL, type: ExportType, estimatedBounds: CGRect, duration: TimeInterval, resources: Array<ExportableBlock>, isDigitalOnly: Bool, scale: CGFloat? = nil) -> Promise<ContentExport> {
    return Promise<ContentExport>(queue: VideoProducer.contentExportQueue) { resolve, reject in

      var contentsScale = min(scale ?? UIScreen.main.scale, CGFloat(2))
      var maxRenderBounds = estimatedBounds.normalize(scale: contentsScale)
      var renderSize = CGSize(width: maxRenderBounds.width, height: .zero)


      do {
        var yOffset = CGFloat.zero
        var xOffset = CGFloat.zero
        var cropWidth = renderSize.width
        var cropHeight = renderSize.height
        var maxDuration = duration

        for resource in resources {
          if let block = resource.block {
            let renderedFrame = block.maxRenderedFrame(scale: contentsScale, maxY: maxRenderBounds.height)
            
             let _cropWidth = min(
               max(renderedFrame.origin.x + renderedFrame.size.width, cropWidth),
               maxRenderBounds.width
             )

             let _cropHeight = min(
               max(abs(renderedFrame.origin.y) + renderedFrame.size.height, cropHeight),
               maxRenderBounds.height
             )

            if _cropWidth > cropWidth {
              cropWidth = _cropWidth
            }

            if _cropHeight > cropHeight {
              cropHeight = _cropHeight
            }
          }
        }

        if let scale = findCropScale(contentsScale: contentsScale, cropWidth: cropWidth, cropHeight: cropHeight) {
          contentsScale = scale
        }
      }

      maxRenderBounds = estimatedBounds.normalize(scale: contentsScale)
      renderSize = CGSize(width: maxRenderBounds.width, height: .zero)

      var videoCount = 0
       var yOffset = CGFloat.zero
       var xOffset = CGFloat.zero
       var cropWidth = renderSize.width
       var cropHeight = renderSize.height
       var maxDuration = duration

      var videoYPositions: Dictionary<String, CGFloat> = [:]
      var lastVideoYPosition = CGFloat.zero

      let group = DispatchGroup()
      group.enter()

      DispatchQueue.main.async {
        var zIndex = CGFloat.zero
        for resource in resources {
          if let block = resource.block {
            let frame = block.renderSizeFrame(scale: contentsScale)

            let minY = max(min(frame.origin.y, yOffset), 0)
            let minX = max(min(frame.origin.x, xOffset), 0)

            if minY < yOffset {
              yOffset = minY
            }

            if minX < xOffset {
              xOffset = minX
            }

            let renderedFrame = block.maxRenderedFrame(scale: contentsScale, maxY: maxRenderBounds.height)

            let _cropWidth = min(
              max(renderedFrame.origin.x + renderedFrame.size.width, cropWidth),
              maxRenderBounds.width
            )

            maxDuration = max(maxDuration, block.totalDuration)

            let _cropHeight = min(
              max(abs(renderedFrame.origin.y) + renderedFrame.size.height, cropHeight),
              maxRenderBounds.height
            )

            if _cropWidth > cropWidth {
              cropWidth = _cropWidth
            }

            if _cropHeight > cropHeight {
              cropHeight = _cropHeight
            }

            let maxX = frame.width

            if block.value.image.isVideo {
             videoYPositions[block.id] = lastVideoYPosition
            }

             // In the rendered frame, we stack the videos vertically
             // This means that the width only needs to be set to whatever is the biggest width
             // but the height needs to be the total height
             renderSize.height = frame.height + renderSize.height

            if block.value.image.isVideo {
             lastVideoYPosition = renderSize.height
            }

             if maxX > renderSize.width {
               renderSize.width = maxX
             }

            if block.value.image.isVideo {
              videoCount = videoCount + 1
            }
          }
        }
        group.leave()
      }

      group.wait()

      if renderSize.width == .zero {
        renderSize.width = cropWidth
      }

      if renderSize.height == .zero {
        renderSize.height = cropHeight
      }


      var minRenderWidth = abs(xOffset) + cropWidth

      var minRenderHeight = abs(yOffset) + cropHeight

      if minRenderWidth > renderSize.width {
        renderSize.width = minRenderWidth
      }


      if minRenderHeight > renderSize.height {
        renderSize.height = minRenderHeight
      }

      var blankTrackSize = CGSize.zero
      if minRenderHeight > renderSize.height {
        blankTrackSize.height = minRenderHeight - renderSize.height
        blankTrackSize.width = renderSize.width
        renderSize.height = minRenderHeight
      }

      renderSize.height = renderSize.height.rounded(.toNearestOrEven)



      let videoContainerRect = CGRect(origin: .zero, size: renderSize)

      let parentLayer = CALayer()
      let centerPoint = CGPoint(x: .zero, y: yOffset * CGFloat(-1))

      var cropRect = CGRect(
        origin: centerPoint,
        size: CGSize(width: min(cropWidth, renderSize.width), height: min(cropHeight, renderSize.height))
      )

      parentLayer.bounds = videoContainerRect
      parentLayer.frame = CGRect(origin: CGPoint.zero, size: videoContainerRect.size)

      parentLayer.contentsScale = CGFloat(1)
      parentLayer.contentsGravity = .topLeft
      parentLayer.isGeometryFlipped = true
      parentLayer.masksToBounds = false
      parentLayer.isOpaque = false


      if (type.isVideo) {
        let startPrepTime = CACurrentMediaTime()

        let seconds = [maxDuration, duration, 3.0].max()!
        let vid_timerange = CMTimeRangeMake(start: CMTime.zero, duration: CMTime(seconds: seconds))
        let composition = AVMutableComposition()



        let layercomposition = AVMutableVideoComposition()
        layercomposition.frameDuration = CMTime(value: 1, timescale: 30)

        var videoLayers: Array<CALayer> = []
        let instruction = AVMutableVideoCompositionInstruction()
        instruction.timeRange = vid_timerange
        instruction.backgroundColor = UIColor.clear.cgColor


        if blankTrackSize != .zero {
          guard let track = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
            reject(ContentExportError(.insertVideoTrackFailed))
            return
          }

          let yOffset = renderSize.height - blankTrackSize.height

          let layerTransform = CGAffineTransform.init(translationX: .zero, y: yOffset).scaledBy(x: blankTrackSize.width / track.naturalSize.width, y: blankTrackSize.height / track.naturalSize.height)

          let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: track)
           layerInstruction.setTransform(layerTransform, at: .zero)
           instruction.layerInstructions.append(layerInstruction)
          track.preferredTransform = ContentExport.blankTrack.preferredTransform
           track.naturalTimeScale = ContentExport.blankTrack.naturalTimeScale

        }


        if videoCount == 0 {
         let videoLayer = CALayer()
         videoLayer.bounds = maxRenderBounds
         videoLayer.frame = maxRenderBounds

         parentLayer.addSublayer(videoLayer)
         videoLayers.append(videoLayer)
       }


        resources.forEach { resource in
          guard let block = resource.block else {
            return
          }

          let isVideo = block.value.image.isVideo
          let isImage = block.value.image.isImage

          if (isVideo) {
            guard let video = block.value.image.video  else {
              return
            }



            group.enter()

            DispatchQueue.main.async {
              let _asset = video.asset
               guard _asset.isPlayable else {
                 reject(ContentExportError(.assetUnplayable))
                 return
               }

               let vidAsset = _asset.tracks(withMediaType: .video).first!

               guard vidAsset.isPlayable else {
                 reject(ContentExportError(.videoTrackUnplayable))
                 return
               }

               let assetDuration = CMTimeGetSeconds(vidAsset.timeRange.duration)
               let loopCount = ( seconds / assetDuration).rounded(.up)

               if let audioAsset = _asset.tracks(withMediaType: .audio).first {
                 if audioAsset.isPlayable {
                   let loopCount = (seconds / audioAsset.timeRange.duration.seconds).rounded(.up)

                   guard let track = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
                     reject(ContentExportError(.insertVideoTrackFailed))
                     return
                   }
                   for _ in 0...Int(loopCount) {
                     do {
                       try track.insertTimeRange(CMTimeRangeMake(start: audioAsset.timeRange.start, duration: audioAsset.timeRange.duration), of: audioAsset, at: .zero)
                     } catch(let error) {
                       reject(error)
                       return
                     }
                   }
                 }
               }

               guard let track = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
                 reject(ContentExportError(.insertVideoTrackFailed))
                 return
               }
               for _ in 0...Int(loopCount) {
                 do {
                   try track.insertTimeRange(CMTimeRangeMake(start: .zero, duration: vidAsset.timeRange.duration), of: vidAsset, at: .zero)
                 } catch(let error) {
                   reject(error)
                   return
                 }
               }
              let frame = (block.nodeFrame ?? block.frame).normalize(scale: contentsScale)

              let nodeView = video.nodeView!
              let playerFrame = video.videoView!.playerLayer.videoRect
              let nodeScale = nodeView.transform.scaleX

              let ___rect = AVMakeRect(aspectRatio: _asset.resolution, insideRect: CGRect(origin: .zero, size: frame.size))

              let scaleX = (___rect.width / _asset.resolution.width)
              let scaleY = (___rect.height / _asset.resolution.height)

              let _videoTransform = CGAffineTransform
                .identity
                .scaledBy(x: scaleX, y: scaleY)

              let videoTransform = _videoTransform
              let videoTranslateTransform = CGAffineTransform.init(translationX: .zero, y: videoYPositions[block.id]!)
              let layerTransform = CGAffineTransform.identity.concatenating(vidAsset.preferredTransform).concatenating(videoTransform).concatenating(videoTranslateTransform)

              let videoRect = CGRect(origin: .zero, size: vidAsset.naturalSize).applying(layerTransform)


              let interRect = videoContainerRect.intersection(videoRect)

              let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: track)
              layerInstruction.setTransform(layerTransform, at: .zero)
              instruction.layerInstructions.append(layerInstruction)
            track.preferredTransform = vidAsset.preferredTransform
              track.naturalTimeScale = vidAsset.naturalTimeScale


              if (CMTimeGetSeconds(layercomposition.frameDuration) > CMTimeGetSeconds(vidAsset.minFrameDuration)) {
                layercomposition.frameDuration = vidAsset.minFrameDuration
              }

              let videoLayer = ContentExport.composeImageLayer(image: video, frame: CGRect(origin: .zero, size: ___rect.size), duration: 0, scale: CGFloat(block.position.scale.doubleValue), exportType: type, estimatedBounds: estimatedBounds, parentLayer: parentLayer)

              let _layer = CALayer()
              _layer.bounds = ___rect
              _layer.frame = frame
//              videoLayer.anchorPoint = CGPoint(x: 0.5, y: 0)
              videoLayer.bounds = ___rect
              videoLayer.position = _layer.position

              let contentsScaleRect = ___rect.applying(block.position.transform())
              let contentsScaleFrame = frame.applying(block.position.transform())

              if (___rect.x != .zero) {
                videoLayer.contentsScale = contentsScaleFrame.width > contentsScaleRect.width ? contentsScaleFrame.width / contentsScaleRect.width : contentsScaleRect.width / contentsScaleFrame.width
              } else if (___rect.y != .zero) {
                videoLayer.contentsScale = contentsScaleFrame.height > contentsScaleRect.height ? contentsScaleFrame.height / contentsScaleRect.height : contentsScaleRect.height / contentsScaleFrame.height
              }




              videoLayer.isGeometryFlipped = false
              videoLayer.setAffineTransform(block.position.transform())


              if self.SHOW_BORDERS {
                videoLayer.borderWidth = CGFloat(2)
                videoLayer.borderColor = UIColor.red.cgColor
              }


              let contentsRect = CGRect(
                origin: CGPoint(
                  x: interRect.origin.x / videoContainerRect.width,
                  y: interRect.origin.y / videoContainerRect.height
                ),
                size: CGSize(
                  width: interRect.width / videoContainerRect.width,
                  height: interRect.height / videoContainerRect.height
                )
              )

              videoLayer.contentsRect = contentsRect






              // ~1722 x ~1285
              // 862 x 644
              // 812 x 466
              // 812 x 339


              videoLayers.append(videoLayer)
              parentLayer.addSublayer(videoLayer)

              SwiftyBeaver.info("""
  Bounds diff:
  - translation \(videoTransform.translation())
  - Editor: \(frame)
  - vidRect: \(videoRect)
  - Node: \(nodeView.bounds),\(nodeView.frame)
  - Node Transform: \(nodeView.transform)
  - contentsScale: \(videoLayer.contentsScale)
  - contentsRect: \(videoLayer.contentsRect)
  - renderSize: \(renderSize)
  - cropRect: \(cropRect)
  """)
              group.leave()
            }

            group.wait()


          } else if (isImage) {
            let _ = composeAnimationLayer(parentLayer: parentLayer, estimatedBounds: parentLayer.bounds, duration: seconds, resources: [resource], contentsScale: contentsScale, exportType: type)
          }
        }

        parentLayer.backgroundColor = UIColor.clear.cgColor

        #if DEBUG
        let debugLayer = CALayer()
        debugLayer.bounds = CGRect(origin: .zero, size: CGSize(width: renderSize.width, height: 1))
        debugLayer.backgroundColor = UIColor.red.cgColor
        debugLayer.frame = CGRect(origin: CGPoint(x: .zero, y: cropRect.maxY), size: debugLayer.bounds.size)
        parentLayer.addSublayer(debugLayer)

        #endif




        layercomposition.instructions.append(instruction)
        layercomposition.renderSize = renderSize
//
        parentLayer.applyScale(x: contentsScale, y: contentsScale)

        instruction.enablePostProcessing = true
//

        if videoLayers.count > 1 {
          layercomposition.animationTool = .init(postProcessingAsVideoLayers: videoLayers, in: parentLayer)
        } else if videoLayers.count == 1 {
          layercomposition.animationTool = .init(postProcessingAsVideoLayer: videoLayers.first!, in: parentLayer)
        }

        if (layercomposition.renderSize.width == .zero || layercomposition.renderSize.height == .zero) {
          SwiftyBeaver.error("Invalid video export size \(layercomposition.renderSize)")
          reject(ContentExportError(.renderSizeIsZero))
          return
        }

        let presetName: String

        if videoCount == 1 && resources.count == 1 && resources.first?.block?.value.image.isVideo ?? false {
          presetName = AVAssetExportPresetPassthrough
        } else if AVURLAsset.hasHEVCHardwareEncoder {
          presetName = AVAssetExportPresetHEVCHighestQuality
        } else {
          presetName = AVAssetExportPresetHighestQuality
        }

        guard let assetExport = AVAssetExportSession(asset: composition, presetName: presetName) else {
          reject(ContentExportError(.failedToCreateExportSession))
          return
        }

        var metadata = assetExport.metadata ?? []

        if type == .mov {
          var cameraID = AVMutableMetadataItem()
          cameraID.identifier = .quickTimeMetadataCameraIdentifier
          cameraID.keySpace = .quickTimeMetadata
          cameraID.key = AVMetadataKey.quickTimeMetadataKeyCameraIdentifier as NSString
          cameraID.value = "Made with yeet" as NSString
          metadata.append(cameraID)
        } else if type == .mp4 {

           var cameraID = AVMutableMetadataItem()
            cameraID.identifier = .iTunesMetadataDescription
            cameraID.key = AVMetadataKey.iTunesMetadataKeyDescription as NSString
            cameraID.keySpace = AVMetadataKeySpace.iTunes
           cameraID.value = "Made with yeet" as NSString
          metadata.append(cameraID)
        }

        assetExport.metadata = metadata



        let canSkipCrop = renderSize == cropRect.size && cropRect.origin == .zero
        assetExport.outputFileType = type.avFileType
        assetExport.outputURL = canSkipCrop ? url : VideoProducer.generateExportURL(type: type)
        assetExport.timeRange = vid_timerange
        assetExport.shouldOptimizeForNetworkUse = canSkipCrop

        if layercomposition.instructions.count > 0 {
          assetExport.videoComposition = layercomposition
        }

        let timeSpentPreparing = CACurrentMediaTime() - startPrepTime
        SwiftyBeaver.info("Preparing video export with \(resources.count) completed in \(timeSpentPreparing)s")
        SwiftyBeaver.info("Starting video export...")
        let startExportTime = CACurrentMediaTime()

//        if assetExport.estimatedOutputFileLength > 50000000 {
//          assetExport.presetName = AVAssetExportPresetHighest
//        }
        

        assetExport.exportAsynchronously {
          VideoProducer.contentExportQueue.async {
            let status = assetExport.status
            switch status {
            case .completed:
                let duration = CMTimeGetSeconds(assetExport.asset.duration)
                let fullAsset = AVURLAsset(url: assetExport.outputURL!)
                SwiftyBeaver.info("""
Cropping video...
  \(renderSize) -> \(cropRect)
  \(assetExport.outputURL!.absoluteString)

""")

                if canSkipCrop {
                  let resolution = fullAsset.resolution ?? cropRect.size
                  var colors: UIImageColors? = nil
                  let thumbnail = ContentExportThumbnail(asset: fullAsset)

                  let timeSpentExporting = CACurrentMediaTime() - startExportTime
                  SwiftyBeaver.info("Video Export completed\nResolution:\(Int(resolution.width))x\(Int(resolution.height))\nDuration: \(seconds)\nPath: \(url.absoluteString)\nAVAssetExportSession took \(timeSpentExporting)s")



                  resolve(ContentExport(url: url, resolution: resolution, type: type, duration: duration, colors: colors, thumbnail: thumbnail))
                } else {
                  fullAsset.crop(to: cropRect, dest: url, exact: true, type: type, loops: true).then(on: VideoProducer.contentExportQueue) { asset in
                    let resolution = asset.resolution ?? cropRect.size
                    var colors: UIImageColors? = nil

                    let thumbnail = ContentExportThumbnail(asset: asset)

                    let timeSpentExporting = CACurrentMediaTime() - startExportTime
                    SwiftyBeaver.info("Video Export completed\nResolution:\(Int(resolution.width))x\(Int(resolution.height))\nDuration: \(seconds)\nPath: \(url.absoluteString)\nAVAssetExportSession took \(timeSpentExporting)s")

                    resolve(ContentExport(url: url, resolution: resolution, type: type, duration: duration, colors: colors, thumbnail: thumbnail))
                  }
                }



              case AVAssetExportSessionStatus.cancelled:
                SwiftyBeaver.warning("Video Export cancelled")
                reject(ContentExportError(.exportCancelled))

            default:
               SwiftyBeaver.error("Video Export incomplete. \(assetExport.error)")
               reject(assetExport.error ?? ContentExportError(.unknownError))

            }
            }



        }

      } else {
        parentLayer.isGeometryFlipped = false
        let _ = composeAnimationLayer(parentLayer: parentLayer, estimatedBounds: estimatedBounds, duration: duration, resources: resources, contentsScale: contentsScale, exportType: type)

         let fullImage = UIImage.image(from: parentLayer)!.sd_croppedImage(with: cropRect)!


        let thumbnailSize = ContentExportThumbnail.size
        let thumbnailImage = fullImage.sd_resizedImage(with: thumbnailSize, scaleMode: .aspectFill)

        let imageData: NSData
        let thumbnailData: NSData
        let thumbnailType: ExportType


        let compressionQuality = isDigitalOnly ? CGFloat(1) : CGFloat(0.99)
        if (type == ExportType.png) {
          imageData = fullImage.pngData()! as NSData
          thumbnailData = thumbnailImage!.pngData()! as NSData
          thumbnailType = .png
        } else if (type == ExportType.webp) {
          imageData = SDImageWebPCoder.shared.encodedData(with: fullImage, format: .webP, options: [SDImageCoderOption.encodeCompressionQuality:compressionQuality, SDImageCoderOption.encodeFirstFrameOnly: 0])! as NSData

          thumbnailData = thumbnailImage!.pngData()! as NSData
          thumbnailType = .png
        } else {
          imageData = fullImage.jpegData(compressionQuality: compressionQuality)! as NSData
          thumbnailData = thumbnailImage!.jpegData(compressionQuality: compressionQuality)! as NSData
          thumbnailType = .jpg
        }

        let thumbnailUrl = VideoProducer.generateExportURL(type: thumbnailType)

        imageData.write(to: url, atomically: true)
        thumbnailData.write(to: thumbnailUrl, atomically: true)
        let resolution = fullImage.size

        SwiftyBeaver.info("""
          Saved image.
            To:    \(url)
            Size:  \(resolution.width)x\(resolution.height)
            Scale: \(contentsScale)
        """)


        let thumbnail = ContentExportThumbnail(uri: thumbnailUrl.absoluteString, width: Double(thumbnailSize.width), height: Double(thumbnailSize.height), type: thumbnailType)

        resolve(ContentExport(url: url, resolution: resolution, type: type, duration: duration, colors: nil, thumbnail: thumbnail))

//        resolve(ContentExport(url: url, resolution: resolution, type: type, duration: duration, colors: fullImage.getColors()))
      }
    }
  }

}

private extension UIImage {
  class func image(from layer: CALayer) -> UIImage? {
    UIGraphicsBeginImageContextWithOptions(layer.bounds.size,
                                           layer.isOpaque, UIScreen.main.scale)

    defer { UIGraphicsEndImageContext() }

    // Don't proceed unless we have context
    guard let context = UIGraphicsGetCurrentContext() else {
      return nil
    }

    layer.render(in: context)
    return UIGraphicsGetImageFromCurrentImageContext()
  }
}

extension UIColor {
  var rgbComponents:(red: CGFloat, green: CGFloat, blue: CGFloat, alpha: CGFloat) {
    var r:CGFloat = 0
    var g:CGFloat = 0
    var b:CGFloat = 0
    var a:CGFloat = 0
    if getRed(&r, green: &g, blue: &b, alpha: &a) {
      return (r,g,b,a)
    }
    return (0,0,0,0)
  }
  // hue, saturation, brightness and alpha components from UIColor**
  var hsbComponents:(hue: CGFloat, saturation: CGFloat, brightness: CGFloat, alpha: CGFloat) {
    var hue:CGFloat = 0
    var saturation:CGFloat = 0
    var brightness:CGFloat = 0
    var alpha:CGFloat = 0
    if getHue(&hue, saturation: &saturation, brightness: &brightness, alpha: &alpha){
      return (hue,saturation,brightness,alpha)
    }
    return (0,0,0,0)
  }
  var rgbString:String {
    return String(format: "rgb(%d,%d,%d)", Int(rgbComponents.red * 255), Int(rgbComponents.green * 255),Int(rgbComponents.blue * 255))
  }
  var rgbaString:String {
    return String(format: "rgba(%d,%d,%d,%f)", Int(rgbComponents.red * 255), Int(rgbComponents.green * 255),Int(rgbComponents.blue * 255),rgbComponents.alpha )
  }
}



extension CALayer {
  func applyTransform(withScale scale: CGFloat, paddingScale: CGFloat, anchorPoint: CGPoint) {
      let xPadding = (paddingScale - 1) * (anchorPoint.x - 0.5) * bounds.width
      let yPadding = (paddingScale - 1) * (anchorPoint.y - 0.5) * bounds.height
      setAffineTransform(CGAffineTransform(scaleX: scale, y: scale).translatedBy(x: xPadding, y: yPadding))
  }

  func applyScale(x: CGFloat, y: CGFloat) {
//    self.applyTransform(withScale: x, paddingSc ale: 1 / x, anchorPoint: CGPoint(x: 0, y: 0.5))
  }
}



extension UIColor {
    convenience init(rgb:UInt, alpha:CGFloat = 1.0) {
        self.init(
            red: CGFloat((rgb & 0xFF0000) >> 16) / 255.0,
            green: CGFloat((rgb & 0x00FF00) >> 8) / 255.0,
            blue: CGFloat(rgb & 0x0000FF) / 255.0,
            alpha: CGFloat(alpha)
        )
    }
}


extension CALayer {
  func setRotatableFrame(frame: CGRect, rotation: CGFloat) {
    if (rotation == .zero || Int(abs(rotation.radiansToDegrees).rounded()) % 90 == 0) {
      self.frame = frame
    } else {
      let _layer = CALayer()
      _layer.bounds = frame
      _layer.frame = frame
      self.position = _layer.position
    }
  }

  func mask(to: CGRect, inverse: Bool = false) {
      let path = UIBezierPath(rect: to)
      let maskLayer = CAShapeLayer()

      if inverse {
        path.append(UIBezierPath(rect: self.bounds))
        maskLayer.fillRule = .nonZero
      } else {
        maskLayer.fillRule = .evenOdd
    }

      maskLayer.path = path.cgPath

      self.mask = maskLayer
  }
}


extension AVAsset {
  var resolution : CGSize {
    guard let videoTrack = self.tracks(withMediaType: .video).first else {
      return .zero
    }

    return CGRect(origin: .zero, size: videoTrack.naturalSize.applying(videoTrack.preferredTransform)).standardized.size
  }
}

extension AVLayerVideoGravity {
  var contentsGravity: CALayerContentsGravity {
//    return .center
    switch self {
      case .resize: return .resize
      case .resizeAspect: return .resizeAspect
      case .resizeAspectFill: return  .resizeAspectFill
    default:
      return .resizeAspect
    }
  }
}

