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
app.listen(port);
console.log('app available on port ' + port);

console.log('start init');
require(['Core/core-init'], () => {
   console.log('core init success');
}, (err) => {
   console.log(err);
   console.log('core init failed');
});

app.get('/cdn*', (req, res) => {
   res.redirect('http://dev-cdn.wasaby.io' + req.url.slice(4));
});

app.get('/Coffee/*', (req, res) => {
   res.send(indexFile);
});


// websockets

const {createServer} = require('wss')

createServer(function connectionListener(ws) {
   setInterval(() => {
      getCurrentData().then((data) => {
         ws.send(JSON.stringify(data));
      });
   }, 2000);
}).listen(8080, function() {
   const {address, port} = this.address() // this is the http[s].Server
   console.log('listening on http://%s:%d (%s)', /::/.test(address) ? '0.0.0.0' : address, port)
})

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

