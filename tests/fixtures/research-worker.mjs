// CPU-stalled synthetic worker proves parent cancellation, not model behavior.
import {parentPort} from 'node:worker_threads';
parentPort.postMessage({type:'reserve',units:100});
parentPort.once('message',()=>{parentPort.postMessage({type:'modelCall'});for(;;){};});
