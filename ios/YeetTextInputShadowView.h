//
//  YeetTextInputShadowView.h
//  yeet
//
//  Created by Jarred WSumner on 1/8/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <React/RCTBaseTextShadowView.h>
#import "YeetTextEnums.h"

#if !defined(SWIFT_CLASS_PROPERTY)
# if __has_feature(objc_class_property)
#  define SWIFT_CLASS_PROPERTY(...) __VA_ARGS__
# else
#  define SWIFT_CLASS_PROPERTY(...)
# endif
#endif

@class CAShapeLayer;
@class YeetTextLayoutManager;
@class NSTextContainer;

@interface YeetTextAttributes : NSObject
@property (nonatomic, strong) RCTTextAttributes * _Nullable textAttributes;
@property (nonatomic) UIEdgeInsets textContainerInset;
@property (nonatomic) CGFloat highlightCornerRadius;
@property (nonatomic) YeetTextBorder border;
@property (nonatomic) YeetTextFormat format;
@property (nonatomic) CGRect textRect;
@property (nonatomic, getter=template, setter=setTemplate:) YeetTextTemplate template_;
@property (nonatomic) CGFloat strokeWidth;
@property (nonatomic, strong) UIColor * _Nonnull strokeColor;
@property (nonatomic) CGFloat highlightInset;
- (nonnull instancetype)init ;
- (nonnull instancetype)initWithCopy:(YeetTextAttributes * _Nonnull)other ;
- (NSDictionary<NSAttributedStringKey, id> * _Nonnull)effectiveTextAttributes ;
- (void)apply:(YeetTextAttributes * _Nonnull)other;
- (id _Nonnull)copy ;
SWIFT_CLASS_PROPERTY(@property (nonatomic, class, readonly, strong) YeetTextAttributes * _Nonnull zero;)
+ (YeetTextAttributes * _Nonnull)zero ;
@property (nonatomic, readonly) CGFloat baselineOffset;
@property (nonatomic) CGRect emptySize;
- (BOOL)isEqual:(id _Nullable)_rhs;
- (void)drawHighlightLayer:(CAShapeLayer * _Nonnull)highlightLayer layout:(YeetTextLayoutManager * _Nonnull)layout textContainer:(NSTextContainer * _Nonnull)textContainer textLayer:(CALayer * _Nonnull)textLayer;
@end

NS_ASSUME_NONNULL_BEGIN

@interface YeetTextInputShadowView : RCTBaseTextShadowView

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@property (nonatomic, nullable) YeetTextAttributes *yeetAttributes;

- (void)didUpdateTextStyle;
- (void)dirtyLayout;

@property (nonatomic, nullable, strong) YeetTextAttributes *cachedYeetAttributes;
@property (nonatomic, copy, nullable) NSString *text;
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, assign) NSInteger maximumNumberOfLines;
@property (nonatomic, assign) NSInteger minimumNumberOfLines;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onContentSizeChange;

- (void)uiManagerWillPerformMounting;

@end

NS_ASSUME_NONNULL_END
