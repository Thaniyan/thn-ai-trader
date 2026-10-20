import http from 'node:http';
import handler from '../.vercel/output/functions/index.func/index.mjs';
const server=http.createServer(handler);
server.listen(0,'127.0.0.1',()=>console.log('THN_TEST_PORT='+server.address().port));
