"use strict";

var http        = require('http'),
    httpProxy   = require('http-proxy'),
    express     = require('express'),
    bodyParser  = require('body-parser'),
    app         = express(),
    proxyConfig  = require('./server-proxy-config.js');

// Handles parsing post request body content
// NOTE: do not use with httpProxy
//app.use(bodyParser.json());

//create api proxy server
var apiProxy = httpProxy.createProxyServer();

//run from the dist folder for testing gulp build, if true
if(proxyConfig.runFromDist){
  console.log('');
  console.log('***************************************');
  console.log('*****                            ******');
  console.log('***** RUNNING FROM DIST FOLDER!  ******');
  console.log('*****                            ******');
  console.log('***************************************');
  console.log(' ');

  app.use(express.static(__dirname + '/dist'));
}
else {
  app.use(express.static(__dirname + '/app'));
}

//use proxy server for api requests
var apiTarget = proxyConfig.api.server.protocol + '://' + proxyConfig.api.server.host + ':' + proxyConfig.api.server.port;

//.all() allows all HTTP verbs
app.all(proxyConfig.api.server.path, function (req, res) {
  apiProxy.web(req,res, {
    target: apiTarget
  });
});


// Catch route exceptions
app.use(function(err, req, res, next) {
  console.log(err.stack);
  res.status(500);
  res.send('Internal server error');
});

// get port
var port = process.env.PORT || 3000;

//create http server
var server = app.listen(port, function () {
  var host = server.address().address;
  console.log('Express app listening at http://%s:%s', host, port);
});
