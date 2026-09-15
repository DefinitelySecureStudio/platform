import { PreparationError, fail, requireCondition as need } from './errors.js';

// Bounded duplicate-key-aware JSON parser. No eval, reviver, schema fetch or property setters.
export function parseSourceJson(text) {
  let offset = 0, nodes = 0, chars = 0;
  const invalid = () => fail('INVALID_SOURCE');
  const budget = condition => { if (!condition) throw new PreparationError('BUDGET_EXCEEDED', 'normalization'); };
  const whitespace = () => { while (offset < text.length && /[\x20\t\r\n]/.test(text[offset])) offset++; };
  function string() {
    need(text[offset] === '"', 'INVALID_SOURCE');
    const start = offset++;
    let closed = false;
    while (offset < text.length) {
      const c = text[offset++];
      if (c === '\\') { offset++; continue; }
      if (c === '"') { closed = true; break; }
    }
    need(closed, 'INVALID_SOURCE');
    let value;
    try { value = JSON.parse(text.slice(start, offset)); } catch { invalid(); }
    need(value.isWellFormed(), 'INVALID_SOURCE');
    chars += value.length; budget(chars <= 2_000_000);
    return value;
  }
  function value(depth) {
    budget(depth <= 64 && ++nodes <= 100000);
    whitespace();
    if (text[offset] === '"') return string();
    if (text[offset] === '{') {
      offset++; whitespace(); const object = {}, keys = new Set();
      if (text[offset] === '}') { offset++; return Object.freeze(object); }
      while (true) {
        const key = string(); need(!keys.has(key), 'INVALID_SOURCE'); keys.add(key);
        whitespace(); need(text[offset++] === ':', 'INVALID_SOURCE');
        Object.defineProperty(object, key, { value: value(depth + 1), enumerable: true });
        whitespace(); const c = text[offset++];
        if (c === '}') return Object.freeze(object);
        need(c === ',', 'INVALID_SOURCE'); whitespace();
      }
    }
    if (text[offset] === '[') {
      offset++; whitespace(); const array = [];
      if (text[offset] === ']') { offset++; return Object.freeze(array); }
      while (true) {
        array.push(value(depth + 1)); whitespace(); const c = text[offset++];
        if (c === ']') return Object.freeze(array);
        need(c === ',', 'INVALID_SOURCE');
      }
    }
    for (const [token, parsed] of [['true', true], ['false', false], ['null', null]]) {
      if (text.startsWith(token, offset)) { offset += token.length; return parsed; }
    }
    // Tokenize only to the next delimiter to avoid repeatedly copying the remaining document.
    const start = offset;
    while (offset < text.length && !/[\x20\t\r\n,\]}]/.test(text[offset])) offset++;
    const token = text.slice(start, offset);
    need(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/.test(token), 'INVALID_SOURCE');
    const number = Number(token); need(Number.isFinite(number), 'INVALID_SOURCE'); return number;
  }
  const parsed = value(0); whitespace(); need(offset === text.length, 'INVALID_SOURCE');
  return parsed;
}
