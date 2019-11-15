import Foundation
import AVKit
import AVFoundation
import SpriteKit
import Photos
import SDWebImage
import UIImageColors
import SwiftyBeaver
import Promise
import NextLevelSessionExporter


typealias ExportableSlice = (Array<AVAssetTrack>, Array<ExportableBlock>)

class ContentExportError : NSError {
  enum ErrorCode : Int {
    case exportCancelled = -1
    case insertVideoTrackFailed = -2
    case resourceMissingBlock = -3
    case assetUnplayable = -4
    case videoTrackUnplayable = -5
    case renderSizeIsZero = -6
    case failedToCreateExportSession = -7
    case videoMissingFromResource = -8
    case unknownError = 0

  }

  static let ERROR_MESAGES: [ErrorCode : String] = [
    ErrorCode.unknownError: "Something went wrong. Please try again.",
    ErrorCode.videoMissingFromResource: "Something went wrong. Please try again.",
    ErrorCode.insertVideoTrackFailed: "Something went wrong. Please try again.",
    ErrorCode.resourceMissingBlock: "Something went wrong. Please try again.",
    ErrorCode.assetUnplayable: "One of the videos might be broken. Please try again.",
    ErrorCode.videoTrackUnplayable: "One of the videos might be broken. Please try again.",
    ErrorCode.renderSizeIsZero: "Can't save an empty screen.",
    ErrorCode.failedToCreateExportSession: "Can't export an empty screen.",
  ]

  let errorCode: ErrorCode


  required init?(coder: NSCoder) {
    fatalError()
  }

  override var localizedDescription: String {
    return ContentExportError.ERROR_MESAGES[self.errorCode] ?? "Something went wrong. Please try again."
  }

  init(_ errorCode: ErrorCode, userInfo: [String: Any]? = nil) {
    self.errorCode = errorCode

    super.init(domain: "com.codeblogcorp.ContentExportError", code: errorCode.rawValue,  userInfo: userInfo)
  }
}

class ContentExport {

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

  init(url: URL, resolution: CGSize, type: ExportType, duration: TimeInterval, colors: UIImageColors?) {
    self.url = url
    self.resolution = resolution
    self.type = type
    self.duration = duration
    self.colors = colors
  }

  func dictionaryValue() -> [String: Any] {
    return [
      "uri": url.absoluteString as NSString,
      "width": NSNumber(value: Double(resolution.width)),
      "height": NSNumber(value: Double(resolution.height)),
      "type": NSString(string: type.rawValue),
      "duration": NSNumber(value: Double(duration)),
      "colors": [
        "background": colors?.background.rgbaString,
        "primary": colors?.primary.rgbaString,
        "secondary": colors?.secondary.rgbaString,
        "detail": colors?.detail.rgbaString,
        ] as [String: String?]
    ]
  }

  static func composeImageLayer(image: ExportableImageSource, frame: CGRect, duration: TimeInterval, block: ContentBlock? = nil, scale: CGFloat) -> CALayer {
    let layer = CALayer()
    layer.bounds = frame
    layer.frame = frame

    setupInnerLayer(layer: layer, block: block)

    layer.contentsScale = scale

    if (image.isAnimated) {
      layer.contents = image.firstFrame
      var images: Array<CGImage> = []

      for frameIndex in 0...image.animatedImageFrameCount - 1 {
        let frame = image.animatedImageFrame(at: UInt(frameIndex))

        images.append(frame)
      }

      layer.add(getFramesAnimation(frames: images, duration: duration), forKey: nil)
    } else if (image.mediaSource.mimeType == .png) {
      layer.contents = image.staticImage!.cgImage!
//      if (ContentExport.CONVERT_PNG_TO_WEBP) {
//        let newImage = SDImageWebPCoder.shared.decodedImage(with: SDImageWebPCoder.shared.encodedData(with: image.staticImage!, format: .webP, options: [SDImageCoderOption.encodeCompressionQuality: CGFloat(1), SDImageCoderOption.encodeFirstFrameOnly: 1]), options: nil)!
//        layer.contents = newImage.cgImage!
//      } else {
//        layer.contents = UIImage.init(data: image.staticImage!.jpegData(compressionQuality: CGFloat(1.0))!)?.cgImage!
//      }
    } else {
      layer.contents = image.firstFrame.cgImage!
    }

    return layer
  }

  static func composeAnimationLayer(parentLayer: CALayer, estimatedBounds: CGRect, duration: TimeInterval, resources: Array<ExportableBlock>, contentsScale: CGFloat) -> (CGRect) {
    var maxY = CGFloat(0)
    var minY = estimatedBounds.size.height
    resources.forEach { resource in
      guard let block = resource.block else {
        return
      }

      guard let image = block.value.image.image else {
        return
      }

      let frame = (block.nodeFrame ?? block.frame).normalize(scale: contentsScale)

      if (frame.origin.y + frame.size.height > maxY) {
       maxY = frame.origin.y + frame.size.height
      }

      if (frame.origin.y < minY) {
       minY = frame.origin.y
      }

      let layer = composeImageLayer(image: image, frame: frame, duration: duration, block: block, scale: contentsScale)


      parentLayer.addSublayer(layer)
    }

    return CGRect(x: estimatedBounds.origin.x, y: minY, width: estimatedBounds.size.width, height: maxY)
  }

  static var blankTrack: AVAssetTrack {
    let vidAsset = AVURLAsset(url: Bundle.main.url(forResource: "blank_1080p", withExtension: ".mp4")!)

    return vidAsset.tracks(withMediaType: AVMediaType.video)[0]
  }


  static func setupInnerLayer(layer: CALayer, block: ContentBlock? = nil) {
    layer.masksToBounds = true
    layer.allowsEdgeAntialiasing = true
    layer.contentsScale = CGFloat(1)
    layer.isOpaque = false
    layer.backgroundColor = UIColor.clear.cgColor
    layer.contentsGravity = .resizeAspectFill

    layer.isGeometryFlipped = true
    layer.edgeAntialiasingMask = CAEdgeAntialiasingMask(rawValue: 15) // all sides


    if let block = block {
      layer.cornerRadius = CGFloat(block.dimensions.cornerRadius.doubleValue * block.position.scale.doubleValue)
      layer.setAffineTransform(CGAffineTransform.init(rotationAngle: CGFloat(block.position.rotate.doubleValue)))
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
      let contentsScale = (scale != nil ? scale! : UIScreen.main.scale)
      let VIDEO_MARGIN = contentsScale

      var renderSize = CGSize.zero
      var videoCount = 0
      var yOffset = CGFloat.zero
      var xOffset = CGFloat.zero
      var cropWidth = CGFloat.zero
      var cropHeight = CGFloat.zero
      var maxDuration = duration

      let maxRenderBounds = estimatedBounds.normalize(scale: contentsScale)


      var videoYPositions: Dictionary<String, CGFloat> = [:]
      var lastVideoYPosition = CGFloat.zero
      for resource in resources {
        if let block = resource.block {
          let frame = block.maxRenderedFrame(scale: contentsScale)

          let minY = min(frame.origin.y, yOffset)
          let minX = min(frame.origin.x, xOffset)



          if minY < yOffset {
            yOffset = minY
          }

          if minX < xOffset {
            xOffset = minX
          }

          let renderedFrame = block.maxRenderedFrame(scale: contentsScale)

          let _cropWidth = min(
            max(renderedFrame.origin.x + renderedFrame.width, cropWidth),
            maxRenderBounds.width
          )

          maxDuration = max(maxDuration, block.totalDuration)

          let _cropHeight = min(
            max(renderedFrame.origin.y + renderedFrame.height, cropHeight),
            maxRenderBounds.height
          )

          if _cropWidth > cropWidth {
            cropWidth = _cropWidth
          }

          if _cropHeight > cropHeight {
            cropHeight = _cropHeight
          }

          if block.value.image.isVideo {
            videoCount = videoCount + 1

            let maxX = frame.width

            videoYPositions[block.id] = lastVideoYPosition

            // In the rendered frame, we stack the videos vertically
            // This means that the width only needs to be set to whatever is the biggest width
            // but the height needs to be the total height
            renderSize.height = frame.height + renderSize.height

            lastVideoYPosition = renderSize.height

            if maxX > renderSize.width {
              renderSize.width = maxX
            }
          }
        }
      }

      if renderSize.width == .zero {
        renderSize.width = cropWidth
      }

      if renderSize.height == .zero {
        renderSize.height = cropHeight
      }
      

      let minRenderWidth = abs(xOffset) + cropWidth
      let minRenderHeight = abs(yOffset) + cropHeight

      var renderSizeScale = CGFloat(1)
      if minRenderWidth > renderSize.width || minRenderHeight > renderSize.height {
        renderSizeScale = max(
          minRenderWidth / renderSize.width,
          minRenderHeight / renderSize.height
        )

        let size = CGSize(
          width: renderSize.width * renderSizeScale,
          height: renderSize.height * renderSizeScale
        )

        videoYPositions.forEach { key, value in
          videoYPositions[key] = value * renderSizeScale
        }

        renderSize = size
      }


      let videoContainerRect = CGRect(origin: .zero, size: renderSize)

      let parentLayer = CALayer()
      let centerPoint = CGPoint(x: .zero, y: yOffset * CGFloat(-1))

      let cropRect = CGRect(
        origin: centerPoint,
        size: CGSize(width: min(cropWidth, renderSize.width), height: min(cropHeight, renderSize.height))
      )

      parentLayer.bounds = videoContainerRect
      parentLayer.frame = CGRect(origin: CGPoint.zero, size: videoContainerRect.size)

      parentLayer.contentsScale = contentsScale
      parentLayer.contentsGravity = .topLeft
      parentLayer.isGeometryFlipped = true
      parentLayer.masksToBounds = false
      parentLayer.isOpaque = true


      if (type == ExportType.mp4) {
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
            let frame = block.scaledFrame(scale: contentsScale)
            let loopCount = ( seconds / assetDuration).rounded(.up)
            let nodeView = video.nodeView


            let scaleX = (frame.width / vidAsset.naturalSize.width) * renderSizeScale
            let scaleY = (frame.height / vidAsset.naturalSize.height) * renderSizeScale

            let rotationTransform = CGAffineTransform.init(rotationAngle: CGFloat(block.position.rotate.doubleValue))

            var _videoTransform = CGAffineTransform.identity

            if (CGFloat(block.position.rotate.doubleValue) != CGFloat.zero) {
              _videoTransform =  CGAffineTransform
                .identity
                .rotated(by: CGFloat(block.position.rotate.doubleValue * -1) )
                .scaledBy(x: scaleX, y: scaleY)
                .rotated(by: CGFloat(block.position.rotate.doubleValue) )
            } else {
              _videoTransform =  CGAffineTransform
                .identity
                .scaledBy(x: scaleX, y: scaleY)
            }


            let videoTransform = _videoTransform
            let videoTranslateTransform = CGAffineTransform.init(translationX: .zero, y: videoYPositions[block.id]!)
            let layerTransform = CGAffineTransform.identity.concatenating(videoTransform).concatenating(videoTranslateTransform).concatenating(vidAsset.preferredTransform)

            let videoRect = CGRect(origin: .zero, size: vidAsset.naturalSize).applying(layerTransform)


           let view = video.view

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

              let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: track)
              layerInstruction.setTransform(layerTransform, at: .zero)
              instruction.layerInstructions.append(layerInstruction)
              track.preferredTransform = vidAsset.preferredTransform
              track.naturalTimeScale = vidAsset.naturalTimeScale

              if (CMTimeGetSeconds(layercomposition.frameDuration) > CMTimeGetSeconds(vidAsset.minFrameDuration)) {
                layercomposition.frameDuration = vidAsset.minFrameDuration
              }


            let videoLayer = CALayer()
            
            setupInnerLayer(layer: videoLayer, block: block)

            videoLayer.isGeometryFlipped = false
            videoLayer.backgroundColor = UIColor.clear.cgColor
            videoLayer.contentsGravity = .center
            videoLayer.masksToBounds = true
            

            if self.SHOW_BORDERS {
              videoLayer.borderWidth = CGFloat(2)
              videoLayer.borderColor = UIColor.red.cgColor
            }

            let interRect = videoContainerRect.intersection(videoRect)

            videoLayer.backgroundColor = UIColor.clear.cgColor
            videoLayer.frame = CGRect(origin: frame.origin, size: frame.size)
            videoLayer.bounds = CGRect(origin: .zero, size: videoLayer.frame.size)

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
            videoLayer.contentsScale = renderSizeScale * (videoContainerRect.height / interRect.height)

            
            videoLayers.append(videoLayer)
            parentLayer.addSublayer(videoLayer)

            SwiftyBeaver.info("""
Bounds diff:
- translation \(videoTransform.translation())
- Editor: \(frame)
- View: \(view?.bounds),\(view?.frame)
- vidRect: \(videoRect)
- Node: \(nodeView?.bounds),\(nodeView?.frame)
- Node Transform: \(nodeView?.transform)
- contentsScale: \(videoLayer.contentsScale)
""")
          } else if (isImage) {
            let _ = composeAnimationLayer(parentLayer: parentLayer, estimatedBounds: parentLayer.bounds, duration: seconds, resources: resources, contentsScale: contentsScale)
          }
        }

        parentLayer.backgroundColor = UIColor.clear.cgColor





        layercomposition.instructions.append(instruction)
        layercomposition.renderSize = renderSize

//        parentLayer.applyScale(x: contentsScale, y: contentsScale )


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

        guard let assetExport = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else {
          reject(ContentExportError(.failedToCreateExportSession))
          return
        }

        assetExport.outputFileType = AVFileType.mp4
        assetExport.outputURL = VideoProducer.generateExportURL(type: type)
        assetExport.timeRange = vid_timerange

        if layercomposition.instructions.count > 0 {
          assetExport.videoComposition = layercomposition
        }

        let timeSpentPreparing = CACurrentMediaTime() - startPrepTime
        SwiftyBeaver.info("Preparing video export with \(resources.count) completed in \(timeSpentPreparing)s")
        SwiftyBeaver.info("Starting video export...")
        let startExportTime = CACurrentMediaTime()
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

                fullAsset.crop(to: cropRect, dest: url).then(on: VideoProducer.contentExportQueue) { asset in
                  var resolution = cropRect.size
                  var colors: UIImageColors? = nil

//                  do {
//                    let imageGenerator = AVAssetImageGenerator(asset: asset)
//                    imageGenerator.appliesPreferredTrackTransform = true
//                    let thumbnail = try UIImage(cgImage: imageGenerator.copyCGImage(at: CMTime(seconds: 0, preferredTimescale: 1), actualTime: nil))
//
//                    resolution = thumbnail.size
//                    colors = thumbnail.getColors()
//                  } catch {
//
//                  }

                  let timeSpentExporting = CACurrentMediaTime() - startExportTime
                  SwiftyBeaver.info("Video Export completed\nResolution:\(Int(resolution.width))x\(Int(resolution.height))\nDuration: \(seconds)\nPath: \(url.absoluteString)\nAVAssetExportSession took \(timeSpentExporting)s")

                  resolve(ContentExport(url: url, resolution: resolution, type: type, duration: duration, colors: colors))
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
        let _ = composeAnimationLayer(parentLayer: parentLayer, estimatedBounds: estimatedBounds, duration: duration, resources: resources, contentsScale: contentsScale)

         let fullImage = UIImage.image(from: parentLayer)!.sd_croppedImage(with: cropRect)!
        let imageData: NSData
        let compressionQuality = isDigitalOnly ? CGFloat(1) : CGFloat(0.99)
        if (type == ExportType.png) {
          imageData = fullImage.pngData()! as NSData
        } else if (type == ExportType.webp) {
          imageData = SDImageWebPCoder.shared.encodedData(with: fullImage, format: .webP, options: [SDImageCoderOption.encodeCompressionQuality:compressionQuality, SDImageCoderOption.encodeFirstFrameOnly: 0])! as NSData
        } else {
          imageData = fullImage.jpegData(compressionQuality: compressionQuality)! as NSData
        }

        imageData.write(to: url, atomically: true)
        let resolution = fullImage.size

        resolve(ContentExport(url: url, resolution: resolution, type: type, duration: duration, colors: nil))

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


extension CGAffineTransform {
    init(from: CGRect, toRect to: CGRect) {
        self.init(translationX: to.midX-from.midX, y: to.midY-from.midY)
        self = self.scaledBy(x: to.width/from.width, y: to.height/from.height)
    }
}


extension CALayer {
  func applyScale(x: CGFloat, y: CGFloat) {
    let _scaleTransform = CGAffineTransform.init(scaleX: x, y: y)
    let to = frame.applying(_scaleTransform)

    let scaleTransform = self.affineTransform().concatenating(_scaleTransform)
    self.anchorPoint = CGPoint(x: 0.5, y: 0.5)
    self.position = CGPoint(x: to.midX, y: to.midY)
    self.setAffineTransform(self.affineTransform().concatenating(scaleTransform))
  }
}

private extension CGSize {
  static let defaultScale = CGSize(width: UIScreen.main.nativeScale, height: UIScreen.main.nativeScale)
}

extension CGFloat {
    func roundedToScreenScale(_ rule: FloatingPointRoundingRule = .toNearestOrAwayFromZero) -> CGFloat {
        let scale: CGFloat = 1.0 / UIScreen.main.scale
        return scale * (self / scale).rounded(rule)
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

extension CGFloat {
  func toClosestMultiple(_ of: CGFloat) -> CGFloat {
     return floor(self / of) * of
  }
}

extension CGSize {
  func h264Friendly() -> CGSize {
    let h264Width = abs(self.width.toClosestMultiple(CGFloat(16)))

    return CGSize(
      width: h264Width,
      height: abs(floor((h264Width / width) * height))
    )
  }
}

extension CGRect {
  func normalize(scale: CGFloat = CGFloat(1)) -> CGRect {
    self.standardized.applying(.init(scaleX: scale, y: scale)).integral
  }

  func h264Friendly() -> CGRect {
    let size = self.size.h264Friendly()

//    let origin = CGPoint(
//      x: self.origin.x + self.size.width - size.width,
//      y: self.origin.y + self.size.height - size.height
//    )

    return CGRect(
      origin: origin,
      size: size
      )
//      size: CGSize(
//        width: size.width - origin.x,
//        height: size.height - origin.y
//      )
//    )
  }
}




extension CALayer {
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
