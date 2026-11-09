const {Client}=require('../.tools/webos/node_modules/ssh2');
const fs=require('fs');
const connection=new Client();
const destination=process.argv[3];
if(!/^\/tmp\/[a-zA-Z0-9_.-]+$/.test(destination)) throw new Error('Only simple /tmp paths allowed');
connection.on('ready',()=>connection.exec("cat > '"+destination+"'",(error,stream)=>{
  if(error) {console.error(error.message);connection.end();process.exitCode=1;return;}
  stream.on('exit',code=>{process.exitCode=code||0;connection.end();});
  stream.stderr.on('data',data=>process.stderr.write(data));
  fs.createReadStream(process.argv[2]).pipe(stream);
}));
connection.on('error',error=>{console.error(error.message);process.exitCode=1;});
connection.connect({host:'10.73.40.80',port:22,username:'root',password:process.env.LJ5500_SSH_PASSWORD||'alpine',readyTimeout:10000});
