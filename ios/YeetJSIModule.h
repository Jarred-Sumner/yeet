//
//  YeetJSIModule.h
//  yeet
//
//  Created by Jarred WSumner on 2/6/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

#import <jsi/jsi.h>
#include <ReactCommon/BridgeJSCallInvoker.h>

using namespace facebook;

@class RCTCxxBridge;

class JSI_EXPORT YeetJSIModule : public jsi::HostObject {
public:
    YeetJSIModule(RCTCxxBridge* bridge);

    static void install(RCTCxxBridge *bridge);

    /*
     * `jsi::HostObject` specific overloads.
     */
    jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override;

    

private:
    RCTCxxBridge* bridge_;
    std::shared_ptr<facebook::react::JSCallInvoker> _jsInvoker;
};
