//
//  _RCTUITextView.h
//  yeet
//
//  Created by Jarred WSumner on 1/9/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <React/RCTUITextView.h>

NS_ASSUME_NONNULL_BEGIN

@interface _RCTUITextView : RCTUITextView
- (instancetype)initWithFrame:(CGRect)frame NS_DESIGNATED_INITIALIZER;
- (void)enforceTextAttributesIfNeeded;

@end

NS_ASSUME_NONNULL_END
