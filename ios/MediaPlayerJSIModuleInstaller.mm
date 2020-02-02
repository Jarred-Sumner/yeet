//
//  MediaPlayerJSIModuleInstaller.m
//  yeet
//
//  Created by Jarred WSumner on 1/30/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import "MediaPlayerJSIModuleInstaller.h"
#import "MediaPlayerJSIModule.h"

@implementation MediaPlayerJSIModuleInstaller

+(void)install:(id)player {
  MediaPlayerJSIModule::install(player);
}
@end
