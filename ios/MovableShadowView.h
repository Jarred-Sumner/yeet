//
//  MovableShadowView.h
//  yeet
//
//  Created by Jarred WSumner on 2/17/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

#import <React/RCTShadowView.h>

NS_ASSUME_NONNULL_BEGIN

@interface MovableShadowView : RCTShadowView

- (id)init:(RCTBridge*)bridge;


@property (nonatomic, strong) NSNumber* contentContainerTag;

- (void)handleKeyboardShowEventEndFrame:(CGRect)frame;
- (void)handleKeyboardHideEvent;

@end

NS_ASSUME_NONNULL_END
