//
//  yeetTests.swift
//  yeetTests
//
//  Created by Jarred WSumner on 10/22/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import XCTest
import Quick
import Nimble
import Foundation
import Promise

@testable import yeet


class ContentExportTest: QuickSpec {

  static let OPEN_VIDEOS = true

  func runVideoProducer(videoProducer: VideoProducer, bounds: CGRect, isServerOnly: Bool, exportURL: URL, scale: CGFloat) -> Promise<URL?> {
    return Promise<URL?>() { resolve, reject in
      if FileManager.default.fileExists(atPath: exportURL.path) {
        try! FileManager.default.removeItem(at: exportURL)
      }

      videoProducer.start(estimatedBounds: bounds, isServerOnly: isServerOnly, exportURL: exportURL, scale: scale) { response in
        guard let response = response else {
          fail("Empty")
          resolve(nil)
          return
        }

        guard response.count > 0 else {
          fail("Empty")
          resolve(nil)
          return
        }

        let error = response[0] as? Error


        if error != nil {
          fail(error!.localizedDescription)
          resolve(nil)
          return
        }

        if let exportDictionary = response[1] as? Dictionary<String, Any> {
          guard let uriString = exportDictionary["uri"] as? String  else {
            fail("\(exportDictionary) is invalid")
            resolve(nil)
            return
          }

          guard let uri = URL(string: uriString)  else {
            fail("\(uriString) is invalid")
            resolve(nil)
            return
          }

          let asset = AVURLAsset(url: uri)

          
          if asset.isPlayable {


            resolve(uri)
            return
          } else {
            fail("\(uriString) is invalid")

            resolve(nil)
            return
          }


        } else {
          fail("No content")
          resolve(nil)
        }

        resolve(nil)
      }
    }
  }

  override func spec() {
    describe("Hi Gif") {
      let fixture = Fixtures.hiGifTransparentPNGJSON
      let videoProducer = Fixtures.videoProducer(fixture: fixture)
      let estimatedBounds = CGRect.from(json: fixture["bounds"])
      let destination = Fixtures.hiGifTransparentPNGOutputURL!


      it("exports successfully") {

        waitUntil(timeout: 40.0) { done in
          self.runVideoProducer(videoProducer: videoProducer, bounds: estimatedBounds, isServerOnly: true, exportURL: destination, scale: CGFloat(1)).then { video in
            done()
          }
        }

      }

      it("@2x exports successfully") {
        let destination = Fixtures.hiGifTransparentPNGOutputURL2x!
        waitUntil(timeout: 40.0) { done in
          self.runVideoProducer(videoProducer: videoProducer, bounds: estimatedBounds, isServerOnly: true, exportURL: destination, scale: CGFloat(2)).then { video in
            done()
          }
        }

      }
    }



    describe("Two Videos + Transparent PNG") {
      let fixture = Fixtures.twoVideosTransparentPNGJSON
      let videoProducer = Fixtures.videoProducer(fixture: fixture)
      let estimatedBounds = CGRect.from(json: fixture["bounds"])
      let destination = Fixtures.twoVideosTransparentPNGOutputURL!


      it("exports successfully") {

        waitUntil(timeout: 40.0) { done in
          self.runVideoProducer(videoProducer: videoProducer, bounds: estimatedBounds, isServerOnly: true, exportURL: destination, scale: CGFloat(1)).then { video in
            done()
          }
        }

      }

      describe("@2x") {
        it("exports successfully") {
          let destination = Fixtures.twoVideosTransparentPNGOutputURL2x!
          waitUntil(timeout: 40.0) { done in
            self.runVideoProducer(videoProducer: videoProducer, bounds: estimatedBounds, isServerOnly: true, exportURL: destination, scale: CGFloat(2)).then { video in
              done()
            }
          }

        }
      }


    }
  }
}
