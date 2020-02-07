package com.yeet;

import android.app.Application;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.hermes.reactexecutor.HermesExecutorFactory;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.ReactApplication;
import io.realm.react.RealmReactPackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;
import com.microsoft.codepush.react.CodePush;
import com.reactnativecommunity.cameraroll.CameraRollPackage;
import com.microsoft.appcenter.reactnative.appcenter.AppCenterReactNativePackage;
import io.invertase.firebase.analytics.ReactNativeFirebaseAnalyticsPackage;
import com.dylanvann.fastimage.FastImageViewPackage;
import com.akshetpandey.rncronet.RNCronetNetworkingPackage;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.swmansion.reanimated.ReanimatedPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.ijzerenhein.sharedelement.RNSharedElementPackage;
import com.rnfs.RNFSPackage;
import com.guhungry.rnphotomanipulator.RNPhotoManipulatorPackage;
import com.reactlibrary.securekeystore.RNSecureKeyStorePackage;
import com.mkuczera.RNReactNativeHapticFeedbackPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.imagepicker.ImagePickerPackage;
import com.brentvatne.react.ReactVideoPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import androidx.multidex.MultiDexApplication;
import com.wix.reactnativekeyboardinput.KeyboardInputPackage;


import java.util.List;

public class MainApplication extends MultiDexApplication implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    protected String getJSBundleFile(){
      return CodePush.getJSBundleFile();
    }

    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();
      // Packages that cannot be autolinked yet can be added manually here, for example:
      packages.add(new KeyboardInputPackage(MainApplication.this));

      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };


  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
