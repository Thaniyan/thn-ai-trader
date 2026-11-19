// Public-safe diagnostic categories for the isolated research pilot.
// Never expose arbitrary exception messages, raw provider text or secret-bearing payloads.
const codes=new Set(['TIMEOUT','CONTEXT_LIMIT','INVALID_JSON','INVALID_SCHEMA',
 'UNSUPPORTED_CLAIM','MODEL_RESPONSE_INVALID','MODEL_UNAVAILABLE','CONTEXT_CHANGED','UNSUPPORTED_QUESTION','UNKNOWN']);
export function classifyPilotFailure(error){
 if(error?.code && codes.has(error.code))return error.code;
 if(error?.name==='TimeoutError'||error?.name==='AbortError')return 'TIMEOUT';
 if(error instanceof SyntaxError)return 'INVALID_JSON';
 // Match exact first-party invariant errors only, never pass through the message.
 const m=error?.message;
 if(m==='Local context window exceeded'||m==='Local pilot reserved token ceiling exceeded')return 'CONTEXT_LIMIT';
 if(m==='Fresh immutable server evidence required')return 'CONTEXT_CHANGED';
 if(m==='Local provider timeout'||m==='Interpretation deadline exceeded')return 'TIMEOUT';
 if(m==='Malformed local response')return 'INVALID_JSON';
 if(m==='Invalid model schema or citation'||m==='Unexpected model field'||
    m==='Model context or contradiction mismatch'||m==='Unrequested specialist roles'||
    m==='Grounded claims required'||m==='Uncertainty required'||m==='Unexpected claim field')return 'INVALID_SCHEMA';
 if(m==='Invented fact or calculation'||m==='Uncited claim'||m==='Unsupported model prose'||
    m==='Unverified numeric model statement'||m==='Conflicting instrument'||
    m==='Instruction-like model response rejected')return 'UNSUPPORTED_CLAIM';
 if(m==='Incomplete, mismatched or tool-calling model response'||m==='Unexpected provider output'||
    m==='Unverified model identity')return 'MODEL_RESPONSE_INVALID';
 if(m==='Local provider HTTP failure'||m==='Installed local weights required'||
    m==='Cloud or incompatible runtime model rejected'||m==='Local provider unavailable or unauthenticated')return 'MODEL_UNAVAILABLE';
 return 'UNKNOWN';
}
