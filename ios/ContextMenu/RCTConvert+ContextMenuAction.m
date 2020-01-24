//
//  RCTConvert+ContextMenuAction.m
//  reactnativeuimenu
//
//  Created by Matthew Iannucci on 10/7/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RCTConvert+ContextMenuAction.h"

@implementation RCTConvert(ContextMenuAction)

+ (ContextMenuAction*) ContextMenuAction:(id)json {
  json = [self NSDictionary:json];
  ContextMenuAction* action = [[ContextMenuAction alloc] init];
  action.title = [self NSString:json[@"title"]];
  action.identifier = [self NSString:json[@"id"]];
  action.systemIcon = [self NSString:json[@"systemIcon"]];
  action.disabled = [self BOOL:json[@"disabled"]] || false;
  action.destructive = [self BOOL:json[@"destructive"]] || false;
  action.hidden = [self BOOL:json[@"hidden"]] || false;

  NSArray *_children = [self NSDictionaryArray:json[@"children"]];
  if (_children != nil && _children.count > 0) {
    action.children = [RCTConvert ContextMenuActionArray:_children];
  }
  return action;
}

+(NSArray<ContextMenuAction*>*) ContextMenuActionArray:(id)json {
  json = [self NSArray:json];
  NSMutableArray<ContextMenuAction*>* actions = [[NSMutableArray alloc] init];
  
  for (NSDictionary* dict in json) {
    [actions addObject:[self ContextMenuAction:dict]];
  }
  
  return [NSArray arrayWithArray:actions];
}

@end
