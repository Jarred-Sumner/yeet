//
//  YeetBridge.m
//  yeet
//
//  Created by Jarred WSumner on 2/4/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

#import "YeetBridge.h"
#import <React/RCTModuleData.h>
#import <React/RCTLog.h>

@implementation YeetCxxBridge{
  id<RCTTurboModuleLookupDelegate> _turboModuleLookupDelegate;
}

- (void) setRCTTurboModuleLookupDelegate:(id<RCTTurboModuleLookupDelegate>)turboModuleLookupDelegate{
  [super setRCTTurboModuleLookupDelegate:turboModuleLookupDelegate];
  _turboModuleLookupDelegate = turboModuleLookupDelegate;
}

- (id)moduleForName:(NSString *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad
{
  if (_turboModuleLookupDelegate) {
    const char* moduleNameCStr = [moduleName UTF8String];
    if (lazilyLoad || [_turboModuleLookupDelegate moduleIsInitialized:moduleNameCStr]) {
      id<RCTTurboModule> module = [_turboModuleLookupDelegate moduleForName:moduleNameCStr warnOnLookupFailure:NO];
      if (module != nil) {
        return module;
      }
    }
  }

  if (!lazilyLoad) {

    return [self moduleDataForName:moduleName].instance;
  }

  RCTModuleData *moduleData = [self moduleDataForName:moduleName];
  if (moduleData) {
    if (![moduleData isKindOfClass:[RCTModuleData class]]) {
      // There is rare race condition where the data stored in the dictionary
      // may have been deallocated, which means the module instance is no longer
      // usable.
      return nil;
    }
    return moduleData.instance;
  }

  static NSSet<NSString *> *ignoredModuleLoadFailures = [NSSet setWithArray: @[@"UIManager"]];

  // Module may not be loaded yet, so attempt to force load it here.
  const BOOL result = [self.delegate respondsToSelector:@selector(bridge:didNotFindModule:)] &&
    [self.delegate bridge:self didNotFindModule:moduleName];
  if (result) {
    // Try again.
    moduleData = [self moduleDataForName:moduleName];
  } else if ([ignoredModuleLoadFailures containsObject: moduleName]) {
    RCTLogWarn(@"Unable to find module for %@", moduleName);
  } else {
    RCTLogError(@"Unable to find module for %@", moduleName);
  }

  return moduleData.instance;
}

@end


@implementation YeetBridge

- (Class)bridgeClass {
  return [YeetCxxBridge class];
}

@end
