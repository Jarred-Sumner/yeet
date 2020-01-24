//
//  ContextMenu.m
//  reactnativeuimenu
//
//  Created by Matthew Iannucci on 10/6/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "ContextMenuView.h"
#import <React/UIView+React.h>

@implementation ContextMenuView

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  if (@available(iOS 13.0, *)) {
    UIContextMenuInteraction* contextInteraction = [[UIContextMenuInteraction alloc] initWithDelegate:self];
    
    [subview addInteraction:contextInteraction];
  }
}

- (void)removeReactSubview:(UIView *)subview
{
    [super removeReactSubview:subview];
}

- (void)didUpdateReactSubviews
{
  [super didUpdateReactSubviews];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
}

- (nullable UIContextMenuConfiguration *)contextMenuInteraction:(nonnull UIContextMenuInteraction *)interaction configurationForMenuAtLocation:(CGPoint)location  API_AVAILABLE(ios(13.0)){
  
  return [UIContextMenuConfiguration configurationWithIdentifier:nil previewProvider:nil actionProvider:^UIMenu * _Nullable(NSArray<UIMenuElement *> * _Nonnull suggestedActions) {
    NSMutableArray* actions = [[NSMutableArray alloc] init];
    
    for (ContextMenuAction* thisAction in self.actions) {
      UIImage *icon = thisAction.systemIcon != nil ? [UIImage systemImageNamed:thisAction.systemIcon] : nil;

      UIAction* actionMenuItem = [UIAction actionWithTitle:thisAction.title image:icon identifier:nil handler:^(__kindof UIAction * _Nonnull action) {
        if (self.onPress != nil) {
          self.onPress(@{@"title": thisAction.title, @"id": thisAction.identifier});
        }
        
      }];



      if (thisAction.disabled || thisAction.destructive || thisAction.hidden) {
        actionMenuItem.attributes = thisAction.attributes;
      }
      
      [actions addObject:actionMenuItem];
    }
                              
    return [UIMenu menuWithTitle:self.title children:actions];
  }];
}

@end
