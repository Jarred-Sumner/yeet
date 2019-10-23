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
import PromiseKit



@testable import yeet



class ContentExportTest: QuickSpec {

  static let OPEN_VIDEOS = true

  func runVideoProducer(videoProducer: VideoProducer, bounds: CGRect, isServerOnly: Bool, exportURL: URL, scale: CGFloat) -> Promise<URL?> {
    return Promise<URL?>() { promise in
      videoProducer.start(estimatedBounds: bounds, isServerOnly: isServerOnly, exportURL: exportURL, scale: scale) { response in
        guard let response = response else {
          fail("Empty")
          promise.fulfill(nil)
          return
        }

        guard response.count > 0 else {
          fail("Empty")
          promise.fulfill(nil)
          return
        }

        let error = response[0] as? Error


        if error != nil {
          fail(error!.localizedDescription)
          promise.fulfill(nil)
          return
        }

        if let exportDictionary = response[1] as? Dictionary<String, Any> {
          guard let uriString = exportDictionary["uri"] as? String  else {
            fail("\(exportDictionary) is invalid")
            promise.fulfill(nil)
            return
          }

          guard let uri = URL(string: uriString)  else {
            fail("\(uriString) is invalid")
            promise.fulfill(nil)
            return
          }

          let asset = AVURLAsset(url: uri)

          if asset.isPlayable {


            promise.fulfill(uri)
            return
          } else {
            fail("\(uriString) is invalid")

            promise.fulfill(nil)
            return
          }


        } else {
          fail("No content")
          promise.fulfill(nil)
        }

        promise.fulfill(nil)
      }
    }
  }
  override func spec() {
    


    describe("Two Videos + Transparent PNG") {
      let fixture = Fixtures.twoVideosTransparentPNGJSON
      let videoProducer = Fixtures.videoProducer(fixture: fixture)
      let estimatedBounds = CGRect.from(json: fixture["bounds"])
      let destination = Fixtures.twoVideosTransparentPNGOutputURL!

      if FileManager.default.fileExists(atPath: destination.path) {
        try! FileManager.default.removeItem(at: destination)
      }

      it("exports successfully") {

        waitUntil(timeout: 20.0) { done in
          firstly {
            self.runVideoProducer(videoProducer: videoProducer, bounds: estimatedBounds, isServerOnly: true, exportURL: destination, scale: CGFloat(1))
          }.ensure {
            done()
          }
        }

      }
    }
  }
}
