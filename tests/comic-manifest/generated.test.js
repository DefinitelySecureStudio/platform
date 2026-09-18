import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMIC_MANIFEST_CONTRACT as pin } from '../../src/comic-manifest/index.js';
const root=fileURLToPath(new URL('../../',import.meta.url));
const hash=b=>'sha256:'+createHash('sha256').update(b).digest('hex');
test('reviewed Codex artifacts match exact merged source pins',async()=>{
  const lock=JSON.parse(await readFile(join(root,'tests/fixtures/comic-manifest-validation-lock.json')));
  assert.equal(lock.commit,pin.commit);assert.equal(lock.status,'unreleased-development');
  for(const a of lock.artifacts){const bytes=await readFile(join(root,a.path));assert.equal(bytes.length,a.byte_size);assert.equal(hash(bytes),a.sha256);assert.equal(a.artifact_uri,`https://github.com/${lock.repository}/blob/${lock.commit}/${a.source_path}`);}
  assert.equal(lock.artifacts[0].sha256,pin.sha256);assert.equal(lock.artifacts[0].byte_size,pin.byte_size);
});
test('locked validator generation is reproducible and refuses altered schema bytes',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'comic-validator-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const out=join(dir,'generated.js'),schema=join(root,'tests/fixtures/comic-manifest-v1.schema.json');
  execFileSync(process.execPath,['scripts/generate-comic-manifest-validator.mjs',schema,out],{cwd:root});
  const committed=await readFile(join(root,'src/comic-manifest/generated/schema-v1.js'));
  assert.deepEqual(await readFile(out),committed);
  const tampered=join(dir,'tampered.json');await writeFile(tampered,Buffer.concat([await readFile(schema),Buffer.from(' ')]));
  const failed=spawnSync(process.execPath,['scripts/generate-comic-manifest-validator.mjs',tampered,out],{cwd:root,encoding:'utf8'});
  assert.notEqual(failed.status,0);assert.match(failed.stderr,/Schema identity mismatch/);assert.deepEqual(await readFile(out),committed);
});
test('runtime validation has no file, network, clock, dynamic code or process effects',()=>{
  const code=`
    import assert from 'node:assert/strict';
    import fs from 'node:fs'; import fsp from 'node:fs/promises';
    import http from 'node:http'; import https from 'node:https';
    import net from 'node:net'; import dns from 'node:dns';import cp from 'node:child_process';
    import {syncBuiltinESMExports} from 'node:module';
    import {validateComicManifest} from './src/comic-manifest/index.js';
    const f=JSON.parse(fs.readFileSync('tests/fixtures/comic-manifest-v1.json'));
    const inputs=[f.production,f.result,f.release,...f.approvals].map(x=>JSON.stringify(x));
    let calls=0;const deny=()=>{calls++;throw Error('Forbidden validation effect');};
    for(const name of ['readFile','readFileSync','writeFile','writeFileSync','open','openSync','stat','statSync','readdir','readdirSync'])fs[name]=deny;
    for(const name of ['readFile','writeFile','open','stat','readdir'])fsp[name]=deny;
    for(const m of [http,https]){m.request=deny;m.get=deny;}
    net.connect=deny;net.createConnection=deny;dns.lookup=deny;dns.resolve=deny;
    for(const name of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork'])cp[name]=deny;
    globalThis.fetch=deny;globalThis.eval=deny;globalThis.Function=deny;Date.now=deny;
    syncBuiltinESMExports();
    for(const input of inputs)assert.equal(validateComicManifest(input).valid,true);
    assert.equal(validateComicManifest('{"$ref":"https://example.invalid/private"}').valid,false);
    assert.equal(calls,0);
  `;
  execFileSync(process.execPath,['--input-type=module','-e',code],{cwd:root,timeout:10_000});
});
