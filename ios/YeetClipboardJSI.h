//
//  YeetClipboardJSI.h
//  yeet
//
//  Created by Jarred WSumner on 2/6/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "YeetClipboard.h"
#include <ReactCommon/BridgeJSCallInvoker.h>
#import <jsi/jsi.h>

#ifdef __cplusplus

using namespace facebook;

@class RCTCxxBridge;

class JSI_EXPORT YeetClipboardJSIModule : public jsi::HostObject {
public:
    YeetClipboardJSIModule(YeetClipboard* clipboard);

    static void install(YeetClipboard *clipboard);

    /*
     * `jsi::HostObject` specific overloads.
     */
    jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override;

    jsi::Value getOther(jsi::Runtime &runtime, const jsi::PropNameID &name);

private:
    YeetClipboard* clipboard_;
    std::shared_ptr<facebook::react::JSCallInvoker> _jsInvoker;
};

#endif



