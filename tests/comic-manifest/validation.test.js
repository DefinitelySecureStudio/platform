import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateComicManifest as validate, COMIC_MANIFEST_CONTRACT } from '@definitely-secure-studio/platform/comic-manifest';
const read=async p=>JSON.parse(await readFile(new URL('../fixtures/'+p,import.meta.url)));
const fixture=await read('comic-manifest-v1.json');
const negative=await read('comic-manifest-v1-cases.json');
const check=d=>validate(JSON.stringify(d));
for(const [name,d] of [['production',fixture.production],['result',fixture.result],['release',fixture.release],...fixture.approvals.map((a,i)=>['approval '+i,a])]) {
  test(`${name} reviewed candidate passes and returns exact canonical identity`,()=>{
    const r=check(d);assert.equal(r.valid,true,JSON.stringify(r.diagnostics));
    const expected=name==='production'?fixture.linkage.production.identity:name==='result'?fixture.linkage.result_identity:name==='release'?fixture.linkage.release_identity:null;
    if(expected)assert.deepEqual(r.identity,expected);
    assert.equal(Object.isFrozen(r.value),true);assert.deepEqual(r.diagnostics,[]);
  });
  test(`${name} is closed and exactly versioned`,()=>{
    assert.equal(check({...d,allow:true}).valid,false);
    assert.deepEqual(check({...d,spec_version:'1.1.0'}).diagnostics,[{stage:'schema',code:'UNSUPPORTED_VERSION'}]);
    assert.deepEqual(check({...d,kind:'private-future-kind'}).diagnostics,[{stage:'schema',code:'UNSUPPORTED_KIND'}]);
  });
}
for(const c of negative.filter(c=>c.layer==='schema'))test(`Codex negative: ${c.name}`,()=>{
  const s=structuredClone(fixture);
  for(const e of c.edits){const p=e.path.slice(0,-1).reduce((v,k)=>v[k],s);if(e.remove)delete p[e.path.at(-1)];else p[e.path.at(-1)]=e.value;}
  const path=c.edits[0].path;const d=path[0]==='approvals'?s.approvals[path[1]]:s[path[0]];
  assert.equal(check(d).valid,false);
});
const mutations=[
 ['production',p=>p.panels[1].panel_id=p.panels[0].panel_id,'DUPLICATE_ID'],
 ['production',p=>p.panels[0].asset_ids=['missing'],'LOCAL_REFERENCE'],
 ['production',p=>p.panels[0].prompt_bindings=['missing'],'LOCAL_REFERENCE'],
 ['production',p=>p.panels[0].text[0].speaker='synthetic','SPEAKER'],
 ['production',p=>p.revision=2,'REVISION'],
 ['production',p=>p.classification='public','CLASSIFICATION'],
 ['production',p=>p.renditions[0].required=false,'REQUIRED_RENDITION'],
 ['production',p=>p.renditions[0].dimensions={width:1,height:1},'DIMENSIONS'],
 ['production',p=>p.inputs.canon.tag='main','FLOATING_REFERENCE'],
 ['result',r=>r.outputs.push(r.outputs[0]),'DUPLICATE_ID'],
 ['result',r=>r.execution.finished_at='2026-09-14T12:00:00Z','TIME_ORDER'],
 ['result',r=>r.execution.tool.commit='2'.repeat(40),'TOOL_REFERENCE'],
 ['result',r=>r.execution.transformations[0].private_inputs_withheld=true,'TRANSFORMATION'],
 ['release',r=>r.previous=fixture.result.production,'SCHEMA_INVALID'],
 ['release',r=>r.title='Untitled','FINAL_TITLE'],
 ['release',r=>r.gates.reverse(),'GATE_ORDER'],
 ['release',r=>r.approvers=r.approvers.filter(a=>a.role!=='publisher'),'APPROVAL_ROLE'],
 ['release',r=>r.execution.transformations[0].input_digests=['sha256:'+'0'.repeat(64)],'PUBLIC_PROVENANCE'],
 ['release',r=>r.dependencies.push(r.dependencies[0]),'DUPLICATE_REFERENCE']
];
for(const [kind,mutate,code]of mutations)test(`${kind} local invariant: ${code}`,()=>{
  const d=structuredClone(fixture[kind]);mutate(d);const r=check(d);assert.equal(r.valid,false);assert.equal(r.diagnostics[0].code,code);
});
test('detached evidence enforces local time/scope and sorted artifacts without granting authority',()=>{
  for(const mutate of [a=>a.expires_at=a.decided_at,a=>a.scope.publication_time=a.expires_at]){
    const a=structuredClone(fixture.approvals[1]);mutate(a);assert.equal(check(a).diagnostics[0].code,'TIME_ORDER');
  }
  const a=structuredClone(fixture.approvals[1]);a.artifact_digests=['sha256:'+'f'.repeat(64),'sha256:'+'0'.repeat(64)];assert.equal(check(a).diagnostics[0].code,'ARTIFACT_ORDER');
});
test('validation never equates local validity with build success, authorization or publication',()=>{
  const failed=structuredClone(fixture.result);failed.status='failed';failed.outputs=[];failed.diagnostics=['AUTHORITY_DENIED'];assert.equal(check(failed).valid,true);
  const blocked=structuredClone(fixture.release);blocked.gates[0].disposition='fail';assert.equal(check(blocked).valid,true);
  // Structurally coherent historical approvals remain historical, irrespective of today's date.
  assert.equal(check(fixture.approvals[1]).valid,true);
  assert.equal(COMIC_MANIFEST_CONTRACT.status,'unreleased-development');
});
test('dates are calendar-validated, preserve fractional ordering and accept UTC leap-second syntax',()=>{
  const r=structuredClone(fixture.result);r.execution.started_at='2026-02-30T12:00:00Z';assert.equal(check(r).valid,false);
  r.execution.started_at='2026-09-15T12:00:00.000000002Z';r.execution.finished_at='2026-09-15T12:00:00.000000001Z';assert.equal(check(r).diagnostics[0].code,'TIME_ORDER');
  r.execution.started_at='2016-12-31T23:59:60Z';r.execution.finished_at='2017-01-01T00:00:00Z';assert.equal(check(r).valid,true);
});
