# Host-side descriptor preflight

`@definitely-secure-studio/platform/host-execution` provides
`executePromptWithPreflight(request, options)` for hosts that need a bounded
wait while loading an adapter descriptor. This wrapper is outside the Prompt
SDK and does not change Provider Execution v1.

Options require `adapter` and `preflightTimeoutMs`; optional options are
`signal`, `clock`, `observer`, `observerTimeoutMs`, and `provenance`. Unknown
keys and malformed option shapes fail before descriptor acquisition. Invalid
requests raise the SDK's `ExecutionValidationError` before option checks.

Pass `adapter` and a required `preflightTimeoutMs` in the range 1 through
2,147,483,647 milliseconds. That maximum is Node's supported `setTimeout`
delay; larger values are coerced to a one-millisecond delay. There is no default
preflight budget. [Node.js timer documentation](https://nodejs.org/download/release/v22.18.0/docs/api/timers.html#scheduling-timers)

The wrapper validates the original request before synchronously snapshotting it
as canonical JSON, then checks the adapter and invocation options before calling
`describe()`. It acquires one
descriptor for each attempt. After the SDK document validator accepts a request,
the wrapper requires its `kind` to be `execution-request`; other valid Provider
Execution document kinds raise `ExecutionValidationError` before options are
checked or `describe()` is called. Descriptor snapshots must have kind
`provider-adapter-descriptor`; other union members are represented as an invalid
descriptor so the SDK returns its normal `INVALID_ADAPTER_DESCRIPTOR` result.
The wrapper validates and kind-checks the parsed JSON request snapshot again
before options or descriptor acquisition, and validates and kind-checks each
parsed descriptor snapshot before handing it to the SDK. This keeps mutable input
values from changing document kinds during snapshotting. The SDK validates a
valid cached descriptor again and performs compatibility negotiation, execution,
result normalization, and ordinary observer delivery. The facade delegates
`execute()` to the captured original method with the original adapter as its
receiver. Descriptors are never cached across attempts.

The returned host envelope has one of these forms:

```js
{ kind: 'preflight-stop', status: 'cancelled' | 'timed-out', preflight_timing }
{ kind: 'execution', result, preflight_timing }
```

`result` is the unchanged Provider Execution result. `preflight_timing` records
host descriptor-phase timing separately from the SDK result timing. With this
wrapper, SDK timing starts after descriptor handoff; direct `executePrompt()`
timing behavior is unchanged. A host stop
does not create an SDK execution result or observer record, and the host
envelope is in-memory data that this function does not persist.

The preflight deadline begins immediately before descriptor acquisition and is
checked when description settles and immediately before SDK handoff. At a tie,
deadline expiry wins over cancellation, which wins over descriptor settlement.
The wrapper clears its timer and cancellation listener on every exit, consumes
late descriptor rejections, and never invokes adapter `execute()` after a host
preflight stop. The caller's `timeout_ms` is passed through unchanged; it still
controls SDK execution after the descriptor has been handed off.

`describe()` has no cancellation-signal parameter. A timeout or cancellation
bounds the host's wait and prevents provider execution, but cannot force a
non-cooperative descriptor lookup to stop. Late descriptor values are ignored.
Genuine synchronous throws and promise rejections from `describe()` pass through
the facade so the SDK retains its normal `ADAPTER_DESCRIPTION_FAILED`
classification. Invalid or non-JSON descriptor values are represented by an
invalid descriptor sentinel, allowing the SDK to retain its
`INVALID_ADAPTER_DESCRIPTOR` classification without exposing a mutable live
object or surfacing a native clone error.

Host-side pre-abort is checked after request and option validation and before
descriptor acquisition. Once the cached descriptor is handed to the SDK, the
SDK owns any later cancellation and execution-timeout result. This wrapper adds
no retries, routing, scheduling, persistence, or provider-specific behavior.
