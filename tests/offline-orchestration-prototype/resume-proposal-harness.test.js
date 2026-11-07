// Test-only executable model for the proposed O08 restart boundary.
// It does not test or implement a production/runtime resume API, persistent
// store, trusted clock service, or adapter idempotency contract.
import assert from 'node:assert/strict';
import test from 'node:test';

const DOMAIN = 'synthetic-o08-time-domain-v1';
const EPOCH = 'synthetic-o08-epoch-1';

function createResumeModel({
  now = 10,
  retryNotBefore = 10,
  originalDeadline = 50,
  afterBoundary = {},
  claimOutcome = 'acquired',
  evidenceValid = true,
  markerOutcome = 'committed',
  providerOutcome = 'confirmed',
  authorized = true
} = {}) {
  const clock = { now, domain: DOMAIN, epoch: EPOCH, available: true };
  const state = {
    authorized,
    lastValidatedNow: undefined,
    claimed: false,
    claimCount: 0,
    dispatchIntent: false,
    evidenceReads: 0,
    providerCalls: 0,
    quarantined: false,
    trace: []
  };

  function currentGate() {
    if (!state.authorized) return 'authority-denied';
    if (!clock.available || clock.domain !== DOMAIN || clock.epoch !== EPOCH
      || !Number.isFinite(clock.now)) return 'time-unverifiable';
    if (!Number.isFinite(retryNotBefore) || !Number.isFinite(originalDeadline)) {
      return 'time-unverifiable';
    }
    if (state.lastValidatedNow !== undefined && clock.now < state.lastValidatedNow) {
      return 'time-unverifiable';
    }
    state.lastValidatedNow = clock.now;
    if (retryNotBefore >= originalDeadline) return 'empty-window';
    if (clock.now >= originalDeadline) return 'deadline-expired';
    if (clock.now < retryNotBefore) return 'retry-not-before';
    return undefined;
  }

  async function crossBoundary(name) {
    state.trace.push(`${name}:settled`);
    const outcome = await afterBoundary[name]?.(clock, state);
    if (outcome === 'crash') {
      state.quarantined = true;
      state.trace.push(`${name}:crash`);
      return 'process-crashed';
    }
    const failure = currentGate();
    if (failure) {
      if (state.claimed || state.dispatchIntent) state.quarantined = true;
      return failure;
    }
    return undefined;
  }

  async function resume() {
    if (state.quarantined || state.dispatchIntent) return 'quarantined';
    if (state.claimed) return 'claim-held';
    let failure = currentGate();
    if (failure) return failure;

    state.claimCount++;
    state.trace.push('claim:begin');
    if (claimOutcome === 'ambiguous') {
      state.quarantined = true;
      return 'claim-ambiguous';
    }
    if (claimOutcome !== 'acquired' || state.claimed) return 'claim-busy';
    state.claimed = true;
    failure = await crossBoundary('claim');
    if (failure) return failure;
    // The helper's gate can become stale before this caller resumes. Recheck
    // synchronously before the protected evidence read.
    failure = currentGate();
    if (failure) {
      state.quarantined = true;
      return failure;
    }

    state.evidenceReads++;
    state.trace.push('evidence:read');
    const evidenceFailure = await crossBoundary('evidence');
    if (evidenceFailure) return evidenceFailure;
    // Do not trust a check performed inside the awaited helper across the
    // promise continuation before preflight.
    failure = currentGate();
    if (failure) {
      state.quarantined = true;
      return failure;
    }
    if (!evidenceValid) {
      state.quarantined = true;
      return 'evidence-invalid';
    }

    state.trace.push('preflight:begin');
    const preflightFailure = await crossBoundary('preflight');
    if (preflightFailure) return preflightFailure;
    failure = currentGate();
    if (failure) {
      state.quarantined = true;
      return failure;
    }

    state.trace.push('dispatch-marker:begin');
    if (markerOutcome === 'ambiguous') {
      state.quarantined = true;
      return 'marker-ambiguous';
    }
    if (markerOutcome !== 'committed') {
      state.quarantined = true;
      return 'marker-uncommitted';
    }
    state.dispatchIntent = true;
    state.trace.push('dispatch-marker:committed');
    const markerFailure = await crossBoundary('dispatchMarker');
    if (markerFailure) return markerFailure;

    // This caller-side check and invocation intentionally have no await between them.
    failure = currentGate();
    if (failure) {
      state.quarantined = true;
      return failure;
    }
    state.providerCalls++;
    state.trace.push('provider:called');
    if (providerOutcome === 'uncertain') {
      state.quarantined = true;
      return 'dispatch-uncertain';
    }
    return 'resumed';
  }

  return { clock, state, resume };
}

test('proposal harness admits the inclusive retry bound and preserves marker-before-effect order', async () => {
  const model = createResumeModel({ now: 10, retryNotBefore: 10, originalDeadline: 50 });
  assert.equal(await model.resume(), 'resumed');
  assert.equal(model.state.providerCalls, 1);
  assert.ok(model.state.trace.indexOf('dispatch-marker:committed') < model.state.trace.indexOf('provider:called'));
});

test('proposal harness checks current authority before protected evidence and effects', async t => {
  await t.test('initial denial', async () => {
    const model = createResumeModel({ authorized: false });
    assert.equal(await model.resume(), 'authority-denied');
    assert.equal(model.state.claimCount, 0);
    assert.equal(model.state.evidenceReads, 0);
    assert.equal(model.state.providerCalls, 0);
  });
  await t.test('revocation after claim', async () => {
    const model = createResumeModel({
      afterBoundary: { claim: (_clock, state) => { state.authorized = false; } }
    });
    assert.equal(await model.resume(), 'authority-denied');
    assert.equal(model.state.evidenceReads, 0);
    assert.equal(model.state.providerCalls, 0);
  });
  await t.test('revocation in the caller microtask gap after claim', async () => {
    const model = createResumeModel({
      afterBoundary: {
        claim: (_clock, state) => {
          queueMicrotask(() => queueMicrotask(() => { state.authorized = false; }));
        }
      }
    });
    assert.equal(await model.resume(), 'authority-denied');
    assert.equal(model.state.evidenceReads, 0);
    assert.equal(model.state.providerCalls, 0);
    assert.equal(model.state.quarantined, true);
  });
  for (const [boundary, expectedEvidenceReads, expectMarker] of [
    ['evidence', 1, false],
    ['preflight', 1, false],
    ['dispatchMarker', 1, true]
  ]) {
    await t.test(`revocation in the caller microtask gap after ${boundary}`, async () => {
      const model = createResumeModel({
        afterBoundary: {
          [boundary]: (_clock, state) => {
            queueMicrotask(() => queueMicrotask(() => { state.authorized = false; }));
          }
        }
      });
      assert.equal(await model.resume(), 'authority-denied');
      assert.equal(model.state.evidenceReads, expectedEvidenceReads);
      assert.equal(model.state.trace.includes('dispatch-marker:committed'), expectMarker);
      assert.equal(model.state.providerCalls, 0);
      assert.equal(model.state.quarantined, true);
    });
  }
});

test('proposal harness rejects early retry, the exclusive deadline, and an empty window', async t => {
  await t.test('before retry_not_before', async () => {
    const model = createResumeModel({ now: 9, retryNotBefore: 10, originalDeadline: 50 });
    assert.equal(await model.resume(), 'retry-not-before');
    assert.equal(model.state.claimCount, 0);
    assert.equal(model.state.evidenceReads, 0);
    assert.equal(model.state.providerCalls, 0);
  });
  await t.test('at original_deadline', async () => {
    const model = createResumeModel({ now: 50, retryNotBefore: 10, originalDeadline: 50 });
    assert.equal(await model.resume(), 'deadline-expired');
    assert.equal(model.state.providerCalls, 0);
  });
  await t.test('retry_not_before at or after original_deadline', async () => {
    const model = createResumeModel({ now: 10, retryNotBefore: 50, originalDeadline: 50 });
    assert.equal(await model.resume(), 'empty-window');
    assert.equal(model.state.claimCount, 0);
    assert.equal(model.state.evidenceReads, 0);
    assert.equal(model.state.providerCalls, 0);
  });
});

for (const [boundName, invalidBound] of [
  ['retry_not_before', 'retryNotBefore'],
  ['original_deadline', 'originalDeadline']
]) {
  for (const [sampleName, invalidSample] of [
    ['NaN', Number.NaN],
    ['positive infinity', Number.POSITIVE_INFINITY],
    ['negative infinity', Number.NEGATIVE_INFINITY]
  ]) {
    test(`proposal harness rejects ${boundName}=${sampleName} before claiming`, async () => {
      const options = { now: 10, retryNotBefore: 10, originalDeadline: 50 };
      options[invalidBound] = invalidSample;
      const model = createResumeModel(options);
      assert.equal(await model.resume(), 'time-unverifiable');
      assert.equal(model.state.claimCount, 0);
      assert.equal(model.state.claimed, false);
      assert.equal(model.state.evidenceReads, 0);
      assert.equal(model.state.dispatchIntent, false);
      assert.deepEqual(model.state.trace, []);
      assert.equal(model.state.providerCalls, 0);
      assert.equal(model.state.quarantined, false);
    });
  }
}

test('caller-side final time check catches a clock change after the marker helper gate', async () => {
  const model = createResumeModel({
    afterBoundary: {
      dispatchMarker: clock => {
        queueMicrotask(() => queueMicrotask(() => { clock.now = 50; }));
      }
    }
  });
  assert.equal(await model.resume(), 'deadline-expired');
  assert.equal(model.state.dispatchIntent, true);
  assert.equal(model.state.providerCalls, 0);
  assert.equal(model.state.quarantined, true);
});

const asyncBoundaries = ['claim', 'evidence', 'preflight', 'dispatchMarker'];
const timeFaults = [
  ['deadline expiry', 10, clock => { clock.now = 50; }, 'deadline-expired'],
  ['changed epoch', 10, clock => { clock.epoch = 'unexpected-epoch'; }, 'time-unverifiable'],
  ['rollback above retry bound', 20, clock => { clock.now = 15; }, 'time-unverifiable'],
  ['unavailable clock', 10, clock => { clock.available = false; }, 'time-unverifiable'],
  ['non-finite clock sample', 10, clock => { clock.now = Number.NaN; }, 'time-unverifiable']
];

for (const boundary of asyncBoundaries) {
  for (const [faultName, initialNow, mutate, expectedResult] of timeFaults) {
    test(`proposal harness revalidates time after ${boundary}: ${faultName} is ${expectedResult}`, async () => {
      const model = createResumeModel({
        now: initialNow,
        afterBoundary: { [boundary]: clock => mutate(clock) }
      });
      const result = await model.resume();
      assert.equal(result, expectedResult);
      assert.equal(model.state.claimCount, 1);
      assert.equal(model.state.claimed, true);
      assert.equal(model.state.evidenceReads, boundary === 'claim' ? 0 : 1);
      assert.equal(model.state.dispatchIntent, boundary === 'dispatchMarker');
      assert.equal(model.state.trace.includes('dispatch-marker:committed'), boundary === 'dispatchMarker');
      assert.equal(model.state.providerCalls, 0);
      assert.equal(model.state.quarantined, true);
    });
  }
}

test('proposal harness does not take over a held claim or recover an ambiguous claim commit', async t => {
  await t.test('held claim has no automatic takeover', async () => {
    const model = createResumeModel();
    model.state.claimed = true;
    assert.equal(await model.resume(), 'claim-held');
    assert.equal(model.state.claimCount, 0);
    assert.equal(model.state.providerCalls, 0);
  });
  await t.test('concurrent resume contenders have at most one call', async () => {
    const model = createResumeModel();
    const results = await Promise.all([model.resume(), model.resume()]);
    assert.equal(results.filter(result => result === 'resumed').length, 1);
    assert.equal(model.state.claimCount, 1);
    assert.equal(model.state.providerCalls, 1);
  });
  await t.test('ambiguous claim commit is quarantined', async () => {
    const model = createResumeModel({ claimOutcome: 'ambiguous' });
    assert.equal(await model.resume(), 'claim-ambiguous');
    assert.equal(await model.resume(), 'quarantined');
    assert.equal(model.state.evidenceReads, 0);
    assert.equal(model.state.providerCalls, 0);
  });
  await t.test('crash after confirmed claim does not trigger automatic takeover', async () => {
    const model = createResumeModel({ afterBoundary: { claim: () => 'crash' } });
    assert.equal(await model.resume(), 'process-crashed');
    assert.equal(await model.resume(), 'quarantined');
    assert.equal(model.state.claimCount, 1);
    assert.equal(model.state.evidenceReads, 0);
    assert.equal(model.state.providerCalls, 0);
  });
});

test('proposal harness quarantines corrupt evidence and ambiguous dispatch-marker commits', async t => {
  await t.test('invalid evidence', async () => {
    const model = createResumeModel({ evidenceValid: false });
    assert.equal(await model.resume(), 'evidence-invalid');
    assert.equal(model.state.providerCalls, 0);
  });
  await t.test('ambiguous dispatch-marker commit', async () => {
    const model = createResumeModel({ markerOutcome: 'ambiguous' });
    assert.equal(await model.resume(), 'marker-ambiguous');
    assert.equal(model.state.providerCalls, 0);
  });
  await t.test('crash after marker commit is quarantined before the provider effect', async () => {
    const model = createResumeModel({ afterBoundary: { dispatchMarker: () => 'crash' } });
    assert.equal(await model.resume(), 'process-crashed');
    assert.equal(await model.resume(), 'quarantined');
    assert.equal(model.state.dispatchIntent, true);
    assert.equal(model.state.providerCalls, 0);
  });
});

test('proposal harness quarantines uncertain dispatch and never replays it', async () => {
  const model = createResumeModel({ providerOutcome: 'uncertain' });
  assert.equal(await model.resume(), 'dispatch-uncertain');
  assert.equal(await model.resume(), 'quarantined');
  assert.equal(model.state.providerCalls, 1);
});
