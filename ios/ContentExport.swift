import Foundation
import AVKit
import AVFoundation
import SpriteKit
import Photos
import SDWebImage


class ContentExport {

  private static func getFramesAnimation(frames: [UIImage], duration: CFTimeInterval) -> CAAnimation {
    let animation = CAKeyframeAnimation(keyPath:#keyPath(CALayer.contents))
    animation.calculationMode = CAAnimationCalculationMode.discrete
    animation.duration = duration
    animation.values =  frames.map {$0.cgImage! }
    animation.speed = 1.0
    animation.repeatCount = 99999
    animation.isRemovedOnCompletion = false
    animation.fillMode = CAMediaTimingFillMode.forwards
    animation.beginTime = AVCoreAnimationBeginTimeAtZero

    return animation
  }

  let url: URL
  let resolution: CGSize
  let type: ExportType
  let duration: TimeInterval

  init(url: URL, resolution: CGSize, type: ExportType, duration: TimeInterval) {
    self.url = url
    self.resolution = resolution
    self.type = type
    self.duration = duration
  }

  func dictionaryValue() -> [String: Any] {
    return [
      "uri": url.absoluteString,
      "width": Double(resolution.width),
      "height": Double(resolution.height),
      "type": type.rawValue,
      "duration": Double(duration)
    ]
  }


  static func export(url: URL, type: ExportType, estimatedBounds: CGRect, duration: TimeInterval, resources: Array<ExportableBlock>, complete: @escaping(ContentExport?)->()) {
    do {
      let composition = AVMutableComposition()
      let vidAsset = AVURLAsset(url: Bundle.main.url(forResource: "blank_1080p", withExtension: ".mp4")!)

      let videoTrack = vidAsset.tracks(withMediaType: AVMediaType.video)[0]


      let vid_timerange = CMTimeRangeMake(start: CMTime.zero, duration: CMTime(seconds: [duration, 0.01].max()! ))

      let track = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)
      try! track!.insertTimeRange(vid_timerange, of: videoTrack, at: .zero)

//      let contentsScale = type == ExportType.mp4 ? CGFloat(1) : UIScreen.main.scale
            let contentsScale = UIScreen.main.scale


      // Watermark Effect

      // Original video from frontal camera.
      let videolayer = CALayer()
      videolayer.frame = estimatedBounds
      videolayer.opacity = 1.0
      videolayer.backgroundColor = UIColor.black.cgColor
      videolayer.contentsGravity = .topLeft


      let parentlayer = CALayer()
      parentlayer.bounds = estimatedBounds
      parentlayer.frame = estimatedBounds
      parentlayer.isGeometryFlipped = type == ExportType.mp4
      parentlayer.addSublayer(videolayer)
      parentlayer.contentsScale = contentsScale

//      parentlayer.isGeometryFlipped = type == ExportType.mp4
      parentlayer.contentsGravity = type == ExportType.mp4 ? .resize   : .resize

//      parentlayer.anchorPoint = CGPoint(x: 0.5, y: -0.5)
//      parentlayer.transform = CATransform3DMakeAffineTransform(CGAffineTransform.identity.translatedBy(x: CGFloat(bounds.size.width * 0.5), y: CGFloat(bounds.size.width * -0.5)).scaledBy(x: CGFloat(UIScreen.main.scale), y: UIScreen.main.scale))

//      parentlayer.transform = CATransform3DMakeAffineTransform(CGAffineTransform.identity.scaledBy(x: CGFloat(1), y: CGFloat(-1)))
      var maxY = CGFloat(0)
      var minY = estimatedBounds.size.height
      resources.forEach { resource in
        guard let block = resource.block else {
          return
        }


        let layer = CALayer()

        if let frame = block.nodeFrame {
          layer.frame = frame;

          if (frame.origin.y + frame.size.height > maxY) {
            maxY = frame.origin.y + frame.size.height
          }

          if (frame.origin.y < minY) {
            minY = frame.origin.y
          }
        } else {
          layer.frame = block.frame;
          if (block.frame.origin.y + block.frame.size.height > maxY) {
            maxY = block.frame.origin.y  + block.frame.size.height

          }

          if (block.frame.origin.y < minY) {
            minY = block.frame.origin.y
          }
        }

        layer.masksToBounds = true
        layer.cornerRadius = CGFloat(block.dimensions.cornerRadius.doubleValue * block.position.scale.doubleValue)
        layer.allowsEdgeAntialiasing = true
        layer.contentsScale = contentsScale
        layer.isOpaque = false
        layer.backgroundColor = UIColor.clear.cgColor
        layer.contentsGravity = .resizeAspect
        layer.isGeometryFlipped = true

        layer.edgeAntialiasingMask = CAEdgeAntialiasingMask(rawValue: 15) // all sides


        layer.setAffineTransform(CGAffineTransform.init(rotationAngle: CGFloat(block.position.rotate.doubleValue)))

        let image = block.value.image.firstFrame;


        layer.contentsFormat = .RGBA16Float


        if block.value.image.isAnimated {
          layer.contents =  image.cgImage!
          var images: Array<UIImage> = []

          for frameIndex in 0...block.value.image.animatedImageFrameCount - 1 {
            let image = block.value.image.animatedImageFrame(at: frameIndex)!

            images.append(image)
          }

          layer.add(getFramesAnimation(frames: images, duration: block.totalDuration), forKey: nil)
        } else if (block.value.mimeType == MimeType.png) {
          let newImage = SDImageWebPCoder.shared.decodedImage(with: SDImageWebPCoder.shared.encodedData(with: image, format: .webP, options: [SDImageCoderOption.encodeCompressionQuality: 1, SDImageCoderOption.encodeFirstFrameOnly: 0]), options: nil)!
          layer.contents = newImage.cgImage!
        } else {
          layer.contents = image.cgImage!
        }

        parentlayer.addSublayer(layer)

      }

      let cropRect = CGRect(x: estimatedBounds.origin.x, y: minY, width: estimatedBounds.size.width, height: maxY)


//      parentlayer.frame = CGRect(x: estimatedBounds.origin.x, y: minY, width: estimatedBounds.size.width, height: maxY).applying(CGAffineTransform.init(scaleX: contentsScale, y: contentsScale))
//      parentlayer.setAffineTransform(CGAffineTransform.init(translationX: estimatedBounds.size.width / contentsScale, y: parentlayer.frame.height / CGFloat(2)).scaledBy(x: contentsScale, y: contentsScale))

//      parentlayer.bounds = bounds
//      parentlayer.frame = bounds
//      parentlayer.masksToBounds = true
////      parentlayer.sublayers?.forEach({ layer in
////        layer.bounds = bounds
////      })
//
////      parentlayer.setNeedsLayout()


      if (type == ExportType.mp4) {

//        videolayer.frame = CGRect(origin: .zero, size: bounds.size)
//        parentlayer.setAffineTransform(CGAffineTransform.init(translationX: cropRect.size.width / contentsScale, y: (cropRect.size.height / contentsScale) + (cropRect.size.height - parentlayer.frame.size.height)).scaledBy(x: contentsScale, y: contentsScale))

        parentlayer.bounds = cropRect
        let y = parentlayer.bounds.origin.y + (cropRect.size.height * contentsScale)  * (parentlayer.anchorPoint.y )
        let x = parentlayer.bounds.origin.x + (cropRect.size.width * contentsScale) * parentlayer.anchorPoint.x
        parentlayer.position = CGPoint(x: x, y: y)
        parentlayer.setAffineTransform(CGAffineTransform(scaleX: contentsScale, y: contentsScale))


        let layercomposition = AVMutableVideoComposition()
        layercomposition.frameDuration = CMTime(value: 1, timescale: 30)
//        layercomposition.renderSize = CGSize(width: cropRect.size.width, height: max(cropRect.size.height, estimatedBounds.size.height) +  (cropRect.size.height - parentlayer.frame.size.height)).applying(.init(scaleX: contentsScale, y: contentsScale))
        layercomposition.renderSize = CGSize(width: parentlayer.bounds.size.width * contentsScale, height: parentlayer.bounds.size.height * contentsScale)
        layercomposition.animationTool = AVVideoCompositionCoreAnimationTool(
          postProcessingAsVideoLayer: videolayer, in: parentlayer)


        // instruction for watermark
        let instruction = AVMutableVideoCompositionInstruction()
        instruction.timeRange = CMTimeRangeMake(start: CMTime.zero, duration: CMTime(seconds: [duration, 0.01].max()!, preferredTimescale: 1000000))
        let layerinstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: videoTrack)
	        layerinstruction.setTransform(videoTrack.preferredTransform, at: CMTime.zero)
//        layerinstruction.setTransform(videoTrack.preferredTransform, at: .zero)
        instruction.layerInstructions = [layerinstruction] as [AVVideoCompositionLayerInstruction]
        layercomposition.instructions = [instruction] as [AVVideoCompositionInstructionProtocol]

//        layerinstruction.setCropRectangle(cropRect.applying(CGAffineTransform.identity.scaledBy(x: contentsScale, y: contentsScale)), at: .zero)


        // Use AVAssetExportSession to export video
        let assetExport =  AVAssetExportSession(asset: composition, presetName:AVAssetExportPresetHEVCHighestQuality)
        assetExport?.outputFileType = AVFileType.mp4
        assetExport?.outputURL = url
        assetExport?.shouldOptimizeForNetworkUse = false
        assetExport?.videoComposition = layercomposition



        assetExport?.exportAsynchronously(completionHandler: {
          switch assetExport!.status {
          case AVAssetExportSessionStatus.failed:
            print("failed")
            print(assetExport?.error ?? "unknown error")
            complete(nil)
          case AVAssetExportSessionStatus.cancelled:
            print("cancelled")
            print(assetExport?.error ?? "unknown error")
            complete(nil)
          default:
            print("Movie complete")
            complete(ContentExport(url: url, resolution: parentlayer.frame.size, type: type, duration: duration))
          }
        })
      } else {
        let fullImage = UIImage.image(from: parentlayer)!.sd_croppedImage(with: cropRect)!
        let imageData: NSData
        if (type == ExportType.png) {
          imageData = fullImage.pngData()! as NSData
        } else {
          imageData = fullImage.jpegData(compressionQuality: CGFloat(0.9))! as NSData
        }

        imageData.write(to: url, atomically: true)
        complete(ContentExport(url: url, resolution: cropRect.size, type: type, duration: duration))
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