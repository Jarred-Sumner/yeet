//
//  MediaPlayerJSIModule.h
//  yeet
//
//  Created by Jarred WSumner on 1/29/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <jsi/jsi.h>

using namespace facebook;

@class MediaPlayerViewManager;

class JSI_EXPORT MediaPlayerJSIModule : public jsi::HostObject {
public:
    MediaPlayerJSIModule(MediaPlayerViewManager* mediaPlayer);

    static void install(MediaPlayerViewManager *mediaPlayerManager);

    /*
     * `jsi::HostObject` specific overloads.
     */
    jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override;

private:
    MediaPlayerViewManager* mediaPlayer_;
};


