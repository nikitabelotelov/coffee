let root = process.cwd(),
   fs = require('fs'),
   path = require('path');

/**
 * Look ma, it cp -R.
 * @param {string} src The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
let copyRecursiveSync = function (src, dest) {
   const exists = fs.existsSync(src);
   const stats = exists && fs.statSync(src);
   const isDirectory = exists && stats.isDirectory();
   if (exists && isDirectory) {
      if (!fs.existsSync(dest)) {
         fs.mkdirSync(dest);
      }
      fs.readdirSync(src).forEach(function (childItemName) {
         copyRecursiveSync(path.join(src, childItemName),
            path.join(dest, childItemName));
      });
   } else {
      if (!fs.existsSync(dest)) {
         try {
            fs.linkSync(src, dest);
         } catch (e) {
         }
      }
   }
};

var gultConfig = JSON.stringify(require('./buildTemplate.json'));
gultConfig = gultConfig.replace(/%cd%/ig, root).replace(/\\/ig, '/');

if (!fs.existsSync(path.join(root, 'application'))) {
   fs.mkdirSync(path.join(root, 'application'));
}
if (!fs.existsSync(path.join(root, 'application', 'resources'))) {
   fs.mkdirSync(path.join(root, 'application', 'resources'));
}

fs.writeFile(path.join(root, 'builderCfg.json'), gultConfig, function(){
   const { spawn } = require('child_process');

   const child = spawn('node',[
      root+'/node_modules/gulp/bin/gulp.js',
      '--gulpfile', root+'/node_modules/sbis3-builder/gulpfile.js',
      'build',
      '--config='+root+'/builderCfg.json',
      '-LLLL'
   ]);

   child.stdout.on('data', (data) => {
      console.log(`${data}`);
   });

   child.stderr.on('data', (data) => {
      console.log(`ERROR: ${data}`);
   });


   child.on('exit', function (code, signal) {
      console.log('child process exited with ' + `code ${code} and signal ${signal}`);


      copyRecursiveSync(path.join(root, 'application', 'ws', 'core'), path.join(root, 'application', 'Core'));

      gultConfig = JSON.parse(gultConfig);
      gultConfig.modules.forEach((one) => {
         let oldName = one.path.split('/');
         oldName = oldName[oldName.length - 1];
         if (one.name !== oldName) {
            fs.renameSync(path.join(root, 'application', oldName), path.join(root, 'application', 'tempName'));
            fs.renameSync(path.join(root, 'application', 'tempName'), path.join(root, 'application', one.name));
         }
      });

      const allJson = {links: {}, nodes: {}};
      const contents = { buildMode: '', modules: {} };
      const bundles = {};

      gultConfig.modules.forEach((one) => {
         if (one.name.indexOf('WS.Core') === -1)
         {
            let fileName = path.join(root, 'application', one.name, 'module-dependencies.json');
            if (fs.existsSync(fileName)) {
               let oneJson = require(fileName);

               for (let i in oneJson.links) {
                  allJson.links[i] = oneJson.links[i];
               }

               for (let j in oneJson.nodes) {
                  allJson.nodes[j] = oneJson.nodes[j];
               }
            }
         }
      });

      fs.writeFileSync(path.join(root, 'application', 'contents.js'),
         'contents = ' + JSON.stringify(contents, '', 3)+';' );
      fs.linkSync(path.join(root, 'application', 'contents.js'), path.join(root, 'application', 'contents.min.js'));
      fs.writeFileSync(path.join(root, 'application', 'bundles.js'),
         'bundles = ' + JSON.stringify(bundles, '', 3)+';' );


      if (!fs.existsSync(path.join(root, 'application', 'resources'))) {
         fs.mkdirSync(path.join(root, 'application', 'resources'));
      }

      fs.writeFileSync(path.join(root, 'application', 'resources', 'module-dependencies.json'),
         JSON.stringify(allJson, '', 3).replace(/ws\/core/ig, 'WS.Core/core').replace(/resources\//i, ''));

      fs.writeFileSync(path.join(root, 'application', 'router.js'),
         'define(\'router\', [], function(){ return {}; })');
   });

});