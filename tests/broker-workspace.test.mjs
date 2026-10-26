import {test} from 'node:test';
import assert from 'node:assert/strict';
import {brokers,countries,selection,connectionState,planningCapital} from '../public/broker-catalog.js';
test('broker preferences default to Oman and reject injected or unsupported identities',()=>{
 assert.deepEqual(selection(null),{country:'OM',broker:'xtb'});
 assert.deepEqual(selection({country:'<script>',broker:'__proto__',apiToken:'not-retained'}),{country:'OM',broker:'xtb'});
 for(const country of countries)assert.equal(selection({country}).country,country);
 assert.ok(Object.isFrozen(brokers)&&brokers.every(Object.isFrozen));
});
test('no country or broker selection grants financial capabilities or eligibility',()=>{
 for(const country of countries)for(const broker of brokers){const state=connectionState({country,broker:broker.id});assert.equal(state.eligibility,'unverified');for(const key of ['connected','accountOpening','readBalance','execution'])assert.equal(state[key],false);assert.equal(new URL(state.website).protocol,'https:');}
 assert.equal(connectionState({broker:'mt5'}).kind,'platform');
 assert.equal(connectionState({broker:'xtb'}).apiStatus,'discontinued');
 assert.equal(connectionState({broker:'exness'}).apiStatus,'documented');
 assert.equal(connectionState({broker:'mt5'}).apiStatus,'terminal-required');
});
test('manual planning capital is bounded USD input, never a synthetic account balance',()=>{
 for(const value of ['', ' ', '-1','0','Infinity','NaN','1e3','1.001','1000000000001','<img>',null,1000])assert.equal(planningCapital(value),null,String(value));
 for(const [input,value]of [['1',1],[' 2500.25 ',2500.25],['1000000000000',1e12]])assert.equal(planningCapital(input),value);
});
