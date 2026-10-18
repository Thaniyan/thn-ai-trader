import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('public/app.js','utf8');
test('dashboard consumes mapped immutable ledger DTOs and clears them when account access is lost',()=>{
 const nodes={dashRecentActivityTable:{innerHTML:''},dashAiOppsGrid:{innerHTML:''}};
 const context={currentAnalysis:null,watchScanResults:[],analysisError:'',currentLang:'en',serverLedger:[{id:'fixture-close',symbol:'EURUSD',decision:'BUY',pnl:12.5,date:'2026-10-17T08:00:00.000Z',immutable:true}],workspaceAccount:()=>({id:'fixture-account',currency:'USD'}),$:id=>nodes[id],t:()=>'',escapeHtml:value=>String(value??''),workspaceMoney:value=>value==null?'--':'$'+value.toFixed(2),fmt:String,localizedValue:String};
 vm.createContext(context);
 const code=source.slice(source.indexOf('function renderDashboardEvidence(){'),source.indexOf('function translateStaticDom()'));
 vm.runInContext(code+'\nrenderDashboardEvidence()',context);
 assert.match(nodes.dashRecentActivityTable.innerHTML,/EURUSD.*BUY.*\$12\.50.*2026.*PAPER FILL/);
 assert.doesNotMatch(nodes.dashRecentActivityTable.innerHTML,/undefined/);
 context.workspaceAccount=()=>null;vm.runInContext('renderDashboardEvidence()',context);
 assert.doesNotMatch(nodes.dashRecentActivityTable.innerHTML,/EURUSD|12\.50/);
 assert.match(nodes.dashRecentActivityTable.innerHTML,/No recorded paper fills/);
});
test('every new workspace UI translation binding has complete English and Arabic copy',()=>{
 const code=source.slice(source.indexOf('const WORKSPACE_COPY='),source.indexOf('const ux=key=>'));
 const context={I18N:{en:{},ar:{}}};vm.createContext(context);vm.runInContext(code,context);
 const html=fs.readFileSync('public/index.html','utf8');
 const keys=[...html.matchAll(/data-i18n(?:-placeholder|-aria)?="(ux[^"]+)"/g)].map(m=>m[1]);
 assert.ok(keys.length>30);
 assert.deepEqual(Object.keys(context.I18N.en).sort(),Object.keys(context.I18N.ar).sort());
 for(const key of keys)for(const language of ['en','ar'])assert.ok(typeof context.I18N[language][key]==='string'&&context.I18N[language][key].length>0,`${language}:${key}`);
});

test('account amounts retain their actual currency and unknown values stay unavailable',()=>{
 const code=source.slice(source.indexOf('function workspaceMoney('),source.indexOf('function workspaceTime('));
 const context={currentLang:'en'};vm.createContext(context);vm.runInContext(code,context);
 assert.equal(vm.runInContext("workspaceMoney(12.5,'EUR')",context),'€12.50');
 assert.equal(vm.runInContext("workspaceMoney(0,'USD')",context),'$0.00');
 assert.equal(vm.runInContext("workspaceMoney(null,'USD')",context),'—');
 assert.equal(vm.runInContext("workspaceMoney(12.5,undefined)",context),'—');
});
