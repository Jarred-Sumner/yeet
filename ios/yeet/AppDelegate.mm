/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"
#import "yeet-Bridging-Header.h"

#import "YeetBridge.h"

#import <PINRemoteImage/PINRemoteImage.h>

//
//#import <React/RCTBridge.h>
//#import <React/RCTBundleURLProvider.h>
//#import <React/RCTRootView.h>
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
#import <CodePush/CodePush.h>
#import <AVFoundation/AVFoundation.h>
#import "RNSplashScreen.h"  // here
#import "VydiaRNFileUploader.h"
#import <PINCache/PINCache.h>
#import "NSNumber+CGFloat.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/JSCExecutorFactory.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTCxxBridgeDelegate.h>
//#import <React/RCTJavaScriptLoader.h>
//#import <React/RCTLinkingManager.h>
#import <React/RCTImageLoader.h>
#import <React/RCTLocalAssetImageLoader.h>
#import <React/RCTGIFImageDecoder.h>
#import <React/RCTNetworking.h>
#import <React/RCTHTTPRequestHandler.h>
#import <React/RCTDataRequestHandler.h>
#import <React/RCTFileRequestHandler.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <cxxreact/JSExecutor.h>
#import "YeetSplashScreen.h"

#import <KTVHTTPCache/KTVHTTPCache.h>

//#import <React/RCTCxxBridgeDelegate.h>
//#import <ReactCommon/RCTTurboModuleManager.h>
#import <React/CoreModulesPlugins.h>
//#import <React/JSCExecutorFactory.h>
#import <MMKV/MMKV.h>
#import "YeetJSIModule.h"

@interface AppDelegate() <RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate>{
  RCTTurboModuleManager *_turboModuleManager;
}
@end

//#import <FlipperKit/FlipperClient.h>
//#import <FlipperKitLayoutComponentKitSupport/FlipperKitLayoutComponentKitSupport.h>
//#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
//#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
//#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
//







@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
//  RCTEnableTurboModule(YES);
  [MMKV initializeMMKV:nil];
  

  [RCTCronetHTTPRequestHandler setCustomCronetBuilder:^{
    [Cronet setHttp2Enabled:YES];
    [Cronet setQuicEnabled:YES];
    [Cronet setBrotliEnabled:YES];
    [Cronet setHttpCacheType:CRNHttpCacheTypeDisk];
    [Cronet addQuicHint:@"www.google.com" port:443 altPort:443];
    [Cronet addQuicHint:@"https://getyeet.app" port:443 altPort:443];
    [Cronet addQuicHint:@"https://www.getyeet.app" port:443 altPort:443];
    [Cronet addQuicHint:@"https://yeet-backend.herokuapp.com" port:443 altPort:443];

    [Cronet start];
    [Cronet registerHttpProtocolHandler];
  }];


  [[UITextField appearance] setKeyboardAppearance:UIKeyboardAppearanceDark];
  

  if (![[[[NSUserDefaults standardUserDefaults] dictionaryRepresentation] allKeys] containsObject:@"HIDE_WAITLIST"]) {
    [[NSUserDefaults standardUserDefaults] setBool:NO forKey:@"HIDE_WAITLIST"];
  }


//  [[AVAudioSession sharedInstance] setMode:AVAudioSessionMode error:<#(NSError *__autoreleasing  _Nullable * _Nullable)#>]
  // Replace default manager's loader implementation
  SDWebImageManager.defaultImageLoader = SDImageLoadersManager.sharedManager;

  if (!KTVHTTPCache.proxyIsRunning) {
    [KTVHTTPCache proxyStart:nil];
  }


  PINCache *cache = (PINCache *)[[PINRemoteImageManager sharedImageManager] cache];
  [[cache memoryCache] setCostLimit:600 * [[UIScreen mainScreen] scale] * 600 * [[UIScreen mainScreen] scale] * 100];
  [[cache diskCache] setByteLimit:100 * 1024 * 1024];

  [[UITextField appearance] setTintColor:[UIColor whiteColor]];

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

  rootView.backgroundColor = [[UIColor alloc] initWithRed:0 green:0 blue:0 alpha:1];
#ifndef TEST
//[FIRApp configure];
[AppCenterReactNative register];
//[AppCenterReactNativeAnalytics registerWithInitiallyEnabled:true];
#endif
[EnableWebpDecoder enable];


  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [YeetSplashScreen showSplash:@"LaunchScreen" inRootView:rootView];

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


# pragma mark - RCTCxxBridgeDelegate

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  __weak __typeof(self) weakSelf = self;
  return std::make_unique<facebook::react::JSCExecutorFactory>([weakSelf, bridge](facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }


    __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      YeetJSIModule::install(bridge);
      strongSelf->_turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge delegate:strongSelf];
      [strongSelf->_turboModuleManager installJSBindingWithRuntime:&runtime];
    }
  });
}

#pragma mark RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
  if (RCTCoreModulesClassProvider(name)) {
    return RCTCoreModulesClassProvider(name);
  } else {
    return nil;
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::JSCallInvoker>)jsInvoker
{
  return nullptr;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                       instance:(id<RCTTurboModule>)instance
                                                      jsInvoker:(std::shared_ptr<facebook::react::JSCallInvoker>)jsInvoker
{
  return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  if (moduleClass == RCTImageLoader.class) {
    return [[moduleClass alloc] initWithRedirectDelegate:nil loadersProvider:^NSArray<id<RCTImageURLLoader>> *{
      return @[[RCTLocalAssetImageLoader new]];
    } decodersProvider:^NSArray<id<RCTImageDataDecoder>> *{
      return @[[RCTGIFImageDecoder new]];
    }];
  } else if (moduleClass == RCTNetworking.class) {
    return [[moduleClass alloc] initWithHandlersProvider:^NSArray<id<RCTURLRequestHandler>> *{
      return @[
        [RCTHTTPRequestHandler new],
        [RCTDataRequestHandler new],
        [RCTFileRequestHandler new],
      ];
    }];
  }
  // No custom initializer here.
  return [moduleClass new];
}

@end
