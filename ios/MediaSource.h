//
//  MediaSource.h
//  yeet
//
//  Created by Jarred WSumner on 2/6/20.
//  Copyright © 2020 Yeet. All rights reserved.
//
#import <Foundation/Foundation.h>

@interface MediaSource : NSObject
@property (nonatomic, readonly, strong) NSNumber * _Nonnull duration;
@property (nonatomic, readonly, strong) NSNumber * _Nonnull playDuration;
@property (nonatomic, readonly, copy) NSString * _Nonnull id;
@property (nonatomic, readonly, copy) NSURL * _Nonnull uri;
@property (nonatomic, readonly, copy) NSURL * _Nullable audioURI;
@property (nonatomic, readonly, strong) NSNumber * _Nonnull width;
@property (nonatomic, readonly, strong) NSNumber * _Nonnull height;
@property (nonatomic, readonly, strong) NSNumber * _Nonnull pixelRatio;
@property (nonatomic, readonly) CGRect bounds;
@property (nonatomic, readonly, copy) NSURL * _Nullable coverUri;
@property (nonatomic, readonly, copy) NSDictionary<NSString *, id> * _Nonnull toDictionary;
@property (nonatomic, readonly) BOOL isVideo;
@property (nonatomic, readonly) BOOL isImage;
@property (nonatomic, readonly) CGRect naturalBounds;
@property (nonatomic, strong) MediaSource * _Nullable coverMediaSource;
@property (nonatomic, readonly) BOOL isMP4;
+ (MediaSource * _Nullable)fromDictionary:(NSDictionary<NSString *, id> * _Nonnull)dictionary;
+ (MediaSource * _Nonnull)fromURI:(NSString * _Nonnull)uri mimeType:(NSString * _Nonnull)mimeType duration:(NSNumber * _Nonnull)duration playDuration:(NSNumber * _Nonnull)playDuration id:(NSString * _Nonnull)id width:(NSNumber * _Nonnull)width height:(NSNumber * _Nonnull)height bounds:(CGRect)bounds pixelRatio:(NSNumber * _Nonnull)pixelRatio cover:(NSString * _Nullable)cover audioURI:(NSString * _Nullable)audioURI;
+ (MediaSource * _Nullable)cached:(NSString * _Nonnull)uri;

@end
