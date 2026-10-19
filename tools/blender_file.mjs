import net from 'node:net';
import fs from 'node:fs';
const code=fs.readFileSync(process.argv[2],'utf8');
const socket=net.createConnection({host:'127.0.0.1',port:9876});let data='';
socket.setTimeout(600000);
socket.on('connect',()=>socket.write(JSON.stringify({type:'execute_code',params:{code}})));
socket.on('data',c=>{data+=c;try{const r=JSON.parse(data);console.log(JSON.stringify(r,null,2));socket.end();if(r.status==='error')process.exitCode=1;}catch{}});
socket.on('error',e=>{console.error(e.message);process.exitCode=1});socket.on('timeout',()=>{socket.destroy();process.exitCode=1});
