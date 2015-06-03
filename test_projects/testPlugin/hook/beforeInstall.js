module.exports = function(context) {
  var async = require('async'),
      colors = require('colors'),
      sprintf = require('sprintf').sprintf,
      argv = require('optimist').argv,
      xml2js = require('xml2js'),
      os = require('os'),
      fs = require('fs'),
      installWizard = require('./installWizard.js');

  var Q = context.requireCordovaModule('q');
  var deferral = new Q.defer();


  //-------------------------------
  // Parse the variable options
  //-------------------------------
  var argVariables = {};
  if ('variable' in argv) {

    if (Object.prototype.toString.call(argv.variable) === '[object Array]') {
      // User specified multiple variable parameters
      argv.variable.forEach(function(arg) {
        var tmp = arg.split("=");
        var key = (tmp.shift()).toUpperCase(),
            value = tmp.join("=");
        argVariables[key] = value;
      });
    } else {
      // User specified a variable parameter
      var tmp = argv.variable.split("=");
      var key = (tmp.shift()).toUpperCase(),
          value = tmp.join("=");
      argVariables[key] = value;
    }
  }
  colors.setTheme({
    'infoColor': 'blue',
    'errorColor': 'red',
    'msgColor': 'green'
  });

  console.log('------------------------------'.infoColor);
  console.log('hook/beforeInstall.js -- start'.infoColor);
  console.log('------------------------------'.infoColor);

  var platforms = context.opts.cordova.platforms;
  async.waterfall([
    function(next) {
      //----------------------------------------------
      // Get the project ID from the config.xml file
      //----------------------------------------------
      var parser = new xml2js.Parser();

      fs.readFile(context.opts.projectRoot + "/config.xml", function(err, data) {
        parser.parseString(data, function (err, result) {
          if (result &&
              'widget' in result &&
              '$' in result.widget &&
              'id' in result.widget['$']) {
            next(null, result.widget['$'].id);
          } else {
            next('[error]Cannot parse your config.xml file.');
          }
        });
      });
    },

    function(projctID, next) {
      //-------------------------------
      // Get the api key
      //-------------------------------
      async.map(platforms, function(platform, next2) {
        if (['android', 'ios'].indexOf(platform) === -1) {
          next2(null, {
            'platform': platform
          });
        }

        // If the command line has the 'API_KEY_FOR_(ANDROID|IOS)' option, skip here
        var key = 'API_KEY_FOR_' + platform.toUpperCase();
        if (key in argVariables) {
          next2(null, {
            'platform': platform,
            'api_key': argVariables[key]
          });
          return;
        }

        // If user does not sprcify the API KEY for the platform, do the install wizard.
        installWizard[platform](projctID, function(err, result) {
          if (err) {
            next(err);
            return;
          }
          result.platform = platform;
          next(null, result);
        });
      }, next);
    }
  ], function(err, results) {
    if (err) {
      console.error(err.errorColor);
    }
    console.log(results);
    console.log('------------------------------'.infoColor);
    console.log('hook/beforeInstall.js -- end'.infoColor);
    console.log('------------------------------'.infoColor);
    deferral.resolve();
  });

  return deferral.promise;

}
