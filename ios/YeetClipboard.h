//
//  YeetClipboard.h
//  yeet
//
//  Created by Jarred WSumner on 2/6/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTEventEmitter.h>

@class MediaSource;

@interface YeetClipboard : RCTEventEmitter
+ (void)onApplicationBecomeActive;
- (void)startObserving;
- (void)stopObserving;
- (void)handleChangeEvent:(NSNotification * _Nonnull)notification;
- (void)handleRemoveEvent:(NSNotification * _Nonnull)notification;
@property (nonatomic, strong) RCTBridge * _Null_unspecified bridge;
+ (NSString * _Null_unspecified)moduleName ;
+ (NSDictionary<NSString *, id> * _Nonnull)serializeContents ;
- (NSArray<NSString *> * _Null_unspecified)supportedEvents ;
+ (BOOL)requiresMainQueueSetup ;
- (NSDictionary * _Null_unspecified)constantsToExport ;
- (MediaSource*)lastMediaSource;
- (void)getContent:(RCTResponseSenderBlock _Nonnull)callback;

+ (BOOL)hasImagesInClipboard ;
- (void)clipboardMediaSource:(RCTResponseSenderBlock _Nonnull)callback;
@end
