const root = process.cwd(),
   path = require('path'),
   express = require('express'),
   fs = require('fs'),
   app = express(),
   resourcesPath = path.join('', 'application');

const global = (function() {
   return this || (0, eval)('this');
})();

const indexFile = fs.readFileSync(path.join(root, 'application', 'Coffee', 'index.html'), 'utf8');

EXIT_CODES = {
   OK: 0,
   UPDATE: 1,
   ERROR: 2
};

var requirejs = require(path.join(root, 'node_modules', 'saby-units', 'lib', 'requirejs', 'r.js'));
global.requirejs = requirejs;
global.originRequire = require;


const createConfig = require(path.join(root, 'node_modules', 'sbis3-ws', 'WS.Core', 'ext', 'requirejs', 'config.js'));
const config = createConfig(path.join(root, 'application'),
   path.join(root, 'application', 'WS.Core'),
   path.join(root, 'application'),
   {lite: true});

global.require = global.requirejs = require = requirejs;
requirejs.config(config);

app.use(express.static(resourcesPath));

const port = process.env.PORT || 777;
var expressServer = app.listen(port);
console.log('app available on port ' + port);

console.log('start init');
require(['Core/core-init'], () => {
   console.log('core init success');
}, (err) => {
   console.log(err);
   console.log('core init failed');
});

app.get('/Coffee/*', (req, res) => {
   res.send(indexFile);
});

// websockets

const {createServer} = require('wss')

global.settings = {
   g1TSet: 94,
   g2TSet: 92,
   g1TimeSet: 0,
   g2TimeSet: 0,
   g1AutoMode1: 0,
   g1AutoMode2: 0,
   g2AutoMode1: 0,
   g2AutoMode2: 0,
   allRecieved: 0,
   g1_1TimeSet: 0,
   g2_1TimeSet: 0,
   parTSet: 1000,
   rCold: 0,
   gCold: 0,
   bCold: 16,
   aCold: 16,
   rHot: 16,
   gHot: 0,
   bHot: 0,
   aHot: 16
};

global.currentInfo = {};

var INTERVALS = [];

const wss = createServer(function connectionListener(ws) {
   var initSettingsTmt = setTimeout(() => {
      ws.send(JSON.stringify(getInitialSettings()));
   }, 5000);

   setIntervalWrapper(() => {
      ws.send(JSON.stringify(getCurrentInfo()));
   }, 1000);

   // Send alive-message every 2 seconds
   setIntervalWrapper(function aliveSender() {
      ws.send(JSON.stringify({type: "alive"}));
   }, 2000);
   ws.on('close', () => {
      clearTimeout(initSettingsTmt);
      stopAllIntervals();
   });
   ws.on('message', (data) => {
      handleMessage(JSON.parse(data));
   });

}).listen(8080, function() {
   const {address, port} = this.address() // this is the http[s].Server
   console.log('listening on http://%s:%d (%s)', /::/.test(address) ? '0.0.0.0' : address, port)
});

function handleMessage(data) {
   switch (data.type) {
      case "newSettings":
         global.settings = data.data;
         return sendSettings(data.data);
      default:
         return "wrong request";
   }
}

function getInitialSettings() {
   return {
      type: 'initialSettings',
      data: global.settings
   };
}

function getCurrentInfo() {
   return {
      type: 'currentInfoUpdate',
      data: global.currentInfo
   };
}

app.get('/Update', (req, res) => {
   console.log('Update request!');
   res.end();
   process.exitCode = EXIT_CODES.UPDATE;
   stopServers();
   stopAllIntervals();
});

function setIntervalWrapper(callback, time) {
   INTERVALS.push(setInterval(callback, time));
}

function stopAllIntervals() {
   for (var i = 0; i < INTERVALS.length; i++) {
      clearInterval(INTERVALS[i]);
   }
}

function stopServers() {
   // closeAllClientConnections(wss);
   wss.close();
   expressServer.close();
}

function handleCurrentInfoUpdated(receivedInfo) {
   for (var key in receivedInfo) {
      global.currentInfo[key] = receivedInfo[key];
   }
}

function sendSettings(data) {
   global.SerialHelper.Transmit(data);
}

global.originRequire('../serial-helper/serialHelper.js');
global.SerialHelper.SerialOpen();
global.SerialHelper.onReceiveUpdate(handleCurrentInfoUpdated);

