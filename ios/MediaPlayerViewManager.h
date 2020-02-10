#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>
//
//  MediaPlayerViewManager.h
//  yeet
//
//  Created by Jarred WSumner on 1/30/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

@interface MediaPlayerViewManager : RCTViewManager


- (NSDictionary*)mediaSize:(nonnull NSNumber*)_id;
- (BOOL)isRegistered:(nonnull NSString*)_id;
- (void)batchPlay:(nonnull NSNumber*)tag IDs:(nonnull NSArray*)ids;
- (void)batchPause:(nonnull NSNumber*)tag IDs:(nonnull NSArray*)ids;
- (void)crop:(nonnull NSNumber*)tag bounds:(CGRect)bounds originalSize:(CGSize)originalSize resolver:(RCTPromiseResolveBlock _Nullable )resolver rejecter:(RCTPromiseRejectBlock _Nullable )rejecter;

- (void)startCachingMediaSources:(nonnull NSArray*)mediaSources bounds:(CGRect)bounds contentMode:(UIViewContentMode)contentMode;
- (void)stopCachingMediaSources:(nonnull NSArray*)mediaSources bounds:(CGRect)bounds contentMode:(UIViewContentMode)contentMode;
- (void)stopCachingAll;

- (void)share:(nonnull NSNumber*)tag network:(NSString*)network callback:(RCTResponseSenderBlock)callback;
- (void)pause:(nonnull NSNumber*)tag;
- (void)play:(nonnull NSNumber*)tag;
- (void)editVideo:(nonnull NSNumber*)tag cb:(RCTResponseSenderBlock)callback;
- (void)detectRectangles:(nonnull NSNumber*)tag cb:(RCTResponseSenderBlock)callback;
- (void)reset:(nonnull NSNumber*)tag;
- (void)save:(nonnull NSNumber*)tag cb:(RCTResponseSenderBlock)callback;
@end

//
//@interface RNCCameraRollManager : RCTViewManager
//
//- (void) getPhotos:(NSDictionary *)params resolve:(RCTPromiseResolveBlock)resolve
//           reject:(RCTPromiseRejectBlock)reject;
//@end
