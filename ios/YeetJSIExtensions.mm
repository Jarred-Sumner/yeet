//
//  YeetJSIExtensions.m
//  yeet
//
//  Created by Jarred WSumner on 2/14/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

#import "YeetJSIExtensions.h"


@implementation RCTScrollView (hacks)

- (NSDictionary*)body {
  return @{
    @"contentOffset": @{
      @"x": @(self.scrollView.contentOffset.x),
      @"y": @(self.scrollView.contentOffset.y)
    },
    @"contentInset": @{
      @"top": @(self.contentInset.top),
      @"left": @(self.contentInset.left),
      @"bottom": @(self.contentInset.bottom),
      @"right": @(self.contentInset.right)
    },
    @"contentSize": @{
      @"width": @(self.contentSize.width),
      @"height": @(self.contentSize.height)
    },
    @"layoutMeasurement": @{
      @"width": @(self.frame.size.width),
      @"height": @(self.frame.size.height)
    },
    @"zoomScale": @(self.scrollView.zoomScale ?: 1),
  };
}
@end

@implementation RCTUIManager (ext)
- (UIView *)unsafeViewForReactTag:(NSNumber *)reactTag {
  return self.viewRegistry[reactTag];
}
@end
