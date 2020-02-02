//
//  MediaPlayerJSIModule.m
//  yeet
//
//  Created by Jarred WSumner on 1/29/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import "MediaPlayerJSIModule.h"
#import <React/RCTBridge+Private.h>
#import "MediaPlayerViewManager.h"
#import "YeetJSIUTils.h"
#import <react-native-cameraroll/RNCCameraRollManager.h>
#import <ReactCommon/TurboModule.h>
#import <Foundation/Foundation.h>
#import "CameraRoll.h"



MediaPlayerJSIModule::MediaPlayerJSIModule(MediaPlayerViewManager* mediaPlayer)
: mediaPlayer_(mediaPlayer) {}


void MediaPlayerJSIModule::install(MediaPlayerViewManager *mediaPlayerManager) {
  MediaPlayerViewManager *_mediaPlayerManager = mediaPlayerManager;
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)mediaPlayerManager.bridge;


  if (cxxBridge.runtime == nullptr) {
    return;
  }


 jsi::Runtime &runtime = *(jsi::Runtime *)cxxBridge.runtime;

 auto reaModuleName = "MediaPlayerViewManager";

 auto reaJsiModule = std::make_shared<MediaPlayerJSIModule>(std::move(_mediaPlayerManager));

 auto object = jsi::Object::createFromHostObject(runtime, reaJsiModule);

 runtime.global().setProperty(runtime, reaModuleName, std::move(object));

}

jsi::Value MediaPlayerJSIModule::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
  auto methodName = name.utf8(runtime);

  if (methodName == "isCached") {
    MediaPlayerViewManager* mediaPlayerViewManager = mediaPlayer_;


    return jsi::Function::createFromHostFunction(runtime, name, 2, [mediaPlayerViewManager](
          jsi::Runtime &runtime,
          const jsi::Value &thisValue,
          const jsi::Value *arguments,
          size_t count) -> jsi::Value {

       auto arg1 = &arguments[0];
      auto __id = convertJSIStringToNSString(runtime, arg1->asString(runtime));

      if ([mediaPlayerViewManager isRegistered:__id]) {
        return convertNSNumberToJSIBoolean(runtime, @(1));
      } else {
        return convertNSNumberToJSIBoolean(runtime, @(0));
      }
   });
  } else if (methodName == "startCaching") {
    MediaPlayerViewManager* mediaPlayerViewManager = mediaPlayer_;
     return jsi::Function::createFromHostFunction(runtime, name, 3, [mediaPlayerViewManager](
           jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {

      auto sources = &arguments[0];
      auto bounds = &arguments[1];
      auto contentMode = &arguments[2];

       __block id _sources = convertJSIValueToObjCObject(runtime, sources->asObject(runtime));
       __block CGRect _bounds = [RCTConvert CGRect:convertJSIObjectToNSDictionary(runtime, bounds->asObject(runtime))];

       __block NSString *__contentMode = convertJSIStringToNSString(runtime, contentMode->asString(runtime));
       UIViewContentMode _contentMode;
       if ([__contentMode isEqualToString:@"aspectFill"]) {
         _contentMode = UIViewContentModeScaleAspectFill;
       } else if ([__contentMode isEqualToString:@"aspectFit"]) {
         _contentMode = UIViewContentModeScaleAspectFit;
       }

       dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        [mediaPlayerViewManager startCachingMediaSources:_sources bounds:_bounds contentMode:_contentMode];
       });


       return jsi::Value::null();
    });
  } else if (methodName == "stopCaching") {
    MediaPlayerViewManager* mediaPlayerViewManager = mediaPlayer_;
     return jsi::Function::createFromHostFunction(runtime, name, 0, [mediaPlayerViewManager](
           jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {

       [mediaPlayerViewManager stopCachingAll];

       return jsi::Value::null();
    });
  } else if (methodName == "batchPlay") {
    MediaPlayerViewManager* mediaPlayerViewManager = mediaPlayer_;
     return jsi::Function::createFromHostFunction(runtime, name, 2, [mediaPlayerViewManager](
           jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {

       auto ids = &arguments[1];
       id _ids = convertJSIValueToObjCObject(runtime, ids->asObject(runtime));

       [mediaPlayerViewManager batchPlay:@(arguments[0].asNumber()) IDs:_ids];

       return jsi::Value::null();
    });
  } else if (methodName == "batchPause") {
    MediaPlayerViewManager* mediaPlayerViewManager = mediaPlayer_;
     return jsi::Function::createFromHostFunction(runtime, name, 2, [mediaPlayerViewManager](
           jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {


         auto ids = &arguments[1];
         id _ids = convertJSIValueToObjCObject(runtime, ids->asObject(runtime));

       [mediaPlayerViewManager batchPause:@(arguments[0].asNumber()) IDs:_ids];


       return jsi::Value::null();
    });
  } else if (methodName == "play") {
    MediaPlayerViewManager* mediaPlayerViewManager = mediaPlayer_;
     return jsi::Function::createFromHostFunction(runtime, name, 2, [mediaPlayerViewManager](
           jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {

       [mediaPlayerViewManager play:@(arguments[0].asNumber())];

       return jsi::Value::null();
    });
  } else if (methodName == "pause") {
    MediaPlayerViewManager* mediaPlayerViewManager = mediaPlayer_;
     return jsi::Function::createFromHostFunction(runtime, name, 2, [mediaPlayerViewManager](
           jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {

       [mediaPlayerViewManager pause:@(arguments[0].asNumber())];

       return jsi::Value::null();
    });
  } else if (methodName == "getPhotos") {
     return jsi::Function::createFromHostFunction(runtime, name, 1, [](
           jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {

       NSDictionary *params = convertJSIObjectToNSDictionary(runtime, arguments[0].asObject(runtime));

       PHImageContentMode contentMode = PHImageContentModeAspectFill;
       if ([params[@"contentMode"] isEqualToString:@"aspectFit"]) {
         contentMode = PHImageContentModeAspectFit;
       }

       CameraRoll *cameraRoll = [CameraRoll withAlbumID:[params objectForKey:@"albumId"] mediaType: params[@"mediaType"] size:[RCTConvert CGSize:params[@"size"]] contentMode:contentMode cache:[RCTConvert BOOL:params[@"cache"]]];

       NSInteger offset = [params[@"offset"] integerValue];
       NSInteger length = [params[@"length"] integerValue];

       NSDictionary *results = [cameraRoll from:offset to:length];

        params = nil;
       cameraRoll = nil;

       return convertNSDictionaryToJSIObject(runtime, results);
    });
  } else if (methodName == "getAlbums") {
     return jsi::Function::createFromHostFunction(runtime, name, 0, [](
           jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {


       NSArray *collections = [CameraRoll assetCollections];
       NSMutableArray *dicts = [[NSMutableArray alloc] initWithCapacity:collections.count];
       for (PHAssetCollection *collection in collections) {
         [dicts addObject:[collection dictionaryValue]];
       }

       return convertNSArrayToJSIArray(runtime, dicts);
    });
  } else if (methodName == "stopAlbumSession") {
     return jsi::Function::createFromHostFunction(runtime, name, 1, [](
           jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {


       [CameraRoll stopSession:convertJSIStringToNSString(runtime, arguments[0].asString(runtime))];

       return jsi::Value::null();
    });
  }




  return jsi::Value::undefined();
}


