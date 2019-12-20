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

fileprivate let ContentExportThumbnailSize = CGSize(width: 80, height: 80)

struct ContentExportThumbnail {
  let uri: String
  let width: Double
  let height: Double
  let type: ExportType

  init?(asset: AVURLAsset) {
    let imageGenerator = AVAssetImageGenerator(asset: asset)
    imageGenerator.maximumSize = ContentExportThumbnailSize.applying(CGAffineTransform.init(scaleX: CGFloat(2), y: CGFloat(2)))

     do {
       let cgImage = try imageGenerator.copyCGImage(at: .zero, actualTime: nil)
       let image = UIImage(cgImage: cgImage).sd_resizedImage(with: ContentExportThumbnailSize, scaleMode: .aspectFill)!
       let data = image.jpegData(compressionQuality: 0.9)!

       let thumbnailUrl = VideoProducer.generateExportURL(type: .jpg)
       try data.write(to: thumbnailUrl)

       self.init(uri: thumbnailUrl.absoluteString, width: Double(image.size.width), height:  Double(image.size.height), type: .jpg)
     } catch {
      return nil
     }
  }


  init(uri: String, width: Double, height: Double, type: ExportType) {
    self.uri = uri
    self.width = width
    self.height = height
    self.type = type
  }

  func dictionaryValue() -> Dictionary<String, Any> {
    return [
      "uri": self.uri as NSString,
      "width": NSNumber(value: self.width),
      "height": NSNumber(value: self.height),
      "type": type.rawValue,
    ]
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
      let group = DispatchGroup()
      group.enter()

      DispatchQueue.main.async {
        let view =  image.nodeView!
        layer.bounds = CGRect(origin: .zero, size: _frame.size)
        layer.setRotatableFrame(frame: frame, rotation: rotation)

        setupInnerLayer(layer: layer, block: block)

        let format: UIGraphicsImageRendererFormat
        if #available(iOS 13.0, *) {
          format = UIGraphicsImageRendererFormat.init(for: .current)
        } else {
          format = UIGraphicsImageRendererFormat.init()
        }


        format.preferredRange = .standard


        format.opaque = false
        layer.contentsGravity = .center


        let renderer = UIGraphicsImageRenderer.init(bounds: view.bounds, format: format)


//        let _view =  block?.nodeFrame != nil ?  view.subviews.first! : view
//
//
//        let _image = _view.caSnapshot(scale: scale * CGFloat(block!.position.scale.doubleValue), isOpaque: false, layer: .default)!

        let _image = view.caSnapshot(scale: scale * CGFloat(block!.position.scale.doubleValue), isOpaque: false, layer: .default)!


        let image = _image.cgImage!

        layer.contents = image
        layer.isOpaque = false
        layer.masksToBounds = false

        layer.contentsScale = CGFloat(1)






        Log.info("""
          Bounds: \(view.bounds)
          Content Scale: \(layer.contentsScale)
          Frame: \(frame)
          Image: \(image.width)x\(image.height)

        """)
        layer.backgroundColor = UIColor.clear.cgColor

        group.leave()
      }

      group.wait()

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

      if (frame.origin.y < minY) {
       minY = frame.origin.y
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
      let contentsScale = min(scale ?? UIScreen.main.scale, CGFloat(1.5))



      let maxRenderBounds = estimatedBounds.normalize(scale: contentsScale)
      var renderSize = CGSize(width: estimatedBounds.width, height: .zero)

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
              max(renderedFrame.topRight.x, cropWidth),
              maxRenderBounds.width
            )

            maxDuration = max(maxDuration, block.totalDuration)

            let _cropHeight = min(
              max(renderedFrame.bottomCenter.y, cropHeight),
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




      var renderSizeScale = CGFloat(1)
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

              let ___rect = AVMakeRect(aspectRatio: _asset.resolution, insideRect: CGRect(origin: .zero, size: frame.size))

              let scaleX = (___rect.width / _asset.resolution.width)
              let scaleY = (___rect.height / _asset.resolution.height)

              var _videoTransform = CGAffineTransform
                .identity
                .scaledBy(x: scaleX, y: scaleY)

              let videoTransform = _videoTransform
              let videoTranslateTransform = CGAffineTransform.init(translationX: .zero, y: videoYPositions[block.id]!)
              let layerTransform = CGAffineTransform.identity.concatenating(vidAsset.preferredTransform).concatenating(videoTransform).concatenating(videoTranslateTransform)

              let videoRect = CGRect(origin: .zero, size: vidAsset.naturalSize).applying(layerTransform)

              let videoLayer = CALayer()
              let interRect = videoContainerRect.intersection(videoRect)
               videoLayer.contentsScale = scaleX



               let view = video.view



                let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: track)
                layerInstruction.setTransform(layerTransform, at: .zero)
                instruction.layerInstructions.append(layerInstruction)
              track.preferredTransform = vidAsset.preferredTransform
                track.naturalTimeScale = vidAsset.naturalTimeScale


                if (CMTimeGetSeconds(layercomposition.frameDuration) > CMTimeGetSeconds(vidAsset.minFrameDuration)) {
                  layercomposition.frameDuration = vidAsset.minFrameDuration
                }



              setupInnerLayer(layer: videoLayer, block: block)

              videoLayer.isGeometryFlipped = false
              videoLayer.backgroundColor = UIColor.clear.cgColor
              videoLayer.masksToBounds = false


              if self.SHOW_BORDERS {
                videoLayer.borderWidth = CGFloat(2)
                videoLayer.borderColor = UIColor.red.cgColor
              }



              videoLayer.backgroundColor = UIColor.clear.cgColor

              videoLayer.bounds = CGRect(origin: ___rect.origin, size: ___rect.size)
              videoLayer.setRotatableFrame(frame: frame, rotation: CGFloat(block.position.rotate.doubleValue))




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

                videoLayer.contentsGravity = video.videoView!.playerLayer.videoGravity.contentsGravity





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
  - View: \(view?.bounds),\(view?.frame)
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



        let canSkipCrop = renderSize == cropRect.size && cropRect.origin == .zero
        assetExport.outputFileType = AVFileType.mp4
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
                  fullAsset.crop(to: cropRect, dest: url).then(on: VideoProducer.contentExportQueue) { asset in
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

        let thumbnailSize = ContentExportThumbnailSize
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


extension CGAffineTransform {
    init(from: CGRect, toRect to: CGRect) {
        self.init(translationX: to.midX-from.midX, y: to.midY-from.midY)
        self = self.scaledBy(x: to.width/from.width, y: to.height/from.height)
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

extension UIImage {
  public func hasAlpha() -> Bool {
    guard let alpha: CGImageAlphaInfo = self.cgImage?.alphaInfo else { return false }
    return alpha == .first || alpha == .last || alpha == .premultipliedFirst || alpha == .premultipliedLast
  }

  func rotate(radians: Float) -> UIImage? {
       var newSize = CGRect(origin: CGPoint.zero, size: self.size).applying(CGAffineTransform(rotationAngle: CGFloat(radians))).size
       // Trim off the extremely small float value to prevent core graphics from rounding it up
       newSize.width = floor(newSize.width)
       newSize.height = floor(newSize.height)

       UIGraphicsBeginImageContextWithOptions(newSize, !hasAlpha(), self.scale)
       let context = UIGraphicsGetCurrentContext()!

       // Move origin to middle
       context.translateBy(x: newSize.width/2, y: newSize.height/2)
       // Rotate around middle
       context.rotate(by: CGFloat(radians))
       // Draw the image at its center
       self.draw(in: CGRect(x: -self.size.width/2, y: -self.size.height/2, width: self.size.width, height: self.size.height))

       let newImage = UIGraphicsGetImageFromCurrentImageContext()
       UIGraphicsEndImageContext()

       return newImage
   }
}

extension BinaryInteger {
    var degreesToRadians: CGFloat { return CGFloat(self) * .pi / 180 }
}

extension FloatingPoint {
    var degreesToRadians: Self { return self * .pi / 180 }
    var radiansToDegrees: Self { return self * 180 / .pi }
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


extension UIView {

   public func snapshot(scale: CGFloat = 0, isOpaque: Bool = false, afterScreenUpdates: Bool = true) -> UIImage? {
      UIGraphicsBeginImageContextWithOptions(bounds.size, isOpaque, scale)
      drawHierarchy(in: bounds, afterScreenUpdates: afterScreenUpdates)
      let image = UIGraphicsGetImageFromCurrentImageContext()
      UIGraphicsEndImageContext()
      return image
   }


   public enum CASnapshotLayer: Int {
      case `default`, presentation, model
   }

   /// The method drawViewHierarchyInRect:afterScreenUpdates: performs its operations on the GPU as much as possible
   /// In comparison, the method renderInContext: performs its operations inside of your app’s address space and does
   /// not use the GPU based process for performing the work.
   /// https://stackoverflow.com/a/25704861/1418981
   public func caSnapshot(scale: CGFloat = 0, isOpaque: Bool = false,
                          layer layerToUse: CASnapshotLayer = .default) -> UIImage? {
      var isSuccess = false
      UIGraphicsBeginImageContextWithOptions(bounds.size, isOpaque, scale)
      if let context = UIGraphicsGetCurrentContext() {
         isSuccess = true
         switch layerToUse {
         case .default:
            layer.render(in: context)
         case .model:
            layer.model().render(in: context)
         case .presentation:
            layer.presentation()?.render(in: context)
         }
      }
      let image = UIGraphicsGetImageFromCurrentImageContext()
      UIGraphicsEndImageContext()
      return isSuccess ? image : nil
   }
}


extension UIImage {
    func cropImageByAlpha() -> UIImage {
        let cgImage = self.cgImage
        let context = createARGBBitmapContextFromImage(inImage: cgImage!)
        let height = cgImage!.height
        let width = cgImage!.width

        var rect: CGRect = CGRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height))
        context?.draw(cgImage!, in: rect)

        let pixelData = self.cgImage!.dataProvider!.data
        let data: UnsafePointer<UInt8> = CFDataGetBytePtr(pixelData)

        var minX = width
        var minY = height
        var maxX: Int = 0
        var maxY: Int = 0

        //Filter through data and look for non-transparent pixels.
        for y in 0..<height {
            for x in 0..<width {
                let pixelIndex = (width * y + x) * 4 /* 4 for A, R, G, B */

                if data[Int(pixelIndex)] != 0 { //Alpha value is not zero pixel is not transparent.
                    if (x < minX) {
                        minX = x
                    }
                    if (x > maxX) {
                        maxX = x
                    }
                    if (y < minY) {
                        minY = y
                    }
                    if (y > maxY) {
                        maxY = y
                    }
                }
            }
        }

        rect = CGRect( x: CGFloat(minX), y: CGFloat(minY), width: CGFloat(maxX-minX), height: CGFloat(maxY-minY))
        let imageScale:CGFloat = self.scale
        let cgiImage = self.cgImage?.cropping(to: rect)
        return UIImage(cgImage: cgiImage!, scale: imageScale, orientation: self.imageOrientation)
    }

    private func createARGBBitmapContextFromImage(inImage: CGImage) -> CGContext? {

        let width = cgImage!.width
        let height = cgImage!.height

        let bitmapBytesPerRow = width * 4
        let bitmapByteCount = bitmapBytesPerRow * height

        let colorSpace = CGColorSpaceCreateDeviceRGB()
        if colorSpace == nil {
            return nil
        }

        let bitmapData = malloc(bitmapByteCount)
        if bitmapData == nil {
            return nil
        }

        let context = CGContext (data: bitmapData, width: width, height: height, bitsPerComponent: 8, bytesPerRow: bitmapBytesPerRow, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue)

        return context
    }
}

extension CGRect {
  /// Sets and returns top left corner
  public var topLeft: CGPoint {
    get { return origin }
    set { origin = newValue }
  }

  /// Sets and returns top center point
  public var topCenter: CGPoint {
    get { return CGPoint(x: midX, y: minY) }
    set { origin = CGPoint(x: newValue.x - width / 2,
                           y: newValue.y) }
  }

  /// Returns top right corner
  public var topRight: CGPoint {
    get { return CGPoint(x: maxX, y: minY) }
    set { origin = CGPoint(x: newValue.x - width,
                           y: newValue.y) }
  }

  /// Returns center left point
  public var centerLeft: CGPoint {
    get { return CGPoint(x: minX, y: midY) }
    set { origin = CGPoint(x: newValue.x,
                           y: newValue.y - height / 2) }
  }

  /// Sets and returns center point
  public var center: CGPoint {
    get { return CGPoint(x: midX, y: midY) }
    set { origin = CGPoint(x: newValue.x - width / 2,
                           y: newValue.y - height / 2) }
  }

  /// Returns center right point
  public var centerRight: CGPoint {
    get { return CGPoint(x: maxX, y: midY) }
    set { origin = CGPoint(x: newValue.x - width,
                           y: newValue.y - height / 2) }
  }

  /// Returns bottom left corner
  public var bottomLeft: CGPoint {
    get { return CGPoint(x: minX, y: maxY) }
    set { origin = CGPoint(x: newValue.x,
                           y: newValue.y - height) }
  }

  /// Returns bottom center point
  public var bottomCenter: CGPoint {
    get { return CGPoint(x: midX, y: maxY) }
    set { origin = CGPoint(x: newValue.x - width / 2,
                           y: newValue.y - height) }
  }

  /// Returns bottom right corner
  public var bottomRight: CGPoint {
    get { return CGPoint(x: maxX, y: maxY) }
    set { origin = CGPoint(x: newValue.x - width,
                           y: newValue.y - height) }
  }
}

// Exposed fields without indirection
extension CGRect {
  /// Returns origin x
  public var x: CGFloat {
    get { return origin.x }
    set { origin.x = newValue }
  }

  /// Returns origin y
  public var y: CGFloat {
    get { return origin.y }
    set { origin.y = newValue }
  }

  /// Returns size width
  public var width: CGFloat {
    get { return size.width } // normally built-in
    set { size.width = newValue }
  }

  /// Returns size height
  public var height: CGFloat {
    get { return size.height } // normally built-in
    set { size.height = newValue }
  }
}

// Rectangle Properties
extension CGRect {
  /// Return rectangle's area
  public var area: CGFloat { return width * height }

  /// Return rectangle's diagonal extent
  public var diagonalExtent: CGFloat { return hypot(width, height) }
}

// Moving Rects
extension CGRect {

  /// Returns rect translated to origin
  public var zeroed: CGRect {
    return CGRect(origin: .zero, size: size)
  }

  /// Constructs a rectangle around a center with the given size
  public static func around(_ center: CGPoint, size: CGSize) -> CGRect {
    var rect = CGRect(origin: .zero, size: size)
    rect.center = center
    return rect
  }

  /// Returns rect centered around point
  func around(_ center: CGPoint) -> CGRect {
    return CGRect.around(center, size: size)
  }

  /// Returns rect with coaligned centers
  public func centered(in mainRect: CGRect) -> CGRect {
    return CGRect.around(mainRect.center, size: size)
  }

}

// Fitting and Filling
extension CGRect {
  /// Calculates the fitting aspect scale between a source size
  /// and a destination rectangle
  public func fittingAspect(of sourceSize: CGSize) -> CGFloat {
    let scaleW = width / sourceSize.width
    let scaleH = height / sourceSize.height
    return fmin(scaleW, scaleH)
  }

  /// Calculates the filling aspect scale between a source size
  /// and a destination rectangle
  public func fillingAspect(of sourceSize: CGSize) -> CGFloat {
    let scaleW = width / sourceSize.width
    let scaleH = height / sourceSize.height
    return fmax(scaleW, scaleH)
  }

  /// Fitting into a destination rectangle
  public func fitting(_ destination: CGRect) -> CGRect {
    let aspect = destination.fittingAspect(of: size)
    let targetSize = CGSize(width: width * aspect, height: height * aspect)
    return CGRect.around(destination.center, size: targetSize)
  }

  /// Filling a destination rectangle
  public func filling(_ destination: CGRect) -> CGRect {
    let aspect = destination.fillingAspect(of: size)
    let targetSize = CGSize(width: width * aspect, height: height * aspect)
    return CGRect.around(destination.center, size: targetSize)
  }
}
