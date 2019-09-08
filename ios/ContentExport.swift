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
    animation.values = frames.map {$0.cgImage!}
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



  static func export(url: URL, type: ExportType, estimatedBounds: CGRect, duration: TimeInterval, resources: Array<ImageBlockResource>, complete: @escaping(ContentExport?)->()) {
    do {
      let composition = AVMutableComposition()
      let vidAsset = AVURLAsset(url: Bundle.main.url(forResource: "blank_1080p", withExtension: ".mp4")!)

      let videoTrack = vidAsset.tracks(withMediaType: AVMediaType.video)[0]


      let vid_timerange = CMTimeRangeMake(start: CMTime.zero, duration: CMTime(seconds: [duration, 0.01].max()! ))

      let track = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)
      try! track!.insertTimeRange(vid_timerange, of: videoTrack, at: .zero)

      let contentsScale = type == ExportType.mp4 ? CGFloat(1) : UIScreen.main.scale


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

      parentlayer.contentsGravity = type == ExportType.mp4 ? .topLeft   : .resize

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
        layer.frame = CGRect(x: .zero, y: .zero, width: CGFloat(block.dimensions.width.doubleValue), height:  CGFloat(block.dimensions.height.doubleValue))
        layer.bounds = estimatedBounds
        layer.masksToBounds = true
        layer.cornerRadius = CGFloat(block.dimensions.cornerRadius.doubleValue)
        layer.allowsEdgeAntialiasing = true
        layer.contentsScale = contentsScale
        layer.contentsGravity = .resize
        layer.edgeAntialiasingMask = CAEdgeAntialiasingMask(rawValue: 15) // all sides


        let scaleX = CGFloat(block.dimensions.maxX.doubleValue - block.dimensions.x.doubleValue) / layer.frame.width
        let scaleY = CGFloat(block.dimensions.maxY.doubleValue - block.dimensions.y.doubleValue) / layer.frame.height


        layer.setAffineTransform(CGAffineTransform.identity.scaledBy(x: scaleX, y: scaleY).concatenating(block.position.transform(flipY: false  )))

        let image = block.value.image.firstFrame;

        layer.contents = image.cgImage!

        if block.value.image.isAnimated {
          var images: Array<UIImage> = []

          for frameIndex in 0...block.value.image.animatedImageFrameCount - 1 {
            let image = block.value.image.animatedImageFrame(at: frameIndex)!

            images.append(image)
          }

          layer.add(getFramesAnimation(frames: images, duration: block.totalDuration), forKey: nil)
        }

        parentlayer.addSublayer(layer)
        let superRect = parentlayer.convert(layer.frame, from: layer)

        if (superRect.maxY > maxY) {
          maxY = superRect.maxY
        }

        if (superRect.minY < minY) {
          minY = superRect.minY
        }
      }

      let bounds = CGRect(x: .zero, y: minY, width: estimatedBounds.width, height: maxY - minY )

//      parentlayer.bounds = bounds
//      parentlayer.frame = bounds
//      parentlayer.masksToBounds = true
////      parentlayer.sublayers?.forEach({ layer in
////        layer.bounds = bounds
////      })
//
////      parentlayer.setNeedsLayout()


      if (type == ExportType.mp4) {
        parentlayer.bounds = bounds
//        videolayer.frame = CGRect(origin: .zero, size: bounds.size)

        let layercomposition = AVMutableVideoComposition()
        layercomposition.frameDuration = CMTime(value: 1, timescale: 30)
        layercomposition.renderSize = CGSize(width: bounds.maxX, height: bounds.maxY)
        layercomposition.animationTool = AVVideoCompositionCoreAnimationTool(
          postProcessingAsVideoLayer: videolayer, in: parentlayer)

        // instruction for watermark
        let instruction = AVMutableVideoCompositionInstruction()
        instruction.timeRange = CMTimeRangeMake(start: CMTime.zero, duration: CMTime(seconds: [duration, 0.01].max()!, preferredTimescale: 1000000))
        let layerinstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: videoTrack)
        layerinstruction.setTransform(videoTrack.preferredTransform.translatedBy(x: .zero, y: (max(bounds.maxY, estimatedBounds.maxY) - min(bounds.maxY, estimatedBounds.maxY)) / CGFloat(2)), at: CMTime.zero)
        layerinstruction.setTransform(videoTrack.preferredTransform, at: .zero)
        instruction.layerInstructions = [layerinstruction] as [AVVideoCompositionLayerInstruction]
        layercomposition.instructions = [instruction] as [AVVideoCompositionInstructionProtocol]



        // Use AVAssetExportSession to export video
        let assetExport = AVAssetExportSession(asset: composition, presetName:AVAssetExportPresetHEVCHighestQuality)
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

            PHPhotoLibrary.shared().performChanges({
              PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: url)
            })

            complete(ContentExport(url: url, resolution: bounds.size, type: type, duration: duration))
          }
        })
      } else {
        let fullImage = UIImage.image(from: parentlayer)!.sd_croppedImage(with: bounds)!
        let imageData: NSData
        if (type == ExportType.png) {
          imageData = fullImage.pngData()! as NSData
        } else {
          imageData = fullImage.jpegData(compressionQuality: CGFloat(0.9))! as NSData
        }

        imageData.write(to: url, atomically: true)
        PHPhotoLibrary.shared().performChanges({
          PHAssetChangeRequest.creationRequestForAssetFromImage(atFileURL: url)
        })
        complete(ContentExport(url: url, resolution: bounds.size, type: type, duration: duration))
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
