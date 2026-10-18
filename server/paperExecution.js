import {getContractSpec} from './riskEngine.js';
// Deterministic educational cost model, not an observed broker spread or fee schedule.
export const PAPER_EXECUTION_MODEL=Object.freeze({id:'paper-fixed-v1',simulated:true,reference:'indicative provider quote',halfSpreadPips:0.4,roundTripSpreadPips:0.8,additionalSlippagePips:0,commission:0,financing:0,feesCurrency:'account currency',limitations:'No market depth, queue priority, liquidity, latency or gap guarantees; zero commission and financing are model assumptions, not broker costs.'});
export function paperPrice(symbol,side,referencePrice,closing=false){
  const spec=getContractSpec(symbol),direction=(side.startsWith('BUY')?1:-1)*(closing?-1:1);
  return Number((referencePrice+direction*spec.pipSize*PAPER_EXECUTION_MODEL.halfSpreadPips).toFixed(spec.digits));
}
