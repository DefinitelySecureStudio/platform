import { renderPrompt } from '../prompt-sdk/render.js';

const DEFINITION = Object.freeze({
  spec_version: '1.0.0',
  id: 'prompt.synthetic.offline-comic',
  version: '1.0.0',
  inputs: Object.freeze([
    Object.freeze({ name: 'production_id', type: 'string', required: true, classification: 'internal' }),
    Object.freeze({ name: 'title', type: 'string', required: true, classification: 'internal' })
  ]),
  context_slots: Object.freeze([]),
  template: Object.freeze({
    format: 'studio-messages-v1',
    messages: Object.freeze([
      Object.freeze({ role: 'instruction', parts: Object.freeze([
        Object.freeze({ type: 'text', text: 'Return the fixed transcript from the synthetic offline Comic Manifest fixture.' })
      ]) }),
      Object.freeze({ role: 'user', parts: Object.freeze([
        Object.freeze({ type: 'text', text: 'Production: ' }),
        Object.freeze({ type: 'input', name: 'production_id' }),
        Object.freeze({ type: 'text', text: '\nTitle: ' }),
        Object.freeze({ type: 'input', name: 'title' })
      ]) })
    ])
  })
});

export function renderOfflineComicPrompt(production) {
  return renderPrompt(DEFINITION, {
    inputValues: {
      production_id: production.production_id,
      title: production.title
    }
  });
}
