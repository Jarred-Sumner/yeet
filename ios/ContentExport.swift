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

  static func export(url: URL, type: ExportType, estimatedBounds: CGRect, duration: TimeInterval, resources: Array<ExportableBlock>, isDigitalOnly: Bool, scale: CGFloat? = nil, complete: @escaping(ContentExport?)->()) {
    do {
//      let _estimatedBounds = CGRect(origin: estimatedBounds.origin, size: estimatedBounds.size.h264Friendly())
//      let h264RenderScale = _estimatedBounds.size.width / estimatedBounds.size.width
//
//      let _contentsScale = (scale != nil ? scale! : UIScreen.main.scale)
//      let contentsScale = _estimatedBounds.applying(CGAffineTransform.init(scaleX: _contentsScale, y: _contentsScale)).size.h264Friendly().width / _estimatedBounds.size.width

      let contentsScale = (scale != nil ? scale! : UIScreen.main.scale)
      let VIDEO_MARGIN = contentsScale
      var renderSize = CGSize.zero
      var naturalVideoSize = CGSize.zero
      var videoCount = 0

      for resource in resources {
        if let block = resource.block {
          let frame = (block.nodeFrame ?? block.frame)

          if block.value.image.isVideo {
            videoCount = videoCount + 1
            if let vidAsset = block.value.image.video?.asset {
              if let vidTrack = vidAsset.tracks(withMediaType: .video).first {
                if vidTrack.naturalSize.width > naturalVideoSize.width {
                  naturalVideoSize = CGSize(
                    width: vidTrack.naturalSize.width,
                    height: naturalVideoSize.height
                  )
                }

                naturalVideoSize = CGSize(
                  width: naturalVideoSize.width,
                  height: vidTrack.naturalSize.height + naturalVideoSize.height
                )
              }
            }
          }

          let maxX = min(frame.origin.x + frame.width, estimatedBounds.width)
          let maxY = frame.origin.y + frame.height


          if maxX > renderSize.width {
            renderSize.width = maxX
          }

          if maxY > renderSize.height {
            renderSize.height = maxY
          }

        }
      }

      naturalVideoSize = CGSize(
        width: naturalVideoSize.width,
        height: naturalVideoSize.height + (CGFloat(videoCount) * CGFloat(VIDEO_MARGIN))
      )

      let scaleTransform = CGAffineTransform.init(scaleX: contentsScale, y: contentsScale)

      let parentLayer = CALayer()


      parentLayer.bounds = CGRect(origin: .zero, size: estimatedBounds.size)
      parentLayer.frame = CGRect(origin: .zero, size: estimatedBounds.size)


      parentLayer.contentsScale = contentsScale
      parentLayer.contentsGravity = .resize
      parentLayer.isGeometryFlipped = true
      parentLayer.masksToBounds = true
      parentLayer.isOpaque = true


      if (type == ExportType.mp4) {
        let startPrepTime = CACurrentMediaTime()
        var lastVideoTranslateY = CGFloat.zero

        let seconds = [duration, 3.0].max()!
        let vid_timerange = CMTimeRangeMake(start: CMTime.zero, duration: CMTime(seconds: seconds))
        let composition = AVMutableComposition()

        let layercomposition = AVMutableVideoComposition()
        layercomposition.frameDuration = CMTime(value: 1, timescale: 30)

        var videoLayers: Array<CALayer> = []


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
//            guard let _asset = resizedAssets[block.value.image.mediaSource.id] else {
//              return
//            }

            let _asset = video.asset
            guard _asset.isPlayable else {
              return
            }

            let vidAsset = _asset.tracks(withMediaType: .video).first!
            guard vidAsset.isPlayable else {
              return
            }

            let assetDuration = CMTimeGetSeconds(vidAsset.timeRange.duration)
            let frame = (block.nodeFrame ?? block.frame)
            let loopCount = ( seconds / assetDuration).rounded(.up)
            let nodeView = video.nodeView


            let scaleX =  (frame.size.width * contentsScale) / vidAsset.naturalSize.width
            let scaleY =  (frame.size.height * contentsScale) / vidAsset.naturalSize.height

            let _videoTransform =  CGAffineTransform
              .identity
              .scaledBy(x: scaleX, y: scaleY)

            let videoTransform = _videoTransform
            let videoTranslateTransform = CGAffineTransform.init(translationX: .zero, y: lastVideoTranslateY)
            let layerTransform = CGAffineTransform.identity.concatenating(videoTransform).concatenating(videoTranslateTransform).concatenating(vidAsset.preferredTransform)

             guard let view = video.view else {
               return
             }



              guard let track = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
                return
              }
              for _ in 0...Int(loopCount) {
                try! track.insertTimeRange(CMTimeRangeMake(start: .zero, duration: vidAsset.timeRange.duration), of: vidAsset, at: .zero)
              }

              let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: track)
              layerInstruction.setTransform(layerTransform, at: .zero)
              instruction.layerInstructions.append(layerInstruction)
              track.preferredTransform = vidAsset.preferredTransform
              track.naturalTimeScale = vidAsset.naturalTimeScale

              if (CMTimeGetSeconds(layercomposition.frameDuration) < CMTimeGetSeconds(vidAsset.minFrameDuration)) {
                layercomposition.frameDuration = vidAsset.minFrameDuration
              }



            let videoLayer = CALayer()
            
            setupInnerLayer(layer: videoLayer, block: block)

            videoLayer.isGeometryFlipped = !parentLayer.isGeometryFlipped
            videoLayer.backgroundColor = UIColor.clear.cgColor
            videoLayer.contentsGravity = .topLeft
            videoLayer.contentsScale = contentsScale
            videoLayer.masksToBounds = true

            if self.SHOW_BORDERS {
              videoLayer.borderWidth = CGFloat(2)
              videoLayer.borderColor = UIColor.red.cgColor
            }

            let vidRect =  CGRect(origin: .zero, size: vidAsset.naturalSize).applying(layerTransform)

            videoLayer.bounds  = CGRect(origin: .zero, size: frame.size)
            videoLayer.frame = CGRect(origin: frame.origin, size: frame.size)

            let videoContainerRect = estimatedBounds.applying(scaleTransform)
            let interRect = videoContainerRect.intersection(vidRect)

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

            
            videoLayers.append(videoLayer)
            parentLayer.addSublayer(videoLayer)

            SwiftyBeaver.info("""
Bounds diff:
- translation \(videoTransform.translation())
- Editor: \(frame)
- View: \(view.bounds),\(view.frame)
- Node: \(nodeView?.bounds),\(nodeView?.frame)
- Node Transform: \(nodeView?.transform)

""")

            lastVideoTranslateY =  vidRect.maxY + VIDEO_MARGIN
          } else if (isImage) {
            let cropRect = composeAnimationLayer(parentLayer: parentLayer, estimatedBounds: parentLayer.bounds, duration: seconds, resources: resources)

            let _width = cropRect.size.width * contentsScale
            let _height = cropRect.size.width * contentsScale
          }
        }


//        parentLayer.bounds = CGRect(origin: .zero, size: renderSize.h264Friendly())
        parentLayer.backgroundColor = UIColor.clear.cgColor


        renderSize = renderSize.applying(scaleTransform)
        let renderBounds = parentLayer.bounds.applying(scaleTransform)

        layercomposition.instructions.append(instruction)
        layercomposition.renderSize = estimatedBounds.applying(scaleTransform).size
//        parentLayer.frame = CGRect(origin: .zero, size: renderSize)



        parentLayer.applyScale(x: contentsScale, y: contentsScale )


//        layercomposition.renderSize = renderSize

        if videoLayers.count > 1 {
          layercomposition.animationTool = .init(postProcessingAsVideoLayers: videoLayers, in: parentLayer)
        } else if videoLayers.count == 1 {
          layercomposition.animationTool = .init(postProcessingAsVideoLayer: videoLayers.first!, in: parentLayer)
        }

        if (layercomposition.renderSize.width == .zero || layercomposition.renderSize.height == .zero) {
          SwiftyBeaver.error("Invalid video export size \(layercomposition.renderSize)")
          complete(nil)
          return
        }



        // TRY masking to only what's visible

        // Use AVAssetExportSession to export video
        let assetExport = NextLevelSessionExporter(withAsset: composition)


        assetExport.outputFileType = AVFileType.mp4
        assetExport.outputURL = VideoProducer.generateExportURL(type: type)
//        assetExport.outputURL = url
        assetExport.videoOutputConfiguration = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: NSNumber(integerLiteral: Int(floor(layercomposition.renderSize.h264Friendly().width))),
            AVVideoHeightKey: NSNumber(integerLiteral: Int(floor(layercomposition.renderSize.h264Friendly().height))),
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
                var resolution = renderSize
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



                let fullAsset = AVURLAsset(url: assetExport.outputURL!)
                
                fullAsset.crop(to: CGRect(origin: .zero, size: renderSize.h264Friendly()), dest: url).then { _ in
                  let timeSpentExporting = CACurrentMediaTime() - startExportTime
                  SwiftyBeaver.info("Video Export completed\nResolution:\(Int(resolution.width))x\(Int(resolution.height))\nDuration: \(seconds)\nPath: \(url.absoluteString)\nAVAssetExportSession took \(timeSpentExporting)s")


                  complete(ContentExport(url: url, resolution: resolution, type: type, duration: duration, colors: colors))
                }

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
  func applyScale(x: CGFloat, y: CGFloat) {

    let scaleTransform = self.affineTransform().scaledBy(x: x, y: y)
    let to = bounds.applying(scaleTransform)
    self.anchorPoint = CGPoint(x: 0.5, y: 0.5)
    self.position = CGPoint(x: to.midX, y: to.midY)
    self.setAffineTransform(scaleTransform)
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
    let roundedOf = of.rounded(.down)
    let roundedSelf = self.rounded(.down)

    if Int(roundedSelf) % Int(roundedOf) == .zero {
      return roundedSelf
    } else if roundedSelf < roundedOf {
      return roundedOf
    } else {
      return (roundedSelf / of + CGFloat(1)) * of
    }

  }
}

extension CGSize {
  func h264Friendly() -> CGSize {
    let h264Width = self.width.toClosestMultiple(CGFloat(16))

    return CGSize(
      width: h264Width,
      height: (h264Width / width) * height
    )
  }
}


