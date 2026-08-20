# Tests

Automated tests and fixtures belong here.

All fixtures must be synthetic or derived from already-public material. Never
copy private lore, unpublished canon, credentials, personal data, confidential
communications, or real private context packages into this directory, including
snapshots and failure output.

Prompt SDK tests use Node's built-in test runner and synthetic passing/failing
fixtures. Coverage includes rendering, exact schema conformance, semantic and
security lint rules, duplicate-key parsing, diagnostic redaction, and CLI exit
behavior. Provider execution tests cover capability negotiation, identity and
digest provenance, defaults, error normalization, no-retry behavior,
cancellation, timeout, invalid outcomes, and the deterministic mock adapter:

Registry tests use temporary synthetic filesystem roots and cover deterministic
discovery, filters, exact and guarded range/latest resolution, SemVer ordering,
deprecation/retirement, duplicate conflicts, atomic refresh, and symlink escape
prevention.

```sh
npm test
```
