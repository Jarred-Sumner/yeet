//
//  ContextMenuAction.m
//  reactnativeuimenu
//
//  Created by Matthew Iannucci on 10/6/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "ContextMenuAction.h"

@implementation ContextMenuAction

- (instancetype) init {
  self = [super init];

  self.destructive = NO;
  self.hidden = NO;
  self.disabled = NO;
  self.children = [[NSMutableArray alloc] init];

  return self;
}

- (UIMenuElementAttributes)attributes  API_AVAILABLE(ios(13.0)){
  if (self.hidden && self.destructive && self.disabled) {
    return UIMenuElementAttributesHidden & UIMenuElementAttributesDestructive & UIMenuElementAttributesDisabled;
  } else if (self.hidden && self.destructive) {
    return UIMenuElementAttributesHidden & UIMenuElementAttributesDestructive;
  } else if (self.disabled && self.destructive) {
     return UIMenuElementAttributesDisabled & UIMenuElementAttributesDestructive;
 } else if (self.hidden && self.disabled) {
     return UIMenuElementAttributesDisabled & UIMenuElementAttributesHidden;
 } else if (self.hidden) {
    return UIMenuElementAttributesHidden;
  } else if (self.destructive) {
    return UIMenuElementAttributesDestructive;
  } else if (self.disabled) {
    return UIMenuElementAttributesDisabled;
  } else {
    return 0;
  }
}

@end
