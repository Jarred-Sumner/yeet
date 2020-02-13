//
//  PanViewManager.h
//  yeet
//
//  Created by Jarred WSumner on 2/11/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@class RCTViewManager;
@class UIView;

@interface PanViewController : UIViewController

@end


@interface PanViewManager : RCTViewManager
- (UIView * _Null_unspecified)view;
+ (NSString * _Null_unspecified)moduleName;
- (void)transition:(NSNumber*)tag to:(NSString*)state;
+ (BOOL)requiresMainQueueSetup;
- (nonnull instancetype)init;
@end


@interface PanViewSheet : UIView
@property (nonatomic, copy) RCTDirectEventBlock _Nullable onWillDismiss;
@property (nonatomic, copy) RCTDirectEventBlock _Nullable onDismiss;
@property (nonatomic) CGFloat minY;
@property (nonatomic) CGFloat topOffset;
@property (nonatomic, strong) RCTBridge * _Nullable bridge;
@property (nonatomic, strong) PanViewController * _Nullable panViewController;
- (void)layoutSubviews;
@end
