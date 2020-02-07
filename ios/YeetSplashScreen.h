//
//  YeetSplashScreen.h
//  yeet
//
//  Created by Jarred WSumner on 2/7/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

@interface YeetSplashScreen : NSObject

+ (void)showSplash:(NSString*)splashScreen inRootView:(UIView*)rootView;
+ (void)hide;

@end

NS_ASSUME_NONNULL_END
