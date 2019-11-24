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
    if FileManager.default.fileExists(atPath: exportURL.path) {
      try! FileManager.default.removeItem(at: exportURL)
    }

    return videoProducer.start(estimatedBounds: bounds, isServerOnly: isServerOnly, exportURL: exportURL, scale: scale).then { response in
      return response.url
    }.catch { error in
      fail(error.localizedDescription)
    }
  }

  override func spec() {
    describe("Money Screenshot") {
     let fixture = Fixtures.moneyJSON
      let videoProducer = Fixtures.videoProducer(fixture: fixture)
      let estimatedBounds = CGRect.from(json: fixture["bounds"])
      let destination = Fixtures.moneyOutputURL!


      it("exports successfully") {

        waitUntil(timeout: 40.0) { done in
          self.runVideoProducer(videoProducer: videoProducer, bounds: estimatedBounds, isServerOnly: true, exportURL: destination, scale: CGFloat(1)).then { video in
            done()
          }
        }

      }

      it("@2x exports successfully") {
        let destination = Fixtures.moneyOutputURL2x!
        waitUntil(timeout: 40.0) { done in
          self.runVideoProducer(videoProducer: videoProducer, bounds: estimatedBounds, isServerOnly: true, exportURL: destination, scale: CGFloat(2)).then { video in
            done()
          }
        }

      }
    }


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
