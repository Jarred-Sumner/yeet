//
//  PanShadowView.m
//  yeet
//
//  Created by Jarred WSumner on 2/11/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

#import "PanShadowView.h"
#import <React/RCTUtils.h>

@implementation PanShadowView

- (void)insertReactSubview:(id<RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[RCTShadowView class]]) {
    ((RCTShadowView *)subview).size = RCTScreenSize();
  }
}

@end
