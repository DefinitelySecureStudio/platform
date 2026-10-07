import {
  comicReferenceAdapterConformance,
  createFixtureReferenceAdapter,
  createIndependentFakeReferenceAdapter
} from '../support/comic-reference-adapter-conformance.js';

comicReferenceAdapterConformance('Codex fixture reference adapter', createFixtureReferenceAdapter);
comicReferenceAdapterConformance('Independent fake reference adapter', createIndependentFakeReferenceAdapter);
