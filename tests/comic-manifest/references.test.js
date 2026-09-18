import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { planComicReferences, createComicReferenceResolver, COMIC_REFERENCE_LIMITS } from '@definitely-secure-studio/platform/comic-manifest';
import { canonicalJson } from '../../src/prompt-sdk/canonical-json.js';
const fixture=JSON.parse(await readFile(new URL('../fixtures/comic-manifest-v1.json',import.meta.url)));
const foundation=JSON.parse(await readFile(new URL('../fixtures/context-builder-v1.json',import.meta.url)));
const json=JSON.stringify,hash=b=>'sha256:'+createHash('sha256').update(b).digest('hex');
const at='2026-09-15T12:00:00Z',end='2026-09-15T13:00:00Z';
const allow=({scope})=>json({decision:'allow',scope,not_before:at,expires_at:end,revocation:{status:'active',checked_at:scope.at}});
function setup(production=fixture.production){
  const plan=planComicReferences(json(production));assert.equal(plan.valid,true,json(plan.diagnostics));
  const calls=[];
  const bindings=plan.references.map((entry,index)=>{
    const ref=entry.reference;
    const bytes=Buffer.from(ref.kind==='public'?fixture.dependency_bytes[ref.dependency.artifact.artifact_uri]:ref.kind==='context-package'?json(foundation.result.package):ref.kind==='builder-result'?json(foundation.result):'SYNTHETIC-PROTECTED-SENTINEL');
    const artifact={media_type:ref.kind==='public'?ref.dependency.artifact.media_type:ref.kind==='protected'?ref.media_type:'application/json',byte_size:bytes.length,sha256:hash(bytes)};
    return {referenceSource:json(ref),artifactSource:json(artifact),classification:entry.classification,
      async *read(options){calls.push({index,options});yield bytes;},bytes};
  });
  const config={bindings,requiredPublicReferences:plan.references.filter(e=>e.uses.some(u=>u.role==='dependency')).map(e=>json(e.reference)),authorize:allow,getTime:()=>at,callerId:'urn:uuid:10000000-0000-4000-8000-000000000900',purpose:'Synthetic artifact inspection.',maxClassification:'internal'};
  return {plan,calls,bindings,config,verify:()=>createComicReferenceResolver(config).verify(json(production))};
}
const code=result=>result.diagnostics[0]?.code;
test('offline exact references verify, retain complete identities and never forward locators to readers',async()=>{
  const s=setup(),r=await s.verify();assert.equal(r.valid,true,json(r));assert.equal(r.artifacts.length,s.plan.references.length);
  assert.equal(s.calls.length,s.plan.references.length);
  for(const call of s.calls)assert.deepEqual(Object.keys(call.options).sort(),['maxBytes','signal']);
  for(let i=0;i<r.artifacts.length;i++){assert.deepEqual(r.artifacts[i].reference,s.plan.references[i].reference);assert.equal(hash(r.artifacts[i].bytes),r.artifacts[i].artifact.sha256);}
  assert.equal(r.classification,'internal');assert.equal(Object.hasOwn(r,'public_projection'),false);
});
test('shared public assets/panel uses deduplicate exact tuples',async()=>{
  const p=structuredClone(fixture.production);p.inputs.assets=[{asset_id:'shared',classification:'public',reference:{kind:'public',dependency:p.inputs.canon},rights_notice:'Synthetic.'}];
  p.panels.forEach(x=>x.asset_ids=['shared']);const s=setup(p),r=await s.verify();assert.equal(r.valid,true);
  assert.equal(r.artifacts.length,planComicReferences(json(fixture.production)).references.length);
  assert.deepEqual(r.artifacts[0].uses.find(x=>x.role==='asset').panel_ids,['first','second']);
});
test('protected asset handles and identities remain protected',async()=>{
  const p=structuredClone(fixture.production),bytes=Buffer.from('SYNTHETIC-PROTECTED-SENTINEL');
  p.inputs.assets=[{asset_id:'private',classification:'internal',reference:{kind:'protected',handle:'urn:uuid:10000000-0000-4000-8000-000000000901',media_type:'text/plain',byte_size:bytes.length,sha256:hash(bytes)},rights_notice:'Synthetic.'}];
  p.panels[0].asset_ids=['private'];const s=setup(p),r=await s.verify();assert.equal(r.valid,true);assert.equal(r.artifacts.at(-1).classification,'internal');
  p.inputs.assets[0].classification='public';assert.equal(code(planComicReferences(json(p))),'CLASSIFICATION');
});
for(const value of ['main','refs/heads/main','latest','release/*'])test('floating tag '+value+' fails before reads',async()=>{
  const s=setup(),p=structuredClone(fixture.production);p.inputs.canon.tag=value;const r=await createComicReferenceResolver(s.config).verify(json(p));assert.equal(r.valid,false);assert.equal(s.calls.length,0);
});
for(const mutate of [p=>p.inputs.canon.commit='2'.repeat(40),p=>p.inputs.canon.artifact.artifact_uri='https://example.invalid/../../private',p=>p.inputs.canon.artifact.artifact_uri='https://example.invalid/%2e%2e/private',p=>p.inputs.canon.artifact.artifact_uri='https://other.invalid/redirect',p=>p.inputs.canon.artifact.sha256='sha256:'+'0'.repeat(64)])test('substitution cannot redirect an installed reader '+mutate.toString(),async()=>{
  const s=setup(),p=structuredClone(fixture.production);mutate(p);const r=await createComicReferenceResolver(s.config).verify(json(p));assert.equal(code(r),'SOURCE_UNCONFIGURED');assert.equal(s.calls.length,0);
});
test('missing late binding denies all reads before any reader is called',async()=>{
  const s=setup();s.config.bindings=s.bindings.slice(0,-1);assert.equal(code(await s.verify()),'SOURCE_UNCONFIGURED');assert.equal(s.calls.length,0);
});
for(const [name,change,expected] of [
  ['deny',d=>d.decision='deny','ACCESS_DENIED'],['revoked',d=>d.revocation.status='revoked','ACCESS_DENIED'],
  ['wrong caller',d=>d.scope.caller_id='another','AUTHORITY_UNVERIFIABLE'],['wrong purpose',d=>d.scope.purpose='another','AUTHORITY_UNVERIFIABLE'],
  ['wrong reference',d=>d.scope.reference_identity.sha256='sha256:'+'0'.repeat(64),'AUTHORITY_UNVERIFIABLE'],
  ['stale revocation',d=>d.revocation.checked_at='2026-09-14T12:00:00Z','AUTHORITY_UNVERIFIABLE'],
  ['expired',d=>d.expires_at=at,'STALE_AUTHORITY'],['not yet valid',d=>d.not_before=end,'STALE_AUTHORITY']
])test(name+' authorization fails with zero reads',async()=>{
  const s=setup();s.config.authorize=arg=>{const d=JSON.parse(allow(arg));change(d);return json(d);};assert.equal(code(await s.verify()),expected);assert.equal(s.calls.length,0);
});
test('a bare allow flag and untrusted grant data are not authority',async()=>{
  for(const authorization of [true,json({allow:true}),json({decision:'allow'})]){const s=setup();s.config.authorize=()=>authorization;assert.equal((await s.verify()).valid,false);assert.equal(s.calls.length,0);}
});
test('classification mismatches and ceilings fail before reads',async()=>{
  for(const mutate of [s=>s.config.maxClassification='public',s=>s.bindings.at(-1).classification='restricted']){const s=setup();mutate(s);assert.equal(code(await s.verify()),'CLASSIFICATION');assert.equal(s.calls.length,0);}
});
for(const [name,read,expected] of [
  ['wrong digest',async function*(){yield Buffer.alloc(fixture.production.inputs.canon.artifact.byte_size);},'ARTIFACT_INTEGRITY'],
  ['too short',async function*(){yield Buffer.from('x');},'ARTIFACT_INTEGRITY'],
  ['too large',async function*(){yield Buffer.alloc(1000);},'ARTIFACT_LIMIT'],
  ['too many empty chunks',async function*(){for(let i=0;i<4097;i++)yield Buffer.alloc(0);},'ARTIFACT_LIMIT'],
  ['invalid chunk',async function*(){yield 'SYNTHETIC-PROTECTED-SENTINEL';},'ARTIFACT_INTEGRITY'],
  ['throwing reader',async function*(){throw Error('SYNTHETIC-PROTECTED-SENTINEL');},'SOURCE_UNAVAILABLE']
])test(name+' fails without delivering partial artifacts',async()=>{
  const s=setup();s.bindings[0].read=read;const r=await s.verify();assert.equal(code(r),expected);assert.deepEqual(Object.keys(r).sort(),['diagnostics','valid']);assert.equal(json(r).includes('SYNTHETIC-PROTECTED-SENTINEL'),false);
});
test('canonical prompt identity is checked even when installed transport bytes match',async()=>{
  const p=structuredClone(fixture.production);p.inputs.prompts[0].identity.sha256='sha256:'+'0'.repeat(64);
  const s=setup(p);assert.equal(code(await s.verify()),'ARTIFACT_IDENTITY');
});
test('context package and Builder canonical substitutions fail despite correct transport hashes',async()=>{
  for(const kind of ['context-package','builder-result']){
    const s=setup();const b=s.bindings.find(b=>JSON.parse(b.referenceSource).kind===kind);
    const altered=JSON.parse(b.bytes);if(kind==='context-package')altered.manifest.package.instance_id=fixture.production.production_id;else altered.build_id=fixture.production.production_id;
    const bytes=Buffer.from(json(altered));b.artifactSource=json({media_type:'application/json',byte_size:bytes.length,sha256:hash(bytes)});b.read=async function*(){yield bytes;};
    assert.equal(code(await s.verify()),'ARTIFACT_IDENTITY');
  }
});
test('revocation before delivery suppresses all collected bytes',async()=>{
  const s=setup();let revoke=false;
  s.config.authorize=arg=>{const d=JSON.parse(allow(arg));if(revoke)d.revocation.status='revoked';return json(d);};
  const original=s.bindings.at(-1).read;s.bindings.at(-1).read=async function*(options){yield*original(options);revoke=true;};
  assert.equal(code(await s.verify()),'ACCESS_DENIED');
});
test('expiry during a delayed chunk cannot be renewed by a later verifier response',async()=>{
  const s=setup();let current=at;s.config.getTime=()=>current;
  const original=s.bindings[0].read;s.bindings[0].read=async function*(options){yield*original(options);current=end;};
  assert.equal(code(await s.verify()),'STALE_AUTHORITY');assert.equal(s.calls.length,1);
});
test('deadline bounds a hung authorizer and reader',async()=>{
  for(const hung of ['authorize','read']){
    const s=setup();s.config.timeoutMs=10;if(hung==='authorize')s.config.authorize=()=>new Promise(()=>{});else s.bindings[0].read=()=>new Promise(()=>{});
    assert.equal(code(await s.verify()),'TIMEOUT');
  }
});
test('pre-cancelled operation reads nothing and forwards cancellation during reads',async()=>{
  const s=setup(),c=new AbortController();c.abort('private reason');assert.equal(code(await createComicReferenceResolver(s.config).verify(json(fixture.production),c.signal)),'CANCELLED');assert.equal(s.calls.length,0);
  const t=setup(),d=new AbortController();t.bindings[0].read=async function*(){d.abort('private reason');yield Buffer.alloc(0);};
  const r=await createComicReferenceResolver(t.config).verify(json(fixture.production),d.signal);assert.equal(code(r),'CANCELLED');assert.equal(json(r).includes('private reason'),false);
});
test('configuration rejects oversized artifacts, duplicate/conflicting mappings and absent authority',()=>{
  for(const mutate of [s=>s.config.authorize=null,s=>s.config.bindings.push(s.bindings[0]),s=>s.bindings[0].artifactSource=json({media_type:'text/plain',byte_size:COMIC_REFERENCE_LIMITS.maxArtifactBytes+1,sha256:'sha256:'+'0'.repeat(64)})]){
    const s=setup();mutate(s);assert.throws(()=>createComicReferenceResolver(s.config),e=>e.code==='RESOLVER_CONFIGURATION'&&!e.message.includes('SYNTHETIC'));
  }
});
test('host-required contract/tool pins cannot be silently omitted',async()=>{
  const s=setup(),p=structuredClone(fixture.production);p.inputs.dependencies.pop();
  const r=await createComicReferenceResolver(s.config).verify(json(p));assert.equal(code(r),'REQUIRED_REFERENCE');assert.equal(s.calls.length,0);
});
test('aggregate expected bytes are bounded before any authorization or reads',async()=>{
  const p=structuredClone(fixture.production);p.inputs.prompts=[];p.panels.forEach(x=>x.prompt_bindings=[]);
  const calls=[],bindings=[];
  for(let i=0;i<5;i++)p.inputs.dependencies.push({repository:'synthetic/big-'+i,version:'1.0.0',tag:'v1.0.0',commit:'1'.repeat(40),artifact:{artifact_uri:'https://example.invalid/big-'+i,media_type:'application/octet-stream',byte_size:COMIC_REFERENCE_LIMITS.maxArtifactBytes,sha256:'sha256:'+'0'.repeat(64)}});
  const plan=planComicReferences(json(p));assert.equal(plan.valid,true);
  for(const e of plan.references){const {media_type,byte_size,sha256}=e.reference.dependency.artifact;bindings.push({referenceSource:json(e.reference),artifactSource:json({media_type,byte_size,sha256}),classification:'public',read(){calls.push('read');}});}
  const s=setup();s.config.bindings=bindings;s.config.authorize=()=>{calls.push('authorize');return null;};
  assert.equal(code(await createComicReferenceResolver(s.config).verify(json(p))),'TOTAL_LIMIT');assert.deepEqual(calls,[]);
});
test('unique reference count is bounded while planning before installation',()=>{
  const p=structuredClone(fixture.production);p.inputs.prompts=[];p.panels.forEach(x=>x.prompt_bindings=[]);
  p.inputs.dependencies=Array.from({length:256},(_,i)=>({...p.inputs.canon,artifact:{...p.inputs.canon.artifact,artifact_uri:'https://example.invalid/ref-'+i}}));
  assert.equal(code(planComicReferences(json(p))),'REFERENCE_LIMIT');
});
test('late preflight denial prevents all reads',async()=>{
  const s=setup();let count=0;s.config.authorize=arg=>{const d=JSON.parse(allow(arg));if(++count===s.plan.references.length)d.decision='deny';return json(d);};
  assert.equal(code(await s.verify()),'ACCESS_DENIED');assert.equal(s.calls.length,0);
});
test('no locator, protected data or raw exception is exposed by authority failures',async()=>{
  const s=setup();s.config.authorize=()=>{throw Error('SYNTHETIC-PROTECTED-SENTINEL /private/source');};
  const r=await s.verify();assert.deepEqual(r,{valid:false,diagnostics:[{stage:'reference',code:'AUTHORITY_UNVERIFIABLE'}]});assert.equal(s.calls.length,0);
});
test('conflicting locators, malformed host settings and media-type mismatches fail configuration',()=>{
  for(const change of [
    s=>{const b={...s.bindings[0]},ref=JSON.parse(b.referenceSource);ref.dependency.commit='2'.repeat(40);b.referenceSource=json(ref);s.config.bindings.push(b);},
    s=>{const a=JSON.parse(s.bindings[0].artifactSource);a.media_type='text/plain';s.bindings[0].artifactSource=json(a);},
    s=>s.config.requiredPublicReferences=[],s=>s.config.getTime=null,s=>s.config.timeoutMs=0
  ]){const s=setup();change(s);assert.throws(()=>createComicReferenceResolver(s.config),e=>e.code==='RESOLVER_CONFIGURATION');}
});
test('clock reversal and slow authority crossing expiry stop without reads',async()=>{
  for(const times of [[at,'2026-09-14T12:00:00Z'],[at,end]]){
    const s=setup();let i=0;s.config.getTime=()=>times[Math.min(i++,1)];assert.equal(code(await s.verify()),'STALE_AUTHORITY');assert.equal(s.calls.length,0);
  }
});
test('reader failure closes a stream and no later binding is read',async()=>{
  const s=setup();let closed=false;s.bindings[0].read=async function*(){try{yield Buffer.alloc(1000);}finally{closed=true;}};
  assert.equal(code(await s.verify()),'ARTIFACT_LIMIT');assert.equal(closed,true);assert.equal(s.calls.length,0);
});
test('a hung iterator is deadline-bounded and receives an abort signal',async()=>{
  const s=setup();s.config.timeoutMs=10;let signal;
  s.bindings[0].read=options=>{signal=options.signal;return {[Symbol.asyncIterator](){return {next:()=>new Promise(()=>{}),return:()=>Promise.resolve({done:true})};}};};
  assert.equal(code(await s.verify()),'TIMEOUT');assert.equal(signal.aborted,true);
});
test('ordinary validation and reference planning never install or call source readers',()=>{
  const p=structuredClone(fixture.production);p.inputs.canon.artifact.artifact_uri='https://example.invalid/private';
  assert.equal(planComicReferences(json(p)).valid,true); // only explicit resolver.verify may read
  assert.equal(planComicReferences(json(fixture.release)).valid,false);
});
test('offline installed fakes resolve without ambient filesystem, network or execution',()=>{
  const script=`
    import assert from 'node:assert/strict';import fs from 'node:fs';import fsp from 'node:fs/promises';
    import http from 'node:http';import https from 'node:https';import net from 'node:net';import cp from 'node:child_process';
    import {syncBuiltinESMExports} from 'node:module';import {createHash} from 'node:crypto';
    import {planComicReferences,createComicReferenceResolver} from './src/comic-manifest/index.js';
    const f=JSON.parse(fs.readFileSync('tests/fixtures/comic-manifest-v1.json'));
    const context=JSON.parse(fs.readFileSync('tests/fixtures/context-builder-v1.json'));
    const source=JSON.stringify(f.production),plan=planComicReferences(source),at='2026-09-15T12:00:00Z';
    const bindings=plan.references.map(e=>{const r=e.reference;const bytes=Buffer.from(r.kind==='public'?f.dependency_bytes[r.dependency.artifact.artifact_uri]:JSON.stringify(r.kind==='context-package'?context.result.package:context.result));
      return {referenceSource:JSON.stringify(r),classification:e.classification,artifactSource:JSON.stringify({media_type:'application/json',byte_size:bytes.length,sha256:'sha256:'+createHash('sha256').update(bytes).digest('hex')}),async *read(){yield bytes;}};});
    const resolver=createComicReferenceResolver({bindings,requiredPublicReferences:bindings.filter((_,i)=>plan.references[i].uses.some(u=>u.role==='dependency')).map(b=>b.referenceSource),callerId:f.production.production_id,purpose:'Synthetic offline verification',maxClassification:'internal',getTime:()=>at,
      authorize:({scope})=>JSON.stringify({decision:'allow',scope,not_before:at,expires_at:'2026-09-15T13:00:00Z',revocation:{status:'active',checked_at:at}})});
    let calls=0;const deny=()=>{calls++;throw Error('Forbidden ambient effect');};
    for(const key of ['readFile','readFileSync','writeFile','writeFileSync','open','openSync'])fs[key]=deny;
    for(const key of ['readFile','writeFile','open'])fsp[key]=deny;
    for(const m of [http,https]){m.request=deny;m.get=deny;}net.connect=deny;net.createConnection=deny;
    for(const key of ['exec','execSync','execFile','execFileSync','spawn','spawnSync','fork'])cp[key]=deny;
    globalThis.fetch=deny;globalThis.eval=deny;globalThis.Function=deny;syncBuiltinESMExports();
    const result=await resolver.verify(source);assert.equal(result.valid,true,JSON.stringify(result.diagnostics));assert.equal(calls,0);
  `;
  execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:fileURLToPath(new URL('../../',import.meta.url)),timeout:10_000});
});
test('cancellation inputs cannot expose raw exceptions or execute spoofed signal properties',async()=>{
  const s=setup();const proxy=new Proxy(new AbortController().signal,{});
  assert.equal(code(await createComicReferenceResolver(s.config).verify(json(fixture.production),proxy)),'REFERENCE_SHAPE');
  let calls=0;const c=new AbortController();Object.defineProperty(c.signal,'aborted',{get(){calls++;throw Error('SYNTHETIC-PROTECTED-SENTINEL');}});
  Object.defineProperty(c.signal,'addEventListener',{value(){calls++;throw Error('private');}});
  assert.equal((await createComicReferenceResolver(s.config).verify(json(fixture.production),c.signal)).valid,true);assert.equal(calls,0);
});
test('deadline also detects synchronous adapter overruns before a reader is invoked',async()=>{
  const s=setup();s.config.timeoutMs=5;s.config.getTime=()=>{const until=performance.now()+15;while(performance.now()<until){}return at;};
  assert.equal(code(await s.verify()),'TIMEOUT');assert.equal(s.calls.length,0);
});
