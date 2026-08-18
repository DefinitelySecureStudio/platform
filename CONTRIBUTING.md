# Contributing

Thank you for helping build the Definitely Secure Studio production platform.

## Before opening a change

1. Open or reference an issue that explains the intended behavior and boundary.
2. Keep each change focused on one production-platform responsibility.
3. Confirm that the work is an implementation, not a stable cross-repository
   specification or an experiment that belongs in `codex` or `lab`.
4. Use only synthetic or already-public content in examples, tests, fixtures,
   screenshots, logs, and recorded output.

Never submit proprietary lore, unrevealed canon, credentials, private context,
personal data, or confidential communications. If uncertain whether material is
safe for a public repository, do not include it and ask a maintainer privately.

## Development expectations

- Add or update tests for behavior changes.
- Keep documentation current with public interfaces and operational behavior.
- Pin or lock third-party dependencies when the selected ecosystem supports it.
- Do not introduce a new runtime, framework, or service without documenting the
  decision and its operational consequences.
- Keep generated files reproducible and identify their source inputs.
- Run the relevant tests, linters, and security checks before opening a pull
  request.

The runtime requires Node.js 22 or newer. Install the exact reviewed dependency
graph with `npm ci`; do not use an unlocked install in CI. Run `npm test` before
opening a pull request that affects JavaScript, prompt validation/rendering,
examples, fixtures, or generated schema code.

Never edit generated schema-validator code manually. An intentional contract
update must use the documented generator, exact source artifact, digest check,
tests, dependency/provenance update, and review.

## Pull requests

Pull requests should explain what changed, why it belongs in `platform`, how it
was validated, and whether it changes any cross-repository contract. Do not
silently redefine a contract owned by `codex`; propose that change there first.

All changes are reviewed under the repository's branch protection rules.

## Contributions and licensing

By intentionally submitting a contribution for inclusion, you license it under
the [Apache License 2.0](LICENSE), consistent with section 5 of that license.
You represent that you have the right to submit it. Identify third-party code,
dependencies, or assets in the pull request and preserve every required license
and notice; do not submit material with unknown or incompatible terms.
