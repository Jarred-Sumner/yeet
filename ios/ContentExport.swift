import Foundation
import AVKit
import AVFoundation
import SpriteKit
import Photos
import SDWebImage
import UIImageColors
import SwiftyBeaver
import PromiseKit
import NextLevelSessionExporter


typealias ExportableSlice = (Array<AVAssetTrack>, Array<ExportableBlock>)

class ContentExport {
  static let CONVERT_PNG_TO_WEBP = true

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

  static func composeImageLayer(image: ExportableImageSource, frame: CGRect, duration: TimeInterval, block: ContentBlock? = nil) -> CALayer {
    let layer = CALayer()
    layer.bounds = frame
    layer.frame = frame

    setupInnerLayer(layer: layer, block: block)

    if (image.isAnimated) {
      layer.contents = image.firstFrame
      var images: Array<CGImage> = []

      for frameIndex in 0...image.animatedImageFrameCount - 1 {
        let frame = image.animatedImageFrame(at: UInt(frameIndex))

        images.append(frame)
      }

      layer.add(getFramesAnimation(frames: images, duration: duration), forKey: nil)
    } else if (image.mediaSource.mimeType == .png) {
      if (ContentExport.CONVERT_PNG_TO_WEBP) {
        let newImage = SDImageWebPCoder.shared.decodedImage(with: SDImageWebPCoder.shared.encodedData(with: image.staticImage!, format: .webP, options: [SDImageCoderOption.encodeCompressionQuality: CGFloat(1), SDImageCoderOption.encodeFirstFrameOnly: 1]), options: nil)!
        layer.contents = newImage.cgImage!
      } else {
        layer.contents = UIImage.init(data: image.staticImage!.jpegData(compressionQuality: CGFloat(1.0))!)?.cgImage!
      }
    } else {
      layer.contents = image.staticImage!.cgImage!
    }

    return layer
  }

  static func composeAnimationLayer(parentLayer: CALayer, estimatedBounds: CGRect, duration: TimeInterval, resources: Array<ExportableBlock>) -> (CGRect) {
    let contentsScale = UIScreen.main.scale

    var maxY = CGFloat(0)
    var minY = estimatedBounds.size.height
    resources.forEach { resource in
      guard let block = resource.block else {
        return
      }

      guard let image = block.value.image.image else {
        return
      }

      let frame = block.nodeFrame ?? block.frame

      if (frame.origin.y + frame.size.height > maxY) {
       maxY = frame.origin.y + frame.size.height
      }

      if (frame.origin.y < minY) {
       minY = frame.origin.y
      }

      let layer = composeImageLayer(image: image, frame: frame, duration: duration, block: block)


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
    layer.contentsScale = UIScreen.main.nativeScale
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

  static func sliceResources (resources: Array<ExportableBlock>) -> Array<Array<ExportableBlock>> {
    guard resources.count > 1  else {
      return [resources]
    }

    let videoIndices = resources.filter { resource in

      guard let block = resource.block else {
        return false
      }

      return block.value.image.isVideo
    }.compactMap { videoBlock in
      return resources.firstIndex(of: videoBlock)
    }

    guard videoIndices.count > 0 else {
      return [resources]
    }


    var slices: Array<Array<ExportableBlock>> = []

    var lastVideoSlice = 0
    videoIndices.forEach { index in
      if index > lastVideoSlice + 1 {
        slices.append(
          Array(resources[lastVideoSlice + 1...index - 1])
        )
      }

      slices.append(
        [resources[index]]
      )

      lastVideoSlice = index
    }

    if lastVideoSlice < resources.count - 1 {
      slices.append(
        Array(resources[lastVideoSlice + 1...resources.count - 1])
      )
    }

    return slices
  }

  static func export(url: URL, type: ExportType, estimatedBounds: CGRect, duration: TimeInterval, resources: Array<ExportableBlock>, isDigitalOnly: Bool, scale: CGFloat? = nil, complete: @escaping(ContentExport?)->()) {
    do {
      let contentsScale = scale != nil ? scale! : UIScreen.main.scale

      let parentLayer = CALayer()
      parentLayer.bounds = estimatedBounds
      parentLayer.frame = estimatedBounds
      parentLayer.contentsScale = contentsScale
      parentLayer.contentsGravity = .resize
      parentLayer.isGeometryFlipped = true
      parentLayer.masksToBounds = true
      parentLayer.isOpaque = false



      if (type == ExportType.mp4) {
        let startPrepTime = CACurrentMediaTime()
        var lastVideoTranslateY = CGFloat.zero

        let seconds = [duration, 3.0].max()!
        let vid_timerange = CMTimeRangeMake(start: CMTime.zero, duration: CMTime(seconds: seconds))
        let composition = AVMutableComposition()
        let slicedResources = sliceResources(resources: resources)
        let layercomposition = AVMutableVideoComposition()
        layercomposition.frameDuration = CMTime(value: 1, timescale: 30)

        var videoLayers: Array<CALayer> = []
        var animationLayers: Array<CALayer> = []

        var bounds = estimatedBounds
        let videos = resources.filter { resource in
          return resource.block!.value.image.isVideo
        }

        var resizedAssets: Dictionary<String, AVURLAsset> = [:]

        let instruction = AVMutableVideoCompositionInstruction()
        instruction.timeRange = vid_timerange
        instruction.backgroundColor = UIColor.clear.cgColor

        if videos.count == 0 {
           let videoLayer = CALayer()
           videoLayer.bounds = estimatedBounds
           videoLayer.frame = estimatedBounds

           parentLayer.addSublayer(videoLayer)
           videoLayers.append(videoLayer)
         }

        for videoResource in videos {
          let block = videoResource.block!
          let mediaSource = block.value.image.mediaSource
          let asset = AVURLAsset(url: mediaSource.getAssetURI())
          let frame = (block.value.image.view!).frame

          let rotateTransform = CGAffineTransform(rotationAngle: CGFloat(block.position.rotate.doubleValue))

          let _asset = try! asset.resize(
            url: mediaSource.getAssetURI(), to: CGRect(origin: .zero, size: frame.size), duration: min(CMTimeGetSeconds( block.value.image.video!.asset.duration), seconds), scale: contentsScale, transform: rotateTransform
          ).wait()

          resizedAssets[mediaSource.id] = _asset
        }

        var videoWidth = CGFloat.zero
        var videoHeight = CGFloat.zero
        resizedAssets.forEach { _, asset in
          guard let vidAsset = asset.tracks(withMediaType: .video).first else {
            return
          }

          videoWidth = videoWidth + vidAsset.naturalSize.width
          videoHeight = videoHeight + vidAsset.naturalSize.height
        }

        let videoSize = CGSize(width: videoWidth, height: videoHeight)
        let VIDEO_MARGIN = contentsScale

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

            let resizeScale = UIScreen.main.nativeScale
            guard let _asset = resizedAssets[block.value.image.mediaSource.id] else {
              return
            }

            let vidAsset = _asset.tracks(withMediaType: .video).first!
            let frame = block.nodeFrame ?? block.frame
            

            guard let track = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
              return
            }
            try! track.insertTimeRange(vidAsset.timeRange, of: vidAsset, at: .zero)

            track.preferredTransform = vidAsset.preferredTransform
            track.naturalTimeScale = vidAsset.naturalTimeScale
            let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: track)

            let scaleAdjustmentValue = estimatedBounds.width / vidAsset.naturalSize.width

            let videoTranslateTransform = CGAffineTransform.init(translationX: .zero, y: lastVideoTranslateY)
            let rotateTransform = CGAffineTransform(rotationAngle: CGFloat(block.position.rotate.doubleValue))
            let translateTransform = CGAffineTransform(translationX: CGFloat(block.position.x.doubleValue), y: CGFloat(block.position.y.doubleValue))
            let scaleTransform = CGAffineTransform(scaleX: CGFloat(block.position.scale.doubleValue), y: CGFloat(block.position.scale.doubleValue))

            let nodeView = video.nodeView
            guard let view = video.view else {
              return
            }

            let _videoTransform =  CGAffineTransform
              .identity
              .concatenating(translateTransform)
              .concatenating(scaleTransform)
              .concatenating(rotateTransform)

            let videoTransform = _videoTransform


            let inverserRotateTransform = CGAffineTransform(rotationAngle: CGFloat(block.position.rotate.doubleValue * -1))

            let unrotatedFrame = frame.applying(inverserRotateTransform)

            let layerTransform = CGAffineTransform.identity.concatenating(videoTranslateTransform).concatenating(videoTransform).concatenating(track.preferredTransform)
            layerInstruction.setTransform(layerTransform, at: .zero)
            instruction.layerInstructions.append(layerInstruction)

            layercomposition.frameDuration = vidAsset.minFrameDuration

            let layerInstructionRect = CGRect(origin: .zero, size: vidAsset.naturalSize).applying(layerTransform)


            let videoLayer = CALayer()
            
            setupInnerLayer(layer: videoLayer, block: block)

            let transformedRect = CGRect(origin: .zero, size: vidAsset.naturalSize).applying(videoTransform)

            let containerLayer = CALayer()

            containerLayer.frame = CGRect(origin: .zero, size: estimatedBounds.size)
            containerLayer.isGeometryFlipped = false
            containerLayer.bounds = CGRect(origin:  .zero, size: estimatedBounds.size)
            containerLayer.borderWidth = CGFloat(1)
            containerLayer.borderColor = UIColor.green.cgColor

            videoLayer.isGeometryFlipped = false

            videoLayer.backgroundColor = UIColor.clear.cgColor
            videoLayer.contentsGravity = .topLeft
            videoLayer.contentsScale = CGFloat(1)
            videoLayer.masksToBounds = false
            videoLayer.borderWidth = CGFloat(2)
            videoLayer.borderColor = UIColor.red.cgColor

            let vidRect = CGRect(origin: .zero, size: vidAsset.naturalSize).applying(videoTransform)
            videoLayer.setAffineTransform(CGAffineTransform.identity.translatedBy(x: vidRect.origin.x * -1, y: vidRect.origin.y * -1))
            videoLayer.bounds  = CGRect(origin: .zero, size: estimatedBounds.size)
            videoLayer.frame = CGRect(origin: .zero, size: estimatedBounds.size)
            let maskLayer = CAShapeLayer()

//            maskLayer.bounds = videoLayer.bounds
//            maskLayer.path = UIBezierPath(rect: CGRect(origin: vidRect.origin, size: frame.size) ).cgPath
//            maskLayer.borderColor = UIColor.init(rgb: 0xFFF999333, alpha: 0.95).cgColor
//            maskLayer.borderWidth = CGFloat(2)
//            maskLayer.isGeometryFlipped = false
//            maskLayer.fillRule = .evenOdd
//            maskLayer.setAffineTransform(rotateTransform)
//
//            videoLayer.mask = maskLayer


//            videoLayer.adjustAnchorPoint(anchorPoint: CGPoint.zero)

//            videoLayer.setAffineTransform(videoTransform)
//            containerLayer.addSublayer(videoLayer)



            let _bounds = parentLayer.convert(videoLayer.frame.applying(videoTransform), to: videoLayer)


            videoLayers.append(videoLayer)
//            containerLayer.addSublayer(videoLayer)
//            parentLayer.addSublayer(containerLayer)
            parentLayer.addSublayer(videoLayer)


            if (Double(bounds.width) < block.dimensions.maxX.doubleValue) {
              bounds.size.width = CGFloat(block.dimensions.maxX.doubleValue)
            }

            if (Double(bounds.height) < block.dimensions.maxY.doubleValue) {
              bounds.size.height = CGFloat(block.dimensions.maxY.doubleValue)
            }


            SwiftyBeaver.info("""
Bounds diff:
- translation \(videoTransform.translation())
- Editor: \(frame)
- Export: \(_bounds)
- View: \(view.bounds),\(view.frame)
- Node: \(nodeView?.bounds),\(nodeView?.frame)
- Node Transform: \(nodeView?.transform)

""")

            lastVideoTranslateY =  _bounds.origin.y + _bounds.size.height + VIDEO_MARGIN
          } else if (isImage) {
            let cropRect = composeAnimationLayer(parentLayer: parentLayer, estimatedBounds: estimatedBounds, duration: seconds, resources: resources)

            let _width = cropRect.size.width * contentsScale
            let _height = cropRect.size.width * contentsScale

            if _width > bounds.size.width {
              bounds.size.width = _width
            }

            if _height > bounds.size.height {
              bounds.size.height = _height
            }
          }
        }

        layercomposition.instructions.append(instruction)
        layercomposition.renderSize = parentLayer.bounds.size
//        parentLayer.setAffineTransform(CGAffineTransform.init(scaleX: contentsScale, y: contentsScale).concatenating(parentLayer.affineTransform()))

        if videoLayers.count > 1 {
          layercomposition.animationTool = .init(postProcessingAsVideoLayers: videoLayers, in: parentLayer)
        } else if videoLayers.count == 1 {
          layercomposition.animationTool = .init(postProcessingAsVideoLayer: videoLayers.first!, in: parentLayer)
        }


        let layerInstruction = instruction.layerInstructions.first! as! AVMutableVideoCompositionLayerInstruction

        if (layercomposition.renderSize.width == .zero || layercomposition.renderSize.height == .zero) {
          SwiftyBeaver.error("Invalid video export size \(layercomposition.renderSize)")
          complete(nil)
          return
        }

        // Use AVAssetExportSession to export video
        let assetExport = NextLevelSessionExporter(withAsset: composition)

        assetExport.outputFileType = AVFileType.mp4
        assetExport.outputURL = url
        assetExport.videoOutputConfiguration = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: NSNumber(integerLiteral: Int(floor(parentLayer.bounds.width))),
            AVVideoHeightKey: NSNumber(integerLiteral: Int(floor(parentLayer.bounds.height))),
            AVVideoScalingModeKey: AVVideoScalingModeResize,
            AVVideoCompressionPropertiesKey: [
              AVVideoAverageBitRateKey: NSNumber(integerLiteral: 6000000),
              AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel as String,
            ]
        ]

        assetExport.audioOutputConfiguration = [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVEncoderBitRateKey: NSNumber(integerLiteral: 128000),
            AVNumberOfChannelsKey: NSNumber(integerLiteral: 2),
            AVSampleRateKey: NSNumber(value: Float(44100))
        ]

        assetExport.timeRange = vid_timerange

        if layercomposition.instructions.count > 0 {
          assetExport.videoComposition = layercomposition
        }

        let timeSpentPreparing = CACurrentMediaTime() - startPrepTime
        SwiftyBeaver.info("Preparing video export with \(resources.count) completed in \(timeSpentPreparing)s")
        SwiftyBeaver.info("Starting video export...")
        let startExportTime = CACurrentMediaTime()
        assetExport.export { result in
          let timeSpentExporting = CACurrentMediaTime() - startExportTime

          switch(result) {
          case .success(let status):
              switch status {
              case AVAssetExportSessionStatus.failed:
                SwiftyBeaver.error("Video Export failed.")
                complete(nil)
              case AVAssetExportSessionStatus.cancelled:
                SwiftyBeaver.warning("Video Export cancelled")

                complete(nil)
              default:
                var resolution = CGSize(width: bounds.size.width, height: bounds.size.height)
                var colors: UIImageColors? = nil

                do {
                  let imageGenerator = AVAssetImageGenerator(asset: assetExport.asset!)
                  imageGenerator.appliesPreferredTrackTransform = true
                  let thumbnail = try UIImage(cgImage: imageGenerator.copyCGImage(at: CMTime(seconds: 0, preferredTimescale: 1), actualTime: nil))

                  resolution = thumbnail.size
                  colors = thumbnail.getColors()
                } catch {

                }

                let duration = CMTimeGetSeconds(assetExport.asset!.duration)
                SwiftyBeaver.info("Video Export completed\nResolution:\(Int(resolution.width))x\(Int(resolution.height))\nDuration: \(seconds)\nPath: \(url.absoluteString)\nAVAssetExportSession took \(timeSpentExporting)s")

                complete(ContentExport(url: url, resolution: resolution, type: type, duration: duration, colors: colors))
            }
          case .failure(let error):
            SwiftyBeaver.error(error.localizedDescription, context: error)
            complete(nil)
          }


        }

      } else {
        let cropRect = composeAnimationLayer(parentLayer: parentLayer, estimatedBounds: estimatedBounds, duration: duration, resources: resources)

        let fullImage = UIImage.image(from: parentLayer)!.sd_croppedImage(with: cropRect)!.sd_flippedImage(withHorizontal: false, vertical: true)!
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


        complete(ContentExport(url: url, resolution: resolution, type: type, duration: duration, colors: fullImage.getColors()))
      }
    } catch {
      print("VideoWatermarker->getWatermarkLayer everything is baaaad =(")
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
  func adjustAnchorPoint(anchorPoint: CGPoint) {
      var newPoint = CGPoint(x: bounds.size.width * anchorPoint.x,
                             y: bounds.size.height * anchorPoint.y)


      var oldPoint = CGPoint(x: bounds.size.width * anchorPoint.x,
                             y: bounds.size.height * anchorPoint.y)

      newPoint = newPoint.applying(affineTransform())
      oldPoint = oldPoint.applying(affineTransform())

      var position = self.position
      position.x -= oldPoint.x
      position.x += newPoint.x

      position.y -= oldPoint.y
      position.y += newPoint.y

      self.position = position
      self.anchorPoint = anchorPoint
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
