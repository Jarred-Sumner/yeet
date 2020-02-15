#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>
#import "MediaSource.h"

@class TrackableMediaSource;

@interface MediaPlayer : UIView <UINavigationControllerDelegate, UIVideoEditorControllerDelegate, RCTInvalidating>
@property (nonatomic) BOOL prefetch;
- (void)didSetProps:(NSArray<NSString *> * _Nonnull)changedProps;
@property (nonatomic) BOOL allowSkeleton;
@property (nonatomic, strong) NSString * _Nullable id;
@property (nonatomic, copy) NSArray<MediaSource *> * _Nullable sources;
@property (nonatomic, strong) TrackableMediaSource * _Nullable source;
@property (nonatomic) BOOL paused;
@property (nonatomic) BOOL autoPlay;
@property (nonatomic, copy) RCTDirectEventBlock _Nullable onChangeItem;
@property (nonatomic, copy) RCTDirectEventBlock _Nullable onLoad;
@property (nonatomic, copy) RCTDirectEventBlock _Nullable onPlay;
@property (nonatomic, copy) RCTDirectEventBlock _Nullable onPause;
@property (nonatomic, copy) RCTDirectEventBlock _Nullable onEnd;
@property (nonatomic, copy) RCTDirectEventBlock _Nullable onError;
@property (nonatomic, copy) RCTDirectEventBlock _Nullable onProgress;
@property (nonatomic) CGFloat borderRadius;
- (BOOL)editVideo;
@property (nonatomic, copy) RCTDirectEventBlock _Nullable onEditVideo;
- (void)videoEditorController:(UIVideoEditorController * _Nonnull)editor didSaveEditedVideoToPath:(NSString * _Nonnull)editedVideoPath;
- (void)layoutSubviews;
- (void)pause;
- (void)reset;

@property (nonatomic, readonly) NSString *status;
@property (nonatomic, strong) NSNumber * _Nullable containerTag;
@property (nonatomic, copy) NSString * _Nonnull resizeMode;
- (void)play;
- (void)advance:(NSInteger)to :(BOOL)withFrame :(void (^ _Nullable)(TrackableMediaSource * _Nonnull))cb;
@property (nonatomic) BOOL isActive;
@property (nonatomic) BOOL muted;
- (void)invalidate;
@property (nonatomic) BOOL thumbnail;
- (void)didMoveToWindow;
@property (nonatomic, readonly) CGSize mediaSize;
- (void)willMoveToWindow:(UIWindow * _Nullable)newWindow;
- (nonnull instancetype)initWithFrame:(CGRect)frame;
@end


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
