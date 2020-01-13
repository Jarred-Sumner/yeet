//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//

#import <UIKit/UIKit.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>
#import <SDWebImage/SDAnimatedImage.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import <SDWebImageWebPCoder.h>
#import <React/RCTMultilineTextInputView.h>
#import <React/RCTMultilineTextInputViewManager.h>
#import <React/RCTScrollView.h>
#import <React/UIView+React.h>
#import <React/RCTUITextView.h>
#import <React/RCTTextView.h>
#import "_RCTUITextView.h"
#import <React/RCTInputAccessoryView.h>
#import <React/RCTInputAccessoryViewContent.h>
#import <React/RCTTextAttributes.h>
#import <React/RCTTextSelection.h>
#import <React/RCTConvert+Transform.h>
#import "EnableWebpDecoder.h"


#import <React/RCTUIManagerObserverCoordinator.h>

#import <React/RCTInvalidating.h>
#import <DVURLAsset.h>
#import <DVAssetLoaderDelegate/DVAssetLoaderDelegate.h>
#import <KTVHTTPCache/KTVHTTPCache.h>
#import <FFFastImageView.h>
#import <PINRemoteImage/PINAnimatedImageView.h>
#import <PINRemoteImage/PINDisplayLink.h>
#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTUITextView.h>
#import <React/RCTEventEmitter.h>
#import "FindContours.h"
#import "YeetTextInputShadowView.h"
#import <XExtensionItem/XExtensionItem.h>
#import "YeetTextEnums.h"


@interface RCTConvert (YeetTextEnums)

+ (YeetTextBorder)YeetTextBorder:(id)json;
+ (YeetTextTemplate)YeetTextTemplate:(id)json;
+ (YeetTextFormat)YeetTextFormat:(id)json;

@end

@implementation RCTConvert (YeetTextEnums)

RCT_ENUM_CONVERTER(YeetTextBorder, (@{
@"stroke": @(YeetTextBorderStroke),
@"ellipse": @(YeetTextBorderEllipse),
@"solid": @(YeetTextBorderSolid),
@"hidden": @(YeetTextBorderHidden),
@"invert": @(YeetTextBorderInvert),
@"highlight": @(YeetTextBorderHighlight),
}), YeetTextBorderHidden, integerValue);

RCT_ENUM_CONVERTER(YeetTextTemplate, (@{
@"basic": @(YeetTextTemplateBasic),
@"bigWords": @(YeetTextTemplateBigWords),
@"post": @(YeetTextTemplatePost),
@"comment": @(YeetTextTemplateComment),
@"comic": @(YeetTextTemplateComic),
@"gary": @(YeetTextTemplateGary),
@"terminal": @(YeetTextTemplateTerminal),
@"pickaxe": @(YeetTextTemplatePickaxe),
}), YeetTextTemplatePost, integerValue);

RCT_ENUM_CONVERTER(YeetTextFormat, (@{
@"post": @(YeetTextFormatPost),
@"sticker": @(YeetTextFormatSticker),
@"comment": @(YeetTextFormatComment),
}), YeetTextFormatPost, integerValue);

@end




@interface UIView(PrivateMtehods)
  @property BOOL reactIsFocusNeeded;
  - (void)dirtyLayout;
  - (void)clearLayout;
  - (void)didSetProps:(__unused NSArray<NSString *> *)changedProps;
@end

@interface RCTBaseTextInputView(PrivateMethods)

- (void)updateLocalData;
- (void)enforceTextAttributesIfNeeded;

@property (nonatomic, assign) CGFloat preferredMaxLayoutWidth;
@property (nonatomic, copy) RCTTextSelection *selection;

@end

@interface RCTTextView(PrivateMethods)
  - (void)enableContextMenu;
  - (void)disableContextMenu;
@end



@interface PINAnimatedImageView(PrivateMethods)

@property (nonatomic, assign) CGImageRef frameImage;
@property (nonatomic, strong) PINDisplayLink *displayLink;

@property (nonatomic, assign) CFTimeInterval lastDisplayLinkFire;

- (void)stopAnimating;


- (void)coverImageCompleted:(PINImage *)coverImage;
- (void)setCoverImage:(PINImage *)coverImage;
- (void)checkIfShouldAnimate;
- (void)displayLinkFired:(CADisplayLink *)displayLink;
- (CGImageRef)imageRef;

@end


@interface RCT_EXTERN_MODULE(YeetExporter, NSObject)

RCT_EXTERN_METHOD(startExport:(NSString*)data isServerOnly:(BOOL)isServerOnly callback: (RCTResponseSenderBlock)callback);

@end

@interface RCT_EXTERN_MODULE(YeetClipboard, RCTEventEmitter)

RCT_EXTERN_METHOD(getContent:(RCTResponseSenderBlock)callback);
RCT_EXTERN_METHOD(clipboardMediaSource:(RCTResponseSenderBlock)callback);

@end

@interface RCT_EXTERN_MODULE(YeetColorSliderViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(color, UIColor);
RCT_EXPORT_VIEW_PROPERTY(inputRef, NSNumber);
RCT_EXPORT_VIEW_PROPERTY(colorType, NSString);
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onCancel, RCTBubblingEventBlock);

@end

@interface RCT_EXTERN_MODULE(MovableViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(inputTag, NSNumber);
RCT_EXPORT_VIEW_PROPERTY(unfocusedBottom, NSNumber);
RCT_EXPORT_VIEW_PROPERTY(unfocusedLeft, NSNumber);
RCT_EXPORT_VIEW_PROPERTY(yeetContentSizeChange, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onTransform, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onTransformLayout, RCTDirectEventBlock);
RCT_REMAP_VIEW_PROPERTY(transform, yeetTransform, CATransform3D);
//RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, MovableView) {
//  view.yeetTransform = json ? [RCTConvert CATransform3D:json] : CATransform3DIdentity;
//}

@end

@interface RCT_EXTERN_MODULE(YeetTextInputViewManager, RCTBaseTextViewManager)

RCT_EXPORT_VIEW_PROPERTY(singleFocus, BOOL);


RCT_EXPORT_VIEW_PROPERTY(onFinishEditing, RCTDirectEventBlock);
RCT_REMAP_VIEW_PROPERTY(isSticker, textView.isSticker, BOOL);
RCT_EXPORT_VIEW_PROPERTY(isSelectable, BOOL);
RCT_EXPORT_VIEW_PROPERTY(fontSizeRnge, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(showHighlight, BOOL);



RCT_REMAP_VIEW_PROPERTY(autoCapitalize, backedTextInputView.autocapitalizationType, UITextAutocapitalizationType)
RCT_REMAP_VIEW_PROPERTY(autoCorrect, backedTextInputView.autocorrectionType, UITextAutocorrectionType)
RCT_REMAP_VIEW_PROPERTY(contextMenuHidden, backedTextInputView.contextMenuHidden, BOOL)
RCT_REMAP_VIEW_PROPERTY(editable, backedTextInputView.editable, BOOL)
RCT_REMAP_VIEW_PROPERTY(enablesReturnKeyAutomatically, backedTextInputView.enablesReturnKeyAutomatically, BOOL)
RCT_REMAP_VIEW_PROPERTY(keyboardAppearance, backedTextInputView.keyboardAppearance, UIKeyboardAppearance)
RCT_REMAP_VIEW_PROPERTY(placeholder, backedTextInputView.placeholder, NSString)
RCT_REMAP_VIEW_PROPERTY(placeholderTextColor, backedTextInputView.placeholderColor, UIColor)
RCT_REMAP_VIEW_PROPERTY(returnKeyType, backedTextInputView.returnKeyType, UIReturnKeyType)
RCT_REMAP_VIEW_PROPERTY(selectionColor, backedTextInputView.tintColor, UIColor)
RCT_REMAP_VIEW_PROPERTY(spellCheck, backedTextInputView.spellCheckingType, UITextSpellCheckingType)
RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
RCT_REMAP_VIEW_PROPERTY(scrollEnabled, backedTextInputView.scrollEnabled, BOOL)

//
RCT_CUSTOM_SHADOW_PROPERTY(border, YeetTextBorder, YeetTextInputShadowView) {
  YeetTextBorder border = [RCTConvert YeetTextBorder:json];
  view.yeetAttributes.border = border;
  [view didUpdateTextStyle];
}

RCT_CUSTOM_SHADOW_PROPERTY(format, YeetTextFormat, YeetTextInputShadowView) {
  YeetTextFormat format = [RCTConvert YeetTextFormat:json];
  view.yeetAttributes.format = format;
  [view didUpdateTextStyle];
}

RCT_CUSTOM_SHADOW_PROPERTY(template, YeetTextTemplate, YeetTextInputShadowView) {
  YeetTextTemplate _template = [RCTConvert YeetTextTemplate:json];
  view.yeetAttributes.template = _template;
  [view didUpdateTextStyle];
}

RCT_CUSTOM_SHADOW_PROPERTY(strokeWidth, CGFloat, YeetTextInputShadowView) {
  CGFloat strokeWidth = [RCTConvert CGFloat:json];
  view.yeetAttributes.strokeWidth = strokeWidth;
  [view didUpdateTextStyle];
}

RCT_CUSTOM_SHADOW_PROPERTY(highlightInset, CGFloat, YeetTextInputShadowView) {
  CGFloat highlightInset = [RCTConvert CGFloat:json];
  view.yeetAttributes.highlightInset = highlightInset;
  [view didUpdateTextStyle];
}

RCT_CUSTOM_SHADOW_PROPERTY(highlightCornerRadius, CGFloat, YeetTextInputShadowView) {
  CGFloat highlightCornerRadius = [RCTConvert CGFloat:json];
  view.yeetAttributes.highlightCornerRadius = highlightCornerRadius;
  [view didUpdateTextStyle];
}

RCT_CUSTOM_SHADOW_PROPERTY(strokeColor, UIColor, YeetTextInputShadowView) {
  UIColor *strokeColor = [RCTConvert UIColor:json];
  view.yeetAttributes.strokeColor = strokeColor;
  [view didUpdateTextStyle];
}

RCT_REMAP_VIEW_PROPERTY(highlightColor, textView.highlightColor, UIColor)

RCT_REMAP_VIEW_PROPERTY(maxContentWidth, textView.maxContentWidth, CGFloat);

RCT_EXPORT_VIEW_PROPERTY(secureTextEntry, BOOL)
RCT_EXPORT_VIEW_PROPERTY(blurOnSubmit, BOOL)
RCT_EXPORT_VIEW_PROPERTY(clearTextOnFocus, BOOL)
RCT_EXPORT_VIEW_PROPERTY(keyboardType, UIKeyboardType)
RCT_EXPORT_VIEW_PROPERTY(maxLength, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(selectTextOnFocus, BOOL)
RCT_EXPORT_VIEW_PROPERTY(selection, RCTTextSelection)
RCT_EXPORT_VIEW_PROPERTY(inputAccessoryViewID, NSString)
RCT_EXPORT_VIEW_PROPERTY(textContentType, NSString)
RCT_EXPORT_VIEW_PROPERTY(passwordRules, NSString)

RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onTextInput, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onScroll, RCTDirectEventBlock)

RCT_EXPORT_VIEW_PROPERTY(mostRecentEventCount, NSInteger)

RCT_EXPORT_SHADOW_PROPERTY(text, NSString)
RCT_EXPORT_SHADOW_PROPERTY(onContentSizeChange, RCTBubblingEventBlock)

RCT_REMAP_SHADOW_PROPERTY(color, textAttributes.foregroundColor, UIColor)
RCT_REMAP_SHADOW_PROPERTY(backgroundColor, textAttributes.backgroundColor, UIColor)
RCT_REMAP_SHADOW_PROPERTY(opacity, textAttributes.opacity, CGFloat)
// Font
RCT_REMAP_SHADOW_PROPERTY(fontFamily, textAttributes.fontFamily, NSString)
RCT_REMAP_SHADOW_PROPERTY(fontSize, textAttributes.fontSize, CGFloat)
RCT_REMAP_SHADOW_PROPERTY(fontWeight, textAttributes.fontWeight, NSString)
RCT_REMAP_SHADOW_PROPERTY(fontStyle, textAttributes.fontStyle, NSString)
RCT_REMAP_SHADOW_PROPERTY(fontVariant, textAttributes.fontVariant, NSArray)
RCT_REMAP_SHADOW_PROPERTY(allowFontScaling, textAttributes.allowFontScaling, BOOL)
RCT_REMAP_SHADOW_PROPERTY(maxFontSizeMultiplier, textAttributes.maxFontSizeMultiplier, CGFloat)
RCT_REMAP_SHADOW_PROPERTY(letterSpacing, textAttributes.letterSpacing, CGFloat)
// Paragraph Styles
RCT_REMAP_SHADOW_PROPERTY(lineHeight, textAttributes.lineHeight, CGFloat)
RCT_REMAP_SHADOW_PROPERTY(textAlign, textAttributes.alignment, NSTextAlignment)
RCT_REMAP_SHADOW_PROPERTY(writingDirection, textAttributes.baseWritingDirection, NSWritingDirection)
// Decoration
RCT_REMAP_SHADOW_PROPERTY(textDecorationColor, textAttributes.textDecorationColor, UIColor)
RCT_REMAP_SHADOW_PROPERTY(textDecorationStyle, textAttributes.textDecorationStyle, NSUnderlineStyle)
RCT_REMAP_SHADOW_PROPERTY(textDecorationLine, textAttributes.textDecorationLine, RCTTextDecorationLineType)
// Shadow
RCT_REMAP_SHADOW_PROPERTY(textShadowOffset, textAttributes.textShadowOffset, CGSize)
RCT_REMAP_SHADOW_PROPERTY(textShadowRadius, textAttributes.textShadowRadius, CGFloat)
RCT_REMAP_SHADOW_PROPERTY(textShadowColor, textAttributes.textShadowColor, UIColor)
// Special
RCT_REMAP_SHADOW_PROPERTY(isHighlighted, textAttributes.isHighlighted, BOOL)
RCT_REMAP_SHADOW_PROPERTY(textTransform, textAttributes.textTransform, RCTTextTransform)


@end

@interface RCT_EXTERN_MODULE(EmojiTextInputViewManager, RCTMultilineTextInputViewManager)

RCT_EXPORT_VIEW_PROPERTY(highlightColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(highlightCornerRadius, CGFloat);
RCT_EXPORT_VIEW_PROPERTY(highlightInset, CGFloat);
RCT_EXPORT_VIEW_PROPERTY(fontSizeRnge, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(showHighlight, BOOL);


@end

@interface RCT_EXTERN_MODULE(MediaFrameViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(source, MediaSource);
RCT_EXPORT_VIEW_PROPERTY(percentage, Double);
RCT_EXPORT_VIEW_PROPERTY(id, NSString);

_RCT_EXTERN_REMAP_METHOD(updateFrame, updateFrame:(nonnull NSNumber*)node queueNode:(nonnull NSNumber*)queueNode async:(BOOL)async, FALSE)

@end


@interface RCT_EXTERN_MODULE(MediaPlayerViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
RCT_EXPORT_VIEW_PROPERTY(autoPlay, BOOL);
RCT_EXPORT_VIEW_PROPERTY(prefetch, BOOL);
RCT_EXPORT_VIEW_PROPERTY(isVisible, BOOL);
RCT_EXPORT_VIEW_PROPERTY(borderRadius, CGFloat);
RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
RCT_EXPORT_VIEW_PROPERTY(cropRect, BOOL);
RCT_EXPORT_VIEW_PROPERTY(id, NSString);
RCT_EXPORT_VIEW_PROPERTY(allowSkeleton, BOOL);
RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
RCT_EXPORT_VIEW_PROPERTY(sources, MediaSourceArray);
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onProgress, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPlay, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPause, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onEnd, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onChangeItem, RCTDirectEventBlock);

RCT_EXTERN_METHOD(batchPlay:(nonnull NSNumber*)tag IDs:(nonnull NSArray*)ids);
RCT_EXTERN_METHOD(batchPause:(nonnull NSNumber*)tag IDs:(nonnull NSArray*)ids);
RCT_EXTERN_METHOD(crop:(nonnull NSNumber*)tag bounds:(CGRect)bounds originalSize:(CGSize)originalSize resolver:(RCTPromiseResolveBlock)resolver rejecter:( RCTPromiseRejectBlock)rejecter);

RCT_EXTERN_METHOD(startCachingMediaSources:(nonnull NSArray*)mediaSources bounds:(CGRect)bounds contentMode:(UIViewContentMode)contentMode);
RCT_EXTERN_METHOD(stopCachingMediaSources:(nonnull NSArray*)mediaSources bounds:(CGRect)bounds contentMode:(UIViewContentMode)contentMode);
RCT_EXTERN_METHOD(stopCachingAll);

RCT_EXTERN_METHOD(share:(nonnull NSNumber*)tag network:(NSString*)network callback:(RCTResponseSenderBlock)callback);
RCT_EXTERN_METHOD(pause:);
RCT_EXTERN_METHOD(play:);
RCT_EXTERN_METHOD(reset:);
RCT_EXTERN_METHOD(save:(nonnull NSNumber*)tag cb:(RCTResponseSenderBlock)callback);
RCT_EXTERN_METHOD(goNext:::);
RCT_EXTERN_METHOD(goBack:::);
RCT_EXTERN_METHOD(advance:(nonnull NSNumber*)tag index:(nonnull NSNumber*)node callback:(RCTResponseSenderBlock)callback);
RCT_EXTERN_METHOD(advanceWithFrame:(nonnull NSNumber*)tag index:(nonnull NSNumber*)node resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject);

_RCT_EXTERN_REMAP_METHOD(advance, advance:(nonnull NSNumber*)tag index:(nonnull NSNumber*)node resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject, NO);
_RCT_EXTERN_REMAP_METHOD(goNextWithResolver, goNextWithResolver::::, NO);
_RCT_EXTERN_REMAP_METHOD(goBackWithResolver, goBackWithResolver::::, NO);

@end
