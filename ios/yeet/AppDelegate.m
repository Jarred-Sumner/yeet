/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <SDWebImageWebPCoder.h>
#import <SDWebImage/SDImageLoadersManager.h>
#import <SDWebImagePhotosPlugin.h>
#import "YeetWebImageDecoder.h"
#import <RNFastImage/FFFastImageViewManager.h>
#import "SDImageCacheConfig.h"
#import "yeet-Bridging-Header.h"
//#import <FlipperKit/FlipperClient.h>
//#import <FlipperKitLayoutComponentKitSupport/FlipperKitLayoutComponentKitSupport.h>
//#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
//#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
//#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
//

@import Firebase;

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  SDImageLoadersManager.sharedManager.loaders = @[SDWebImageDownloader.sharedDownloader, SDWebImagePhotosLoader.sharedLoader];
  // Replace default manager's loader implementation
  SDWebImageManager.defaultImageLoader = SDImageLoadersManager.sharedManager;
  SDWebImagePhotosLoader.sharedLoader.imageRequestOptions.deliveryMode = PHImageRequestOptionsDeliveryModeOpportunistic;
  

  [SDImageCache.sharedImageCache.config setMaxMemoryCost:50 * 1024 * 1024];
  [SDImageCache.sharedImageCache.config setMaxDiskSize:100 * 1024 * 1024];



  SDImageCache.sharedImageCache.config.diskCacheReadingOptions = NSDataReadingMappedIfSafe;

  // Limit progress block callback frequency
  SDWebImageDownloader.sharedDownloader.config.minimumProgressInterval = 0.1;

//
//  FlipperClient *client = [FlipperClient sharedClient];
//  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
//  [FlipperKitLayoutComponentKitSupport setUpWithDescriptorMapper: layoutDescriptorMapper];
//  [client addPlugin: [[FlipperKitLayoutPlugin alloc] initWithRootNode: application
//                                                 withDescriptorMapper: layoutDescriptorMapper]];
//
//  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
//  [client addPlugin: [[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
//  [client start];


  SDImageWebPCoder *webPCoder = [SDImageWebPCoder sharedCoder];
  [[SDImageCodersManager sharedManager] addCoder:webPCoder];

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"yeet"
                                            initialProperties:nil];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
[FIRApp configure];
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
