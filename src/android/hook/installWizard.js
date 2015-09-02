//---------------------------------------------------------------------------------
// Install wizard for Google Maps API
//
// callback: function
//---------------------------------------------------------------------------------
var async = require('async'),
    colors = require('colors'),
    sprintf = require('sprintf').sprintf,
    prompt = require('prompt'),
    child_process = require('child_process');

colors.setTheme({
  'infoColor': 'blue',
  'errorColor': 'red',
  'msgColor': 'green'
});

module.exports = {
  android: function (projectID, callback) {

    //-----------------
    // Install wizard
    //-----------------
    async.waterfall([
      function(next) {
        //----------------------------
        // Get the SHA1 finger print
        //----------------------------
        child_process.execFile('keytool',
                               ['-list',
                                '-alias', 'androiddebugkey',
                                '-storepass', 'android',
                                '-keypass', 'android',
                                '-keystore',
                                (process.env.HOME || process.env.USERPROFILE) + "/.android/debug.keystore"],
          function(err, result) {
            if (err) {
              next(err);
              return;
            }
            var matches = result.match(/\(SHA1\).*?((?:[A-Z0-9]{2}\:)+[A-Z0-9]{2})/);
            if (matches && matches.length) {
              next(null,matches[1]);
              return;
            }
            next('[error]Cannot get your SHA1 finger print');
          });
      },

      function(SHA1, next) {

        var regURL = sprintf([
          "https://console.developers.google.com/flows/enableapi?apiid=maps_android_backend",
          "keyType=CLIENT_SIDE_ANDROID",
          "r=%s%%3B%s"].join("&"),
          SHA1,
          projectID);

        console.log('In order to use Google Maps Android API v2,'.msgColor);
        console.log('you need to get your API key from Google.'.msgColor);
        console.log('Please visit the follow URL, then input your API key below.'.msgColor);
        console.log(regURL.infoColor);
        console.log("")

        prompt.start();
        prompt.get({
          'name': 'api_key',
          'description': 'Please input your API key > ',
          'type': 'string',
          'required': true,
          'pattern': /^[a-z0-9\-\_]{39}$/i,
          'message': 'Please copy and past your API key from https://console.developers.google.com/'
        }, next);
      }

    ], callback);
  },

  'ios': function(projectID, callback) {
    var regURL = sprintf([
      "https://console.developers.google.com/flows/enableapi?apiid=maps_android_ios",
      "keyType=CLIENT_SIDE_IOS",
      "r=%s"].join("&"),
      projectID);

    console.log('In order to use Google Maps SDK for iOS,'.msgColor);
    console.log('you need to get your API key from Google.'.msgColor);
    console.log('Please visit the follow URL, then input your API key below.'.msgColor);
    console.log(regURL.infoColor);
    console.log("")

    prompt.start();
    prompt.get({
      'name': 'api_key',
      'description': 'Please input your API key > ',
      'type': 'string',
      'required': true,
      'pattern': /^[a-z0-9\-\_]{39}$/i,
      'message': 'Please copy and past your API key from https://console.developers.google.com/'
    }, callback);
  }
};
