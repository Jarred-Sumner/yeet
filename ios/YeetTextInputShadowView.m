//
//  YeetTextInputShadowView.m
//  yeet
//
//  Created by Jarred WSumner on 1/8/20.
//  Copyright © 2020 Facebook. All rights reserved.
//


#import "YeetTextInputShadowView.h"
#import <React/RCTBridge.h>
#import <React/RCTShadowView+Layout.h>
#import <React/RCTUIManager.h>
#import <yoga/Yoga.h>
#import "EnableWebpDecoder.h"
#import <UIKit/UIKit.h>
#import <React/NSTextStorage+FontScaling.h>




@implementation YeetTextInputShadowView
{
  __weak RCTBridge *_bridge;
  NSAttributedString *_Nullable _previousAttributedText;
  YeetTextAttributes *_Nullable previousTextAttrs;
  BOOL _needsUpdateView;
  NSAttributedString *_Nullable _localAttributedText;
  CGSize _previousContentSize;
  CALayer *textLayer;
  CAShapeLayer *highlightLayer;

  NSString *_text;
  NSTextStorage *_textStorage;
  NSTextContainer *_textContainer;
  YeetTextLayoutManager *_layoutManager;
}

@synthesize yeetAttributes = currentTextAttrs;

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _needsUpdateView = YES;
    self.yeetAttributes = [[YeetTextAttributes alloc] initWithTextContainerInset:UIEdgeInsetsZero highlightCornerRadius:0 border:YeetTextBorderHidden attributedText:_localAttributedText template:YeetTextTemplatePost strokeWidth:0 font:[UIFont systemFontOfSize:17] strokeColor:[UIColor clearColor] highlightInset:0];
    textLayer = [[CALayer alloc] init];
    textLayer.drawsAsynchronously = true;
    highlightLayer = [[CAShapeLayer alloc] init];
    highlightLayer.drawsAsynchronously = true;
    [textLayer addSublayer:highlightLayer];

    YGNodeSetMeasureFunc(self.yogaNode, YeetTextInputShadowViewMeasure);
    YGNodeSetBaselineFunc(self.yogaNode, RCTTextInputShadowViewBaseline);
  }

  return self;
}

- (BOOL)isYogaLeafNode
{
  return YES;
}

- (void)didUpdateTextStyle {
  __block YeetTextAttributes *attrs = self.yeetAttributes;
  NSNumber *tag = self.reactTag;

   [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
     YeetTextInputView *baseTextInputView = (YeetTextInputView *)viewRegistry[tag];
     if (!baseTextInputView) {
       return;
     }

     baseTextInputView.yeetTextAttributes = [attrs clone];
   }];

  [self dirtyLayout];
}

- (void)layoutSubviewsWithContext:(RCTLayoutContext)layoutContext
{
  // Do nothing.
}

- (void)setLocalData:(NSObject *)localData
{
  YeetTextAttributes *attrs = (YeetTextAttributes *)localData;
  NSAttributedString *attributedText = attrs.attributedText;

  if ([attrs isEqual:currentTextAttrs]) {
    return;
  }

  if ([attributedText isEqualToAttributedString:_localAttributedText]) {
    return;
  }

  _localAttributedText = attributedText;
  previousTextAttrs = currentTextAttrs;
  currentTextAttrs = attrs;
  [self dirtyLayout];
}

- (void)dirtyLayout
{
  [super dirtyLayout];
  _needsUpdateView = YES;
  YGNodeMarkDirty(self.yogaNode);
  [self invalidateContentSize];
}

-(void)setTextAttributes:(RCTTextAttributes *)textAttributes {
  [super setTextAttributes:textAttributes];
}

- (void)invalidateContentSize
{
  if (!_onContentSizeChange) {
    return;
  }

  CGSize maximumSize = self.layoutMetrics.frame.size;

  if (_maximumNumberOfLines == 1) {
    maximumSize.width = CGFLOAT_MAX;
  } else {
    maximumSize.height = CGFLOAT_MAX;
  }


  CGSize contentSize = [self sizeThatFitsMinimumSize:(CGSize)CGSizeZero maximumSize:maximumSize];

  if (CGSizeEqualToSize(_previousContentSize, contentSize)) {
    return;
  }
  _previousContentSize = contentSize;

  _onContentSizeChange(@{
    @"contentSize": @{
      @"height": @(contentSize.height),
      @"width": @(contentSize.width),
    },
    @"target": self.reactTag,
  });
}

- (NSString *)text
{
  return _text;
}

- (void)setText:(NSString *)text
{
  _text = text;
  // Clear `_previousAttributedText` to notify the view about the change
  // when `text` native prop is set.
  _previousAttributedText = nil;
  [self dirtyLayout];
}



#pragma mark - RCTUIManagerObserver

- (void)uiManagerWillPerformMounting
{
  if (YGNodeIsDirty(self.yogaNode)) {
    return;
  }

  if (!_needsUpdateView) {
    return;
  }
  _needsUpdateView = NO;

  UIEdgeInsets borderInsets = self.borderAsInsets;
  UIEdgeInsets paddingInsets = self.paddingAsInsets;


  RCTTextAttributes *textAttributes = [self.textAttributes copy];

  NSMutableAttributedString *attributedText =
    [[NSMutableAttributedString alloc] initWithAttributedString:[self attributedTextWithBaseTextAttributes:nil]];

  // Removing all references to Shadow Views and tags to avoid unnecessary retaining
  // and problems with comparing the strings.
  [attributedText removeAttribute:RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                            range:NSMakeRange(0, attributedText.length)];

  [attributedText removeAttribute:RCTTextAttributesTagAttributeName
                            range:NSMakeRange(0, attributedText.length)];

  if (self.text.length) {
    NSAttributedString *propertyAttributedText =
      [[NSAttributedString alloc] initWithString:self.text
                                      attributes:self.textAttributes.effectiveTextAttributes];
    [attributedText insertAttributedString:propertyAttributedText atIndex:0];
  }

  BOOL isAttributedTextChanged = NO;
  if (![_previousAttributedText isEqualToAttributedString:attributedText]) {
    // We have to follow `set prop` pattern:
    // If the value has not changed, we must not notify the view about the change,
    // otherwise we may break local (temporary) state of the text input.
    isAttributedTextChanged = YES;
    _previousAttributedText = [attributedText copy];
  }

  NSNumber *tag = self.reactTag;

  [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    YeetTextInputView *baseTextInputView = (YeetTextInputView *)viewRegistry[tag];
    if (!baseTextInputView) {
      return;
    }

    baseTextInputView.yeetTextAttributes = self.yeetAttributes;
    baseTextInputView.textAttributes = textAttributes;
    baseTextInputView.reactBorderInsets = borderInsets;
    baseTextInputView.reactPaddingInsets = paddingInsets;


    if (isAttributedTextChanged) {
      // Don't set `attributedText` if length equal to zero, otherwise it would shrink when attributes contain like `lineHeight`.
      if (attributedText.length != 0) {
        baseTextInputView.attributedText = attributedText;
      } else {
        baseTextInputView.attributedText = nil;
      }
    }
  }];
}

#pragma mark -

- (NSAttributedString *)measurableAttributedText
{
  // Only for the very first render when we don't have `_localAttributedText`,
  // we use value directly from the property and/or nested content.
  NSAttributedString *attributedText =
    _localAttributedText ?: [self attributedTextWithBaseTextAttributes:nil];

  if (attributedText.length == 0) {
    // It's impossible to measure empty attributed string because all attributes are
    // associated with some characters, so no characters means no data.

    // Placeholder also can represent the intrinsic size when it is visible.
    NSString *text = self.placeholder;
    if (!text.length) {
      // Note: `zero-width space` is insufficient in some cases.
      text = @"I";
    }
    attributedText = [[NSAttributedString alloc] initWithString:text attributes:self.textAttributes.effectiveTextAttributes];
  }

  return attributedText;
}


- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  NSAttributedString *attributedText = [self measurableAttributedText];

  if (!_textStorage) {
    _textContainer = [NSTextContainer new];
    _textContainer.lineFragmentPadding = 0; // Note, the default value is 5.
    _layoutManager = [YeetTextLayoutManager new];
    
    [_layoutManager addTextContainer:_textContainer];
    _textStorage = [NSTextStorage new];
    _textContainer.lineFragmentPadding = 0;
    [_textStorage addLayoutManager:_layoutManager];
  }

  _textContainer.size = maximumSize;
  _textContainer.maximumNumberOfLines = _maximumNumberOfLines;
  [_textStorage replaceCharactersInRange:(NSRange){0, _textStorage.length}
                    withAttributedString:attributedText];
  [_layoutManager ensureLayoutForTextContainer:_textContainer];

  self.yeetAttributes.textContainerInset = self.paddingAsInsets;
  self.yeetAttributes.attributedText = attributedText;
  self.yeetAttributes.font = self.textAttributes.effectiveFont;

  [self.yeetAttributes drawHighlightLayer:highlightLayer layout:_layoutManager textContainer:_textContainer textLayer:textLayer];

  CGRect rect = CGRectMake(0, 0, 0, 0);

  rect.size = CGSizeMake(self.yeetAttributes.textRect.size.width, self.yeetAttributes.textRect.size.height);


  if (([YeetTextInputView.focusedReactTag isEqualToNumber:self.reactTag] || (!_localAttributedText || _localAttributedText.length == 0)) && self.yeetAttributes.format == YeetTextFormatSticker) {
    rect.size.width = RCTScreenSize().width;
  }

//  rect = CGRectInset(rect, self.yeetAttributes.highlightInset * 2, self.yeetAttributes.highlightInset * 2);
  CGSize size = rect.size;

  return (CGSize){
    MAX(minimumSize.width, MIN(RCTCeilPixelValue(size.width), maximumSize.width)),
    MAX(minimumSize.height, MIN(RCTCeilPixelValue(size.height), maximumSize.height))
  };
}

- (CGFloat)lastBaselineForSize:(CGSize)size
{
  NSAttributedString *attributedText = [self measurableAttributedText];

  __block CGFloat maximumDescender = 0.0;

  [attributedText enumerateAttribute:NSFontAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:
    ^(UIFont *font, NSRange range, __unused BOOL *stop) {
      if (maximumDescender > font.descender) {
        maximumDescender = font.descender;
      }
    }
  ];

  return size.height + maximumDescender;
}

static YGSize YeetTextInputShadowViewMeasure(YGNodeRef node, float width, YGMeasureMode widthMode, float height, YGMeasureMode heightMode)
{
  RCTShadowView *shadowView = (__bridge RCTShadowView *)YGNodeGetContext(node);

  CGSize minimumSize = CGSizeMake(0, 0);
  CGSize maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

  CGSize size = {
    RCTCoreGraphicsFloatFromYogaFloat(width),
    RCTCoreGraphicsFloatFromYogaFloat(height)
  };

  switch (widthMode) {
    case YGMeasureModeUndefined:
      break;
    case YGMeasureModeExactly:
      minimumSize.width = size.width;
      maximumSize.width = size.width;
      break;
    case YGMeasureModeAtMost:
      maximumSize.width = size.width;
      break;
  }

  switch (heightMode) {
    case YGMeasureModeUndefined:
      break;
    case YGMeasureModeExactly:
      minimumSize.height = size.height;
      maximumSize.height = size.height;
      break;
    case YGMeasureModeAtMost:
      maximumSize.height = size.height;
      break;
  }

  CGSize measuredSize = [shadowView sizeThatFitsMinimumSize:minimumSize maximumSize:maximumSize];

  return (YGSize){
    RCTYogaFloatFromCoreGraphicsFloat(measuredSize.width),
    RCTYogaFloatFromCoreGraphicsFloat(measuredSize.height)
  };
}

static float RCTTextInputShadowViewBaseline(YGNodeRef node, const float width, const float height)
{
  YeetTextInputShadowView *shadowTextView = (__bridge YeetTextInputShadowView *)YGNodeGetContext(node);

  CGSize size = (CGSize){
    RCTCoreGraphicsFloatFromYogaFloat(width),
    RCTCoreGraphicsFloatFromYogaFloat(height)
  };

  CGFloat lastBaseline = [shadowTextView lastBaselineForSize:size];

  return RCTYogaFloatFromCoreGraphicsFloat(lastBaseline);
}

@end
