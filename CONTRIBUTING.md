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

The repository is language-neutral while its initial architecture is selected.
More specific setup and validation commands will be added here with the first
implementation.

## Pull requests

Pull requests should explain what changed, why it belongs in `platform`, how it
was validated, and whether it changes any cross-repository contract. Do not
silently redefine a contract owned by `codex`; propose that change there first.

All changes are reviewed under the repository's branch protection rules. By
contributing, you agree that your contribution is subject to the repository's
current license status and any contribution terms adopted later.
