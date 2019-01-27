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

const requirejs = require(path.join(root, 'node_modules', 'sbis3-ws', 'WS.Core', 'ext', 'requirejs', 'r.js'));
global.requirejs = requirejs;


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

var INTERVALS = [];

const wss = createServer(function connectionListener(ws) {
   setIntervalWrapper(() => {
      getCurrentData().then((data) => {
         ws.send(JSON.stringify(data));
      });
   }, 2000);
   // Send alive-message every 2 seconds
   setIntervalWrapper(function aliveSender() {
      ws.send(JSON.stringify({type: "alive"}));
   }, 2000);
   ws.on('close', () => {
      stopAllIntervals();
   });
}).listen(8080, function() {
   const {address, port} = this.address() // this is the http[s].Server
   console.log('listening on http://%s:%d (%s)', /::/.test(address) ? '0.0.0.0' : address, port)
});

function handleMessage(data) {
   switch (data.type) {
      case "getCurrentSettings":
         return getCurrentData();
      default:
         return "wrong request";
   }
}

function getCurrentData() {
   return new Promise((resolve) => {
      resolve({
         type: 'settingsUpdated',
         data: {
            val1: 1,
            val2: 2,
            val3: 3,
            val4: 4,
            val5: 5,
            val6: 6,
            val7: 7
         }
      });
   });
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

SerialHelper = {
   data: {},
   startRec: 0,
   msgNum: 0,
   SerialOpen: function() {
      const raspi = require('raspi');
      const Serial = require('raspi-serial').Serial;

      raspi.init(() => {
         var serial = new Serial();
         serial.open(() => {
            serial.on('data', (data) => {
               data.forEach((element) => {
                  this.Received(element);
               });
            });
            serial.write('Hello from raspi-serial');
         });
      });
   },
   Received: function(bufUart) {
      if (this.startRec)
      {
         switch (this.msgNum) {
            case 0:
               tParRecived = bufUart & 0xFF;
               break;
            case 1:
               tParRecived = tParRecived | (bufUart<<8);
               break;
            case 2:
               tParRecived = tParRecived | (bufUart<<16);
               break;
            case 3:
               tParRecived = tParRecived | (bufUart<<24);
               console.log(tParRecived);
               break;
            case 4:
               currentParP = bufUart & 0xFF;
               break;
            case 5:
               currentParP = currentParP | (bufUart<<8);
               break;
            case 6:
               currentParP = currentParP | (bufUart<<16);
               break;
            case 7:
               currentParP = currentParP | (bufUart<<24);

               /*currentParP = currentParP*10/36;
               if (currentParP > 248)
               {
                  currentParP=currentParP-248;
               } else {
                  currentParP = 0;
               }*/
               break;

            case 8:
               currentGroup1P = bufUart & 0xFF;
               break;
            case 9:
               currentGroup1P = currentGroup1P | (bufUart<<8);
               break;
            case 10:
               currentGroup1P = currentGroup1P | (bufUart<<16);
               break;
            case 11:
               currentGroup1P = currentGroup1P | (bufUart<<24);
               currentGroup1P = currentGroup1P / 17;
               break;

            case 12:
               tG1Recived = bufUart & 0xFF;
               break;
            case 13:
               tG1Recived = tG1Recived | (bufUart<<8);
               break;
            case 14:
               tG1Recived = tG1Recived | (bufUart<<16);
               break;
            case 15:
               tG1Recived = tG1Recived | (bufUart<<24);
               break;

            case 16:
               currentGroup2P = bufUart & 0xFF;
               break;
            case 17:
               currentGroup2P = currentGroup2P | (bufUart<<8);
               break;
            case 18:
               currentGroup2P = currentGroup2P | (bufUart<<16);
               break;
            case 19:
               currentGroup2P = currentGroup2P | (bufUart<<24);
               currentGroup2P = currentGroup2P / 17;
               break;

            case 20:
               tG2Recived = bufUart & 0xFF;
               break;
            case 21:
               tG2Recived = tG2Recived | (bufUart<<8);
               break;
            case 22:
               tG2Recived = tG2Recived | (bufUart<<16);
               break;
            case 23:
               tG2Recived = tG2Recived | (bufUart<<24);
               break;

            case 24:
               recieved = bufUart & 0xFF;
               break;
            case 25:
               recieved = recieved | (bufUart<<8);
               break;
            case 26:
               recieved = recieved | (bufUart<<16);
               break;
            case 27:
               recieved = recieved | (bufUart<<24);
               if (recieved < 1000) {
                  recievedForTrans = recieved;
                  allRecieved = allRecieved + recieved;
               }
               break;
            case 28:
               if (bufUart<2) {
                  ERROR1_ = bufUart & 0xFF;
               }
               break;
            case 29:
               if (bufUart<2) {
                  ERROR2_ = bufUart & 0xFF;
               }
               break;
            case 30:
               if (bufUart<2) {
                  ERROR3_ = bufUart & 0xFF;
               }
               break;
            case 31:
               if (bufUart<2) {
                  ERROR4_ = bufUart & 0xFF;
               }
               break;
            case 32:
               if (bufUart<2) {
                  ERROR5_ = bufUart & 0xFF;
               }
               break;
            case 33:
               if (bufUart<2) {
                  ERROR6_ = bufUart & 0xFF;
               }
               break;
            case 34:
               if (bufUart<2) {
                  ERROR7_ = bufUart & 0xFF;
               }
               break;
            case 35:
               if (bufUart<2) {
                  ERROR8_ = bufUart & 0xFF;
               }
               break;
            case 36:
               if (bufUart<2) {
                  ERROR9_ = bufUart & 0xFF;
               }
               break;
            case 37:
               hash = ERROR1_+28*ERROR2_ + 28*(ERROR3_+1) +
                  + 28*(ERROR4_+2) + 28*(ERROR5_+3)
                  + 28*(ERROR6_+4) + 28*(ERROR7_+5)
                  + 28*(ERROR8_+6) + 28*(ERROR9_+7);
               hash = (hash == bufUart);
               break;
            default:
               break;
         }
         this.msgNum++;
         if (bufUart == 0xFD) {
            lenFinish++;
            if (lenFinish == 10){
               lenFinish = 0;
               this.startRec = 0;
               if (this.msgNum == 52){
                  if (tParRecived>0
                     && tParRecived < 200
                     && hash == 1
                     && tG2Recived < 1500
                     && tG2Recived > 0
                     && tG1Recived < 1500
                     && tG1Recived > 0) {
                     currentGroup1T = tG1Recived;
                     currentGroup2T = tG2Recived;
                     currentParT = tParRecived;
                     ERROR1 = ERROR1_;
                     ERROR2 = ERROR2_;
                     ERROR3 = ERROR3_;
                     ERROR4 = ERROR4_;
                     ERROR5 = ERROR5_;
                     ERROR6 = ERROR6_;
                     ERROR7 = ERROR7_;
                     ERROR8 = ERROR8_;
                     ERROR9 = ERROR9_;

                  }
               }
               this.msgNum = 0;
            }
         } else {
            lenFinish = 0;
         }

      } else {
         this.msgNum++;
         if (bufUart == 0xFE) {
            lenStart++;
            if (lenStart == 10){
               lenStart = 0;
               this.startRec = 1;
               this.msgNum = 0;
            }
         } else {
            lenStart = 0;
         }
      }

   }
}

