/* Selection metadata, NOT a registry of approved brokers or live capabilities. */
export const countries=Object.freeze('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW OTHER'.split(' '));
export const brokers=Object.freeze([
 Object.freeze({id:'xtb',name:'XTB',kind:'broker',website:'https://www.xtb.com/',apiStatus:'discontinued',documentation:'https://intercom-help.eu/xtb/en/articles/3868-does-xtb-offer-investment-automation-tools'}),
 Object.freeze({id:'exness',name:'Exness',kind:'broker',website:'https://www.exness.com/',apiStatus:'documented',documentation:'https://get.exness.help/hc/en-us/articles/27866287512476-Exness-API'}),
 Object.freeze({id:'mt5',name:'MetaTrader 5',kind:'platform',website:'https://www.metatrader5.com/',apiStatus:'terminal-required',documentation:'https://www.mql5.com/en/docs/python_metatrader5'})
]);
export const preferenceKey='thn.broker-selection.v1';
export function selection(value){
 return {country:countries.includes(value?.country)?value.country:'OM',broker:brokers.some(b=>b.id===value?.broker)?value.broker:'xtb'};
}
export function connectionState(value){
 const selected=selection(value),broker=brokers.find(b=>b.id===selected.broker);
 // No geographic selection grants eligibility, identity, permissions or balances.
 return {...selected,name:broker.name,kind:broker.kind,website:broker.website,apiStatus:broker.apiStatus,documentation:broker.documentation,eligibility:'unverified',connected:false,accountOpening:false,readBalance:false,execution:false};
}
export function planningCapital(value){
 if(typeof value!=='string'||!value.trim()||!/^\d+(?:\.\d{1,2})?$/.test(value.trim()))return null;
 const n=Number(value);return Number.isFinite(n)&&n>=1&&n<=1e12?n:null;
}
