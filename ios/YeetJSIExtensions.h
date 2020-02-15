//
//  YeetJSIExtensions.h
//  yeet
//
//  Created by Jarred WSumner on 2/14/20.
//  Copyright © 2020 Yeet. All rights reserved.
//





#ifdef __cplusplus

#include <ReactCommon/BridgeJSCallInvoker.h>

#import <Foundation/Foundation.h>
#import <React/RCTBridge+Private.h>
#import <Foundation/Foundation.h>
#import <React/RCTUIManager.h>
#import <React/RCTScrollView.h>
#import <RNReactNativeHapticFeedback/RNReactNativeHapticFeedback.h>

#import <ReactCommon/TurboModule.h>


@interface RNReactNativeHapticFeedback (ext)
- (void)trigger:(NSString *)type options:(NSDictionary *)options;
@end


@interface RCTUIManager (ext)
  - (UIView *)unsafeViewForReactTag:(NSNumber *)reactTag;
   - (void)focus:(NSNumber *)reactTag;
 - (void)blur:(NSNumber *)reactTag;
  - (NSMutableDictionary<NSNumber *, UIView *> *)viewRegistry;
    - (NSMutableDictionary<NSNumber *, RCTShadowView *> *)shadowViewRegistry;
@end


@interface RCTScrollView (hacks)
- (void)scrollViewDidScroll:(UIScrollView *)scrollView;
- (NSDictionary*)body;
@end


@interface RCTBridge (ext)
- (std::weak_ptr<facebook::react::Instance>)reactInstance;
@end

#endif
