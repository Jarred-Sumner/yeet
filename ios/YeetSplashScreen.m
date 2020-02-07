//
//  YeetSplashScreen.m
//  yeet
//
//  Created by Jarred WSumner on 2/7/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

#import "YeetSplashScreen.h"
#import <React/RCTBridge.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTUIManager.h>

static bool addedJsLoadErrorObserver = false;
static UIView* _loadingView = nil;

@implementation YeetSplashScreen
- (dispatch_queue_t)methodQueue{
    return dispatch_get_main_queue();
}

+ (UIView*)loadingView {
  return _loadingView;
}

+ (void)setLoadingView:(UIView*)view {
  _loadingView = view;
}

+ (void)showSplash:(NSString*)splashScreen inRootView:(UIView*)rootView {
    if (!_loadingView) {
        _loadingView = [[[NSBundle mainBundle] loadNibNamed:splashScreen owner:self options:nil] objectAtIndex:0];
        CGRect frame = rootView.frame;
        frame.origin = CGPointMake(0, 0);
        _loadingView.frame = frame;
    }

    [rootView addSubview:_loadingView];
}

+ (void)hide {
  RCTExecuteOnMainQueue(^{
    [[YeetSplashScreen loadingView] removeFromSuperview];
  });
}

+ (void) jsLoadError:(NSNotification*)notification
{
    // If there was an error loading javascript, hide the splash screen so it can be shown.  Otherwise the splash screen will remain forever, which is a hassle to debug.
    [self hide];
}


@end
