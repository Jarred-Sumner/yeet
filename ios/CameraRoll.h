//
//  CameraRoll.h
//  yeet
//
//  Created by Jarred WSumner on 1/31/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Photos/Photos.h>

@interface CameraRoll : NSObject
+ (NSArray<NSDictionary *> * _Nonnull)assetCollectionDictionaries;
+ (void)stopSession:(NSString * _Nonnull)cacheKey;
+ (CameraRoll * _Nonnull)withAlbumID:(NSString * _Nullable)assetCollectionID mediaType:(NSString * _Nullable)mediaType size:(CGSize)size contentMode:(PHImageContentMode)contentMode cache:(BOOL)cache;
@property (nonatomic) NSInteger count;
@property (nonatomic, readonly) CGSize size;
@property (nonatomic, readonly) PHImageContentMode contentMode;
@property (nonatomic, readonly) BOOL cache;
- (NSDictionary<NSString *, id> * _Nonnull)from:(NSInteger)offset to:(NSInteger)length;
- (void)stop;
@end


@interface PHAssetCollection (yeetExtensions)
  @property (nonatomic, readonly, copy) NSDictionary<NSString *, id> * _Nonnull dictionaryValue;
@end
