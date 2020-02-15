//
//  YeetJSIModule.m
//  yeet
//
//  Created by Jarred WSumner on 1/29/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import "YeetJSIModule.h"
#import "MediaPlayerViewManager.h"
#import "YeetJSIUTils.h"
#import "RCTConvert+PHotos.h"
#import <MMKV/MMKV.h>
#import "YeetSplashScreen.h"
#import <React/RCTShadowView.h>
#import "PanViewManager.h"



YeetJSIModule::YeetJSIModule(RCTCxxBridge *bridge)
: bridge_(bridge) {
  std::shared_ptr<facebook::react::JSCallInvoker> _jsInvoker = std::make_shared<react::BridgeJSCallInvoker>(bridge.reactInstance);
}


void YeetJSIModule::install(RCTCxxBridge *bridge) {
  if (bridge.runtime == nullptr) {
    return;
  }

 jsi::Runtime &runtime = *(jsi::Runtime *)bridge.runtime;

 auto reaModuleName = "YeetJSI";
 auto reaJsiModule = std::make_shared<YeetJSIModule>(std::move(bridge));
 auto object = jsi::Object::createFromHostObject(runtime, reaJsiModule);
 runtime.global().setProperty(runtime, reaModuleName, std::move(object));
}

jsi::Value YeetJSIModule::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
  auto methodName = name.utf8(runtime);

  RCTCxxBridge* _bridge = bridge_;
  std::shared_ptr<facebook::react::JSCallInvoker> jsInvoker = _jsInvoker;

  if (methodName == "photosAuthorizationStatus") {
    NSString *value = [RCTConvert PHAuthorizationStatusValuesReversed][@([PHPhotoLibrary authorizationStatus])];

    if (value != nil) {
      return convertNSStringToJSIString(runtime, value);
    } else {
      return convertNSStringToJSIString(runtime, [RCTConvert PHAuthorizationStatusValuesReversed][@(PHAuthorizationStatusNotDetermined)]);
    }

  } else if (methodName == "scrollViewMetrics") {


     return jsi::Function::createFromHostFunction(runtime, name, 1, [_bridge, jsInvoker](
           jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {



        __block NSNumber *scrollViewTag = convertJSIValueToObjCObject(runtime, arguments[0], jsInvoker);
       __block RCTScrollView *scrollView = [_bridge.uiManager unsafeViewForReactTag:scrollViewTag];
       __block NSDictionary *bodyValue;

       dispatch_group_t group = dispatch_group_create();
       dispatch_group_enter(group);
       RCTExecuteOnMainQueue(^{
         bodyValue = scrollView.body;
          dispatch_group_leave(group);
       });
       dispatch_group_wait(group, DISPATCH_TIME_NOW + (1.0 * NSEC_PER_SEC));

       if (scrollView != nil) {
         return convertObjCObjectToJSIValue(runtime, bodyValue);
       } else {
         return jsi::Value::null();
       }

    });
  } else if (methodName == "triggerScrollEvent") {
    RCTCxxBridge* _bridge = bridge_;
    std::shared_ptr<facebook::react::JSCallInvoker> jsInvoker = _jsInvoker;
     return jsi::Function::createFromHostFunction(runtime, name, 1, [_bridge, jsInvoker](
           jsi::Runtime &runtime,
           const jsi::Value &thisValue,
           const jsi::Value *arguments,
           size_t count) -> jsi::Value {

       __block NSNumber *scrollViewTag = convertJSIValueToObjCObject(runtime, arguments[0], jsInvoker);

       if (scrollViewTag == nil) {
         return jsi::Value::null();
       }

       RCTExecuteOnMainQueue(^{
         RCTScrollView *scrollView = [_bridge.uiManager viewForReactTag:scrollViewTag];
         if (scrollView != nil) {
           [scrollView scrollViewDidZoom:scrollView.scrollView];
         }
       });

       return jsi::Value(true);
   });
  } else if (methodName == "removeItem") {
    MMKV *mmkv = [MMKV defaultMMKV];
    return jsi::Function::createFromHostFunction(runtime, name, 1, [mmkv](
          jsi::Runtime &runtime,
          const jsi::Value &thisValue,
          const jsi::Value *arguments,
          size_t count) -> jsi::Value {


      NSString *key = convertJSIStringToNSString(runtime, arguments[0].asString(runtime));

      if (key && key.length > 0) {
        [mmkv removeValueForKey:key];
        return jsi::Value(true);
      } else {
        return jsi::Value(false);
      }
    });
  } else if (methodName == "getItem") {
    MMKV *mmkv = [MMKV defaultMMKV];
    return jsi::Function::createFromHostFunction(runtime, name, 2, [mmkv](
          jsi::Runtime &runtime,
          const jsi::Value &thisValue,
          const jsi::Value *arguments,
          size_t count) -> jsi::Value {

      NSString *type =  convertJSIStringToNSString(runtime, arguments[1].asString(runtime));
      NSString *key =   convertJSIStringToNSString(runtime, arguments[0].asString(runtime));

      if (!key || ![key length]) {
        return jsi::Value::null();
      }

      if ([type isEqualToString:@"string"]) {
        NSString *value = [mmkv getStringForKey:key];

        if (value) {
          return convertNSStringToJSIString(runtime, value);
        } else {
          return jsi::Value::null();
        }
      } else if ([type isEqualToString:@"number"]) {
        double value = [mmkv getDoubleForKey:key];

        if (value) {
          return jsi::Value(value);
        } else {
          return jsi::Value::null();
        }
      } else if ([type isEqualToString:@"bool"]) {
        BOOL value = [mmkv getBoolForKey:key defaultValue:NO];

        return jsi::Value(value == YES ? 1 : 0);
      } else {
        return jsi::Value::null();
      }
    });
  } else if (methodName == "setItem") {
    MMKV *mmkv = [MMKV defaultMMKV];
    return jsi::Function::createFromHostFunction(runtime, name, 3, [mmkv](
             jsi::Runtime &runtime,
             const jsi::Value &thisValue,
             const jsi::Value *arguments,
             size_t count) -> jsi::Value {
      NSString *type =  convertJSIStringToNSString(runtime, arguments[2].asString(runtime));
      NSString *key =   convertJSIStringToNSString(runtime, arguments[0].asString(runtime));

      if (!key || ![key length]) {
        return jsi::Value::null();
      }

      if ([type isEqualToString:@"string"]) {
        NSString *value = convertJSIStringToNSString(runtime, arguments[1].asString(runtime));

        if ([value length] > 0) {
          return jsi::Value([mmkv setString:value forKey:key]);
        } else {
          return jsi::Value(false);
        }
      } else if ([type isEqualToString:@"number"]) {
        double value = arguments[2].asNumber();

        return jsi::Value([mmkv setDouble:value forKey:key]);
      } else if ([type isEqualToString:@"bool"]) {
        BOOL value = arguments[2].asNumber();

        return jsi::Value([mmkv setBool:value forKey:key]);
      } else {
        return jsi::Value::null();
      }
    });

  } else if (methodName == "hideSplashScreen") {
    return jsi::Function::createFromHostFunction(runtime, name, 0, [](
             jsi::Runtime &runtime,
             const jsi::Value &thisValue,
             const jsi::Value *arguments,
             size_t count) -> jsi::Value {

      [YeetSplashScreen hide];

      return jsi::Value(true);
    });

  } else if (methodName == "hapticFeedback") {
    RCTBridge *rctBridge = _bridge;
    RNReactNativeHapticFeedback *haptic = [rctBridge moduleForClass:[RNReactNativeHapticFeedback class]];


    return jsi::Function::createFromHostFunction(runtime, name, 2, [haptic, jsInvoker](
             jsi::Runtime &runtime,
             const jsi::Value &thisValue,
             const jsi::Value *arguments,
             size_t count) -> jsi::Value {

      NSDictionary *options = convertJSIObjectToNSDictionary(runtime, arguments[1].asObject(runtime), jsInvoker);
      NSString *type = convertJSIStringToNSString(runtime, arguments[0].asString(runtime));

      [haptic trigger:type options:options];


      return jsi::Value(true);
    });
  } else if (methodName == "focus") {
    RCTBridge *rctBridge = _bridge;

    return jsi::Function::createFromHostFunction(runtime, name, 1, [rctBridge, jsInvoker](
             jsi::Runtime &runtime,
             const jsi::Value &thisValue,
             const jsi::Value *arguments,
             size_t count) -> jsi::Value {

      __block NSNumber *tag = @(arguments[0].asNumber());

      RCTExecuteOnMainQueue(^{
        UIView *view = [rctBridge.uiManager viewForReactTag:tag];
        [view reactFocus];
        tag = nil;
      });

      return jsi::Value::undefined();
    });
  } else if (methodName == "blur") {
    RCTBridge *rctBridge = _bridge;

    return jsi::Function::createFromHostFunction(runtime, name, 1, [rctBridge, jsInvoker](
             jsi::Runtime &runtime,
             const jsi::Value &thisValue,
             const jsi::Value *arguments,
             size_t count) -> jsi::Value {

      __block NSNumber *tag = @(arguments[0].asNumber());
      RCTExecuteOnMainQueue(^{
        UIView *view = [rctBridge.uiManager viewForReactTag:tag];
        [view reactBlur];
        tag = nil;
      });
      return jsi::Value::undefined();
    });
  } else if (methodName == "transitionPanView") {
    RCTBridge *rctBridge = _bridge;
    PanViewManager *panViewManager = [rctBridge moduleForClass:[PanViewManager class]];

    return jsi::Function::createFromHostFunction(runtime, name, 2, [rctBridge, jsInvoker, panViewManager](
             jsi::Runtime &runtime,
             const jsi::Value &thisValue,
             const jsi::Value *arguments,
             size_t count) -> jsi::Value {

      __block NSNumber *toTag = @(arguments[0].asNumber());

      [panViewManager transition:toTag to:convertJSIStringToNSString(runtime, arguments[1].asString(runtime))];
      return jsi::Value::null();
    });
  }

  return jsi::Value::undefined();
}
