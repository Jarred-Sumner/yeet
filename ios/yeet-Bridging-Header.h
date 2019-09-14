//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>
#import <SDWebImage/SDAnimatedImage.h>
#import <React/RCTUIManager.h>
#import <FFFastImageView.h>
#import <React/RCTUIManagerUtils.h>
#import <SDWebImageWebPCoder.h>
#import <React/RCTMultilineTextInputView.h>
#import <React/RCTMultilineTextInputViewManager.h>
#import <React/RCTScrollView.h>
#import <React/UIView+React.h>

#import <React/RCTInputAccessoryView.h>
#import <React/RCTInputAccessoryViewContent.h>
#import <React/RCTTextAttributes.h>
#import <React/RCTTextSelection.h>

@interface RCT_EXTERN_MODULE(YeetExporter, NSObject)

RCT_EXTERN_METHOD(startExport:(NSString*)data isServerOnly:(BOOL)isServerOnly callback: (RCTResponseSenderBlock)callback);

@end

@interface RCT_EXTERN_MODULE(YeetTextInputViewManager, RCTMultilineTextInputViewManager)

RCT_EXPORT_VIEW_PROPERTY(highlightColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(highlightCornerRadius, CGFloat);
RCT_EXPORT_VIEW_PROPERTY(highlightInset, CGFloat);
RCT_EXPORT_VIEW_PROPERTY(fontSizeRnge, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(showHighlight, BOOL);


@end

