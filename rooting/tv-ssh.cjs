const { Client } = require('../.tools/webos/node_modules/ssh2');
const connection = new Client();
connection.on('ready', () => connection.exec(process.argv[2], (error, stream) => {
  if (error) { console.error(error.message); connection.end(); process.exitCode = 1; return; }
  stream.on('data', data => process.stdout.write(data));
  stream.stderr.on('data', data => process.stderr.write(data));
  stream.on('close', code => { process.exitCode = code || 0; connection.end(); });
}));
connection.on('error', error => { console.error(error.message); process.exitCode = 1; });
connection.connect({ host: '10.73.40.80', port: 22, username: 'root', password: process.env.LJ5500_SSH_PASSWORD || 'alpine', readyTimeout: 10000 });
