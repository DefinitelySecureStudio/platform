# ADR 0003: Provider-neutral synchronous execution boundary

- Status: Accepted by merge
- Date: 2026-08-19
- Decision owner: `@andrewperis`
- Issue: [DefinitelySecureStudio/studio#65](https://github.com/DefinitelySecureStudio/studio/issues/65)

## Context

Platform needs to execute rendered prompts without making the core SDK depend
on a provider library or silently embedding provider-specific behavior. Callers
also need stable provenance and actionable capability mismatch and failure data.

## Decision

Implement the Codex-owned Provider Execution v1 request, descriptor, result,
capability, and error models as a compiled exact-schema boundary plus reviewed
semantic checks. Keep provider-specific code behind an adapter with `describe`
and `execute` methods. The v1 executor performs one synchronous invocation,
materializes declared defaults, passes an abort signal, normalizes output and
errors, and never routes, retries, clamps, repairs, or imports a provider SDK.

Compile the exact 23,168-byte schema at Codex commit
`8cf6297b5180ca201328f45681417c10771e4e1a`, verified by SHA-256
`7c0aaa6698c782e54779a0099cf13f8e163aa9559ae4765df58d3061b22e6334`.

## Consequences

- Core execution remains testable offline with the deterministic mock adapter.
- Exact adapter/provider/model identity, usage, timing, output digest, finish
  reason, and normalized failures cross the boundary without vendor types.
- Capability or extension mismatch fails before a provider call; optional loss
  and emulation remain visible.
- Retry orchestration, provider adapters, streaming, routing, context trust, and
  release execution remain separate future decisions.
- The provisional commit pin must be replaced by the immutable issue #72
  artifact before release.
