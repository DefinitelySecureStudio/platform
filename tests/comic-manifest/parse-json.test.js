import test from 'node:test';
import assert from 'node:assert/strict';
import { parseComicManifestJson as parse, COMIC_MANIFEST_LIMITS as limits, validateComicManifest } from '../../src/comic-manifest/index.js';
const reject = (source, code) => {
  const result = parse(source);
  assert.deepEqual(result, { valid: false, diagnostics: [{ stage: 'parse', code }] });
};
for (const source of ['', ' ', '{', '[', '{"x":}', '[1,]', '{"x":1,}', '[truefalse]', 'null null', 'undefined', 'NaN', '+1', '01', '.1', '1.', '1e', '/*x*/null', '\u00a0null', '"\n"', '"\\x00"', '"unterminated', '"\\uZZZZ"']) {
  test(`reject malformed JSON ${JSON.stringify(source)}`, () => reject(source, 'JSON_SYNTAX'));
}
test('duplicate decoded keys fail at any depth including escaped aliases', () => {
  for (const source of ['{"x":1,"x":2}', '{"a":1,"\\u0061":2}', '[{"nested":{"private":1,"private":2}}]', '{"__proto__":1,"__proto__":2}']) reject(source, 'DUPLICATE_KEY');
  assert.equal(parse('[{"x":1},{"x":2}]').valid, true);
});
test('valid UTF-8 input forms, whitespace, escapes and numeric grammar', () => {
  const text = ' \r\n {"é":"😀\\uD83D\\uDE00", "a":[1,-0,1.25,2e-2,true,false,null]}\t';
  for (const source of [text, Buffer.from(text), new Uint8Array(Buffer.from(text))]) {
    const r=parse(source);assert.equal(r.valid,true);assert.equal(r.value.é,'😀😀');assert.equal(r.value.a[3],0.02);
    assert.equal(Object.isFrozen(r.value),true);assert.equal(Object.isFrozen(r.value.a),true);
  }
});
test('BOM, invalid UTF-8 and raw/escaped unpaired surrogates are rejected', () => {
  for(const v of ['\ufeffnull',Buffer.from('\ufeffnull')])reject(v,'JSON_BOM');
  for(const v of [Buffer.from([0xc0,0xaf]),Buffer.from([0xed,0xa0,0x80]),Buffer.from([0xff]),'"\ud800"','"\\ud800"','{"\\udfff":1}'])reject(v,'INVALID_UNICODE');
});
test('finite numeric values and safe integers are mandatory', () => {
  for(const v of ['1e999','9007199254740992','-9007199254740992'])reject(v,'NUMBER_RANGE');
  for(const v of ['9007199254740991','-9007199254740991','-0','1.5'])assert.equal(parse(v).valid,true);
});
test('exact document-byte boundary is enforced before parsing', () => {
  const exact='null'+' '.repeat(limits.maxBytes-4);
  assert.equal(parse(exact).valid,true);reject(exact+' ','INPUT_BYTES');
  reject(new Uint8Array(limits.maxBytes+1),'INPUT_BYTES');
});
test('depth counts root at zero and fails before stack exhaustion', () => {
  assert.equal(parse('['.repeat(32)+'0'+']'.repeat(32)).valid,true);
  reject('['.repeat(33)+'0'+']'.repeat(33),'DEPTH_LIMIT');
  reject('['.repeat(50_000),'DEPTH_LIMIT');
});
test('value count includes root and every JSON value but not member names', () => {
  assert.equal(parse('['+'0,'.repeat(limits.maxValues-2)+'0]').valid,true);
  reject('['+'0,'.repeat(limits.maxValues-1)+'0]','VALUE_LIMIT');
});
test('string and member-name byte limits apply after escape decoding', () => {
  for (const key of [false,true]) {
    const wrap=x=>key?'{'+x+':0}':x;
    assert.equal(parse(wrap(JSON.stringify('a'.repeat(limits.maxStringBytes)))).valid,true);
    reject(wrap(JSON.stringify('a'.repeat(limits.maxStringBytes+1))),'STRING_LIMIT');
    assert.equal(parse(wrap(JSON.stringify('😀'.repeat(limits.maxStringBytes/4)))).valid,true);
    reject(wrap(JSON.stringify('😀'.repeat(limits.maxStringBytes/4+1))),'STRING_LIMIT');
    assert.equal(parse(wrap('"'+'\\u0061'.repeat(limits.maxStringBytes)+'"')).valid,true);
    reject(wrap('"'+'\\u0061'.repeat(limits.maxStringBytes+1)+'"'),'STRING_LIMIT');
  }
});
test('prototype names remain inert own data properties', () => {
  const r=parse('{"__proto__":{"polluted":true},"constructor":1,"toString":2}');
  assert.equal(r.valid,true);assert.equal(Object.getPrototypeOf(r.value),null);
  assert.equal(r.value.__proto__.polluted,true);assert.equal({}.polluted,undefined);
});
test('objects, coercion hooks, proxies, subclasses and shared bytes never execute hooks', () => {
  let called=0;const run=()=>{called++;throw Error('SYNTHETIC-PROTECTED-SENTINEL');};
  const proxy=new Proxy({}, {get:run,getPrototypeOf:run});
  const revoked=Proxy.revocable({},{});revoked.revoke();
  class CustomBytes extends Uint8Array { get byteLength(){return run();} }
  for(const v of [{toString:run,toJSON:run},new String('{}'),proxy,revoked.proxy,new CustomBytes(2),new Uint8Array(new SharedArrayBuffer(2)),[],null,42])reject(v,'INPUT_TYPE');
  assert.equal(called,0);
});
test('byte-array snapshots do not consult spoofed lengths, iterators or buffers', () => {
  let calls=0;const run=()=>{calls++;throw Error('private');};
  const v=new Uint8Array(Buffer.from('null'));
  for(const key of ['byteLength','length','buffer','constructor'])Object.defineProperty(v,key,{get:run});
  Object.defineProperty(v,Symbol.iterator,{value:run});
  assert.equal(parse(v).valid,true);assert.equal(calls,0);
});
test('diagnostics contain only fixed codes/stages even for protected member names', () => {
  const secret='SYNTHETIC-PROTECTED-SENTINEL';
  for(const source of [`{"${secret}":0,"${secret}":1}`,`{"${secret}":`,JSON.stringify({kind:'comic-production',spec_version:'1.0.0',[secret]:secret})]) {
    const r=validateComicManifest(source);assert.equal(r.valid,false);
    assert.equal(JSON.stringify(r).includes(secret),false);assert.deepEqual(Object.keys(r).sort(),['diagnostics','valid']);
    assert.deepEqual(Object.keys(r.diagnostics[0]).sort(),['code','stage']);
  }
});
test('malformed inputs always terminate with one value-free diagnostic', () => {
  let seed=90;const alphabet='{}[],:"\\012true false\n';
  for(let n=0;n<400;n++) {
    let input='';for(let i=0;i<n%80;i++){seed=(seed*1664525+1013904223)>>>0;input+=alphabet[seed%alphabet.length];}
    const r=validateComicManifest(input);assert.equal(r.valid,false);assert.equal(r.diagnostics.length,1);
  }
});
