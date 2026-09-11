import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runReference } from '../../examples/reference-prompts/run.mjs';
import { validateExecutionProvenance, validateStructuredOutputDocument } from '../../src/prompt-sdk/index.js';
for (const name of ['text', 'structured', 'context']) {
  test('reference ' + name + ': complete flow matches reviewed golden', async () => {
    const result = await runReference(name);
    const golden = JSON.parse(await readFile(new URL('../fixtures/golden/' + name + '.json', import.meta.url)));
    assert.deepEqual(result, golden);
    assert.deepEqual(await runReference(name), golden);
    for (const provenance of result.provenance) assert.equal(validateExecutionProvenance(provenance), true);
    if (result.structured) assert.equal(validateStructuredOutputDocument(result.structured).valid, true);
    if (name === 'context') {
      assert.equal(result.provenance[0].record.redacted_context_count, 2);
      assert.equal(result.provenance[0].record.rendered, undefined);
      assert.equal(result.provenance[0].record.output, undefined);
      assert.doesNotMatch(JSON.stringify(result), /Synthetic approved note|source.synthetic.internal|context_auth_reference/);
    }
  });
}
test('structured reference rejects schema-invalid output', async () => {
  await assert.rejects(runReference('structured', { invalidOutput: true }), error => Boolean(error.failure) && error.failure.status === 'failed');
});
test('context reference rejects expired authorization before execution', async () => {
  await assert.rejects(runReference('context', { expiredContext: true }), error => /EXPIRED/.test(error.code));
});
