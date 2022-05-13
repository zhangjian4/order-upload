## Extra Android installation steps

Open `android/app/src/main/AndroidManifest.xml` and above the closing `</manifest>` tag add this line to request the CAMERA permission:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```
For more help consult the [Capacitor docs](https://capacitorjs.com/docs/android/configuration#configuring-androidmanifestxml).

## Extra iOS installation steps
You will need to add two permissions to `Info.plist`. Follow the [Capacitor docs](https://capacitorjs.com/docs/ios/configuration#configuring-infoplist) and add permissions with the raw keys `NSCameraUsageDescription` and `NSMicrophoneUsageDescription`.

## Extra Web installation steps
Add `import '@capacitor-community/camera-preview'` to you entry script in ionic on `app.module.ts`, so capacitor can register the web platform from the plugin