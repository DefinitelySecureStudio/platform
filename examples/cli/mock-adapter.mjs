import { MockTextAdapter } from '../../src/prompt-sdk/index.js';

// A real trusted module obtains credentials from approved runtime configuration,
// never from the prompt. It must not print credentials or other logs to stdout.
export function createAdapter() {
  return new MockTextAdapter({ content: '{"facts":[]}' });
}
