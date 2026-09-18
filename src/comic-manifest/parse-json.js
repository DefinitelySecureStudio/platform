import { types } from 'node:util';

export const COMIC_MANIFEST_LIMITS = Object.freeze({
  maxBytes: 8 * 1024 * 1024, maxDepth: 32, maxValues: 100_000, maxStringBytes: 32_768
});
const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const byteLength = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'byteLength').get;
const backingBuffer = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'buffer').get;
const stop = code => { throw code; }; // Internal constant codes only; no raw exceptions escape.
const failure = code => ({ valid: false, diagnostics: [{ stage: 'parse', code }] });
const codes = new Set(['INPUT_TYPE', 'INPUT_BYTES', 'INVALID_UNICODE', 'JSON_BOM', 'JSON_SYNTAX',
  'DUPLICATE_KEY', 'DEPTH_LIMIT', 'VALUE_LIMIT', 'STRING_LIMIT', 'NUMBER_RANGE']);

function decode(source) {
  if (typeof source === 'string') {
    // UTF-16 length is a cheap upper-bound guard before the UTF-8 byte count.
    if (source.length > COMIC_MANIFEST_LIMITS.maxBytes || Buffer.byteLength(source) > COMIC_MANIFEST_LIMITS.maxBytes) stop('INPUT_BYTES');
    if (!source.isWellFormed()) stop('INVALID_UNICODE');
    return source;
  }
  if (!source || typeof source !== 'object' || types.isProxy(source) || !types.isUint8Array(source)) stop('INPUT_TYPE');
  const prototype = Object.getPrototypeOf(source);
  if (prototype !== Uint8Array.prototype && prototype !== Buffer.prototype) stop('INPUT_TYPE');
  // Intrinsic getters bypass user-defined buffer/length accessors. Shared backing
  // memory is not a stable input snapshot and is deliberately unsupported.
  const size = byteLength.call(source);
  if (size > COMIC_MANIFEST_LIMITS.maxBytes) stop('INPUT_BYTES');
  if (types.isSharedArrayBuffer(backingBuffer.call(source))) stop('INPUT_TYPE');
  const copy = Buffer.alloc(size);
  for (let i = 0; i < size; i++) copy[i] = source[i];
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(copy); }
  catch { stop('INVALID_UNICODE'); }
}

/** Pure bounded JSON parsing. No object coercion, reviver, I/O or authority. */
export function parseComicManifestJson(source) {
  try {
    const text = decode(source);
    if (text.charCodeAt(0) === 0xfeff) stop('JSON_BOM');
    let offset = 0, values = 0;
    const whitespace = () => { while (offset < text.length && /[\x20\t\r\n]/.test(text[offset])) offset++; };
    function string() {
      if (text[offset++] !== '"') stop('JSON_SYNTAX');
      const start = offset - 1;
      let closed = false;
      while (offset < text.length) {
        // Even maximally escaped legal strings cannot exceed this token budget.
        if (offset - start > 6 * COMIC_MANIFEST_LIMITS.maxStringBytes + 2) stop('STRING_LIMIT');
        const c = text[offset++];
        if (c === '\\') { offset++; continue; }
        if (c === '"') { closed = true; break; }
      }
      if (!closed) stop('JSON_SYNTAX');
      let decoded;
      try { decoded = JSON.parse(text.slice(start, offset)); } catch { stop('JSON_SYNTAX'); }
      if (!decoded.isWellFormed()) stop('INVALID_UNICODE');
      if (Buffer.byteLength(decoded) > COMIC_MANIFEST_LIMITS.maxStringBytes) stop('STRING_LIMIT');
      return decoded;
    }
    function value(depth) {
      if (depth > COMIC_MANIFEST_LIMITS.maxDepth) stop('DEPTH_LIMIT');
      if (++values > COMIC_MANIFEST_LIMITS.maxValues) stop('VALUE_LIMIT');
      whitespace();
      if (text[offset] === '"') return string();
      if (text[offset] === '{') {
        offset++; whitespace();
        const object = Object.create(null), keys = new Set();
        if (text[offset] === '}') { offset++; return Object.freeze(object); }
        while (true) {
          const key = string();
          if (keys.has(key)) stop('DUPLICATE_KEY');
          keys.add(key); whitespace();
          if (text[offset++] !== ':') stop('JSON_SYNTAX');
          Object.defineProperty(object, key, { value: value(depth + 1), enumerable: true });
          whitespace(); const delimiter = text[offset++];
          if (delimiter === '}') return Object.freeze(object);
          if (delimiter !== ',') stop('JSON_SYNTAX');
          whitespace();
        }
      }
      if (text[offset] === '[') {
        offset++; whitespace(); const array = [];
        if (text[offset] === ']') { offset++; return Object.freeze(array); }
        while (true) {
          array.push(value(depth + 1)); whitespace(); const delimiter = text[offset++];
          if (delimiter === ']') return Object.freeze(array);
          if (delimiter !== ',') stop('JSON_SYNTAX');
        }
      }
      for (const [token, decoded] of [['true', true], ['false', false], ['null', null]]) {
        if (text.startsWith(token, offset)) { offset += token.length; return decoded; }
      }
      const start = offset;
      while (offset < text.length && !/[\x20\t\r\n,\]}]/.test(text[offset])) offset++;
      const token = text.slice(start, offset);
      if (!/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/.test(token)) stop('JSON_SYNTAX');
      const number = Number(token);
      if (!Number.isFinite(number) || (Number.isInteger(number) && !Number.isSafeInteger(number))) stop('NUMBER_RANGE');
      return number;
    }
    const parsed = value(0); whitespace();
    if (offset !== text.length) stop('JSON_SYNTAX');
    return { valid: true, value: parsed, diagnostics: [] };
  } catch (code) {
    return failure(typeof code === 'string' && codes.has(code) ? code : 'JSON_SYNTAX');
  }
}
