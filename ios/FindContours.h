//
//  FindContours.h
//  yeet
//
//  Created by Jarred WSumner on 12/14/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface FindContours : NSObject
+ (NSArray*)findContoursInImage:(UIImage*)image;
@end

NS_ASSUME_NONNULL_END
