import {spawn} from 'node:child_process';
import {startTestServer} from './harness.mjs';
const server=await startTestServer();
try {
  const child=spawn(process.execPath,['tests/system.test.js'],{env:{...process.env,TEST_URL:server.url,THN_TEST_RUNNER:'1'},stdio:'inherit'});
  process.exitCode=await new Promise(resolve=>child.once('exit',resolve));
} finally {await server.stop()}
