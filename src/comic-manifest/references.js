import { createHash } from 'node:crypto';
import { types } from 'node:util';
import { performance } from 'node:perf_hooks';
import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import { validateContextDocument } from '../prompt-sdk/context-packages.js';
import { validateComicManifest } from './validate.js';
import { parseComicManifestJson } from './parse-json.js';
export const COMIC_REFERENCE_LIMITS = Object.freeze({ maxReferences: 256, maxArtifactBytes: 8 * 1024 * 1024,
  maxTotalBytes: 32 * 1024 * 1024, maxChunks: 4096, timeoutMs: 30_000 });
const ranks = ['public', 'internal', 'confidential', 'restricted'];
const signalAborted = Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted').get;
const listen = EventTarget.prototype.addEventListener, unlisten = EventTarget.prototype.removeEventListener;
const hash = b => 'sha256:' + createHash('sha256').update(b).digest('hex');
const identity = v => { const b = canonicalJson(v); return { canonicalization: 'studio-json-v1', byte_size: Buffer.byteLength(b), sha256: hash(b) }; };
const equal = (a,b) => canonicalJson(a) === canonicalJson(b);
const stop = code => { throw code; };
const need = (value,code) => { if (!value) stop(code); };
const failure = code => ({ valid: false, diagnostics: [{ stage: 'reference', code }] });
const raw = source => { const p = parseComicManifestJson(source); need(p.valid,'REFERENCE_SHAPE'); return p.value; };
const exact = (v,keys) => v && typeof v === 'object' && !Array.isArray(v) && equal(Object.keys(v).sort(),[...keys].sort());
const transport = a => ({ media_type:a.media_type, byte_size:a.byte_size, sha256:a.sha256 });
const frozen = v => raw(canonicalJson(v));
function stamp(value) {
  need(typeof value==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value),'AUTHORITY_UNVERIFIABLE');
  const n=Date.parse(value);need(Number.isFinite(n) && new Date(n).toISOString() === (value.includes('.')?value:value.replace('Z','.000Z')),'AUTHORITY_UNVERIFIABLE');return n;
}
function fixed(d) {
  need(!/^(?:refs\/heads\/|main$|master$|latest$|HEAD$)/i.test(d.tag) && !/[?*]/.test(d.tag),'FLOATING_REFERENCE');
}

/** Protected inventory plan: no reads, permission decisions or public projection. */
export function planComicReferences(source) {
  const p=validateComicManifest(source);if(!p.valid)return p;
  if(p.value.kind!=='comic-production')return failure('RECORD_KIND');
  try {
    const entries=new Map();
    function add(reference,classification,use,check) {
      const key=canonicalJson(reference);let entry=entries.get(key);
      if(!entry){entry={reference,classification,uses:[],checks:[]};entries.set(key,entry);}
      need(entry.classification===classification,'CLASSIFICATION');entry.uses.push(use);if(check)entry.checks.push(check);
      need(entries.size<=COMIC_REFERENCE_LIMITS.maxReferences,'REFERENCE_LIMIT');
    }
    function publicRef(d,use,check){fixed(d);add({kind:'public',dependency:d},'public',use,check);}
    const input=p.value.inputs;
    publicRef(input.canon,{role:'canon'});
    input.dependencies.forEach((d,index)=>publicRef(d,{role:'dependency',index}));
    for(const b of input.prompts){
      publicRef(b.definition,{role:'prompt',binding_id:b.binding_id},{kind:'prompt',id:b.prompt_id,version:b.prompt_version,identity:b.identity});
      if(b.context){
        const c=b.context;
        add({kind:'context-package',package:{id:c.package_id,version:c.package_version,instance_id:c.instance_id},manifest_identity:c.manifest_identity},c.classification,{role:'context',binding_id:b.binding_id});
        add({kind:'builder-result',identity:c.builder_result_identity},c.classification,{role:'builder',binding_id:b.binding_id});
      }
    }
    for(const a of input.assets){
      const use={role:'asset',asset_id:a.asset_id,panel_ids:p.value.panels.filter(panel=>panel.asset_ids.includes(a.asset_id)).map(panel=>panel.panel_id)};
      if(a.reference.kind==='public')publicRef(a.reference.dependency,use);
      else {need(a.classification!=='public','CLASSIFICATION');add(a.reference,a.classification,use);}
    }
    return {valid:true,manifest_identity:p.identity,classification:p.value.classification,references:frozen([...entries.values()]),diagnostics:[]};
  }catch(code){return failure(typeof code==='string'?code:'REFERENCE_SHAPE');}
}
const lengthGetter=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),'byteLength').get;
const bufferGetter=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),'buffer').get;
function copyChunk(chunk,remaining){
  need(chunk && !types.isProxy(chunk) && types.isUint8Array(chunk),'ARTIFACT_INTEGRITY');
  need(!types.isSharedArrayBuffer(bufferGetter.call(chunk)),'ARTIFACT_INTEGRITY');
  const length=lengthGetter.call(chunk);need(length<=remaining,'ARTIFACT_LIMIT');
  const bytes=Buffer.alloc(length);for(let i=0;i<length;i++)bytes[i]=chunk[i];return bytes;
}
function verifyContent(entry,bytes){
  const ref=entry.reference;
  if(ref.kind==='context-package' || ref.kind==='builder-result' || entry.checks.length){
    const parsed=parseComicManifestJson(bytes);need(parsed.valid,'ARTIFACT_IDENTITY');const v=parsed.value;
    if(ref.kind==='context-package'){
      // The released package validator is reused, but its detailed diagnostics never escape.
      need(validateContextDocument(v).valid,'ARTIFACT_IDENTITY');
      need(equal(v.manifest.package,ref.package) && equal(identity(v.manifest),ref.manifest_identity),'ARTIFACT_IDENTITY');
      need(v.manifest.classification===entry.classification,'CLASSIFICATION');
    }else if(ref.kind==='builder-result'){
      need(v?.kind==='context-build-result' && v.spec_version==='1.0.0' && v.status==='prepared' && v.package?.manifest && equal(identity(v),ref.identity),'ARTIFACT_IDENTITY');
      need(v.package.manifest.classification===entry.classification,'CLASSIFICATION');
    }
    for(const c of entry.checks)need(v?.id===c.id && v?.version===c.version && equal(identity(v),c.identity),'ARTIFACT_IDENTITY');
  }
}
const errorCodes=new Set(['REFERENCE_SHAPE','RECORD_KIND','REFERENCE_LIMIT','CLASSIFICATION','FLOATING_REFERENCE',
  'SOURCE_UNCONFIGURED','REQUIRED_REFERENCE','ARTIFACT_LIMIT','TOTAL_LIMIT','ARTIFACT_INTEGRITY','ARTIFACT_IDENTITY','SOURCE_UNAVAILABLE',
  'AUTHORITY_UNVERIFIABLE','ACCESS_DENIED','STALE_AUTHORITY','CANCELLED','TIMEOUT']);

/** Host installation is a trusted-code boundary; no payload can install an adapter. */
export function createComicReferenceResolver({bindings,requiredPublicReferences,authorize,getTime,callerId,purpose,maxClassification,timeoutMs=COMIC_REFERENCE_LIMITS.timeoutMs} = {}) {
  let inventory,required;
  try {
    need(Array.isArray(bindings)&&bindings.length<=COMIC_REFERENCE_LIMITS.maxReferences,'config');
    need(typeof authorize==='function'&&typeof getTime==='function','config');
    need(typeof callerId==='string'&&/^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(callerId),'config');
    need(typeof purpose==='string'&&purpose.length>0&&purpose.length<=4096&&purpose.isWellFormed()&&ranks.includes(maxClassification),'config');
    need(Number.isSafeInteger(timeoutMs)&&timeoutMs>0&&timeoutMs<=COMIC_REFERENCE_LIMITS.timeoutMs,'config');
    inventory=new Map();const locations=new Map();
    for(const b of bindings){
      const reference=raw(b.referenceSource),artifact=raw(b.artifactSource);
      need(exact(artifact,['media_type','byte_size','sha256']) && typeof artifact.media_type==='string' && artifact.media_type.length>0 && artifact.media_type.length<=128
        && Number.isSafeInteger(artifact.byte_size)&&artifact.byte_size>=0&&artifact.byte_size<=COMIC_REFERENCE_LIMITS.maxArtifactBytes
        && typeof artifact.sha256==='string'&&/^sha256:[0-9a-f]{64}$/.test(artifact.sha256),'config');
      need(ranks.includes(b.classification)&&typeof b.read==='function','config');
      need(reference&&['public','protected','context-package','builder-result'].includes(reference.kind),'config');
      if(reference.kind==='public'){fixed(reference.dependency);need(b.classification==='public'&&equal(transport(reference.dependency.artifact),artifact),'config');}
      if(reference.kind==='protected')need(b.classification!=='public'&&equal(transport(reference),artifact),'config');
      if(['context-package','builder-result'].includes(reference.kind))need(artifact.media_type==='application/json','config');
      const key=canonicalJson(reference);need(!inventory.has(key),'config');
      const locator=reference.kind==='public'?reference.dependency.artifact.artifact_uri:reference.kind==='protected'?reference.handle:null;
      if(locator){need(!locations.has(locator)||locations.get(locator)===key,'config');locations.set(locator,key);}
      inventory.set(key,{reference,artifact,classification:b.classification,read:b.read.bind(undefined)});
    }
    need(Array.isArray(requiredPublicReferences)&&requiredPublicReferences.length>0&&requiredPublicReferences.length<=COMIC_REFERENCE_LIMITS.maxReferences,'config');
    required=requiredPublicReferences.map(source=>{const ref=raw(source);need(ref.kind==='public','config');const key=canonicalJson(ref);need(inventory.has(key),'config');return key;});
    need(new Set(required).size===required.length,'config');
  }catch{const error=new Error('Invalid Comic reference resolver configuration.');error.code='RESOLVER_CONFIGURATION';throw error;}

  return Object.freeze({async verify(source,signal){
    const plan=planComicReferences(source);if(!plan.valid)return plan;
    const controller=new AbortController();const deadline=performance.now()+timeoutMs;let timer,relay;
    const expired=()=>{if(performance.now()>=deadline&&!controller.signal.aborted)controller.abort('TIMEOUT');if(controller.signal.aborted)stop(controller.signal.reason);};
    const guarded=async operation=>{
      expired();
      let listener;
      try{const value=await Promise.race([Promise.resolve().then(()=>{expired();return operation();}),new Promise((_,reject)=>{listener=()=>reject(controller.signal.reason);controller.signal.addEventListener('abort',listener,{once:true});})]);expired();return value;}
      finally{if(listener)controller.signal.removeEventListener('abort',listener);}
    };
    try{
      if(signal!==undefined){need(!types.isProxy(signal)&&signal instanceof AbortSignal,'REFERENCE_SHAPE');const aborted=signalAborted.call(signal);relay=()=>controller.abort('CANCELLED');if(aborted)relay();else listen.call(signal,'abort',relay,{once:true});}
      need(!controller.signal.aborted,'CANCELLED');timer=setTimeout(()=>controller.abort('TIMEOUT'),timeoutMs);
      const requested=new Set(plan.references.map(e=>canonicalJson(e.reference)));
      need(required.every(key=>requested.has(key)),'REQUIRED_REFERENCE');
      const selected=[];let total=0,lastTime=-Infinity,earliestExpiry=Infinity;
      for(const entry of plan.references){
        const binding=inventory.get(canonicalJson(entry.reference));need(binding,'SOURCE_UNCONFIGURED');
        need(binding.classification===entry.classification && ranks.indexOf(entry.classification)<=ranks.indexOf(maxClassification),'CLASSIFICATION');
        total+=binding.artifact.byte_size;need(total<=COMIC_REFERENCE_LIMITS.maxTotalBytes,'TOTAL_LIMIT');
        selected.push({entry,binding});
      }
      async function now(){const at=await guarded(()=>getTime());const n=stamp(at);need(n>=lastTime && n<earliestExpiry,'STALE_AUTHORITY');lastTime=n;return at;}
      async function permit({entry,binding}){
        const at=await now();
        const scope=frozen({operation:'comic-reference-read',caller_id:callerId,purpose,max_classification:maxClassification,
          manifest_identity:plan.manifest_identity,reference_identity:identity(entry.reference),artifact:binding.artifact,classification:entry.classification,at});
        let decision;
        try{decision=raw(await guarded(()=>authorize(Object.freeze({scope,signal:controller.signal}))));}
        catch(e){if(controller.signal.aborted)throw controller.signal.reason;stop('AUTHORITY_UNVERIFIABLE');}
        need(exact(decision,['decision','scope','not_before','expires_at','revocation']) && equal(decision.scope,scope),'AUTHORITY_UNVERIFIABLE');
        need(decision.decision==='allow','ACCESS_DENIED');
        need(exact(decision.revocation,['status','checked_at'])&&decision.revocation.checked_at===at,'AUTHORITY_UNVERIFIABLE');
        need(decision.revocation.status==='active','ACCESS_DENIED');
        const start=stamp(decision.not_before),end=stamp(decision.expires_at),time=stamp(await now());
        need(start<=stamp(at)&&time<end&&start<end,'STALE_AUTHORITY');earliestExpiry=Math.min(earliestExpiry,end);return end;
      }
      // Resolve every exact binding and grant before any reader is called.
      for(const selectedEntry of selected)await permit(selectedEntry);
      const verified=[];
      for(const selectedEntry of selected){
        const {entry,binding}=selectedEntry;const end=await permit(selectedEntry);
        let iterator,complete=false;
        try{
          // The installed closure chooses the source. No URI, path or handle is forwarded.
          const stream=await guarded(()=>binding.read(Object.freeze({maxBytes:binding.artifact.byte_size,signal:controller.signal})));
          need(stream&&typeof stream[Symbol.asyncIterator]==='function','SOURCE_UNAVAILABLE');iterator=stream[Symbol.asyncIterator]();
          const chunks=[];let size=0,count=0;
          while(true){
            need(stamp(await now())<end,'STALE_AUTHORITY');
            const step=await guarded(()=>iterator.next());need(stamp(await now())<end,'STALE_AUTHORITY');if(step.done){complete=true;break;}
            need(++count<=COMIC_REFERENCE_LIMITS.maxChunks,'ARTIFACT_LIMIT');
            const chunk=copyChunk(step.value,binding.artifact.byte_size-size);chunks.push(chunk);size+=chunk.length;
          }
          const bytes=Buffer.concat(chunks,size);need(size===binding.artifact.byte_size&&hash(bytes)===binding.artifact.sha256,'ARTIFACT_INTEGRITY');
          verifyContent(entry,bytes);await permit(selectedEntry);
          verified.push(Object.freeze({reference:entry.reference,classification:entry.classification,artifact:binding.artifact,uses:entry.uses,bytes}));
        }finally{if(!complete&&iterator?.return){try{Promise.resolve(iterator.return()).catch(()=>{});}catch{}}}
      }
      // No bytes are delivered if an earlier source was revoked during later reads.
      for(const selectedEntry of selected)await permit(selectedEntry);
      await now();
      return {valid:true,manifest_identity:plan.manifest_identity,classification:plan.classification,artifacts:Object.freeze(verified),diagnostics:[]};
    }catch(code){return failure(controller.signal.aborted?controller.signal.reason:errorCodes.has(code)?code:'SOURCE_UNAVAILABLE');}
    finally{clearTimeout(timer);if(signal&&relay)unlisten.call(signal,'abort',relay);controller.abort('CANCELLED');}
  }});
}
