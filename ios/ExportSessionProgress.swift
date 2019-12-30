//
//  ContentExportTask.swift
//  yeet
//
//  Created by Jarred WSumner on 12/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

class ExportSessionProgress : NSObject, ProgressReporting {
  static let updateInterval = 0.2
  var progress: Progress
  var exportSession: AVAssetExportSession? = nil
  var exportStatusObserver: NSKeyValueObservation? = nil
  var updateTimer: RepeatingTimer? = nil

  init(exportSession: AVAssetExportSession) {
    self.exportSession = exportSession
    progress = Progress(totalUnitCount: 100)
    super.init()

    progress.isCancellable = true
    progress.isPausable = false

    progress.cancellationHandler = { [weak exportSession] in
      if exportSession?.status == .exporting {
        exportSession?.cancelExport()
      }
    }

    exportStatusObserver = exportSession.observe(\AVAssetExportSession.status) { [weak self] exportSession, changes in
      let status = exportSession.status
      if (status == .cancelled || status == .failed) && !(self?.progress.isCancelled ?? false) {
        self?.progress.cancel()
        self?.clearObservers()
      } else if status == .completed {
        self?.progress.completedUnitCount = 100
        self?.clearObservers()
      } else if status == .exporting {
        self?.updateTimer?.suspend()

        let updateTimer = RepeatingTimer(timeInterval: ExportSessionProgress.updateInterval) { [weak self]  in
          self?.update()
        }

        updateTimer.resume()
        self?.updateTimer = updateTimer
      }

    }
  }

  func update() {
    guard let exportSession = self.exportSession else {
      self.updateTimer?.suspend()
      self.updateTimer = nil
      return
    }

    let progress = exportSession.progress
   let progressValue = Int64(ceil(min(progress, 0.99) * 100.0))
   self.progress.completedUnitCount = progressValue

    if self.progress.isFinished {
      self.updateTimer?.suspend()
      self.updateTimer = nil
    }
  }

  func clearObservers() {
    exportStatusObserver?.invalidate()
    progress.cancellationHandler = nil
    updateTimer?.suspend()
    updateTimer = nil
    exportSession = nil
  }

  deinit {
    clearObservers()
  }
}
