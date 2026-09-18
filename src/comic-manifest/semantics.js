import { canonicalJson } from '../prompt-sdk/canonical-json.js';
const need = (condition, code) => { if (!condition) throw code; };
const same = (a, b) => canonicalJson(a) === canonicalJson(b);
const unique = (values, code) => need(new Set(values).size === values.length, code);
const rank = value => ['public', 'internal', 'confidential', 'restricted'].indexOf(value);
// Schema-validated UTC timestamps; lexical comparison preserves sub-millisecond
// precision and RFC3339 leap seconds without reading a clock or rounding dates.
const time = value => value.slice(0, -1).replace(/[t\s]/, 'T').split('.').map((v, i) => i ? v.padEnd(12, '0') : v).concat(value.includes('.') ? [] : ['000000000000']).join('.');
const gateOrder = ['editorial', 'canon-continuity', 'visual-text', 'integrity', 'provenance', 'security-privacy', 'rights', 'accessibility', 'packaging'];
function dimensions(output) {
  need(output.artifact ? output.artifact.media_type.startsWith('image/') === (output.dimensions !== null)
    : output.media_type.startsWith('image/') === (output.dimensions !== null), 'DIMENSIONS');
}
function dependency(d) {
  need(!['main', 'master', 'latest'].includes(d.tag.toLowerCase()), 'FLOATING_REFERENCE');
}
function inputs(input, classification) {
  dependency(input.canon); input.dependencies.forEach(dependency);
  unique(input.prompts.map(x => x.binding_id), 'DUPLICATE_ID');
  unique(input.assets.map(x => x.asset_id), 'DUPLICATE_ID');
  for (const prompt of input.prompts) {
    dependency(prompt.definition);
    if (prompt.context) {
      unique(prompt.context.sections, 'DUPLICATE_ID');
      need(rank(classification) >= rank(prompt.context.classification), 'CLASSIFICATION');
    }
  }
  for (const asset of input.assets) {
    need(rank(classification) >= rank(asset.classification), 'CLASSIFICATION');
    if (asset.reference.kind === 'public') {
      need(asset.classification === 'public', 'CLASSIFICATION'); dependency(asset.reference.dependency);
    }
  }
}
function execution(e, isPublic) {
  dependency(e.tool);
  need(time(e.started_at) <= time(e.finished_at), 'TIME_ORDER');
  unique(e.transformations.map(t => t.step_id), 'DUPLICATE_ID');
  for (const t of e.transformations) {
    if (!isPublic) need(t.input_digests.length > 0 && t.output_digests.length > 0 && !t.private_inputs_withheld && !t.private_outputs_withheld, 'TRANSFORMATION');
    else need((t.input_digests.length > 0 || t.private_inputs_withheld) && (t.output_digests.length > 0 || t.private_outputs_withheld), 'TRANSFORMATION');
  }
  for (const g of e.generation) unique(g.parameters.map(p => p.name), 'DUPLICATE_ID');
}
function production(p) {
  need((p.revision === 1) === (p.previous === null), 'REVISION');
  if (p.previous) need(p.previous.production_id === p.production_id && p.previous.revision === p.revision - 1, 'REVISION');
  inputs(p.inputs, p.classification);
  unique(p.panels.map(x => x.panel_id), 'DUPLICATE_ID');
  unique(p.panels.flatMap(x => x.text.map(t => t.text_id)), 'DUPLICATE_ID');
  const assetIds = new Set(p.inputs.assets.map(x => x.asset_id)), promptIds = new Set(p.inputs.prompts.map(x => x.binding_id));
  for (const panel of p.panels) {
    unique(panel.asset_ids, 'DUPLICATE_ID'); unique(panel.prompt_bindings, 'DUPLICATE_ID');
    need(panel.asset_ids.every(id => assetIds.has(id)) && panel.prompt_bindings.every(id => promptIds.has(id)), 'LOCAL_REFERENCE');
    for (const t of panel.text) need((t.kind === 'caption') === (t.speaker === null), 'SPEAKER');
  }
  unique(p.renditions.map(x => x.rendition_id), 'DUPLICATE_ID');
  need(p.renditions.some(r => r.required), 'REQUIRED_RENDITION');
  p.renditions.forEach(dimensions);
}
function result(r) {
  inputs(r.inputs, r.classification);
  unique(r.outputs.map(x => x.rendition_id), 'DUPLICATE_ID');
  unique(r.gates.map(x => x.gate), 'DUPLICATE_ID');
  r.outputs.forEach(dimensions); execution(r.execution, false);
  need(r.inputs.dependencies.some(d => same(d, r.execution.tool)), 'TOOL_REFERENCE');
}
function release(r) {
  need((r.revision === 1) === (r.previous === null), 'REVISION');
  if (r.previous) need(r.previous.episode_id === r.episode_id && r.previous.revision === r.revision - 1 && r.previous.release_id !== r.release_id, 'REVISION');
  need(r.title !== 'Untitled', 'FINAL_TITLE');
  dependency(r.input_canon); r.dependencies.forEach(dependency);
  unique(r.dependencies.map(d => canonicalJson(d)), 'DUPLICATE_REFERENCE');
  unique(r.outputs.map(x => x.rendition_id), 'DUPLICATE_ID'); r.outputs.forEach(dimensions);
  need(same(r.gates.map(g => g.gate), gateOrder), 'GATE_ORDER');
  unique(r.approvers.map(a => a.decision_id), 'DUPLICATE_ID');
  for (const role of ['publisher', 'canon-editor', ...(r.private_context.influenced ? ['disclosure-reviewer'] : [])]) {
    need(r.approvers.some(a => a.role === role), 'APPROVAL_ROLE');
  }
  for (const a of r.approvers) need(time(a.decided_at) <= time(r.scope.publication_time), 'TIME_ORDER');
  execution(r.execution, true);
  need(r.dependencies.some(d => same(d, r.execution.tool)), 'TOOL_REFERENCE');
  const publicDigests = new Set([r.input_canon.artifact.sha256, ...r.dependencies.map(d => d.artifact.sha256), ...r.outputs.map(o => o.artifact.sha256)]);
  for (const t of r.execution.transformations) need([...t.input_digests, ...t.output_digests].every(d => publicDigests.has(d)), 'PUBLIC_PROVENANCE');
}
function approval(a) {
  need(time(a.decided_at) < time(a.expires_at) && time(a.decided_at) <= time(a.scope.publication_time) && time(a.scope.publication_time) < time(a.expires_at), 'TIME_ORDER');
  need(a.artifact_digests.every((d, i) => i === 0 || a.artifact_digests[i - 1] <= d), 'ARTIFACT_ORDER');
  need(a.role === 'production-reviewer' ? a.artifact_digests.length === 0 : a.artifact_digests.length > 0, 'APPROVAL_ARTIFACTS');
}
const checks = { 'comic-production': production, 'comic-build-result': result, 'comic-public-release': release, 'comic-approval-binding': approval };
/** Only called with schema-valid, bounded, immutable parsed data. */
export function validateLocalSemantics(value) {
  try { checks[value.kind](value); return null; }
  catch (code) { return typeof code === 'string' ? code : 'SEMANTIC_INVALID'; }
}
