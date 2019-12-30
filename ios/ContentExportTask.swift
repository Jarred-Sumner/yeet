//
//  ContentExportTask.swift
//  yeet
//
//  Created by Jarred WSumner on 12/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

class ContentExportTask : NSObject {
  static var cropUnitCount = Int64(35)
  static var editUnitCount = Int64(60)
  static var composeUnitCount = Int64(5)

  dynamic var composeProgress: Progress? = nil
  dynamic var exportProgress: ExportSessionProgress? = nil
  dynamic var cropProgress: ExportSessionProgress? = nil
  var error: Error? = nil
  dynamic var totalProgress = Progress(totalUnitCount: 100)

  lazy var dateFormatter: DateFormatter = {
    let dateFormatter = DateFormatter()
    dateFormatter.timeStyle = .short
    dateFormatter.dateStyle = .none
    dateFormatter.locale = Locale.current
    dateFormatter.doesRelativeDateFormatting = true

    return dateFormatter
  }()

  enum Step: String {
    case preparing = "Preparing"
    case composing = "Measuring"
    case exporting = "Composing"
    case cropping = "Resizing"
  }

  var detailLabel : String {
    if let remaining = totalProgress.estimatedTimeRemaining {
      return "\(dateFormatter.string(from: Date(timeIntervalSinceNow: remaining))) left"
    } else {
      return "\(Int(totalProgress.fractionCompleted * 100.0))%"
    }
  }

  var label : String {
    return step.rawValue
  }

  var step: Step = Step.preparing

  dynamic var imageBuildProgress: Progress? = nil

  func startImageBuild() {
    self.imageBuildProgress = Progress(totalUnitCount: 3)
    self.totalProgress.addChild(self.imageBuildProgress!, withPendingUnitCount: ContentExportTask.editUnitCount + ContentExportTask.composeUnitCount)
    self.step = .exporting
  }

  func incrementImageBuild() {
    guard let imageBuild = self.imageBuildProgress else {
      return
    }

    imageBuild.completedUnitCount = min(imageBuild.completedUnitCount + 1, imageBuild.totalUnitCount)
  }


  func addExportSession(exportSession: AVAssetExportSession, needsCrop: Bool) {
    self.exportProgress = ExportSessionProgress(exportSession: exportSession)
    self.totalProgress.addChild(self.exportProgress!.progress, withPendingUnitCount: needsCrop ? ContentExportTask.editUnitCount : ContentExportTask.editUnitCount + ContentExportTask.cropUnitCount)
    self.step = .exporting
  }

  func addCropExportSession(exportSession: AVAssetExportSession) {
    self.cropProgress = ExportSessionProgress(exportSession: exportSession)
    self.totalProgress.addChild(self.cropProgress!.progress, withPendingUnitCount: ContentExportTask.cropUnitCount)
    self.step = .cropping
  }

  func incrementCompose() {
    guard let composeProgress = self.composeProgress else {
      return
    }

    composeProgress.completedUnitCount = min(max(composeProgress.completedUnitCount, 0) + 1, composeProgress.totalUnitCount)
  }

  func addComposeProgress(resourceCount: Int64) {
    let composeProgress = Progress(totalUnitCount: resourceCount * 2)
    self.totalProgress.addChild(composeProgress, withPendingUnitCount: ContentExportTask.composeUnitCount)
    self.composeProgress = composeProgress

    self.step = .composing
  }



  override init() {
    totalProgress.isCancellable = true
  }
}
