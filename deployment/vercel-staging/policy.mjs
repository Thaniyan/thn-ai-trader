export const csp="default-src 'self'; script-src 'self' https://s3.tradingview.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; frame-src https://*.tradingview.com; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'";
export const securityHeaders=[{key:'Content-Security-Policy',value:csp},{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'no-referrer'},{key:'Strict-Transport-Security',value:'max-age=86400'}];
export const noCache=[{key:'Cache-Control',value:'private, no-store, max-age=0'},{key:'CDN-Cache-Control',value:'no-store'},{key:'Vercel-CDN-Cache-Control',value:'no-store'}];
export function backendOrigin(value){
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash||!/^staging-backend\.[a-z0-9.-]+$/.test(url.hostname)||url.hostname.endsWith('.invalid')||url.hostname.endsWith('.test')||url.hostname.includes('..')||url.hostname.endsWith('.vercel.app'))throw Error('An approved dedicated HTTPS staging-backend hostname is required; no placeholders, credentials or serverless destination');
 return url.origin;
}
export function config(backend){return {$schema:'https://openapi.vercel.sh/vercel.json',version:2,framework:null,installCommand:'',buildCommand:'node verify-build.mjs',outputDirectory:'public',git:{deploymentEnabled:false},rewrites:[{source:'/api',destination:backend?backend+'/api':'/staging-api-unavailable.json'},{source:'/api/:path*',destination:backend?backend+'/api/:path*':'/staging-api-unavailable.json'}],headers:[{source:'/:path*',headers:[...securityHeaders,...noCache]},{source:'/api/:path*',headers:noCache}]};}
