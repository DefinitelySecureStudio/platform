import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { canonicalJson, validateContextDocument, validateContextBinding, renderPromptWithContextPackage, CONTEXT_PACKAGE_CONTRACT } from '../../src/prompt-sdk/index.js';
const read = async path => JSON.parse(await readFile(new URL(path,import.meta.url)));
const lock = await read('../fixtures/comic-manifest-contract-lock.json');
const schema = await read('../fixtures/comic-manifest-v1.schema.json');
const fixture = await read('../fixtures/comic-manifest-v1.json');
const foundation = await read('../fixtures/context-builder-v1.json');
const hash = b => 'sha256:'+createHash('sha256').update(b).digest('hex');
const identity = value => ({canonicalization:'studio-json-v1',byte_size:Buffer.byteLength(canonicalJson(value)),sha256:hash(canonicalJson(value))});
const ajv = new Ajv({strict:true,strictRequired:false,strictTypes:false,allErrors:true});addFormats(ajv);
const validate = ajv.compile(schema);
const approval = ajv.compile({$ref:schema.$id+'#/$defs/approval'});
// Bounded test consumer only: no Manifest runtime or approval verifier is exported.
function bind(s,f=foundation,at=s.at) {
  const p=s.production,r=s.result,b=p.inputs.prompts[0],pkg=f.result.package;
  assert.deepEqual(r.production,{production_id:p.production_id,revision:p.revision,identity:identity(p)});
  assert.deepEqual(r.inputs,p.inputs);
  assert.deepEqual(b.identity,identity(f.prompt));
  assert.equal(b.prompt_id,f.prompt.id);assert.equal(b.prompt_version,f.prompt.version);
  assert.deepEqual(b.context.manifest_identity,identity(pkg.manifest));
  assert.equal(b.context.package_id,pkg.manifest.package.id);assert.equal(b.context.package_version,pkg.manifest.package.version);
  assert.equal(b.context.instance_id,pkg.manifest.package.instance_id);
  assert.deepEqual(b.context.builder_result_identity,identity(f.result));
  assert.equal(b.context.preparation_reference,f.request.preparation_reference);
  assert.equal(b.context.use_authorization_reference,f.authorization.decision_id);
  assert.equal(b.context.purpose,pkg.manifest.purpose);assert.equal(b.context.classification,pkg.manifest.classification);
  assert.deepEqual(b.context.sections,pkg.manifest.sections.map(x=>x.slot));
  assert.equal(validateContextDocument(pkg).valid,true);
  const validation=validateContextBinding(f.prompt,pkg,f.authorization,{at});
  assert.equal(validation.valid,true,JSON.stringify(validation.diagnostics));
  return renderPromptWithContextPackage(f.prompt,{inputValues:{item:'blue cube',attributes:{}},packageDocument:pkg,authorization:f.authorization,at});
}
test('Comic candidate schema/fixtures are exact Codex source pins, not production locks',async()=>{
  assert.equal(lock.status,'unreleased-test-only');assert.match(lock.commit,/^[0-9a-f]{40}$/);
  assert.equal(CONTEXT_PACKAGE_CONTRACT.status,'released');assert.equal(CONTEXT_PACKAGE_CONTRACT.version,'1.0.0');
  for(const a of lock.artifacts) {
    const bytes=await readFile(new URL('../../'+a.path,import.meta.url));
    assert.equal(bytes.length,a.byte_size);assert.equal(hash(bytes),a.sha256);
    assert.equal(a.artifact_uri,`https://github.com/${lock.repository}/blob/${lock.commit}/${a.source_path}`);
  }
});
test('Platform AJV accepts all three Codex records and detached evidence',()=>{
  for(const kind of ['production','result','release'])assert.equal(validate(fixture[kind]),true,JSON.stringify(validate.errors));
  for(const a of fixture.approvals)assert.equal(approval(a),true,JSON.stringify(approval.errors));
});
test('released SDK consumes the exact Manifest-bound Builder package',()=>{
  const {renderedPrompt}=bind(fixture);
  assert.equal(renderedPrompt.classification,'internal');
  assert.match(renderedPrompt.messages[1].content,/Synthetic approved note\./);
  assert.match(renderedPrompt.messages[1].content,/"facts":\["synthetic"\]/);
});
test('Platform canonical identity agrees with every Codex linkage and approval subject',()=>{
  assert.deepEqual(fixture.linkage.production.identity,identity(fixture.production));
  assert.deepEqual(fixture.linkage.result_identity,identity(fixture.result));
  assert.deepEqual(fixture.linkage.release_identity,identity(fixture.release));
  for(const a of fixture.approvals)assert.deepEqual(a.subject,identity(a.role==='production-reviewer'?fixture.production:fixture.release));
});
test('offline public verification needs only release data and published bytes',()=>{
  const {release,output_bytes,dependency_bytes}=fixture;
  for(const o of release.outputs) {
    const bytes=Buffer.from(output_bytes[o.rendition_id]);assert.equal(bytes.length,o.artifact.byte_size);assert.equal(hash(bytes),o.artifact.sha256);
  }
  for(const d of [release.input_canon,...release.dependencies]) {
    const bytes=Buffer.from(dependency_bytes[d.artifact.artifact_uri]);assert.equal(bytes.length,d.artifact.byte_size);assert.equal(hash(bytes),d.artifact.sha256);
  }
  // Integrity does not certify disclosure or publication authority.
  const publicText=JSON.stringify(release);
  for(const secret of [fixture.production.production_id,fixture.result.result_id,identity(fixture.production).sha256,
    identity(fixture.result).sha256,foundation.result.package.manifest_identity.sha256,...fixture.protected_sentinels])assert.equal(publicText.includes(secret),false);
});
test('unknown behavior and protected identifiers cannot enter the public schema',()=>{
  for(const [key,value] of [['production_id',fixture.production.production_id],['allow',true],['spec_version','1.1.0']])
    assert.equal(validate({...fixture.release,[key]:value}),false);
  const bad=structuredClone(fixture.release);bad.private_context.package_id=foundation.result.package.manifest.package.id;assert.equal(validate(bad),false);
});
test('rehashed Manifest cannot substitute the package or target prompt',()=>{
  for(const mutate of [
    s=>s.production.inputs.prompts[0].context.instance_id=s.production.production_id,
    s=>s.production.inputs.prompts[0].prompt_version='9.0.0',
    s=>s.production.inputs.prompts[0].context.manifest_identity.sha256='sha256:'+'0'.repeat(64),
    s=>s.production.inputs.prompts[0].context.sections=['other']
  ]) {
    const s=structuredClone(fixture);mutate(s);
    s.result.production.identity=identity(s.production);s.result.inputs=structuredClone(s.production.inputs);
    assert.equal(validate(s.production),true);assert.throws(()=>bind(s));
  }
});
test('historical build/preparation evidence cannot replace or renew current use authority',()=>{
  assert.throws(()=>bind(fixture,foundation,foundation.authorization.expires_at));
  const f=structuredClone(foundation);f.authorization=f.result;assert.throws(()=>bind(fixture,f));
  const denied=structuredClone(foundation);denied.authorization.decision='deny';assert.throws(()=>bind(fixture,denied));
  const wrongScope=structuredClone(foundation);wrongScope.authorization.purpose='different-purpose';assert.throws(()=>bind(fixture,wrongScope));
});
