//
//  YeetAnimatedImage.h
//  yeet
//
//  Created by Jarred WSumner on 9/4/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <SDWebImage/SDAnimatedImage.h>


@protocol RCTAnimatedImage <NSObject>
@property (nonatomic, assign, readonly) NSUInteger animatedImageFrameCount;
@property (nonatomic, assign, readonly) NSUInteger animatedImageLoopCount;

- (nullable UIImage *)animatedImageFrameAtIndex:(NSUInteger)index;
- (NSTimeInterval)animatedImageDurationAtIndex:(NSUInteger)index;

@end


@interface YeetAnimatedImage : SDAnimatedImage <RCTAnimatedImage>

@end


