import {startTestServer} from './harness.mjs';
const server=await startTestServer();
console.log(server.url);
for(const signal of ['SIGTERM','SIGINT']) process.on(signal,async()=>{await server.stop();process.exit()});
