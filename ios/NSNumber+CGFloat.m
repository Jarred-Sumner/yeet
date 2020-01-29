//
//  NSNumber+CGFloat.m
//  yeet
//
//  Created by Jarred WSumner on 1/28/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import "NSNumber+CGFloat.h"


@implementation NSNumber (CGFloatValue)
-(CGFloat)cgFloatValue {
    CGFloat result;
    CFNumberGetValue((__bridge CFNumberRef)(self), kCFNumberCGFloatType, &result);
    return result;
}
@end
