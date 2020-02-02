//
//  YeetEnums.h
//  yeet
//
//  Created by Jarred WSumner on 1/30/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTConvert.h>
#import "YeetTextEnums.h"

NS_ASSUME_NONNULL_BEGIN

@interface RCTConvert (YeetTextEnums)

+ (YeetTextBorder)YeetTextBorder:(id)json;
+ (YeetTextTemplate)YeetTextTemplate:(id)json;
+ (YeetTextFormat)YeetTextFormat:(id)json;

@end

NS_ASSUME_NONNULL_END
