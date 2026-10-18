import crypto from 'node:crypto';
const sessions=new Map();
const digest=value=>crypto.createHash('sha256').update(String(value)).digest();
export function authenticateToken(token) {
  if(typeof token!=='string'||token.length<16||token.length>4096)return null;
  const users=process.env.THN_AUTH_USERS?JSON.parse(process.env.THN_AUTH_USERS):[];
  if(process.env.THN_AUTH_TOKEN)users.push({id:'operator',token:process.env.THN_AUTH_TOKEN});
  return users.find(user=>typeof user.id==='string'&&typeof user.token==='string'&&crypto.timingSafeEqual(digest(user.token),digest(token)))?.id||null;
}
export function authenticate(req) {
  const bearer=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if(bearer)return authenticateToken(bearer);
  const id=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('thn_session='))?.slice(12);
  const session=sessions.get(id);
  if(!session||session.expires<Date.now()){sessions.delete(id);return null}
  return session.user;
}
export function createSession(user,res,secure=false) {
  for(const [id,s] of sessions)if(s.expires<Date.now())sessions.delete(id);
  if(sessions.size>=1000)throw Object.assign(Error('Session capacity reached'),{status:503});
  const id=crypto.randomBytes(32).toString('hex');sessions.set(id,{user,expires:Date.now()+8*3600000});
  res.setHeader('Set-Cookie',`thn_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure?'; Secure':''}`);
}
export function logout(req,res){const id=req.headers.cookie?.match(/(?:^|; )thn_session=([^;]+)/)?.[1];sessions.delete(id);res.setHeader('Set-Cookie','thn_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')}
export function assertOrigin(req) {
  const origin=req.headers.origin;
  const allowed=process.env.THN_PUBLIC_ORIGIN||`http://${req.headers.host}`;
  if(origin&&origin!==allowed)throw Object.assign(Error('Cross-origin request denied'),{status:403});
}
export function assertAccountOwner(account,user) {
  if(!account)throw Object.assign(Error('Account not found'),{status:404});
  if((account.ownerId||'operator')!==user)throw Object.assign(Error('Account access denied'),{status:403});
}
