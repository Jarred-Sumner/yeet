//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//

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

#import <React/RCTInputAccessoryView.h>
#import <React/RCTInputAccessoryViewContent.h>
#import <React/RCTTextAttributes.h>
#import <React/RCTTextSelection.h>
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
#import <XExtensionItem/XExtensionItem.h>

@interface UIView(PrivateMtehods)
  @property BOOL reactIsFocusNeeded;
  - (void)dirtyLayout;
  - (void)clearLayout;
  - (void)didSetProps:(__unused NSArray<NSString *> *)changedProps;
@end

@interface RCTBaseTextInputView(PrivateMethods)

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
RCT_EXPORT_VIEW_PROPERTY(onTransform, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onTransformLayout, RCTDirectEventBlock);

@end

@interface RCT_EXTERN_MODULE(YeetTextInputViewManager, RCTMultilineTextInputViewManager)

RCT_EXPORT_VIEW_PROPERTY(highlightColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat);
RCT_REMAP_VIEW_PROPERTY(borderType, borderTypeString, YeetTextInputBorder);
RCT_EXPORT_VIEW_PROPERTY(highlightCornerRadius, CGFloat);
RCT_EXPORT_VIEW_PROPERTY(highlightInset, CGFloat);
RCT_EXPORT_VIEW_PROPERTY(singleFocus, BOOL);


RCT_EXPORT_VIEW_PROPERTY(isSticker, BOOL);
RCT_EXPORT_VIEW_PROPERTY(isSelectable, BOOL);
RCT_EXPORT_VIEW_PROPERTY(template, NSString);
RCT_EXPORT_VIEW_PROPERTY(fontSizeRnge, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(showHighlight, BOOL);


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
