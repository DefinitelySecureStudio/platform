const pins = {
  "context-package": {
    "repository": "DefinitelySecureStudio/codex",
    "contract": "context-package",
    "version": "1.0.0",
    "spec_version": "1.0.0",
    "tag": "contract/context-package/v1.0.0",
    "commit": "62e78b606986988518b9dc502c25ae1cd189684a",
    "artifact_uri": "https://github.com/DefinitelySecureStudio/codex/releases/download/contract%2Fcontext-package%2Fv1.0.0/context-package-v1.0.0.schema.json",
    "media_type": "application/schema+json",
    "schema_sha256": "sha256:d81e88780511c31099b2dd925f31aff26d6ba75e1173e953b98a37298764b617",
    "schema_byte_size": 8390,
    "status": "released"
  },
  "execution-provenance": {
    "repository": "DefinitelySecureStudio/codex",
    "contract": "execution-provenance",
    "version": "1.0.0",
    "spec_version": "1.0.0",
    "tag": "contract/execution-provenance/v1.0.0",
    "commit": "62e78b606986988518b9dc502c25ae1cd189684a",
    "artifact_uri": "https://github.com/DefinitelySecureStudio/codex/releases/download/contract%2Fexecution-provenance%2Fv1.0.0/execution-provenance-v1.0.0.schema.json",
    "media_type": "application/schema+json",
    "schema_sha256": "sha256:d1f897fdd40c8a513f2f3dc9c44728ec124e53a57977a1b11b04e00953020118",
    "schema_byte_size": 13143,
    "status": "released"
  },
  "prompt-definition": {
    "repository": "DefinitelySecureStudio/codex",
    "contract": "prompt-definition",
    "version": "1.0.0",
    "spec_version": "1.0.0",
    "tag": "contract/prompt-definition/v1.0.0",
    "commit": "62e78b606986988518b9dc502c25ae1cd189684a",
    "artifact_uri": "https://github.com/DefinitelySecureStudio/codex/releases/download/contract%2Fprompt-definition%2Fv1.0.0/prompt-definition-v1.0.0.schema.json",
    "media_type": "application/schema+json",
    "schema_sha256": "sha256:6ac345956582d25c2db9c81b85cab9c73b2cbcfc79b8aac7a43d847c07173cb9",
    "schema_byte_size": 18384,
    "status": "released"
  },
  "provider-execution": {
    "repository": "DefinitelySecureStudio/codex",
    "contract": "provider-execution",
    "version": "1.0.0",
    "spec_version": "1.0.0",
    "tag": "contract/provider-execution/v1.0.0",
    "commit": "62e78b606986988518b9dc502c25ae1cd189684a",
    "artifact_uri": "https://github.com/DefinitelySecureStudio/codex/releases/download/contract%2Fprovider-execution%2Fv1.0.0/provider-execution-v1.0.0.schema.json",
    "media_type": "application/schema+json",
    "schema_sha256": "sha256:4366665b89d7633974c4be15cac74f754e722b41031f708ca2f825ead892cb8b",
    "schema_byte_size": 25285,
    "status": "released"
  },
  "structured-output": {
    "repository": "DefinitelySecureStudio/codex",
    "contract": "structured-output",
    "version": "1.0.0",
    "spec_version": "1.0.0",
    "tag": "contract/structured-output/v1.0.0",
    "commit": "62e78b606986988518b9dc502c25ae1cd189684a",
    "artifact_uri": "https://github.com/DefinitelySecureStudio/codex/releases/download/contract%2Fstructured-output%2Fv1.0.0/structured-output-v1.0.0.schema.json",
    "media_type": "application/schema+json",
    "schema_sha256": "sha256:6ea2c5d4804b92bbca386d2b64063d72980ca1d294d23338be6adc057caaeeb2",
    "schema_byte_size": 8427,
    "status": "released"
  }
};
export const RELEASE_CONTRACTS = Object.freeze(Object.fromEntries(Object.entries(pins).map(([name, pin]) => [name, Object.freeze(pin)])));
