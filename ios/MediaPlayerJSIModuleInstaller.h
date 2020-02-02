//
//  MediaPlayerJSIModuleInstaller.h
//  yeet
//
//  Created by Jarred WSumner on 1/30/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN
@class MediaPlayerViewManager;

@interface MediaPlayerJSIModuleInstaller : NSObject

+(void)install:(id)player;

@end

NS_ASSUME_NONNULL_END
