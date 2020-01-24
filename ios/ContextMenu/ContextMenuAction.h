//
//  ContextMenuAction.h
//  reactnativeuimenu
//
//  Created by Matthew Iannucci on 10/6/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface ContextMenuAction : NSObject

@property (nonatomic, copy, nonnull) NSString* identifier;
@property (nonatomic, copy, nonnull) NSString* title;
@property (nonatomic, copy, nullable) NSString* systemIcon;

@property (nonatomic) BOOL hidden;
@property (nonatomic) BOOL destructive;
@property (nonatomic) BOOL disabled;

@property (nonatomic, copy) NSArray *children;

@property (readonly) UIMenuElementAttributes attributes;

@end
