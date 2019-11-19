/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"
#import "yeet-Bridging-Header.h"

#import <PINRemoteImage/PINRemoteImageManagerResult.h>

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <SDWebImageWebPCoder.h>
#import <SDWebImage/SDImageLoadersManager.h>
#import <SDWebImagePhotosPlugin.h>
#import "YeetWebImageDecoder.h"
#import <RNFastImage/FFFastImageViewManager.h>
#import "SDImageCacheConfig.h"
#import <RCTCronetHTTPRequestHandler.h>
#import <Cronet/Cronet.h>
#import "EnableWebpDecoder.h"
#import <React/RCTLinkingManager.h>
#import <AppCenterReactNativeShared/AppCenterReactNativeShared.h>
#import <AppCenterReactNative.h>
#import <AppCenterReactNativeAnalytics.h>
#import <AppCenterReactNativeShared/AppCenterReactNativeShared.h>
#import <AppCenterReactNative.h>
#import <AppCenterReactNativeAnalytics.h>
#import <CodePush/CodePush.h>
#import <AVFoundation/AVFoundation.h>
#import "RNSplashScreen.h"  // here

//#import <FlipperKit/FlipperClient.h>
//#import <FlipperKitLayoutComponentKitSupport/FlipperKitLayoutComponentKitSupport.h>
//#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
//#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
//#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
//

#ifndef TEST
@import Firebase;
#endif
@import SBObjectiveCWrapper;



@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{


//  [[AVAudioSession sharedInstance] setMode:AVAudioSessionMode error:<#(NSError *__autoreleasing  _Nullable * _Nullable)#>]
  SDImageLoadersManager.sharedManager.loaders = @[SDWebImageDownloader.sharedDownloader, SDWebImagePhotosLoader.sharedLoader];
  // Replace default manager's loader implementation
  SDWebImageManager.defaultImageLoader = SDImageLoadersManager.sharedManager;
  SDWebImagePhotosLoader.sharedLoader.imageRequestOptions.deliveryMode = PHImageRequestOptionsDeliveryModeOpportunistic;
  if (!KTVHTTPCache.proxyIsRunning) {
    [KTVHTTPCache proxyStart:nil];
  }


  [SDImageCache.sharedImageCache.config setMaxMemoryCost:50 * 1024 * 1024];
  [SDImageCache.sharedImageCache.config setMaxDiskSize:100 * 1024 * 1024];
  SDImageCache.sharedImageCache.config.diskCacheReadingOptions = NSDataReadingMappedIfSafe;

//  [RCTCronetHTTPRequestHandler setCustomCronetBuilder:^{
//    [Cronet setHttp2Enabled:YES];
//    [Cronet setQuicEnabled:YES];
//    [Cronet setBrotliEnabled:YES];
//    [Cronet setHttpCacheType:CRNHttpCacheTypeDisk];
//
////    [Cronet addQuicHint:@"www.google.com" port:443 altPort:443];
//
//    [Cronet start];
//
//    [Cronet registerHttpProtocolHandler];
//    [Cronet unregisterHttpProtocolHandler];
//  }];
//

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
#ifndef TEST
[FIRApp configure];
[AppCenterReactNative register];
[AppCenterReactNativeAnalytics registerWithInitiallyEnabled:true];
#endif
[EnableWebpDecoder enable];


  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [RNSplashScreen showSplash:@"LaunchScreen" inRootView:rootView];

  [self.window makeKeyAndVisible];

  return YES;
}


- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [CodePush bundleURL];
#endif
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:app openURL:url options:options];
}

@end
