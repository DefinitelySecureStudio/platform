# Tests

Automated tests and fixtures belong here.

All fixtures must be synthetic or derived from already-public material. Never
copy private lore, unpublished canon, credentials, personal data, confidential
communications, or real private context packages into this directory, including
snapshots and failure output.

Prompt SDK tests use Node's built-in test runner and synthetic passing/failing
fixtures. Coverage includes rendering, exact schema conformance, semantic and
security lint rules, duplicate-key parsing, diagnostic redaction, and CLI exit
behavior:

```sh
npm test
```
