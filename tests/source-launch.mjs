// OS-assigned loopback port avoids collisions and Fetch's blocked-port list.
import server from '../server.js';
server.listen(0,'127.0.0.1',()=>console.log('THN_TEST_PORT='+server.address().port));
