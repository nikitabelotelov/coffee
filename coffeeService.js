const {spawn, exec} = require('child_process');

EXIT_CODES = {
   OK: 0,
   UPDATE: 1,
   ERROR: 2
}

let coffeeServerProcess;

function startCoffeeServer() {
   let server = spawn('node', ['app']);

   server.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
   });

   server.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
   });

   server.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      switch (code) {
         case EXIT_CODES.UPDATE:
            exec('git pull', (error, stdout, stderr) => {
               if (error) {
                  console.error(`exec error: ${error}`);
                  return;
               }
               console.log(`stdout: ${stdout}`);
               console.log(`stderr: ${stderr}`);
               coffeeServerProcess = startCoffeeServer();
            });
            break;
         case EXIT_CODES.ERROR:
            coffeeServerProcess = startCoffeeServer();
            break;
      }
   });
   return server;
}

process.on("SIGINT", function() {
   console.log('beforeExit event');
   try {
      coffeeServerProcess.kill();
   } catch(e) {
      console.error("Couldn\'t kill server process: " + e);
   }
});

coffeeServerProcess = startCoffeeServer();