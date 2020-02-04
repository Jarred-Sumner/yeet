//
//  RCTConvert.h
//  yeet
//
//  Created by Jarred WSumner on 1/31/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTConvert.h>
#import <Photos/Photos.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTConvert(ReactNativePhotosFramework)

+ (PHAssetMediaType)PHAssetMediaType:(id)json;
+ (PHAuthorizationStatus)PHAuthorizationStatus:(id)json;
+ (PHAssetMediaSubtype)PHAssetMediaSubtype:(id)json;
+ (PHAssetCollectionType)PHAssetCollectionType:(id)json;
+ (PHAssetCollectionSubtype)PHAssetCollectionSubtype:(id)json;
+ (PHAssetSourceType)PHAssetSourceType:(id)json;
+ (PHAssetResourceType)PHAssetResourceType:(id)json;

+ (NSDictionary *)PHAssetMediaTypeValuesReversed;
+ (NSDictionary *)PHAssetMediaSubtypeValuesReversed;
+ (NSDictionary *)PHAuthorizationStatusValuesReversed;
+ (NSDictionary *)PHAssetBurstSelectionTypeValuesReversed;
+ (NSDictionary *)PHAssetSourceTypeValuesReversed;
+ (NSDictionary *)PHAssetCollectionTypeValuesReversed;
+ (NSDictionary *)PHAssetCollectionSubtypeValuesReversed;
+ (NSDictionary *)PHAssetResourceTypeValuesReversed;



@end

NS_ASSUME_NONNULL_END
