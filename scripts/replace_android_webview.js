var fs = require("fs");
fs.copyFile(
  "./resources/android/src/IonicWebViewEngine.java",
  "./platforms/android/app/src/main/java/com/ionicframework/cordova/webview/IonicWebViewEngine.java",
  function (err) {
    if (err) {
      console.error(err);
    } else {
      console.log("replace IonicWebViewEngine.java success");
    }
  }
);
