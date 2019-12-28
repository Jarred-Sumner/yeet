//
//  MediaPlayerShare.swift
//  yeet
//
//  Created by Jarred WSumner on 12/16/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit
import Photos
import SCSDKCreativeKit

class MediaPlayerShare: NSObject {
  static let snapchatApi = SCSDKSnapAPI()
  enum Network : String {
    case instagram = "instagram"
    case instagramStory = "instagramStory"
    case snapchat = "snapchat"

    func url(_ id: String? = nil) -> URL {
      switch (self) {
        case .instagram:
          if id != nil {
            return URL(string: "instagram://library?LocalIdentifier=\(id!)")!
          } else {
            return URL(string: "instagram://")!
          }
      case .instagramStory:
        return URL(string: "instagram-stories://share")!
      case .snapchat:
        return URL(string: "snapchat://")!
      }

    }
  }






  static func share(network: Network? = nil, mediaPlayer: MediaPlayer) -> Bool {
    let isImage = mediaPlayer.imageSource != nil
    let isVideo = mediaPlayer.videoSource != nil
    guard isImage || isVideo else {
      return false
    }



    var data: NSData? = nil
    let type = mediaPlayer.sharableMimeType
    let path = try! (network == nil ? FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: false) : FileManager.default.temporaryDirectory).appendingPathComponent("share").appendingPathExtension(type.fileExtension())
    if ![.instagramStory].contains(network) {
      do {
        data = mediaPlayer.sharableData! as NSData


        try data!.write(to: path)
      } catch {
        return false
      }
    }


    if let _network = network {
      guard UIApplication.shared.canOpenURL(_network.url()) else {
        return false
      }

      switch _network {
      case .instagramStory:
        guard let data = mediaPlayer.sharableData else {
             return false
           }

           let type = mediaPlayer.sharableMimeType
        var pasteboardItems: [String: Any] = [:]
        if isImage {
          pasteboardItems["com.instagram.sharedSticker.backgroundImage"] = data
        } else if isVideo {
          pasteboardItems["com.instagram.sharedSticker.backgroundVideo"] = data
        }
        UIPasteboard.general.setItems([pasteboardItems], options: [
          UIPasteboard.OptionsKey.expirationDate: Date.init(timeIntervalSinceNow: 60 * 5)
        ])

        UIApplication.shared.open(_network.url(), options: [:], completionHandler: nil)
        return true
      case .instagram:
           let type = mediaPlayer.sharableMimeType
           var request: PHAssetChangeRequest? = nil
           var localIdentifier: String? = nil
           do {
              try PHPhotoLibrary.shared().performChangesAndWait({
                if isImage {
                  request = PHAssetChangeRequest.creationRequestForAssetFromImage(atFileURL: path)
                } else if isVideo {
                  request = PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: path)
                }

                localIdentifier = request?.placeholderForCreatedAsset?.localIdentifier
              })
           } catch {
              return false
            }

           guard let id = localIdentifier else {
              return false
           }


           UIApplication.shared.open(_network.url(id))
            return true

      case .snapchat:



        if isImage {
         let snap = SCSDKPhotoSnapContent(snapPhoto: SCSDKSnapPhoto(imageUrl: path))
          DispatchQueue.main.async {
            snapchatApi.startSending(snap) { error in
              if error != nil {
                Log.error("sned photo error \(error))")
              }
            }
          }
        } else if isVideo {
          let snap = SCSDKVideoSnapContent(snapVideo: SCSDKSnapVideo(videoUrl: path))

          DispatchQueue.main.async {
            snapchatApi.startSending(snap) { error in
              if error != nil {
                Log.error("sned video error \(error))")
              }
            }
          }
        }
        return true

      }
    } else {


      guard let extensionItemSource = XExtensionItemSource.init(data: data! as Data, typeIdentifier: type.utiType()) else {
        return false
      }



      DispatchQueue.main.async {
        let activityVC = UIActivityViewController.init(activityItems: [extensionItemSource], applicationActivities: nil)
        mediaPlayer.reactViewController()?.present(activityVC, animated: true, completion: nil)
      }

      return true
    }
  }
}
