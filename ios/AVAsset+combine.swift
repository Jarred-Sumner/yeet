import Foundation
import UIKit
import AVFoundation
import PromiseKit
import SwiftyBeaver

extension AVAsset {
  static func combine(ids: Array<String>, videos: Array<AVAsset>, frames: Array<CGRect>, rotations: Array<CGFloat>, scale: CGFloat, maxDuration: Double, bounds: CGRect) -> Promise<CombinedAsset> {
    let composition = AVMutableComposition()
    let videoComposition = AVMutableVideoComposition()
    let instruction = AVMutableVideoCompositionInstruction()

    var _maxDuration = 0.0

    videos.forEach { asset in
      let _duration = CMTimeGetSeconds(asset.duration)

      if _duration > _maxDuration {
        _maxDuration = _duration
      }
    }

    let timeRange = CMTimeRangeMake(start: CMTime.zero, duration: CMTime(seconds: _maxDuration))
    instruction.timeRange = timeRange

    var minFPS = 60.0
    var x = CGFloat.zero
    var y = CGFloat.zero
    var maxWidth = CGFloat.zero
    var offsets: CombinedAsset.SpriteSheet = [:]
    var index = 0
    videos.forEach {asset in
      let vidTrack = asset.tracks(withMediaType: .video).first!
      guard let track = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
        return
      }
      let frame = frames[index]
      let rotation = rotations[index]

      try! track.insertTimeRange(vidTrack.timeRange, of: vidTrack, at: vidTrack.timeRange.start)

      let layer = AVMutableVideoCompositionLayerInstruction.init(assetTrack: track)

      let resizeScale = (frame.width / vidTrack.naturalSize.width)

      let transform = CGAffineTransform.identity.translatedBy(x: frame.origin.x, y: y).scaledBy(x: resizeScale, y: resizeScale)
      layer.setTransform(transform, at: .zero)
//      layer.setCropRectangle(frame, at: .zero)

      offsets[ids[index]] = CGRect(origin: CGPoint(x: frame.origin.x, y: y), size: vidTrack.naturalSize).applying(transform)
      y = frame.size.height + y

      maxWidth = max(frame.size.width, maxWidth)

      if (Double(vidTrack.nominalFrameRate) < minFPS) {
        minFPS = Double(vidTrack.nominalFrameRate)
      }

      instruction.layerInstructions.append(layer)
      index = index + 1
    }

    videoComposition.frameDuration = CMTimeMake(value: 1, timescale: 30);
    videoComposition.renderSize = CGSize(width: maxWidth, height: y)
    videoComposition.instructions = [instruction]

    var presetName = AVAssetExportPreset1920x1080

    if #available(iOS 13.0, *) {
      presetName = AVAssetExportPreset1920x1080
    }

    SwiftyBeaver.info("""
Combining \(videos.count) videos
  renderSize:     \(videoComposition.renderSize)
  frameDuration:  \(videoComposition.frameDuration)
  IDs:            \(ids)
""")

    return Promise<CombinedAsset>() { seal in
      guard let session = AVAssetExportSession(asset: composition, presetName: presetName) else {
        seal.reject(NSError(domain: "com.codeblogcorp.yeet", code: -006, userInfo: nil))
        return
      }

      session.timeRange = CMTimeRange(start: .zero, duration: CMTime(seconds: maxDuration, preferredTimeScale: CMTimeScale(NSEC_PER_SEC)))
      session.shouldOptimizeForNetworkUse = false
      session.outputFileType = AVFileType.mp4

      session.videoComposition = videoComposition
      session.outputURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString.appending(".mp4"))
      session.exportAsynchronously(completionHandler: {
        if session.status == AVAssetExportSession.Status.completed {
          let asset = AVURLAsset.init(url: session.outputURL!)
          let track = asset.tracks(withMediaType: .video).first!
          let widthScale = track.naturalSize.width / videoComposition.renderSize.width
          let heightScale = track.naturalSize.height / videoComposition.renderSize.height

          let _offsets = offsets.mapValues { rect in
            return rect.applying(CGAffineTransform.init(
              scaleX: widthScale, y: heightScale
            ))
          }

              SwiftyBeaver.info("""
          Combined \(videos.count) videos

                Size:     \(videoComposition.renderSize)
                Success?: \(session.status == AVAssetExportSession.Status.completed)
                Path:     \(session.outputURL!.absoluteString)
                Duration: \(CMTimeGetSeconds(session.timeRange.duration))
                Offsets:  \(_offsets)

          """)
          seal.fulfill(CombinedAsset(asset: asset, offsets: offsets))
        } else {
          seal.reject(session.error ?? NSError(domain: "com.codeblogcorp.yeet", code: -007, userInfo: nil))
        }
      })
    }
  }
}


func CGAffineTransformFromRectToRect(fromRect: CGRect, toRect: CGRect) -> CGAffineTransform {
    let sx  = toRect.size.width/fromRect.size.width
    let sy  = toRect.size.height/fromRect.size.height

  let scale = CGAffineTransform(scaleX: sx, y: sy)

    let heightDiff = fromRect.size.height - toRect.size.height
    let widthDiff = fromRect.size.width - toRect.size.width

    let dx = toRect.origin.x - widthDiff / 2 - fromRect.origin.x
    let dy = toRect.origin.y - heightDiff / 2 - fromRect.origin.y

  let trans = CGAffineTransform(translationX: dx, y: dy)
  return scale.concatenating(trans)
}
