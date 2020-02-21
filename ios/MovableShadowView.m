//
//  MovableShadowView.m
//  yeet
//
//  Created by Jarred WSumner on 2/17/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

#import "MovableShadowView.h"
#import "EnableWebpDecoder.h"
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import "YeetTextInputShadowView.h"

#define IS_PREVIOUS_VALUE_DEFINED(value) value == -9999
#define IS_PREVIOUS_VALUE_UNDEFINED(value) value != -9999
#define PREVIOUS_VALUE_UNDEFINED -9999

@implementation MovableShadowView {
  RCTBridge *_bridge;
  BOOL _needsRealignment;
  CGFloat _previousBottomValue;
  CGFloat _previousTopValue;
  CGFloat _previousLeftValue;
}



-(id)init:(RCTBridge *)bridge {
  self = [super init];
    _bridge = bridge;
    _needsRealignment = NO;
      _previousTopValue = PREVIOUS_VALUE_UNDEFINED;
  _previousLeftValue = PREVIOUS_VALUE_UNDEFINED;
    _previousBottomValue = PREVIOUS_VALUE_UNDEFINED;


  return self;
}

@synthesize contentContainerTag;

- (RCTShadowView*)contentContainerView {
  if (!contentContainerTag) {
    return nil;
  }

    return [_bridge.uiManager shadowViewForReactTag:contentContainerTag];
}

- (BOOL)isInputFocused {
  return [YeetTextInputView.focusedMovableViewReactTag isEqualToNumber:self.reactTag];
}

- (nullable YeetTextInputShadowView*)textInputShadowView {
  if (!self.isInputFocused) {
    return nil;
  }

  return (YeetTextInputShadowView*)[_bridge.uiManager shadowViewForReactTag:YeetTextInputView.focusedReactTag];
}

- (BOOL)shouldAlignToKeyboard {
  YeetTextInputShadowView* inputShadowView = self.textInputShadowView;

  if (inputShadowView == nil) {
    return NO;
  }

  return inputShadowView.maxWidth.unit != YGUnitUndefined;
}

- (void)handleKeyboardHideEvent {
  if (!_needsRealignment) {
    return;
  }

//  if (IS_PREVIOUS_VALUE_DEFINED(_previousBottomValue)) {
//    float _bottom = RCTYogaFloatFromCoreGraphicsFloat(_previousBottomValue);
//    _previousBottomValue = PREVIOUS_VALUE_UNDEFINED;
//    self.bottom = (YGValue) { _bottom, YGUnitPoint };;
//  }


  float _left = RCTYogaFloatFromCoreGraphicsFloat(_previousLeftValue);
  self.left = (YGValue) { _left, YGUnitPoint };

  _needsRealignment = NO;
  _previousLeftValue = PREVIOUS_VALUE_UNDEFINED;

//  if (IS_PREVIOUS_VALUE_DEFINED(_previousBottomValue)) {
//
////    YGNodeMarkDirty(self.yogaNode);
//  } else if (IS_PREVIOUS_VALUE_DEFINED(_previousTopValue)) {
//
//    _needsRealignment = NO;
//    float _top = RCTYogaFloatFromCoreGraphicsFloat(_previousTopValue);
//    _previousTopValue = PREVIOUS_VALUE_UNDEFINED;
//    self.top = (YGValue) { _top, YGUnitPoint };;
//    CGFloat _left = RCTYogaFloatFromCoreGraphicsFloat(_previousLeftValue);
//    _previousLeftValue = PREVIOUS_VALUE_UNDEFINED;
//    self.left = (YGValue) { _left, YGUnitPoint };
////    YGNodeMarkDirty(self.yogaNode);
//  }
}

- (YGValue)keyboardLeft {
  return  (YGValue) { RCTYogaFloatFromCoreGraphicsFloat(0), YGUnitPoint };
}

- (void)handleKeyboardShowEventEndFrame:(CGRect)frame {
  if (!self.shouldAlignToKeyboard) {
    return;
  }

  RCTShadowView *contentContainer = [self contentContainerView];

  if (!contentContainer) {
    return;
  }



//    if (IS_PREVIOUS_VALUE_UNDEFINED(_previousBottomValue)) {
//    CGFloat previousBottomValue = RCTCoreGraphicsFloatFromYogaFloat(self.bottom.value);
////    }
//
//    CGFloat keyboardTop = frame.origin.y;
//
//    RCTLayoutMetrics metrics = contentContainer.layoutMetrics;
//    CGFloat yOffset = CGRectIntersection(frame, metrics.contentFrame).origin.y;
//
//
//    YGValue newBottom = (YGValue) { RCTYogaFloatFromCoreGraphicsFloat(yOffset * -1), YGUnitPoint };
    _previousLeftValue = self.left.value;
//    [self setBottom:newBottom];
//    _previousBottomValue = previousBottomValue;
    [self setLeft:self.keyboardLeft];
//    YGNodeMarkDirty(self.yogaNode);
    _needsRealignment = YES;
  
}

//- (void)setTop:(YGValue)top {
//  if (_previousTopValue != PREVIOUS_VALUE_UNDEFINED) {
//    return;
//  }
//
//  super.top = top;
//}
//
//- (void)setBottom:(YGValue)bottom {
//   if (_previousBottomValue != PREVIOUS_VALUE_UNDEFINED) {
//    return;
//  }
//
//  super.bottom = bottom;
//}


@end
