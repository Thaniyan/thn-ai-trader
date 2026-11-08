// Controlled local exception; never imported or packaged by production.
import './provider-fixture.js';
import fs from 'node:fs';
const exists=fs.existsSync;
fs.existsSync=function(file){
 if(String(file).endsWith('/public/error-contract-trigger.js'))throw new Error('PRIVATE_TEST_DIAGNOSTIC /private/operator/config');
 return exists.call(this,file);
};
