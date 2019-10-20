import Foundation
import AVKit
import AVFoundation
import SpriteKit
import Photos
import SDWebImage
import UIImageColors
import SwiftyBeaver
import Promises

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
//      layer.shouldRasterize = true
      if (ContentExport.CONVERT_PNG_TO_WEBP) {
        let newImage = SDImageWebPCoder.shared.decodedImage(with: SDImageWebPCoder.shared.encodedData(with: image.staticImage!, format: .webP, options: [SDImageCoderOption.encodeCompressionQuality: CGFloat(1), SDImageCoderOption.encodeFirstFrameOnly: 1]), options: nil)!
        layer.contents = newImage.cgImage!
      } else {
        layer.contents = UIImage.init(data: image.staticImage!.jpegData(compressionQuality: CGFloat(1.0))!)?.cgImage!
      }
//      layer.contentsFormat = .RGBA16Float
    } else {
//      layer.shouldRasterize = true
      layer.contents = image.staticImage!.cgImage!
//      layer.contentsFormat = .RGBA16Float
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

  static func createVideoLayer(frame: CGRect, containerFrame: CGRect, bounds: CGRect, scale: CGFloat, transform: CGAffineTransform, naturalSize: CGSize) -> (CALayer, CALayer) {
    let videoLayer = CALayer()
    let containerLayer = CALayer()

    containerLayer.contentsGravity = .resizeAspectFill
    containerLayer.bounds = CGRect(origin: .zero, size: frame.size)
    containerLayer.frame = frame
    containerLayer.contentsScale = CGFloat(UIScreen.main.nativeScale)

    let contentsTransform = ContentsGravityTransformation(for: containerLayer, naturalSize: naturalSize)
    containerLayer.setAffineTransform(CGAffineTransform.init(scaleX: contentsTransform.scale.width, y: contentsTransform.scale.height))

    containerLayer.contentsGravity = .center


//    containerLayer.bounds = CGRect(origin: .zero, size: frame.size)
//    containerLayer.frame = containerFrame
//    containerLayer.isGeometryFlipped = true
//    containerLayer.masksToBounds = true

//    containerLayer.frame = containerFrame
//
//    containerLayer.bounds = CGRect(origin: .zero, size: containerFrame.size)


//    videoLayer.bounds = bounds
//    videoLayer.bounds = frame
//    videoLayer.bounds = bounds
    videoLayer.frame = frame
    videoLayer.contentsScale = CGFloat(UIScreen.main.nativeScale)
    videoLayer.contentsGravity = .center
    videoLayer.setAffineTransform(transform)
    videoLayer.masksToBounds = true
    videoLayer.isGeometryFlipped = true
    videoLayer.isOpaque = false
    videoLayer.backgroundColor = UIColor.clear.cgColor

//    let




    containerLayer.addSublayer(videoLayer)

    return (containerLayer, videoLayer)
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
//    layer.adjustAnchorPoint(anchorPoint: CGPoint(x: CGFloat(0.5), y: CGFloat.zero))


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

  static func export(url: URL, type: ExportType, estimatedBounds: CGRect, duration: TimeInterval, resources: Array<ExportableBlock>, isDigitalOnly: Bool, complete: @escaping(ContentExport?)->()) {
    do {
      
      let contentsScale = UIScreen.main.scale
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

        if videos.count == 0 {
          let (containerLayer, videoLayer) = createVideoLayer(frame: estimatedBounds, containerFrame: estimatedBounds, bounds: estimatedBounds, scale: contentsScale, transform: CGAffineTransform.identity, naturalSize: estimatedBounds.size)

          parentLayer.addSublayer(containerLayer)
          videoLayers.append(videoLayer)
        }

        let instruction = AVMutableVideoCompositionInstruction()
        instruction.timeRange = vid_timerange
        instruction.backgroundColor = UIColor.clear.cgColor

        var importedVideoCount = 0

        resources.forEach { resource in
//          guard let resource = resources.first else {
//            return
//          }

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
            let asset = AVURLAsset(url: video.mediaSource.getAssetURI())

            let frame = block.nodeFrame ?? block.frame

            if importedVideoCount == 0 {
//              let asset = try! await(asset.resize(to: CGRect(origin: .zero, size: frame.size), transform: CGAffineTransform.init(rotationAngle: CGFloat(block.position.rotate.doubleValue)), duration: CMTime(seconds: seconds)))
              let originalVidAsset = asset.tracks(withMediaType: .video).first!
              let originalSize = originalVidAsset.naturalSize

              let horizScale = frame.size.width / originalSize.width
              let vertScale = frame.size.height / originalSize.height
              let scale = min(horizScale, vertScale)

              let _asset = try! await(asset.resize(url: video.mediaSource.getAssetURI(), to: CGRect(origin: .zero, size: frame.size.applying(.init(scaleX: contentsScale, y: contentsScale))), duration: min(CMTimeGetSeconds( asset.duration), seconds), scale: contentsScale))
              let vidAsset = _asset.tracks(withMediaType: .video).first!

              guard let track = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
                return
              }
              try! track.insertTimeRange(vidAsset.timeRange, of: vidAsset, at: .zero)

              track.preferredTransform = vidAsset.preferredTransform
              track.naturalTimeScale = vidAsset.naturalTimeScale
              let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: track)

              instruction.layerInstructions.append(layerInstruction)

              layercomposition.frameDuration = vidAsset.minFrameDuration


              let videoLayer = CALayer()
              videoLayer.bounds = CGRect(origin: .zero, size: vidAsset.naturalSize)
              videoLayer.frame = CGRect(origin: frame.origin, size: vidAsset.naturalSize)
              setupInnerLayer(layer: videoLayer, block: block)
              videoLayer.backgroundColor = UIColor.clear.cgColor
//              videoLayer.setAffineTransform(CGAffineTransform.init(scaleX: CGFloat(1) / contentsScale, y: CGFloat(1) / contentsScale).concatenating(videoLayer.affineTransform()))



              videoLayer.contentsGravity = .topLeft
              videoLayer.contentsScale = contentsScale
              videoLayer.masksToBounds = true
//              wrapperLayer.addSublayer(videoLayer)

              videoLayers.append(videoLayer)
              parentLayer.addSublayer(videoLayer)
              importedVideoCount = 1
            } else {
              do {
                let imageSource = try await(video.generateThumbnail(size: frame.size))
                let layer = composeImageLayer(image: imageSource, frame: frame, duration: block.totalDuration, block: block)
                parentLayer.addSublayer(layer)
              } catch {
                SwiftyBeaver.error("Composing \(block.id) failed.\n\(error)")
              }

            }

            if (Double(bounds.width) < block.dimensions.maxX.doubleValue) {
              bounds.size.width = CGFloat(block.dimensions.maxX.doubleValue)
            }

            if (Double(bounds.height) < block.dimensions.maxY.doubleValue) {
              bounds.size.height = CGFloat(block.dimensions.maxY.doubleValue)
            }

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
        let assetExport = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHEVCHighestQuality)
        assetExport?.outputFileType = AVFileType.mp4
        assetExport?.outputURL = url
        assetExport?.canPerformMultiplePassesOverSourceMediaData = true

        assetExport?.timeRange = vid_timerange
        assetExport?.shouldOptimizeForNetworkUse = true


        if layercomposition.instructions.count > 0 {
          assetExport?.videoComposition = layercomposition
        }

        let timeSpentPreparing = CACurrentMediaTime() - startPrepTime
        SwiftyBeaver.info("Preparing video export with \(resources.count) completed in \(timeSpentPreparing)s")
        SwiftyBeaver.info("Starting video export...")
        let startExportTime = CACurrentMediaTime()
        assetExport?.exportAsynchronously(completionHandler: {
          let timeSpentExporting = CACurrentMediaTime() - startExportTime

          switch assetExport!.status {
          case AVAssetExportSessionStatus.failed:

            SwiftyBeaver.error("Video Export failed. \n\(assetExport?.error)")
            complete(nil)
          case AVAssetExportSessionStatus.cancelled:
            SwiftyBeaver.warning("Video Export cancelled")
            complete(nil)
          default:
            var resolution = CGSize(width: bounds.size.width, height: bounds.size.height)
            var colors: UIImageColors? = nil

            do {
              let imageGenerator = AVAssetImageGenerator(asset: assetExport!.asset)
              imageGenerator.appliesPreferredTrackTransform = true
              let thumbnail = try UIImage(cgImage: imageGenerator.copyCGImage(at: CMTime(seconds: 0, preferredTimescale: 1), actualTime: nil))

              resolution = thumbnail.size
              colors = thumbnail.getColors()
            } catch {

            }

            let duration = CMTimeGetSeconds(assetExport!.asset.duration)
            SwiftyBeaver.info("Video Export completed\nResolution:\(Int(resolution.width))x\(Int(resolution.height))\nDuration: \(seconds)\nPath: \(url.absoluteString)\nAVAssetExportSession took \(timeSpentExporting)s")

            complete(ContentExport(url: url, resolution: resolution, type: type, duration: duration, colors: colors))
          }
        })
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

extension CGAffineTransform {
  func from(_ source: CGRect, destination: CGRect) -> CGAffineTransform {
    return self
//           .translatedBy(x: destination.midX - source.midX, y: destination.midY - source.midY)
          .scaledBy(x: destination.width / source.width, y: destination.height / source.height)
  }
}


struct ContentsGravityTransformation {
    /// `offset` is in the provided `layer`'s own (`bounds`) coordinates
    let offset: CGPoint

    /// `scale` is a proportion by which the `layer` will be transformed in each `width` and `height`
    let scale: CGSize

  init(for layer: CALayer, naturalSize: CGSize) {
        let scaledContents = CGSize(
            width: CGFloat(naturalSize.width) / layer.contentsScale,
            height: CGFloat(naturalSize.height) / layer.contentsScale
        )

        let bounds = layer.bounds
        var distanceToMinX: CGFloat {
            return -((bounds.width - scaledContents.width) * layer.anchorPoint.x)
        }
        var distanceToMinY: CGFloat {
            return -((bounds.height - scaledContents.height) * layer.anchorPoint.y)
        }
        var distanceToMaxX: CGFloat {
            return (bounds.width - scaledContents.width) * (1 - layer.anchorPoint.x)
        }
        var distanceToMaxY: CGFloat {
            return (bounds.height - scaledContents.height) * (1 - layer.anchorPoint.y)
        }

        switch layer.contentsGravity {
        case .resize:
            offset = .zero
            scale = CGSize(width: bounds.width / scaledContents.width, height: bounds.height / scaledContents.height)
            break
        case .resizeAspectFill:
            offset = .zero
            let maxScale = max(bounds.width / scaledContents.width, bounds.height / scaledContents.height)
            scale = CGSize(width: maxScale, height: maxScale)
            break
        case .resizeAspect:
            offset = .zero
            let minScale = min(bounds.width / scaledContents.width, bounds.height / scaledContents.height)
            scale = CGSize(width: minScale, height: minScale)
            break
        case .center:
            offset = .zero
            scale = .defaultScale
          break
        case .left:
            offset = CGPoint(x: distanceToMinX, y: 0.0)
            scale = .defaultScale
          break
        case .right:
            offset = CGPoint(x: distanceToMaxX, y: 0.0)
            scale = .defaultScale
          break
        case .top:
            offset = CGPoint(x: 0.0, y: distanceToMinY)
            scale = .defaultScale
          break
        case .bottom:
            offset = CGPoint(x: 0.0, y: distanceToMaxY)
            scale = .defaultScale
          break
        case .topLeft:
            offset = CGPoint(x: distanceToMinX, y: distanceToMinY)
            scale = .defaultScale
          break
        case .topRight:
            offset = CGPoint(x: distanceToMaxX, y: distanceToMinY)
            scale = .defaultScale
          break
        case .bottomLeft:
            offset = CGPoint(x: distanceToMinX, y: distanceToMaxY)
            scale = .defaultScale
          break
        case .bottomRight:
            offset = CGPoint(x: distanceToMaxX, y: distanceToMaxY)
            scale = .defaultScale
            break
        default:
          offset = .zero
          scale = .defaultScale
      }
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
