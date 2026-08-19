// Generated from DefinitelySecureStudio/codex@8cf6297b5180ca201328f45681417c10771e4e1a
// Source SHA-256: 7c0aaa6698c782e54779a0099cf13f8e163aa9559ae4765df58d3061b22e6334
// Rebuild with scripts/generate-execution-schema-validator.mjs; do not edit manually.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
"use strict";
export const validate = validate20;
export default validate20;
const schema31 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:definitely-secure:contract:provider-execution:1.0.0:provider-execution","title":"Definitely Secure Studio Provider Execution Contract v1.0.0","description":"Provider-neutral adapter descriptors, synchronous execution requests, and normalized execution results.","oneOf":[{"$ref":"#/$defs/adapterDescriptor"},{"$ref":"#/$defs/executionRequest"},{"$ref":"#/$defs/executionResult"}],"$defs":{"semver":{"type":"string","pattern":"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"},"safeId":{"type":"string","pattern":"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},"namespace":{"type":"string","pattern":"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$","maxLength":128},"owner":{"type":"string","pattern":"^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"},"capability":{"type":"string","pattern":"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*$","maxLength":128},"classification":{"enum":["public","internal","confidential","restricted"]},"sha256":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"timestamp":{"type":"string","format":"date-time"},"absoluteUri":{"type":"string","format":"uri","pattern":"^[A-Za-z][A-Za-z0-9+.-]*:"},"artifactReference":{"type":"object","additionalProperties":false,"required":["artifact_uri","media_type","byte_size","sha256"],"properties":{"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},"byte_size":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha256"}}},"outputSchemaReference":{"type":"object","additionalProperties":false,"required":["schema_id","repository","contract","version","tag","commit","artifact_uri","media_type","byte_size","sha256"],"properties":{"schema_id":{"type":"string","minLength":1,"maxLength":500},"repository":{"type":"string","pattern":"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"},"contract":{"type":"string","pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$"},"version":{"$ref":"#/$defs/semver"},"tag":{"type":"string","pattern":"^contract/[a-z0-9]+(?:-[a-z0-9]+)*/v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"},"commit":{"type":"string","pattern":"^[0-9a-f]{40}$"},"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"const":"application/schema+json"},"byte_size":{"type":"integer","minimum":1},"sha256":{"$ref":"#/$defs/sha256"}}},"extension":{"type":"object","additionalProperties":false,"required":["required","fallback","configuration"],"properties":{"required":{"type":"boolean"},"fallback":{"enum":["reject","portable-baseline","omit"]},"configuration":{"type":"object"},"evidence":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/absoluteUri"}}}},"capabilityDescriptor":{"type":"object","additionalProperties":false,"required":["name","implementation"],"properties":{"name":{"$ref":"#/$defs/capability"},"implementation":{"enum":["native","emulated"]},"limits":{"type":"object","additionalProperties":false,"properties":{"max_input_bytes":{"type":"integer","minimum":1},"max_output_tokens":{"type":"integer","minimum":1},"accepted_input_media_types":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"}},"output_media_types":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"}}}}}},"numericParameterSupport":{"type":"object","additionalProperties":false,"required":["minimum","maximum"],"properties":{"minimum":{"type":"number"},"maximum":{"type":"number"},"default":{"type":"number"}}},"integerParameterSupport":{"type":"object","additionalProperties":false,"required":["minimum","maximum"],"properties":{"minimum":{"type":"integer"},"maximum":{"type":"integer"},"default":{"type":"integer"}}},"adapterDescriptor":{"type":"object","additionalProperties":false,"required":["spec_version","kind","adapter","provider","model","execution_modes","capabilities","parameters","supported_extensions"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"provider-adapter-descriptor"},"adapter":{"type":"object","additionalProperties":false,"required":["id","version"],"properties":{"id":{"$ref":"#/$defs/namespace"},"version":{"$ref":"#/$defs/semver"}}},"provider":{"type":"object","additionalProperties":false,"required":["id"],"properties":{"id":{"$ref":"#/$defs/safeId"},"display_name":{"type":"string","minLength":1,"maxLength":120}}},"model":{"type":"object","additionalProperties":false,"required":["id"],"properties":{"id":{"$ref":"#/$defs/safeId"},"display_name":{"type":"string","minLength":1,"maxLength":120},"revision":{"type":"string","minLength":1,"maxLength":128}}},"execution_modes":{"type":"array","minItems":1,"uniqueItems":true,"contains":{"const":"synchronous"},"items":{"enum":["synchronous","streaming","asynchronous"]}},"capabilities":{"type":"array","minItems":1,"contains":{"type":"object","properties":{"name":{"const":"text-generation"}},"required":["name"]},"items":{"$ref":"#/$defs/capabilityDescriptor"}},"parameters":{"type":"object","additionalProperties":false,"properties":{"max_output_tokens":{"$ref":"#/$defs/integerParameterSupport"},"temperature":{"$ref":"#/$defs/numericParameterSupport"},"top_p":{"$ref":"#/$defs/numericParameterSupport"},"stop_sequences":{"type":"object","additionalProperties":false,"required":["max_items","max_item_length"],"properties":{"max_items":{"type":"integer","minimum":1},"max_item_length":{"type":"integer","minimum":1}}},"seed":{"$ref":"#/$defs/integerParameterSupport"}}},"supported_extensions":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/namespace"}}}},"renderedPrompt":{"type":"object","additionalProperties":false,"required":["format","definition","renderer","classification","messages","inputs","contexts","byte_size","sha256"],"properties":{"format":{"const":"studio-rendered-messages-v1"},"definition":{"type":"object","additionalProperties":false,"required":["id","version","spec_version"],"properties":{"id":{"type":"string","pattern":"^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"},"version":{"$ref":"#/$defs/semver"},"spec_version":{"const":"1.0.0"}}},"renderer":{"type":"object","additionalProperties":false,"required":["name","version","algorithm","canonical_json","contract"],"properties":{"name":{"type":"string","minLength":1,"maxLength":200},"version":{"$ref":"#/$defs/semver"},"algorithm":{"type":"string","minLength":1,"maxLength":100},"canonical_json":{"type":"string","minLength":1,"maxLength":100},"contract":{"type":"object","additionalProperties":false,"required":["repository","commit","status"],"properties":{"repository":{"type":"string","pattern":"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"},"commit":{"type":"string","pattern":"^[0-9a-f]{40}$"},"status":{"enum":["provisional-unreleased","released"]}}}}},"classification":{"$ref":"#/$defs/classification"},"messages":{"type":"array","minItems":1,"items":{"type":"object","additionalProperties":false,"required":["role","content"],"properties":{"role":{"enum":["instruction","user","assistant-example"]},"content":{"type":"string"}}}},"inputs":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["name","source","classification"],"properties":{"name":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,63}$"},"source":{"enum":["provided","default"]},"classification":{"$ref":"#/$defs/classification"}}}},"contexts":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["slot","classification","media_type","byte_size"],"properties":{"slot":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,63}$"},"classification":{"$ref":"#/$defs/classification"},"media_type":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},"byte_size":{"type":"integer","minimum":0},"reference":{"type":"string","minLength":1,"maxLength":500}}}},"byte_size":{"type":"integer","minimum":1},"sha256":{"$ref":"#/$defs/sha256"}}},"portableParameters":{"type":"object","additionalProperties":false,"properties":{"max_output_tokens":{"type":"integer","minimum":1},"temperature":{"type":"number","minimum":0,"maximum":2},"top_p":{"type":"number","exclusiveMinimum":0,"maximum":1},"stop_sequences":{"type":"array","minItems":1,"maxItems":8,"uniqueItems":true,"items":{"type":"string","minLength":1,"maxLength":256}},"seed":{"type":"integer","minimum":0,"maximum":9007199254740991}}},"expectedOutput":{"type":"object","additionalProperties":false,"required":["kind","media_type","validation"],"properties":{"kind":{"enum":["text","json"]},"media_type":{"enum":["text/plain","application/json"]},"validation":{"enum":["none","json-syntax","json-schema"]},"schema":{"$ref":"#/$defs/outputSchemaReference"}},"allOf":[{"if":{"properties":{"kind":{"const":"text"}},"required":["kind"]},"then":{"properties":{"media_type":{"const":"text/plain"},"validation":{"const":"none"}},"not":{"required":["schema"]}},"else":{"properties":{"media_type":{"const":"application/json"},"validation":{"enum":["json-syntax","json-schema"]}}}},{"if":{"properties":{"validation":{"const":"json-schema"}},"required":["validation"]},"then":{"required":["schema"]},"else":{"not":{"required":["schema"]}}}]},"capabilityRequirements":{"type":"object","additionalProperties":false,"required":["required","optional"],"properties":{"required":{"type":"array","minItems":1,"uniqueItems":true,"contains":{"const":"text-generation"},"items":{"$ref":"#/$defs/capability"}},"optional":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/capability"}}}},"executionRequest":{"type":"object","additionalProperties":false,"required":["spec_version","kind","execution_id","idempotency_key","rendered_prompt","target","capabilities","parameters","expected_output","delegation","observability"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"execution-request"},"execution_id":{"$ref":"#/$defs/safeId"},"correlation_id":{"$ref":"#/$defs/safeId"},"idempotency_key":{"$ref":"#/$defs/safeId"},"rendered_prompt":{"$ref":"#/$defs/renderedPrompt"},"target":{"type":"object","additionalProperties":false,"required":["adapter_id","provider_id","model_id"],"properties":{"adapter_id":{"$ref":"#/$defs/namespace"},"provider_id":{"$ref":"#/$defs/safeId"},"model_id":{"$ref":"#/$defs/safeId"}}},"capabilities":{"$ref":"#/$defs/capabilityRequirements"},"parameters":{"$ref":"#/$defs/portableParameters"},"expected_output":{"$ref":"#/$defs/expectedOutput"},"timeout_ms":{"type":"integer","minimum":1,"maximum":3600000},"cancellation_id":{"$ref":"#/$defs/safeId"},"delegation":{"type":"object","additionalProperties":false,"required":["caller_id","human_owner","purpose","authority_reference"],"properties":{"caller_id":{"$ref":"#/$defs/safeId"},"human_owner":{"$ref":"#/$defs/owner"},"purpose":{"type":"string","minLength":1,"maxLength":1000},"authority_reference":{"$ref":"#/$defs/absoluteUri"}}},"observability":{"type":"object","additionalProperties":false,"required":["retention","capture_prompt","capture_output"],"properties":{"retention":{"enum":["none","metadata-only","restricted-content"]},"capture_prompt":{"type":"boolean"},"capture_output":{"type":"boolean"}}},"extensions":{"type":"object","propertyNames":{"$ref":"#/$defs/namespace"},"additionalProperties":{"$ref":"#/$defs/extension"}}}},"normalizedUsage":{"type":"object","additionalProperties":false,"required":["provider_reported"],"properties":{"provider_reported":{"type":"boolean"},"input_tokens":{"type":"integer","minimum":0},"output_tokens":{"type":"integer","minimum":0},"total_tokens":{"type":"integer","minimum":0}}},"resultWarning":{"type":"object","additionalProperties":false,"required":["code","message"],"properties":{"code":{"type":"string","pattern":"^[A-Z][A-Z0-9_]{0,127}$"},"message":{"type":"string","minLength":1,"maxLength":1000},"details":{"type":"object"}}},"executionError":{"type":"object","additionalProperties":false,"required":["category","code","message","retryable","stage"],"properties":{"category":{"enum":["invalid-request","authentication","authorization","not-found","capability-mismatch","rate-limit","quota","content-policy","timeout","cancelled","provider-unavailable","transport","invalid-provider-response","output-validation","internal"]},"code":{"type":"string","pattern":"^[A-Z][A-Z0-9_]{0,127}$"},"message":{"type":"string","minLength":1,"maxLength":1000},"retryable":{"type":"boolean"},"stage":{"enum":["preflight","adapter","transport","provider","normalization","output-validation","provenance"]},"retry_after_ms":{"type":"integer","minimum":1,"maximum":86400000},"provider":{"type":"object","additionalProperties":false,"properties":{"code":{"type":"string","minLength":1,"maxLength":200},"http_status":{"type":"integer","minimum":100,"maximum":599},"request_id":{"type":"string","minLength":1,"maxLength":200},"details_reference":{"$ref":"#/$defs/absoluteUri"}}}}},"executionOutput":{"type":"object","additionalProperties":false,"required":["kind","media_type","delivery","classification","byte_size","sha256"],"properties":{"kind":{"enum":["text","json"]},"media_type":{"enum":["text/plain","application/json"]},"delivery":{"enum":["inline","reference"]},"classification":{"$ref":"#/$defs/classification"},"byte_size":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha256"},"content":{"type":"string"},"reference":{"$ref":"#/$defs/artifactReference"}},"allOf":[{"if":{"properties":{"kind":{"const":"text"}},"required":["kind"]},"then":{"properties":{"media_type":{"const":"text/plain"}}},"else":{"properties":{"media_type":{"const":"application/json"}}}},{"if":{"properties":{"delivery":{"const":"inline"}},"required":["delivery"]},"then":{"required":["content"],"not":{"required":["reference"]}},"else":{"required":["reference"],"not":{"required":["content"]}}}]},"executionResult":{"type":"object","additionalProperties":false,"required":["spec_version","kind","execution_id","status","identity","timing","finish_reason","warnings"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"execution-result"},"execution_id":{"$ref":"#/$defs/safeId"},"correlation_id":{"$ref":"#/$defs/safeId"},"provider_request_id":{"type":"string","minLength":1,"maxLength":200},"status":{"enum":["succeeded","failed","cancelled","timed-out"]},"identity":{"type":"object","additionalProperties":false,"required":["adapter_id","adapter_version","provider_id","model_id"],"properties":{"adapter_id":{"$ref":"#/$defs/namespace"},"adapter_version":{"$ref":"#/$defs/semver"},"provider_id":{"$ref":"#/$defs/safeId"},"model_id":{"$ref":"#/$defs/safeId"},"model_revision":{"type":"string","minLength":1,"maxLength":128}}},"timing":{"type":"object","additionalProperties":false,"required":["started_at","completed_at","duration_ms"],"properties":{"started_at":{"$ref":"#/$defs/timestamp"},"completed_at":{"$ref":"#/$defs/timestamp"},"duration_ms":{"type":"integer","minimum":0}}},"finish_reason":{"enum":["stop","length","content-filter","cancelled","error","unknown"]},"usage":{"$ref":"#/$defs/normalizedUsage"},"warnings":{"type":"array","items":{"$ref":"#/$defs/resultWarning"}},"output":{"$ref":"#/$defs/executionOutput"},"error":{"$ref":"#/$defs/executionError"}},"allOf":[{"if":{"properties":{"status":{"const":"succeeded"}},"required":["status"]},"then":{"required":["output"],"not":{"required":["error"]},"properties":{"finish_reason":{"enum":["stop","length","content-filter","unknown"]}}},"else":{"required":["error"],"not":{"required":["output"]}}},{"if":{"properties":{"status":{"const":"failed"}},"required":["status"]},"then":{"properties":{"finish_reason":{"const":"error"}}}},{"if":{"properties":{"status":{"const":"cancelled"}},"required":["status"]},"then":{"properties":{"finish_reason":{"const":"cancelled"},"error":{"properties":{"category":{"const":"cancelled"}}}}}},{"if":{"properties":{"status":{"const":"timed-out"}},"required":["status"]},"then":{"properties":{"finish_reason":{"const":"error"},"error":{"properties":{"category":{"const":"timeout"}}}}}}]}}};
const schema32 = {"type":"object","additionalProperties":false,"required":["spec_version","kind","adapter","provider","model","execution_modes","capabilities","parameters","supported_extensions"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"provider-adapter-descriptor"},"adapter":{"type":"object","additionalProperties":false,"required":["id","version"],"properties":{"id":{"$ref":"#/$defs/namespace"},"version":{"$ref":"#/$defs/semver"}}},"provider":{"type":"object","additionalProperties":false,"required":["id"],"properties":{"id":{"$ref":"#/$defs/safeId"},"display_name":{"type":"string","minLength":1,"maxLength":120}}},"model":{"type":"object","additionalProperties":false,"required":["id"],"properties":{"id":{"$ref":"#/$defs/safeId"},"display_name":{"type":"string","minLength":1,"maxLength":120},"revision":{"type":"string","minLength":1,"maxLength":128}}},"execution_modes":{"type":"array","minItems":1,"uniqueItems":true,"contains":{"const":"synchronous"},"items":{"enum":["synchronous","streaming","asynchronous"]}},"capabilities":{"type":"array","minItems":1,"contains":{"type":"object","properties":{"name":{"const":"text-generation"}},"required":["name"]},"items":{"$ref":"#/$defs/capabilityDescriptor"}},"parameters":{"type":"object","additionalProperties":false,"properties":{"max_output_tokens":{"$ref":"#/$defs/integerParameterSupport"},"temperature":{"$ref":"#/$defs/numericParameterSupport"},"top_p":{"$ref":"#/$defs/numericParameterSupport"},"stop_sequences":{"type":"object","additionalProperties":false,"required":["max_items","max_item_length"],"properties":{"max_items":{"type":"integer","minimum":1},"max_item_length":{"type":"integer","minimum":1}}},"seed":{"$ref":"#/$defs/integerParameterSupport"}}},"supported_extensions":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/namespace"}}}};
const schema33 = {"type":"string","pattern":"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$","maxLength":128};
const schema34 = {"type":"string","pattern":"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"};
const schema35 = {"type":"string","pattern":"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"};
const schema39 = {"type":"object","additionalProperties":false,"required":["minimum","maximum"],"properties":{"minimum":{"type":"integer"},"maximum":{"type":"integer"},"default":{"type":"integer"}}};
const schema40 = {"type":"object","additionalProperties":false,"required":["minimum","maximum"],"properties":{"minimum":{"type":"number"},"maximum":{"type":"number"},"default":{"type":"number"}}};
const func1 = Object.prototype.hasOwnProperty;
const func2 = require("ajv/dist/runtime/ucs2length").default;
const func0 = require("ajv/dist/runtime/equal").default;
const pattern4 = new RegExp("^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$", "u");
const pattern5 = new RegExp("^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$", "u");
const pattern6 = new RegExp("^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$", "u");
const schema37 = {"type":"object","additionalProperties":false,"required":["name","implementation"],"properties":{"name":{"$ref":"#/$defs/capability"},"implementation":{"enum":["native","emulated"]},"limits":{"type":"object","additionalProperties":false,"properties":{"max_input_bytes":{"type":"integer","minimum":1},"max_output_tokens":{"type":"integer","minimum":1},"accepted_input_media_types":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"}},"output_media_types":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"}}}}}};
const schema38 = {"type":"string","pattern":"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*$","maxLength":128};
const pattern8 = new RegExp("^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*$", "u");
const pattern9 = new RegExp("^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$", "u");

function validate22(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate22.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.name === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.implementation === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "implementation"},message:"must have required property '"+"implementation"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "name") || (key0 === "implementation")) || (key0 === "limits"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.name !== undefined){
let data0 = data.name;
if(typeof data0 === "string"){
if(func2(data0) > 128){
const err3 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/capability/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(!pattern8.test(data0)){
const err4 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/capability/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*$"},message:"must match pattern \""+"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*$"+"\""};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
else {
const err5 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/capability/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.implementation !== undefined){
let data1 = data.implementation;
if(!((data1 === "native") || (data1 === "emulated"))){
const err6 = {instancePath:instancePath+"/implementation",schemaPath:"#/properties/implementation/enum",keyword:"enum",params:{allowedValues: schema37.properties.implementation.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.limits !== undefined){
let data2 = data.limits;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
for(const key1 in data2){
if(!((((key1 === "max_input_bytes") || (key1 === "max_output_tokens")) || (key1 === "accepted_input_media_types")) || (key1 === "output_media_types"))){
const err7 = {instancePath:instancePath+"/limits",schemaPath:"#/properties/limits/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data2.max_input_bytes !== undefined){
let data3 = data2.max_input_bytes;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err8 = {instancePath:instancePath+"/limits/max_input_bytes",schemaPath:"#/properties/limits/properties/max_input_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 < 1 || isNaN(data3)){
const err9 = {instancePath:instancePath+"/limits/max_input_bytes",schemaPath:"#/properties/limits/properties/max_input_bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
if(data2.max_output_tokens !== undefined){
let data4 = data2.max_output_tokens;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err10 = {instancePath:instancePath+"/limits/max_output_tokens",schemaPath:"#/properties/limits/properties/max_output_tokens/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 < 1 || isNaN(data4)){
const err11 = {instancePath:instancePath+"/limits/max_output_tokens",schemaPath:"#/properties/limits/properties/max_output_tokens/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
if(data2.accepted_input_media_types !== undefined){
let data5 = data2.accepted_input_media_types;
if(Array.isArray(data5)){
if(data5.length < 1){
const err12 = {instancePath:instancePath+"/limits/accepted_input_media_types",schemaPath:"#/properties/limits/properties/accepted_input_media_types/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
let data6 = data5[i0];
if(typeof data6 === "string"){
if(!pattern9.test(data6)){
const err13 = {instancePath:instancePath+"/limits/accepted_input_media_types/" + i0,schemaPath:"#/properties/limits/properties/accepted_input_media_types/items/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},message:"must match pattern \""+"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
else {
const err14 = {instancePath:instancePath+"/limits/accepted_input_media_types/" + i0,schemaPath:"#/properties/limits/properties/accepted_input_media_types/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
let i1 = data5.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data5[i1];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err15 = {instancePath:instancePath+"/limits/accepted_input_media_types",schemaPath:"#/properties/limits/properties/accepted_input_media_types/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err16 = {instancePath:instancePath+"/limits/accepted_input_media_types",schemaPath:"#/properties/limits/properties/accepted_input_media_types/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data2.output_media_types !== undefined){
let data7 = data2.output_media_types;
if(Array.isArray(data7)){
if(data7.length < 1){
const err17 = {instancePath:instancePath+"/limits/output_media_types",schemaPath:"#/properties/limits/properties/output_media_types/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
const len1 = data7.length;
for(let i2=0; i2<len1; i2++){
let data8 = data7[i2];
if(typeof data8 === "string"){
if(!pattern9.test(data8)){
const err18 = {instancePath:instancePath+"/limits/output_media_types/" + i2,schemaPath:"#/properties/limits/properties/output_media_types/items/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},message:"must match pattern \""+"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
else {
const err19 = {instancePath:instancePath+"/limits/output_media_types/" + i2,schemaPath:"#/properties/limits/properties/output_media_types/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
let i3 = data7.length;
let j1;
if(i3 > 1){
const indices1 = {};
for(;i3--;){
let item1 = data7[i3];
if(typeof item1 !== "string"){
continue;
}
if(typeof indices1[item1] == "number"){
j1 = indices1[item1];
const err20 = {instancePath:instancePath+"/limits/output_media_types",schemaPath:"#/properties/limits/properties/output_media_types/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
break;
}
indices1[item1] = i3;
}
}
}
else {
const err21 = {instancePath:instancePath+"/limits/output_media_types",schemaPath:"#/properties/limits/properties/output_media_types/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
else {
const err22 = {instancePath:instancePath+"/limits",schemaPath:"#/properties/limits/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
}
else {
const err23 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate21(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate21.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.spec_version === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "spec_version"},message:"must have required property '"+"spec_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.kind === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.adapter === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "adapter"},message:"must have required property '"+"adapter"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.provider === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.model === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "model"},message:"must have required property '"+"model"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.execution_modes === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "execution_modes"},message:"must have required property '"+"execution_modes"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.capabilities === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capabilities"},message:"must have required property '"+"capabilities"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.parameters === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parameters"},message:"must have required property '"+"parameters"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.supported_extensions === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "supported_extensions"},message:"must have required property '"+"supported_extensions"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema32.properties, key0))){
const err9 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.spec_version !== undefined){
if("1.0.0" !== data.spec_version){
const err10 = {instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.kind !== undefined){
if("provider-adapter-descriptor" !== data.kind){
const err11 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "provider-adapter-descriptor"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.adapter !== undefined){
let data2 = data.adapter;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.id === undefined){
const err12 = {instancePath:instancePath+"/adapter",schemaPath:"#/properties/adapter/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data2.version === undefined){
const err13 = {instancePath:instancePath+"/adapter",schemaPath:"#/properties/adapter/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
for(const key1 in data2){
if(!((key1 === "id") || (key1 === "version"))){
const err14 = {instancePath:instancePath+"/adapter",schemaPath:"#/properties/adapter/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data2.id !== undefined){
let data3 = data2.id;
if(typeof data3 === "string"){
if(func2(data3) > 128){
const err15 = {instancePath:instancePath+"/adapter/id",schemaPath:"#/$defs/namespace/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(!pattern4.test(data3)){
const err16 = {instancePath:instancePath+"/adapter/id",schemaPath:"#/$defs/namespace/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"},message:"must match pattern \""+"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
else {
const err17 = {instancePath:instancePath+"/adapter/id",schemaPath:"#/$defs/namespace/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data2.version !== undefined){
let data4 = data2.version;
if(typeof data4 === "string"){
if(!pattern5.test(data4)){
const err18 = {instancePath:instancePath+"/adapter/version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
else {
const err19 = {instancePath:instancePath+"/adapter/version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
else {
const err20 = {instancePath:instancePath+"/adapter",schemaPath:"#/properties/adapter/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.provider !== undefined){
let data5 = data.provider;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
if(data5.id === undefined){
const err21 = {instancePath:instancePath+"/provider",schemaPath:"#/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
for(const key2 in data5){
if(!((key2 === "id") || (key2 === "display_name"))){
const err22 = {instancePath:instancePath+"/provider",schemaPath:"#/properties/provider/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data5.id !== undefined){
let data6 = data5.id;
if(typeof data6 === "string"){
if(!pattern6.test(data6)){
const err23 = {instancePath:instancePath+"/provider/id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
else {
const err24 = {instancePath:instancePath+"/provider/id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data5.display_name !== undefined){
let data7 = data5.display_name;
if(typeof data7 === "string"){
if(func2(data7) > 120){
const err25 = {instancePath:instancePath+"/provider/display_name",schemaPath:"#/properties/provider/properties/display_name/maxLength",keyword:"maxLength",params:{limit: 120},message:"must NOT have more than 120 characters"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(func2(data7) < 1){
const err26 = {instancePath:instancePath+"/provider/display_name",schemaPath:"#/properties/provider/properties/display_name/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
else {
const err27 = {instancePath:instancePath+"/provider/display_name",schemaPath:"#/properties/provider/properties/display_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
}
else {
const err28 = {instancePath:instancePath+"/provider",schemaPath:"#/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.model !== undefined){
let data8 = data.model;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.id === undefined){
const err29 = {instancePath:instancePath+"/model",schemaPath:"#/properties/model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
for(const key3 in data8){
if(!(((key3 === "id") || (key3 === "display_name")) || (key3 === "revision"))){
const err30 = {instancePath:instancePath+"/model",schemaPath:"#/properties/model/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data8.id !== undefined){
let data9 = data8.id;
if(typeof data9 === "string"){
if(!pattern6.test(data9)){
const err31 = {instancePath:instancePath+"/model/id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
else {
const err32 = {instancePath:instancePath+"/model/id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data8.display_name !== undefined){
let data10 = data8.display_name;
if(typeof data10 === "string"){
if(func2(data10) > 120){
const err33 = {instancePath:instancePath+"/model/display_name",schemaPath:"#/properties/model/properties/display_name/maxLength",keyword:"maxLength",params:{limit: 120},message:"must NOT have more than 120 characters"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(func2(data10) < 1){
const err34 = {instancePath:instancePath+"/model/display_name",schemaPath:"#/properties/model/properties/display_name/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
else {
const err35 = {instancePath:instancePath+"/model/display_name",schemaPath:"#/properties/model/properties/display_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data8.revision !== undefined){
let data11 = data8.revision;
if(typeof data11 === "string"){
if(func2(data11) > 128){
const err36 = {instancePath:instancePath+"/model/revision",schemaPath:"#/properties/model/properties/revision/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(func2(data11) < 1){
const err37 = {instancePath:instancePath+"/model/revision",schemaPath:"#/properties/model/properties/revision/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
else {
const err38 = {instancePath:instancePath+"/model/revision",schemaPath:"#/properties/model/properties/revision/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
}
else {
const err39 = {instancePath:instancePath+"/model",schemaPath:"#/properties/model/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data.execution_modes !== undefined){
let data12 = data.execution_modes;
if(Array.isArray(data12)){
if(data12.length < 1){
const err40 = {instancePath:instancePath+"/execution_modes",schemaPath:"#/properties/execution_modes/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
const len0 = data12.length;
for(let i0=0; i0<len0; i0++){
let data13 = data12[i0];
if(!(((data13 === "synchronous") || (data13 === "streaming")) || (data13 === "asynchronous"))){
const err41 = {instancePath:instancePath+"/execution_modes/" + i0,schemaPath:"#/properties/execution_modes/items/enum",keyword:"enum",params:{allowedValues: schema32.properties.execution_modes.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
const _errs34 = errors;
const len1 = data12.length;
for(let i1=0; i1<len1; i1++){
const _errs35 = errors;
if("synchronous" !== data12[i1]){
const err42 = {instancePath:instancePath+"/execution_modes/" + i1,schemaPath:"#/properties/execution_modes/contains/const",keyword:"const",params:{allowedValue: "synchronous"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
var valid10 = _errs35 === errors;
if(valid10){
break;
}
}
if(!valid10){
const err43 = {instancePath:instancePath+"/execution_modes",schemaPath:"#/properties/execution_modes/contains",keyword:"contains",params:{minContains: 1},message:"must contain at least 1 valid item(s)"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
else {
errors = _errs34;
if(vErrors !== null){
if(_errs34){
vErrors.length = _errs34;
}
else {
vErrors = null;
}
}
}
let i2 = data12.length;
let j0;
if(i2 > 1){
outer0:
for(;i2--;){
for(j0 = i2; j0--;){
if(func0(data12[i2], data12[j0])){
const err44 = {instancePath:instancePath+"/execution_modes",schemaPath:"#/properties/execution_modes/uniqueItems",keyword:"uniqueItems",params:{i: i2, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i2+" are identical)"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err45 = {instancePath:instancePath+"/execution_modes",schemaPath:"#/properties/execution_modes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.capabilities !== undefined){
let data15 = data.capabilities;
if(Array.isArray(data15)){
if(data15.length < 1){
const err46 = {instancePath:instancePath+"/capabilities",schemaPath:"#/properties/capabilities/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
const len2 = data15.length;
for(let i3=0; i3<len2; i3++){
if(!(validate22(data15[i3], {instancePath:instancePath+"/capabilities/" + i3,parentData:data15,parentDataProperty:i3,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
errors = vErrors.length;
}
}
const _errs39 = errors;
const len3 = data15.length;
for(let i4=0; i4<len3; i4++){
let data17 = data15[i4];
const _errs40 = errors;
if(data17 && typeof data17 == "object" && !Array.isArray(data17)){
if(data17.name === undefined){
const err47 = {instancePath:instancePath+"/capabilities/" + i4,schemaPath:"#/properties/capabilities/contains/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data17.name !== undefined){
if("text-generation" !== data17.name){
const err48 = {instancePath:instancePath+"/capabilities/" + i4+"/name",schemaPath:"#/properties/capabilities/contains/properties/name/const",keyword:"const",params:{allowedValue: "text-generation"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
}
else {
const err49 = {instancePath:instancePath+"/capabilities/" + i4,schemaPath:"#/properties/capabilities/contains/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
var valid14 = _errs40 === errors;
if(valid14){
break;
}
}
if(!valid14){
const err50 = {instancePath:instancePath+"/capabilities",schemaPath:"#/properties/capabilities/contains",keyword:"contains",params:{minContains: 1},message:"must contain at least 1 valid item(s)"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
else {
errors = _errs39;
if(vErrors !== null){
if(_errs39){
vErrors.length = _errs39;
}
else {
vErrors = null;
}
}
}
}
else {
const err51 = {instancePath:instancePath+"/capabilities",schemaPath:"#/properties/capabilities/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data.parameters !== undefined){
let data19 = data.parameters;
if(data19 && typeof data19 == "object" && !Array.isArray(data19)){
for(const key4 in data19){
if(!(((((key4 === "max_output_tokens") || (key4 === "temperature")) || (key4 === "top_p")) || (key4 === "stop_sequences")) || (key4 === "seed"))){
const err52 = {instancePath:instancePath+"/parameters",schemaPath:"#/properties/parameters/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data19.max_output_tokens !== undefined){
let data20 = data19.max_output_tokens;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.minimum === undefined){
const err53 = {instancePath:instancePath+"/parameters/max_output_tokens",schemaPath:"#/$defs/integerParameterSupport/required",keyword:"required",params:{missingProperty: "minimum"},message:"must have required property '"+"minimum"+"'"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(data20.maximum === undefined){
const err54 = {instancePath:instancePath+"/parameters/max_output_tokens",schemaPath:"#/$defs/integerParameterSupport/required",keyword:"required",params:{missingProperty: "maximum"},message:"must have required property '"+"maximum"+"'"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
for(const key5 in data20){
if(!(((key5 === "minimum") || (key5 === "maximum")) || (key5 === "default"))){
const err55 = {instancePath:instancePath+"/parameters/max_output_tokens",schemaPath:"#/$defs/integerParameterSupport/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data20.minimum !== undefined){
let data21 = data20.minimum;
if(!(((typeof data21 == "number") && (!(data21 % 1) && !isNaN(data21))) && (isFinite(data21)))){
const err56 = {instancePath:instancePath+"/parameters/max_output_tokens/minimum",schemaPath:"#/$defs/integerParameterSupport/properties/minimum/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data20.maximum !== undefined){
let data22 = data20.maximum;
if(!(((typeof data22 == "number") && (!(data22 % 1) && !isNaN(data22))) && (isFinite(data22)))){
const err57 = {instancePath:instancePath+"/parameters/max_output_tokens/maximum",schemaPath:"#/$defs/integerParameterSupport/properties/maximum/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
if(data20.default !== undefined){
let data23 = data20.default;
if(!(((typeof data23 == "number") && (!(data23 % 1) && !isNaN(data23))) && (isFinite(data23)))){
const err58 = {instancePath:instancePath+"/parameters/max_output_tokens/default",schemaPath:"#/$defs/integerParameterSupport/properties/default/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
}
else {
const err59 = {instancePath:instancePath+"/parameters/max_output_tokens",schemaPath:"#/$defs/integerParameterSupport/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(data19.temperature !== undefined){
let data24 = data19.temperature;
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
if(data24.minimum === undefined){
const err60 = {instancePath:instancePath+"/parameters/temperature",schemaPath:"#/$defs/numericParameterSupport/required",keyword:"required",params:{missingProperty: "minimum"},message:"must have required property '"+"minimum"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data24.maximum === undefined){
const err61 = {instancePath:instancePath+"/parameters/temperature",schemaPath:"#/$defs/numericParameterSupport/required",keyword:"required",params:{missingProperty: "maximum"},message:"must have required property '"+"maximum"+"'"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
for(const key6 in data24){
if(!(((key6 === "minimum") || (key6 === "maximum")) || (key6 === "default"))){
const err62 = {instancePath:instancePath+"/parameters/temperature",schemaPath:"#/$defs/numericParameterSupport/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
if(data24.minimum !== undefined){
let data25 = data24.minimum;
if(!((typeof data25 == "number") && (isFinite(data25)))){
const err63 = {instancePath:instancePath+"/parameters/temperature/minimum",schemaPath:"#/$defs/numericParameterSupport/properties/minimum/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data24.maximum !== undefined){
let data26 = data24.maximum;
if(!((typeof data26 == "number") && (isFinite(data26)))){
const err64 = {instancePath:instancePath+"/parameters/temperature/maximum",schemaPath:"#/$defs/numericParameterSupport/properties/maximum/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(data24.default !== undefined){
let data27 = data24.default;
if(!((typeof data27 == "number") && (isFinite(data27)))){
const err65 = {instancePath:instancePath+"/parameters/temperature/default",schemaPath:"#/$defs/numericParameterSupport/properties/default/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
}
else {
const err66 = {instancePath:instancePath+"/parameters/temperature",schemaPath:"#/$defs/numericParameterSupport/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data19.top_p !== undefined){
let data28 = data19.top_p;
if(data28 && typeof data28 == "object" && !Array.isArray(data28)){
if(data28.minimum === undefined){
const err67 = {instancePath:instancePath+"/parameters/top_p",schemaPath:"#/$defs/numericParameterSupport/required",keyword:"required",params:{missingProperty: "minimum"},message:"must have required property '"+"minimum"+"'"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data28.maximum === undefined){
const err68 = {instancePath:instancePath+"/parameters/top_p",schemaPath:"#/$defs/numericParameterSupport/required",keyword:"required",params:{missingProperty: "maximum"},message:"must have required property '"+"maximum"+"'"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
for(const key7 in data28){
if(!(((key7 === "minimum") || (key7 === "maximum")) || (key7 === "default"))){
const err69 = {instancePath:instancePath+"/parameters/top_p",schemaPath:"#/$defs/numericParameterSupport/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(data28.minimum !== undefined){
let data29 = data28.minimum;
if(!((typeof data29 == "number") && (isFinite(data29)))){
const err70 = {instancePath:instancePath+"/parameters/top_p/minimum",schemaPath:"#/$defs/numericParameterSupport/properties/minimum/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data28.maximum !== undefined){
let data30 = data28.maximum;
if(!((typeof data30 == "number") && (isFinite(data30)))){
const err71 = {instancePath:instancePath+"/parameters/top_p/maximum",schemaPath:"#/$defs/numericParameterSupport/properties/maximum/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(data28.default !== undefined){
let data31 = data28.default;
if(!((typeof data31 == "number") && (isFinite(data31)))){
const err72 = {instancePath:instancePath+"/parameters/top_p/default",schemaPath:"#/$defs/numericParameterSupport/properties/default/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
}
else {
const err73 = {instancePath:instancePath+"/parameters/top_p",schemaPath:"#/$defs/numericParameterSupport/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data19.stop_sequences !== undefined){
let data32 = data19.stop_sequences;
if(data32 && typeof data32 == "object" && !Array.isArray(data32)){
if(data32.max_items === undefined){
const err74 = {instancePath:instancePath+"/parameters/stop_sequences",schemaPath:"#/properties/parameters/properties/stop_sequences/required",keyword:"required",params:{missingProperty: "max_items"},message:"must have required property '"+"max_items"+"'"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(data32.max_item_length === undefined){
const err75 = {instancePath:instancePath+"/parameters/stop_sequences",schemaPath:"#/properties/parameters/properties/stop_sequences/required",keyword:"required",params:{missingProperty: "max_item_length"},message:"must have required property '"+"max_item_length"+"'"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
for(const key8 in data32){
if(!((key8 === "max_items") || (key8 === "max_item_length"))){
const err76 = {instancePath:instancePath+"/parameters/stop_sequences",schemaPath:"#/properties/parameters/properties/stop_sequences/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(data32.max_items !== undefined){
let data33 = data32.max_items;
if(!(((typeof data33 == "number") && (!(data33 % 1) && !isNaN(data33))) && (isFinite(data33)))){
const err77 = {instancePath:instancePath+"/parameters/stop_sequences/max_items",schemaPath:"#/properties/parameters/properties/stop_sequences/properties/max_items/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if((typeof data33 == "number") && (isFinite(data33))){
if(data33 < 1 || isNaN(data33)){
const err78 = {instancePath:instancePath+"/parameters/stop_sequences/max_items",schemaPath:"#/properties/parameters/properties/stop_sequences/properties/max_items/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
}
if(data32.max_item_length !== undefined){
let data34 = data32.max_item_length;
if(!(((typeof data34 == "number") && (!(data34 % 1) && !isNaN(data34))) && (isFinite(data34)))){
const err79 = {instancePath:instancePath+"/parameters/stop_sequences/max_item_length",schemaPath:"#/properties/parameters/properties/stop_sequences/properties/max_item_length/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if((typeof data34 == "number") && (isFinite(data34))){
if(data34 < 1 || isNaN(data34)){
const err80 = {instancePath:instancePath+"/parameters/stop_sequences/max_item_length",schemaPath:"#/properties/parameters/properties/stop_sequences/properties/max_item_length/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
}
}
}
else {
const err81 = {instancePath:instancePath+"/parameters/stop_sequences",schemaPath:"#/properties/parameters/properties/stop_sequences/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
if(data19.seed !== undefined){
let data35 = data19.seed;
if(data35 && typeof data35 == "object" && !Array.isArray(data35)){
if(data35.minimum === undefined){
const err82 = {instancePath:instancePath+"/parameters/seed",schemaPath:"#/$defs/integerParameterSupport/required",keyword:"required",params:{missingProperty: "minimum"},message:"must have required property '"+"minimum"+"'"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if(data35.maximum === undefined){
const err83 = {instancePath:instancePath+"/parameters/seed",schemaPath:"#/$defs/integerParameterSupport/required",keyword:"required",params:{missingProperty: "maximum"},message:"must have required property '"+"maximum"+"'"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
for(const key9 in data35){
if(!(((key9 === "minimum") || (key9 === "maximum")) || (key9 === "default"))){
const err84 = {instancePath:instancePath+"/parameters/seed",schemaPath:"#/$defs/integerParameterSupport/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
if(data35.minimum !== undefined){
let data36 = data35.minimum;
if(!(((typeof data36 == "number") && (!(data36 % 1) && !isNaN(data36))) && (isFinite(data36)))){
const err85 = {instancePath:instancePath+"/parameters/seed/minimum",schemaPath:"#/$defs/integerParameterSupport/properties/minimum/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(data35.maximum !== undefined){
let data37 = data35.maximum;
if(!(((typeof data37 == "number") && (!(data37 % 1) && !isNaN(data37))) && (isFinite(data37)))){
const err86 = {instancePath:instancePath+"/parameters/seed/maximum",schemaPath:"#/$defs/integerParameterSupport/properties/maximum/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(data35.default !== undefined){
let data38 = data35.default;
if(!(((typeof data38 == "number") && (!(data38 % 1) && !isNaN(data38))) && (isFinite(data38)))){
const err87 = {instancePath:instancePath+"/parameters/seed/default",schemaPath:"#/$defs/integerParameterSupport/properties/default/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
}
else {
const err88 = {instancePath:instancePath+"/parameters/seed",schemaPath:"#/$defs/integerParameterSupport/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
}
else {
const err89 = {instancePath:instancePath+"/parameters",schemaPath:"#/properties/parameters/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
if(data.supported_extensions !== undefined){
let data39 = data.supported_extensions;
if(Array.isArray(data39)){
const len4 = data39.length;
for(let i5=0; i5<len4; i5++){
let data40 = data39[i5];
if(typeof data40 === "string"){
if(func2(data40) > 128){
const err90 = {instancePath:instancePath+"/supported_extensions/" + i5,schemaPath:"#/$defs/namespace/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
if(!pattern4.test(data40)){
const err91 = {instancePath:instancePath+"/supported_extensions/" + i5,schemaPath:"#/$defs/namespace/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"},message:"must match pattern \""+"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"+"\""};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
else {
const err92 = {instancePath:instancePath+"/supported_extensions/" + i5,schemaPath:"#/$defs/namespace/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
let i6 = data39.length;
let j1;
if(i6 > 1){
outer1:
for(;i6--;){
for(j1 = i6; j1--;){
if(func0(data39[i6], data39[j1])){
const err93 = {instancePath:instancePath+"/supported_extensions",schemaPath:"#/properties/supported_extensions/uniqueItems",keyword:"uniqueItems",params:{i: i6, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i6+" are identical)"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err94 = {instancePath:instancePath+"/supported_extensions",schemaPath:"#/properties/supported_extensions/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
}
else {
const err95 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema44 = {"type":"object","additionalProperties":false,"required":["spec_version","kind","execution_id","idempotency_key","rendered_prompt","target","capabilities","parameters","expected_output","delegation","observability"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"execution-request"},"execution_id":{"$ref":"#/$defs/safeId"},"correlation_id":{"$ref":"#/$defs/safeId"},"idempotency_key":{"$ref":"#/$defs/safeId"},"rendered_prompt":{"$ref":"#/$defs/renderedPrompt"},"target":{"type":"object","additionalProperties":false,"required":["adapter_id","provider_id","model_id"],"properties":{"adapter_id":{"$ref":"#/$defs/namespace"},"provider_id":{"$ref":"#/$defs/safeId"},"model_id":{"$ref":"#/$defs/safeId"}}},"capabilities":{"$ref":"#/$defs/capabilityRequirements"},"parameters":{"$ref":"#/$defs/portableParameters"},"expected_output":{"$ref":"#/$defs/expectedOutput"},"timeout_ms":{"type":"integer","minimum":1,"maximum":3600000},"cancellation_id":{"$ref":"#/$defs/safeId"},"delegation":{"type":"object","additionalProperties":false,"required":["caller_id","human_owner","purpose","authority_reference"],"properties":{"caller_id":{"$ref":"#/$defs/safeId"},"human_owner":{"$ref":"#/$defs/owner"},"purpose":{"type":"string","minLength":1,"maxLength":1000},"authority_reference":{"$ref":"#/$defs/absoluteUri"}}},"observability":{"type":"object","additionalProperties":false,"required":["retention","capture_prompt","capture_output"],"properties":{"retention":{"enum":["none","metadata-only","restricted-content"]},"capture_prompt":{"type":"boolean"},"capture_output":{"type":"boolean"}}},"extensions":{"type":"object","propertyNames":{"$ref":"#/$defs/namespace"},"additionalProperties":{"$ref":"#/$defs/extension"}}}};
const schema61 = {"type":"object","additionalProperties":false,"properties":{"max_output_tokens":{"type":"integer","minimum":1},"temperature":{"type":"number","minimum":0,"maximum":2},"top_p":{"type":"number","exclusiveMinimum":0,"maximum":1},"stop_sequences":{"type":"array","minItems":1,"maxItems":8,"uniqueItems":true,"items":{"type":"string","minLength":1,"maxLength":256}},"seed":{"type":"integer","minimum":0,"maximum":9007199254740991}}};
const schema69 = {"type":"string","pattern":"^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"};
const schema65 = {"type":"string","format":"uri","pattern":"^[A-Za-z][A-Za-z0-9+.-]*:"};
const pattern38 = new RegExp("^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$", "u");
const pattern34 = new RegExp("^[A-Za-z][A-Za-z0-9+.-]*:", "u");
const schema48 = {"type":"object","additionalProperties":false,"required":["format","definition","renderer","classification","messages","inputs","contexts","byte_size","sha256"],"properties":{"format":{"const":"studio-rendered-messages-v1"},"definition":{"type":"object","additionalProperties":false,"required":["id","version","spec_version"],"properties":{"id":{"type":"string","pattern":"^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"},"version":{"$ref":"#/$defs/semver"},"spec_version":{"const":"1.0.0"}}},"renderer":{"type":"object","additionalProperties":false,"required":["name","version","algorithm","canonical_json","contract"],"properties":{"name":{"type":"string","minLength":1,"maxLength":200},"version":{"$ref":"#/$defs/semver"},"algorithm":{"type":"string","minLength":1,"maxLength":100},"canonical_json":{"type":"string","minLength":1,"maxLength":100},"contract":{"type":"object","additionalProperties":false,"required":["repository","commit","status"],"properties":{"repository":{"type":"string","pattern":"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"},"commit":{"type":"string","pattern":"^[0-9a-f]{40}$"},"status":{"enum":["provisional-unreleased","released"]}}}}},"classification":{"$ref":"#/$defs/classification"},"messages":{"type":"array","minItems":1,"items":{"type":"object","additionalProperties":false,"required":["role","content"],"properties":{"role":{"enum":["instruction","user","assistant-example"]},"content":{"type":"string"}}}},"inputs":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["name","source","classification"],"properties":{"name":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,63}$"},"source":{"enum":["provided","default"]},"classification":{"$ref":"#/$defs/classification"}}}},"contexts":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["slot","classification","media_type","byte_size"],"properties":{"slot":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,63}$"},"classification":{"$ref":"#/$defs/classification"},"media_type":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},"byte_size":{"type":"integer","minimum":0},"reference":{"type":"string","minLength":1,"maxLength":500}}}},"byte_size":{"type":"integer","minimum":1},"sha256":{"$ref":"#/$defs/sha256"}}};
const schema51 = {"enum":["public","internal","confidential","restricted"]};
const schema54 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}$"};
const pattern15 = new RegExp("^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$", "u");
const pattern18 = new RegExp("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", "u");
const pattern19 = new RegExp("^[0-9a-f]{40}$", "u");
const pattern20 = new RegExp("^[a-z][a-z0-9_]{0,63}$", "u");
const pattern23 = new RegExp("^sha256:[0-9a-f]{64}$", "u");

function validate26(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate26.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.format === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "format"},message:"must have required property '"+"format"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.definition === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "definition"},message:"must have required property '"+"definition"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.renderer === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "renderer"},message:"must have required property '"+"renderer"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.classification === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "classification"},message:"must have required property '"+"classification"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.messages === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "messages"},message:"must have required property '"+"messages"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.inputs === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "inputs"},message:"must have required property '"+"inputs"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.contexts === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contexts"},message:"must have required property '"+"contexts"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.byte_size === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "byte_size"},message:"must have required property '"+"byte_size"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.sha256 === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema48.properties, key0))){
const err9 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.format !== undefined){
if("studio-rendered-messages-v1" !== data.format){
const err10 = {instancePath:instancePath+"/format",schemaPath:"#/properties/format/const",keyword:"const",params:{allowedValue: "studio-rendered-messages-v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.definition !== undefined){
let data1 = data.definition;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.id === undefined){
const err11 = {instancePath:instancePath+"/definition",schemaPath:"#/properties/definition/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data1.version === undefined){
const err12 = {instancePath:instancePath+"/definition",schemaPath:"#/properties/definition/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data1.spec_version === undefined){
const err13 = {instancePath:instancePath+"/definition",schemaPath:"#/properties/definition/required",keyword:"required",params:{missingProperty: "spec_version"},message:"must have required property '"+"spec_version"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
for(const key1 in data1){
if(!(((key1 === "id") || (key1 === "version")) || (key1 === "spec_version"))){
const err14 = {instancePath:instancePath+"/definition",schemaPath:"#/properties/definition/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data1.id !== undefined){
let data2 = data1.id;
if(typeof data2 === "string"){
if(!pattern15.test(data2)){
const err15 = {instancePath:instancePath+"/definition/id",schemaPath:"#/properties/definition/properties/id/pattern",keyword:"pattern",params:{pattern: "^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"},message:"must match pattern \""+"^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"+"\""};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
else {
const err16 = {instancePath:instancePath+"/definition/id",schemaPath:"#/properties/definition/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data1.version !== undefined){
let data3 = data1.version;
if(typeof data3 === "string"){
if(!pattern5.test(data3)){
const err17 = {instancePath:instancePath+"/definition/version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"+"\""};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
else {
const err18 = {instancePath:instancePath+"/definition/version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data1.spec_version !== undefined){
if("1.0.0" !== data1.spec_version){
const err19 = {instancePath:instancePath+"/definition/spec_version",schemaPath:"#/properties/definition/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
else {
const err20 = {instancePath:instancePath+"/definition",schemaPath:"#/properties/definition/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.renderer !== undefined){
let data5 = data.renderer;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
if(data5.name === undefined){
const err21 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data5.version === undefined){
const err22 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data5.algorithm === undefined){
const err23 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/required",keyword:"required",params:{missingProperty: "algorithm"},message:"must have required property '"+"algorithm"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data5.canonical_json === undefined){
const err24 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/required",keyword:"required",params:{missingProperty: "canonical_json"},message:"must have required property '"+"canonical_json"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data5.contract === undefined){
const err25 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/required",keyword:"required",params:{missingProperty: "contract"},message:"must have required property '"+"contract"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
for(const key2 in data5){
if(!(((((key2 === "name") || (key2 === "version")) || (key2 === "algorithm")) || (key2 === "canonical_json")) || (key2 === "contract"))){
const err26 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data5.name !== undefined){
let data6 = data5.name;
if(typeof data6 === "string"){
if(func2(data6) > 200){
const err27 = {instancePath:instancePath+"/renderer/name",schemaPath:"#/properties/renderer/properties/name/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(func2(data6) < 1){
const err28 = {instancePath:instancePath+"/renderer/name",schemaPath:"#/properties/renderer/properties/name/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
else {
const err29 = {instancePath:instancePath+"/renderer/name",schemaPath:"#/properties/renderer/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data5.version !== undefined){
let data7 = data5.version;
if(typeof data7 === "string"){
if(!pattern5.test(data7)){
const err30 = {instancePath:instancePath+"/renderer/version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"+"\""};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
else {
const err31 = {instancePath:instancePath+"/renderer/version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data5.algorithm !== undefined){
let data8 = data5.algorithm;
if(typeof data8 === "string"){
if(func2(data8) > 100){
const err32 = {instancePath:instancePath+"/renderer/algorithm",schemaPath:"#/properties/renderer/properties/algorithm/maxLength",keyword:"maxLength",params:{limit: 100},message:"must NOT have more than 100 characters"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(func2(data8) < 1){
const err33 = {instancePath:instancePath+"/renderer/algorithm",schemaPath:"#/properties/renderer/properties/algorithm/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
else {
const err34 = {instancePath:instancePath+"/renderer/algorithm",schemaPath:"#/properties/renderer/properties/algorithm/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data5.canonical_json !== undefined){
let data9 = data5.canonical_json;
if(typeof data9 === "string"){
if(func2(data9) > 100){
const err35 = {instancePath:instancePath+"/renderer/canonical_json",schemaPath:"#/properties/renderer/properties/canonical_json/maxLength",keyword:"maxLength",params:{limit: 100},message:"must NOT have more than 100 characters"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(func2(data9) < 1){
const err36 = {instancePath:instancePath+"/renderer/canonical_json",schemaPath:"#/properties/renderer/properties/canonical_json/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
else {
const err37 = {instancePath:instancePath+"/renderer/canonical_json",schemaPath:"#/properties/renderer/properties/canonical_json/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data5.contract !== undefined){
let data10 = data5.contract;
if(data10 && typeof data10 == "object" && !Array.isArray(data10)){
if(data10.repository === undefined){
const err38 = {instancePath:instancePath+"/renderer/contract",schemaPath:"#/properties/renderer/properties/contract/required",keyword:"required",params:{missingProperty: "repository"},message:"must have required property '"+"repository"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data10.commit === undefined){
const err39 = {instancePath:instancePath+"/renderer/contract",schemaPath:"#/properties/renderer/properties/contract/required",keyword:"required",params:{missingProperty: "commit"},message:"must have required property '"+"commit"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data10.status === undefined){
const err40 = {instancePath:instancePath+"/renderer/contract",schemaPath:"#/properties/renderer/properties/contract/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
for(const key3 in data10){
if(!(((key3 === "repository") || (key3 === "commit")) || (key3 === "status"))){
const err41 = {instancePath:instancePath+"/renderer/contract",schemaPath:"#/properties/renderer/properties/contract/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data10.repository !== undefined){
let data11 = data10.repository;
if(typeof data11 === "string"){
if(!pattern18.test(data11)){
const err42 = {instancePath:instancePath+"/renderer/contract/repository",schemaPath:"#/properties/renderer/properties/contract/properties/repository/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"+"\""};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
else {
const err43 = {instancePath:instancePath+"/renderer/contract/repository",schemaPath:"#/properties/renderer/properties/contract/properties/repository/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data10.commit !== undefined){
let data12 = data10.commit;
if(typeof data12 === "string"){
if(!pattern19.test(data12)){
const err44 = {instancePath:instancePath+"/renderer/contract/commit",schemaPath:"#/properties/renderer/properties/contract/properties/commit/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{40}$"},message:"must match pattern \""+"^[0-9a-f]{40}$"+"\""};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
else {
const err45 = {instancePath:instancePath+"/renderer/contract/commit",schemaPath:"#/properties/renderer/properties/contract/properties/commit/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data10.status !== undefined){
let data13 = data10.status;
if(!((data13 === "provisional-unreleased") || (data13 === "released"))){
const err46 = {instancePath:instancePath+"/renderer/contract/status",schemaPath:"#/properties/renderer/properties/contract/properties/status/enum",keyword:"enum",params:{allowedValues: schema48.properties.renderer.properties.contract.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
}
else {
const err47 = {instancePath:instancePath+"/renderer/contract",schemaPath:"#/properties/renderer/properties/contract/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
}
else {
const err48 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data.classification !== undefined){
let data14 = data.classification;
if(!((((data14 === "public") || (data14 === "internal")) || (data14 === "confidential")) || (data14 === "restricted"))){
const err49 = {instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema51.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data.messages !== undefined){
let data15 = data.messages;
if(Array.isArray(data15)){
if(data15.length < 1){
const err50 = {instancePath:instancePath+"/messages",schemaPath:"#/properties/messages/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
const len0 = data15.length;
for(let i0=0; i0<len0; i0++){
let data16 = data15[i0];
if(data16 && typeof data16 == "object" && !Array.isArray(data16)){
if(data16.role === undefined){
const err51 = {instancePath:instancePath+"/messages/" + i0,schemaPath:"#/properties/messages/items/required",keyword:"required",params:{missingProperty: "role"},message:"must have required property '"+"role"+"'"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(data16.content === undefined){
const err52 = {instancePath:instancePath+"/messages/" + i0,schemaPath:"#/properties/messages/items/required",keyword:"required",params:{missingProperty: "content"},message:"must have required property '"+"content"+"'"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
for(const key4 in data16){
if(!((key4 === "role") || (key4 === "content"))){
const err53 = {instancePath:instancePath+"/messages/" + i0,schemaPath:"#/properties/messages/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
if(data16.role !== undefined){
let data17 = data16.role;
if(!(((data17 === "instruction") || (data17 === "user")) || (data17 === "assistant-example"))){
const err54 = {instancePath:instancePath+"/messages/" + i0+"/role",schemaPath:"#/properties/messages/items/properties/role/enum",keyword:"enum",params:{allowedValues: schema48.properties.messages.items.properties.role.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data16.content !== undefined){
if(typeof data16.content !== "string"){
const err55 = {instancePath:instancePath+"/messages/" + i0+"/content",schemaPath:"#/properties/messages/items/properties/content/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
}
else {
const err56 = {instancePath:instancePath+"/messages/" + i0,schemaPath:"#/properties/messages/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
}
else {
const err57 = {instancePath:instancePath+"/messages",schemaPath:"#/properties/messages/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
if(data.inputs !== undefined){
let data19 = data.inputs;
if(Array.isArray(data19)){
const len1 = data19.length;
for(let i1=0; i1<len1; i1++){
let data20 = data19[i1];
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.name === undefined){
const err58 = {instancePath:instancePath+"/inputs/" + i1,schemaPath:"#/properties/inputs/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data20.source === undefined){
const err59 = {instancePath:instancePath+"/inputs/" + i1,schemaPath:"#/properties/inputs/items/required",keyword:"required",params:{missingProperty: "source"},message:"must have required property '"+"source"+"'"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data20.classification === undefined){
const err60 = {instancePath:instancePath+"/inputs/" + i1,schemaPath:"#/properties/inputs/items/required",keyword:"required",params:{missingProperty: "classification"},message:"must have required property '"+"classification"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
for(const key5 in data20){
if(!(((key5 === "name") || (key5 === "source")) || (key5 === "classification"))){
const err61 = {instancePath:instancePath+"/inputs/" + i1,schemaPath:"#/properties/inputs/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data20.name !== undefined){
let data21 = data20.name;
if(typeof data21 === "string"){
if(!pattern20.test(data21)){
const err62 = {instancePath:instancePath+"/inputs/" + i1+"/name",schemaPath:"#/properties/inputs/items/properties/name/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9_]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9_]{0,63}$"+"\""};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
else {
const err63 = {instancePath:instancePath+"/inputs/" + i1+"/name",schemaPath:"#/properties/inputs/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data20.source !== undefined){
let data22 = data20.source;
if(!((data22 === "provided") || (data22 === "default"))){
const err64 = {instancePath:instancePath+"/inputs/" + i1+"/source",schemaPath:"#/properties/inputs/items/properties/source/enum",keyword:"enum",params:{allowedValues: schema48.properties.inputs.items.properties.source.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(data20.classification !== undefined){
let data23 = data20.classification;
if(!((((data23 === "public") || (data23 === "internal")) || (data23 === "confidential")) || (data23 === "restricted"))){
const err65 = {instancePath:instancePath+"/inputs/" + i1+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema51.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
}
else {
const err66 = {instancePath:instancePath+"/inputs/" + i1,schemaPath:"#/properties/inputs/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
}
else {
const err67 = {instancePath:instancePath+"/inputs",schemaPath:"#/properties/inputs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data.contexts !== undefined){
let data24 = data.contexts;
if(Array.isArray(data24)){
const len2 = data24.length;
for(let i2=0; i2<len2; i2++){
let data25 = data24[i2];
if(data25 && typeof data25 == "object" && !Array.isArray(data25)){
if(data25.slot === undefined){
const err68 = {instancePath:instancePath+"/contexts/" + i2,schemaPath:"#/properties/contexts/items/required",keyword:"required",params:{missingProperty: "slot"},message:"must have required property '"+"slot"+"'"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(data25.classification === undefined){
const err69 = {instancePath:instancePath+"/contexts/" + i2,schemaPath:"#/properties/contexts/items/required",keyword:"required",params:{missingProperty: "classification"},message:"must have required property '"+"classification"+"'"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(data25.media_type === undefined){
const err70 = {instancePath:instancePath+"/contexts/" + i2,schemaPath:"#/properties/contexts/items/required",keyword:"required",params:{missingProperty: "media_type"},message:"must have required property '"+"media_type"+"'"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(data25.byte_size === undefined){
const err71 = {instancePath:instancePath+"/contexts/" + i2,schemaPath:"#/properties/contexts/items/required",keyword:"required",params:{missingProperty: "byte_size"},message:"must have required property '"+"byte_size"+"'"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
for(const key6 in data25){
if(!(((((key6 === "slot") || (key6 === "classification")) || (key6 === "media_type")) || (key6 === "byte_size")) || (key6 === "reference"))){
const err72 = {instancePath:instancePath+"/contexts/" + i2,schemaPath:"#/properties/contexts/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data25.slot !== undefined){
let data26 = data25.slot;
if(typeof data26 === "string"){
if(!pattern20.test(data26)){
const err73 = {instancePath:instancePath+"/contexts/" + i2+"/slot",schemaPath:"#/properties/contexts/items/properties/slot/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9_]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9_]{0,63}$"+"\""};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
else {
const err74 = {instancePath:instancePath+"/contexts/" + i2+"/slot",schemaPath:"#/properties/contexts/items/properties/slot/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data25.classification !== undefined){
let data27 = data25.classification;
if(!((((data27 === "public") || (data27 === "internal")) || (data27 === "confidential")) || (data27 === "restricted"))){
const err75 = {instancePath:instancePath+"/contexts/" + i2+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema51.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(data25.media_type !== undefined){
let data28 = data25.media_type;
if(typeof data28 === "string"){
if(!pattern9.test(data28)){
const err76 = {instancePath:instancePath+"/contexts/" + i2+"/media_type",schemaPath:"#/properties/contexts/items/properties/media_type/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},message:"must match pattern \""+"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"+"\""};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
else {
const err77 = {instancePath:instancePath+"/contexts/" + i2+"/media_type",schemaPath:"#/properties/contexts/items/properties/media_type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data25.byte_size !== undefined){
let data29 = data25.byte_size;
if(!(((typeof data29 == "number") && (!(data29 % 1) && !isNaN(data29))) && (isFinite(data29)))){
const err78 = {instancePath:instancePath+"/contexts/" + i2+"/byte_size",schemaPath:"#/properties/contexts/items/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if((typeof data29 == "number") && (isFinite(data29))){
if(data29 < 0 || isNaN(data29)){
const err79 = {instancePath:instancePath+"/contexts/" + i2+"/byte_size",schemaPath:"#/properties/contexts/items/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
}
if(data25.reference !== undefined){
let data30 = data25.reference;
if(typeof data30 === "string"){
if(func2(data30) > 500){
const err80 = {instancePath:instancePath+"/contexts/" + i2+"/reference",schemaPath:"#/properties/contexts/items/properties/reference/maxLength",keyword:"maxLength",params:{limit: 500},message:"must NOT have more than 500 characters"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(func2(data30) < 1){
const err81 = {instancePath:instancePath+"/contexts/" + i2+"/reference",schemaPath:"#/properties/contexts/items/properties/reference/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
else {
const err82 = {instancePath:instancePath+"/contexts/" + i2+"/reference",schemaPath:"#/properties/contexts/items/properties/reference/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
}
else {
const err83 = {instancePath:instancePath+"/contexts/" + i2,schemaPath:"#/properties/contexts/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
}
else {
const err84 = {instancePath:instancePath+"/contexts",schemaPath:"#/properties/contexts/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
if(data.byte_size !== undefined){
let data31 = data.byte_size;
if(!(((typeof data31 == "number") && (!(data31 % 1) && !isNaN(data31))) && (isFinite(data31)))){
const err85 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
if((typeof data31 == "number") && (isFinite(data31))){
if(data31 < 1 || isNaN(data31)){
const err86 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
}
if(data.sha256 !== undefined){
let data32 = data.sha256;
if(typeof data32 === "string"){
if(!pattern23.test(data32)){
const err87 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
else {
const err88 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
}
else {
const err89 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema58 = {"type":"object","additionalProperties":false,"required":["required","optional"],"properties":{"required":{"type":"array","minItems":1,"uniqueItems":true,"contains":{"const":"text-generation"},"items":{"$ref":"#/$defs/capability"}},"optional":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/capability"}}}};

function validate28(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate28.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.required === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "required"},message:"must have required property '"+"required"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.optional === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "optional"},message:"must have required property '"+"optional"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "required") || (key0 === "optional"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.required !== undefined){
let data0 = data.required;
if(Array.isArray(data0)){
if(data0.length < 1){
const err3 = {instancePath:instancePath+"/required",schemaPath:"#/properties/required/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
const len0 = data0.length;
for(let i0=0; i0<len0; i0++){
let data1 = data0[i0];
if(typeof data1 === "string"){
if(func2(data1) > 128){
const err4 = {instancePath:instancePath+"/required/" + i0,schemaPath:"#/$defs/capability/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!pattern8.test(data1)){
const err5 = {instancePath:instancePath+"/required/" + i0,schemaPath:"#/$defs/capability/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*$"},message:"must match pattern \""+"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*$"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/required/" + i0,schemaPath:"#/$defs/capability/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
const _errs7 = errors;
const len1 = data0.length;
for(let i1=0; i1<len1; i1++){
const _errs8 = errors;
if("text-generation" !== data0[i1]){
const err7 = {instancePath:instancePath+"/required/" + i1,schemaPath:"#/properties/required/contains/const",keyword:"const",params:{allowedValue: "text-generation"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
var valid4 = _errs8 === errors;
if(valid4){
break;
}
}
if(!valid4){
const err8 = {instancePath:instancePath+"/required",schemaPath:"#/properties/required/contains",keyword:"contains",params:{minContains: 1},message:"must contain at least 1 valid item(s)"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
errors = _errs7;
if(vErrors !== null){
if(_errs7){
vErrors.length = _errs7;
}
else {
vErrors = null;
}
}
}
let i2 = data0.length;
let j0;
if(i2 > 1){
outer0:
for(;i2--;){
for(j0 = i2; j0--;){
if(func0(data0[i2], data0[j0])){
const err9 = {instancePath:instancePath+"/required",schemaPath:"#/properties/required/uniqueItems",keyword:"uniqueItems",params:{i: i2, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i2+" are identical)"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err10 = {instancePath:instancePath+"/required",schemaPath:"#/properties/required/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.optional !== undefined){
let data3 = data.optional;
if(Array.isArray(data3)){
const len2 = data3.length;
for(let i3=0; i3<len2; i3++){
let data4 = data3[i3];
if(typeof data4 === "string"){
if(func2(data4) > 128){
const err11 = {instancePath:instancePath+"/optional/" + i3,schemaPath:"#/$defs/capability/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!pattern8.test(data4)){
const err12 = {instancePath:instancePath+"/optional/" + i3,schemaPath:"#/$defs/capability/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*$"},message:"must match pattern \""+"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*$"+"\""};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
else {
const err13 = {instancePath:instancePath+"/optional/" + i3,schemaPath:"#/$defs/capability/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
let i4 = data3.length;
let j1;
if(i4 > 1){
outer1:
for(;i4--;){
for(j1 = i4; j1--;){
if(func0(data3[i4], data3[j1])){
const err14 = {instancePath:instancePath+"/optional",schemaPath:"#/properties/optional/uniqueItems",keyword:"uniqueItems",params:{i: i4, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i4+" are identical)"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err15 = {instancePath:instancePath+"/optional",schemaPath:"#/properties/optional/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
}
else {
const err16 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema62 = {"type":"object","additionalProperties":false,"required":["kind","media_type","validation"],"properties":{"kind":{"enum":["text","json"]},"media_type":{"enum":["text/plain","application/json"]},"validation":{"enum":["none","json-syntax","json-schema"]},"schema":{"$ref":"#/$defs/outputSchemaReference"}},"allOf":[{"if":{"properties":{"kind":{"const":"text"}},"required":["kind"]},"then":{"properties":{"media_type":{"const":"text/plain"},"validation":{"const":"none"}},"not":{"required":["schema"]}},"else":{"properties":{"media_type":{"const":"application/json"},"validation":{"enum":["json-syntax","json-schema"]}}}},{"if":{"properties":{"validation":{"const":"json-schema"}},"required":["validation"]},"then":{"required":["schema"]},"else":{"not":{"required":["schema"]}}}]};
const schema63 = {"type":"object","additionalProperties":false,"required":["schema_id","repository","contract","version","tag","commit","artifact_uri","media_type","byte_size","sha256"],"properties":{"schema_id":{"type":"string","minLength":1,"maxLength":500},"repository":{"type":"string","pattern":"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"},"contract":{"type":"string","pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$"},"version":{"$ref":"#/$defs/semver"},"tag":{"type":"string","pattern":"^contract/[a-z0-9]+(?:-[a-z0-9]+)*/v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"},"commit":{"type":"string","pattern":"^[0-9a-f]{40}$"},"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"const":"application/schema+json"},"byte_size":{"type":"integer","minimum":1},"sha256":{"$ref":"#/$defs/sha256"}}};
const pattern30 = new RegExp("^[a-z0-9]+(?:-[a-z0-9]+)*$", "u");
const pattern32 = new RegExp("^contract/[a-z0-9]+(?:-[a-z0-9]+)*/v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$", "u");
const formats0 = require("ajv-formats/dist/formats").fullFormats.uri;

function validate31(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate31.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.schema_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schema_id"},message:"must have required property '"+"schema_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.repository === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "repository"},message:"must have required property '"+"repository"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.contract === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract"},message:"must have required property '"+"contract"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.version === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.tag === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tag"},message:"must have required property '"+"tag"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.commit === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "commit"},message:"must have required property '"+"commit"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.artifact_uri === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "artifact_uri"},message:"must have required property '"+"artifact_uri"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.media_type === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "media_type"},message:"must have required property '"+"media_type"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.byte_size === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "byte_size"},message:"must have required property '"+"byte_size"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.sha256 === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema63.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.schema_id !== undefined){
let data0 = data.schema_id;
if(typeof data0 === "string"){
if(func2(data0) > 500){
const err11 = {instancePath:instancePath+"/schema_id",schemaPath:"#/properties/schema_id/maxLength",keyword:"maxLength",params:{limit: 500},message:"must NOT have more than 500 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(func2(data0) < 1){
const err12 = {instancePath:instancePath+"/schema_id",schemaPath:"#/properties/schema_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
else {
const err13 = {instancePath:instancePath+"/schema_id",schemaPath:"#/properties/schema_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.repository !== undefined){
let data1 = data.repository;
if(typeof data1 === "string"){
if(!pattern18.test(data1)){
const err14 = {instancePath:instancePath+"/repository",schemaPath:"#/properties/repository/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/repository",schemaPath:"#/properties/repository/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.contract !== undefined){
let data2 = data.contract;
if(typeof data2 === "string"){
if(!pattern30.test(data2)){
const err16 = {instancePath:instancePath+"/contract",schemaPath:"#/properties/contract/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"},message:"must match pattern \""+"^[a-z0-9]+(?:-[a-z0-9]+)*$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
else {
const err17 = {instancePath:instancePath+"/contract",schemaPath:"#/properties/contract/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.version !== undefined){
let data3 = data.version;
if(typeof data3 === "string"){
if(!pattern5.test(data3)){
const err18 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
else {
const err19 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.tag !== undefined){
let data4 = data.tag;
if(typeof data4 === "string"){
if(!pattern32.test(data4)){
const err20 = {instancePath:instancePath+"/tag",schemaPath:"#/properties/tag/pattern",keyword:"pattern",params:{pattern: "^contract/[a-z0-9]+(?:-[a-z0-9]+)*/v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"},message:"must match pattern \""+"^contract/[a-z0-9]+(?:-[a-z0-9]+)*/v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"+"\""};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
else {
const err21 = {instancePath:instancePath+"/tag",schemaPath:"#/properties/tag/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.commit !== undefined){
let data5 = data.commit;
if(typeof data5 === "string"){
if(!pattern19.test(data5)){
const err22 = {instancePath:instancePath+"/commit",schemaPath:"#/properties/commit/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{40}$"},message:"must match pattern \""+"^[0-9a-f]{40}$"+"\""};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
else {
const err23 = {instancePath:instancePath+"/commit",schemaPath:"#/properties/commit/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.artifact_uri !== undefined){
let data6 = data.artifact_uri;
if(typeof data6 === "string"){
if(!pattern34.test(data6)){
const err24 = {instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!(formats0(data6))){
const err25 = {instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
else {
const err26 = {instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.media_type !== undefined){
if("application/schema+json" !== data.media_type){
const err27 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/const",keyword:"const",params:{allowedValue: "application/schema+json"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.byte_size !== undefined){
let data8 = data.byte_size;
if(!(((typeof data8 == "number") && (!(data8 % 1) && !isNaN(data8))) && (isFinite(data8)))){
const err28 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if((typeof data8 == "number") && (isFinite(data8))){
if(data8 < 1 || isNaN(data8)){
const err29 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
}
if(data.sha256 !== undefined){
let data9 = data.sha256;
if(typeof data9 === "string"){
if(!pattern23.test(data9)){
const err30 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
else {
const err31 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
}
else {
const err32 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
validate31.errors = vErrors;
return errors === 0;
}
validate31.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate30(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate30.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.kind === undefined) && (missing0 = "kind")){
const err0 = {};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
if(data.kind !== undefined){
if("text" !== data.kind){
const err1 = {};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
}
}
var _valid0 = _errs3 === errors;
errors = _errs2;
if(vErrors !== null){
if(_errs2){
vErrors.length = _errs2;
}
else {
vErrors = null;
}
}
let ifClause0;
if(_valid0){
const _errs5 = errors;
const _errs6 = errors;
const _errs7 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.schema === undefined) && (missing1 = "schema")){
const err2 = {};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
var valid3 = _errs7 === errors;
if(valid3){
const err3 = {instancePath,schemaPath:"#/allOf/0/then/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
else {
errors = _errs6;
if(vErrors !== null){
if(_errs6){
vErrors.length = _errs6;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.media_type !== undefined){
if("text/plain" !== data.media_type){
const err4 = {instancePath:instancePath+"/media_type",schemaPath:"#/allOf/0/then/properties/media_type/const",keyword:"const",params:{allowedValue: "text/plain"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.validation !== undefined){
if("none" !== data.validation){
const err5 = {instancePath:instancePath+"/validation",schemaPath:"#/allOf/0/then/properties/validation/const",keyword:"const",params:{allowedValue: "none"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.media_type = true;
props0.validation = true;
props0.kind = true;
}
ifClause0 = "then";
}
else {
const _errs10 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.media_type !== undefined){
if("application/json" !== data.media_type){
const err6 = {instancePath:instancePath+"/media_type",schemaPath:"#/allOf/0/else/properties/media_type/const",keyword:"const",params:{allowedValue: "application/json"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.validation !== undefined){
let data4 = data.validation;
if(!((data4 === "json-syntax") || (data4 === "json-schema"))){
const err7 = {instancePath:instancePath+"/validation",schemaPath:"#/allOf/0/else/properties/validation/enum",keyword:"enum",params:{allowedValues: schema62.allOf[0].else.properties.validation.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
var _valid0 = _errs10 === errors;
valid1 = _valid0;
if(valid1){
if(props0 !== true){
props0 = props0 || {};
props0.media_type = true;
props0.validation = true;
}
}
ifClause0 = "else";
}
if(!valid1){
const err8 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
const _errs14 = errors;
let valid6 = true;
const _errs15 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if((data.validation === undefined) && (missing2 = "validation")){
const err9 = {};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
else {
if(data.validation !== undefined){
if("json-schema" !== data.validation){
const err10 = {};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
}
var _valid1 = _errs15 === errors;
errors = _errs14;
if(vErrors !== null){
if(_errs14){
vErrors.length = _errs14;
}
else {
vErrors = null;
}
}
let ifClause1;
if(_valid1){
const _errs17 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.schema === undefined){
const err11 = {instancePath,schemaPath:"#/allOf/1/then/required",keyword:"required",params:{missingProperty: "schema"},message:"must have required property '"+"schema"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
var _valid1 = _errs17 === errors;
valid6 = _valid1;
ifClause1 = "then";
}
else {
const _errs18 = errors;
const _errs19 = errors;
const _errs20 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing3;
if((data.schema === undefined) && (missing3 = "schema")){
const err12 = {};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
var valid8 = _errs20 === errors;
if(valid8){
const err13 = {instancePath,schemaPath:"#/allOf/1/else/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
else {
errors = _errs19;
if(vErrors !== null){
if(_errs19){
vErrors.length = _errs19;
}
else {
vErrors = null;
}
}
}
var _valid1 = _errs18 === errors;
valid6 = _valid1;
ifClause1 = "else";
}
if(!valid6){
const err14 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: ifClause1},message:"must match \""+ifClause1+"\" schema"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(props0 !== true){
props0 = props0 || {};
props0.validation = true;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.media_type === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "media_type"},message:"must have required property '"+"media_type"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.validation === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "validation"},message:"must have required property '"+"validation"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "kind") || (key0 === "media_type")) || (key0 === "validation")) || (key0 === "schema"))){
const err18 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.kind !== undefined){
let data6 = data.kind;
if(!((data6 === "text") || (data6 === "json"))){
const err19 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema62.properties.kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.media_type !== undefined){
let data7 = data.media_type;
if(!((data7 === "text/plain") || (data7 === "application/json"))){
const err20 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/enum",keyword:"enum",params:{allowedValues: schema62.properties.media_type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.validation !== undefined){
let data8 = data.validation;
if(!(((data8 === "none") || (data8 === "json-syntax")) || (data8 === "json-schema"))){
const err21 = {instancePath:instancePath+"/validation",schemaPath:"#/properties/validation/enum",keyword:"enum",params:{allowedValues: schema62.properties.validation.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.schema !== undefined){
if(!(validate31(data.schema, {instancePath:instancePath+"/schema",parentData:data,parentDataProperty:"schema",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate31.errors : vErrors.concat(validate31.errors);
errors = vErrors.length;
}
}
}
else {
const err22 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema72 = {"type":"object","additionalProperties":false,"required":["required","fallback","configuration"],"properties":{"required":{"type":"boolean"},"fallback":{"enum":["reject","portable-baseline","omit"]},"configuration":{"type":"object"},"evidence":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/absoluteUri"}}}};

function validate34(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate34.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.required === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "required"},message:"must have required property '"+"required"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.fallback === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "fallback"},message:"must have required property '"+"fallback"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.configuration === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "configuration"},message:"must have required property '"+"configuration"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "required") || (key0 === "fallback")) || (key0 === "configuration")) || (key0 === "evidence"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.required !== undefined){
if(typeof data.required !== "boolean"){
const err4 = {instancePath:instancePath+"/required",schemaPath:"#/properties/required/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.fallback !== undefined){
let data1 = data.fallback;
if(!(((data1 === "reject") || (data1 === "portable-baseline")) || (data1 === "omit"))){
const err5 = {instancePath:instancePath+"/fallback",schemaPath:"#/properties/fallback/enum",keyword:"enum",params:{allowedValues: schema72.properties.fallback.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.configuration !== undefined){
let data2 = data.configuration;
if(!(data2 && typeof data2 == "object" && !Array.isArray(data2))){
const err6 = {instancePath:instancePath+"/configuration",schemaPath:"#/properties/configuration/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.evidence !== undefined){
let data3 = data.evidence;
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
let data4 = data3[i0];
if(typeof data4 === "string"){
if(!pattern34.test(data4)){
const err7 = {instancePath:instancePath+"/evidence/" + i0,schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!(formats0(data4))){
const err8 = {instancePath:instancePath+"/evidence/" + i0,schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/evidence/" + i0,schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
let i1 = data3.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data3[i1], data3[j0])){
const err10 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err11 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate34.errors = vErrors;
return errors === 0;
}
validate34.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate25(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate25.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.spec_version === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "spec_version"},message:"must have required property '"+"spec_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.kind === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.execution_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "execution_id"},message:"must have required property '"+"execution_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.idempotency_key === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "idempotency_key"},message:"must have required property '"+"idempotency_key"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.rendered_prompt === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rendered_prompt"},message:"must have required property '"+"rendered_prompt"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.target === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target"},message:"must have required property '"+"target"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.capabilities === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capabilities"},message:"must have required property '"+"capabilities"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.parameters === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parameters"},message:"must have required property '"+"parameters"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.expected_output === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expected_output"},message:"must have required property '"+"expected_output"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.delegation === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "delegation"},message:"must have required property '"+"delegation"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.observability === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observability"},message:"must have required property '"+"observability"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema44.properties, key0))){
const err11 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.spec_version !== undefined){
if("1.0.0" !== data.spec_version){
const err12 = {instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.kind !== undefined){
if("execution-request" !== data.kind){
const err13 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "execution-request"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.execution_id !== undefined){
let data2 = data.execution_id;
if(typeof data2 === "string"){
if(!pattern6.test(data2)){
const err14 = {instancePath:instancePath+"/execution_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/execution_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.correlation_id !== undefined){
let data3 = data.correlation_id;
if(typeof data3 === "string"){
if(!pattern6.test(data3)){
const err16 = {instancePath:instancePath+"/correlation_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
else {
const err17 = {instancePath:instancePath+"/correlation_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.idempotency_key !== undefined){
let data4 = data.idempotency_key;
if(typeof data4 === "string"){
if(!pattern6.test(data4)){
const err18 = {instancePath:instancePath+"/idempotency_key",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
else {
const err19 = {instancePath:instancePath+"/idempotency_key",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.rendered_prompt !== undefined){
if(!(validate26(data.rendered_prompt, {instancePath:instancePath+"/rendered_prompt",parentData:data,parentDataProperty:"rendered_prompt",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
errors = vErrors.length;
}
}
if(data.target !== undefined){
let data6 = data.target;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.adapter_id === undefined){
const err20 = {instancePath:instancePath+"/target",schemaPath:"#/properties/target/required",keyword:"required",params:{missingProperty: "adapter_id"},message:"must have required property '"+"adapter_id"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data6.provider_id === undefined){
const err21 = {instancePath:instancePath+"/target",schemaPath:"#/properties/target/required",keyword:"required",params:{missingProperty: "provider_id"},message:"must have required property '"+"provider_id"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data6.model_id === undefined){
const err22 = {instancePath:instancePath+"/target",schemaPath:"#/properties/target/required",keyword:"required",params:{missingProperty: "model_id"},message:"must have required property '"+"model_id"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
for(const key1 in data6){
if(!(((key1 === "adapter_id") || (key1 === "provider_id")) || (key1 === "model_id"))){
const err23 = {instancePath:instancePath+"/target",schemaPath:"#/properties/target/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data6.adapter_id !== undefined){
let data7 = data6.adapter_id;
if(typeof data7 === "string"){
if(func2(data7) > 128){
const err24 = {instancePath:instancePath+"/target/adapter_id",schemaPath:"#/$defs/namespace/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!pattern4.test(data7)){
const err25 = {instancePath:instancePath+"/target/adapter_id",schemaPath:"#/$defs/namespace/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"},message:"must match pattern \""+"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"+"\""};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
else {
const err26 = {instancePath:instancePath+"/target/adapter_id",schemaPath:"#/$defs/namespace/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data6.provider_id !== undefined){
let data8 = data6.provider_id;
if(typeof data8 === "string"){
if(!pattern6.test(data8)){
const err27 = {instancePath:instancePath+"/target/provider_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
else {
const err28 = {instancePath:instancePath+"/target/provider_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data6.model_id !== undefined){
let data9 = data6.model_id;
if(typeof data9 === "string"){
if(!pattern6.test(data9)){
const err29 = {instancePath:instancePath+"/target/model_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
else {
const err30 = {instancePath:instancePath+"/target/model_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
else {
const err31 = {instancePath:instancePath+"/target",schemaPath:"#/properties/target/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.capabilities !== undefined){
if(!(validate28(data.capabilities, {instancePath:instancePath+"/capabilities",parentData:data,parentDataProperty:"capabilities",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
}
if(data.parameters !== undefined){
let data11 = data.parameters;
if(data11 && typeof data11 == "object" && !Array.isArray(data11)){
for(const key2 in data11){
if(!(((((key2 === "max_output_tokens") || (key2 === "temperature")) || (key2 === "top_p")) || (key2 === "stop_sequences")) || (key2 === "seed"))){
const err32 = {instancePath:instancePath+"/parameters",schemaPath:"#/$defs/portableParameters/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data11.max_output_tokens !== undefined){
let data12 = data11.max_output_tokens;
if(!(((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))) && (isFinite(data12)))){
const err33 = {instancePath:instancePath+"/parameters/max_output_tokens",schemaPath:"#/$defs/portableParameters/properties/max_output_tokens/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if((typeof data12 == "number") && (isFinite(data12))){
if(data12 < 1 || isNaN(data12)){
const err34 = {instancePath:instancePath+"/parameters/max_output_tokens",schemaPath:"#/$defs/portableParameters/properties/max_output_tokens/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
}
if(data11.temperature !== undefined){
let data13 = data11.temperature;
if((typeof data13 == "number") && (isFinite(data13))){
if(data13 > 2 || isNaN(data13)){
const err35 = {instancePath:instancePath+"/parameters/temperature",schemaPath:"#/$defs/portableParameters/properties/temperature/maximum",keyword:"maximum",params:{comparison: "<=", limit: 2},message:"must be <= 2"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data13 < 0 || isNaN(data13)){
const err36 = {instancePath:instancePath+"/parameters/temperature",schemaPath:"#/$defs/portableParameters/properties/temperature/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
else {
const err37 = {instancePath:instancePath+"/parameters/temperature",schemaPath:"#/$defs/portableParameters/properties/temperature/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data11.top_p !== undefined){
let data14 = data11.top_p;
if((typeof data14 == "number") && (isFinite(data14))){
if(data14 > 1 || isNaN(data14)){
const err38 = {instancePath:instancePath+"/parameters/top_p",schemaPath:"#/$defs/portableParameters/properties/top_p/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1},message:"must be <= 1"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data14 <= 0 || isNaN(data14)){
const err39 = {instancePath:instancePath+"/parameters/top_p",schemaPath:"#/$defs/portableParameters/properties/top_p/exclusiveMinimum",keyword:"exclusiveMinimum",params:{comparison: ">", limit: 0},message:"must be > 0"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
else {
const err40 = {instancePath:instancePath+"/parameters/top_p",schemaPath:"#/$defs/portableParameters/properties/top_p/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data11.stop_sequences !== undefined){
let data15 = data11.stop_sequences;
if(Array.isArray(data15)){
if(data15.length > 8){
const err41 = {instancePath:instancePath+"/parameters/stop_sequences",schemaPath:"#/$defs/portableParameters/properties/stop_sequences/maxItems",keyword:"maxItems",params:{limit: 8},message:"must NOT have more than 8 items"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data15.length < 1){
const err42 = {instancePath:instancePath+"/parameters/stop_sequences",schemaPath:"#/$defs/portableParameters/properties/stop_sequences/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
const len0 = data15.length;
for(let i0=0; i0<len0; i0++){
let data16 = data15[i0];
if(typeof data16 === "string"){
if(func2(data16) > 256){
const err43 = {instancePath:instancePath+"/parameters/stop_sequences/" + i0,schemaPath:"#/$defs/portableParameters/properties/stop_sequences/items/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(func2(data16) < 1){
const err44 = {instancePath:instancePath+"/parameters/stop_sequences/" + i0,schemaPath:"#/$defs/portableParameters/properties/stop_sequences/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
else {
const err45 = {instancePath:instancePath+"/parameters/stop_sequences/" + i0,schemaPath:"#/$defs/portableParameters/properties/stop_sequences/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
let i1 = data15.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data15[i1];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err46 = {instancePath:instancePath+"/parameters/stop_sequences",schemaPath:"#/$defs/portableParameters/properties/stop_sequences/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err47 = {instancePath:instancePath+"/parameters/stop_sequences",schemaPath:"#/$defs/portableParameters/properties/stop_sequences/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data11.seed !== undefined){
let data17 = data11.seed;
if(!(((typeof data17 == "number") && (!(data17 % 1) && !isNaN(data17))) && (isFinite(data17)))){
const err48 = {instancePath:instancePath+"/parameters/seed",schemaPath:"#/$defs/portableParameters/properties/seed/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if((typeof data17 == "number") && (isFinite(data17))){
if(data17 > 9007199254740991 || isNaN(data17)){
const err49 = {instancePath:instancePath+"/parameters/seed",schemaPath:"#/$defs/portableParameters/properties/seed/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(data17 < 0 || isNaN(data17)){
const err50 = {instancePath:instancePath+"/parameters/seed",schemaPath:"#/$defs/portableParameters/properties/seed/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
}
}
else {
const err51 = {instancePath:instancePath+"/parameters",schemaPath:"#/$defs/portableParameters/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data.expected_output !== undefined){
if(!(validate30(data.expected_output, {instancePath:instancePath+"/expected_output",parentData:data,parentDataProperty:"expected_output",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
errors = vErrors.length;
}
}
if(data.timeout_ms !== undefined){
let data19 = data.timeout_ms;
if(!(((typeof data19 == "number") && (!(data19 % 1) && !isNaN(data19))) && (isFinite(data19)))){
const err52 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/properties/timeout_ms/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if((typeof data19 == "number") && (isFinite(data19))){
if(data19 > 3600000 || isNaN(data19)){
const err53 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/properties/timeout_ms/maximum",keyword:"maximum",params:{comparison: "<=", limit: 3600000},message:"must be <= 3600000"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(data19 < 1 || isNaN(data19)){
const err54 = {instancePath:instancePath+"/timeout_ms",schemaPath:"#/properties/timeout_ms/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
}
if(data.cancellation_id !== undefined){
let data20 = data.cancellation_id;
if(typeof data20 === "string"){
if(!pattern6.test(data20)){
const err55 = {instancePath:instancePath+"/cancellation_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
else {
const err56 = {instancePath:instancePath+"/cancellation_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data.delegation !== undefined){
let data21 = data.delegation;
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.caller_id === undefined){
const err57 = {instancePath:instancePath+"/delegation",schemaPath:"#/properties/delegation/required",keyword:"required",params:{missingProperty: "caller_id"},message:"must have required property '"+"caller_id"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data21.human_owner === undefined){
const err58 = {instancePath:instancePath+"/delegation",schemaPath:"#/properties/delegation/required",keyword:"required",params:{missingProperty: "human_owner"},message:"must have required property '"+"human_owner"+"'"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data21.purpose === undefined){
const err59 = {instancePath:instancePath+"/delegation",schemaPath:"#/properties/delegation/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data21.authority_reference === undefined){
const err60 = {instancePath:instancePath+"/delegation",schemaPath:"#/properties/delegation/required",keyword:"required",params:{missingProperty: "authority_reference"},message:"must have required property '"+"authority_reference"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
for(const key3 in data21){
if(!((((key3 === "caller_id") || (key3 === "human_owner")) || (key3 === "purpose")) || (key3 === "authority_reference"))){
const err61 = {instancePath:instancePath+"/delegation",schemaPath:"#/properties/delegation/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data21.caller_id !== undefined){
let data22 = data21.caller_id;
if(typeof data22 === "string"){
if(!pattern6.test(data22)){
const err62 = {instancePath:instancePath+"/delegation/caller_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
else {
const err63 = {instancePath:instancePath+"/delegation/caller_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data21.human_owner !== undefined){
let data23 = data21.human_owner;
if(typeof data23 === "string"){
if(!pattern38.test(data23)){
const err64 = {instancePath:instancePath+"/delegation/human_owner",schemaPath:"#/$defs/owner/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
else {
const err65 = {instancePath:instancePath+"/delegation/human_owner",schemaPath:"#/$defs/owner/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
if(data21.purpose !== undefined){
let data24 = data21.purpose;
if(typeof data24 === "string"){
if(func2(data24) > 1000){
const err66 = {instancePath:instancePath+"/delegation/purpose",schemaPath:"#/properties/delegation/properties/purpose/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(func2(data24) < 1){
const err67 = {instancePath:instancePath+"/delegation/purpose",schemaPath:"#/properties/delegation/properties/purpose/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
else {
const err68 = {instancePath:instancePath+"/delegation/purpose",schemaPath:"#/properties/delegation/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data21.authority_reference !== undefined){
let data25 = data21.authority_reference;
if(typeof data25 === "string"){
if(!pattern34.test(data25)){
const err69 = {instancePath:instancePath+"/delegation/authority_reference",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(!(formats0(data25))){
const err70 = {instancePath:instancePath+"/delegation/authority_reference",schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
else {
const err71 = {instancePath:instancePath+"/delegation/authority_reference",schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
}
else {
const err72 = {instancePath:instancePath+"/delegation",schemaPath:"#/properties/delegation/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data.observability !== undefined){
let data26 = data.observability;
if(data26 && typeof data26 == "object" && !Array.isArray(data26)){
if(data26.retention === undefined){
const err73 = {instancePath:instancePath+"/observability",schemaPath:"#/properties/observability/required",keyword:"required",params:{missingProperty: "retention"},message:"must have required property '"+"retention"+"'"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if(data26.capture_prompt === undefined){
const err74 = {instancePath:instancePath+"/observability",schemaPath:"#/properties/observability/required",keyword:"required",params:{missingProperty: "capture_prompt"},message:"must have required property '"+"capture_prompt"+"'"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(data26.capture_output === undefined){
const err75 = {instancePath:instancePath+"/observability",schemaPath:"#/properties/observability/required",keyword:"required",params:{missingProperty: "capture_output"},message:"must have required property '"+"capture_output"+"'"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
for(const key4 in data26){
if(!(((key4 === "retention") || (key4 === "capture_prompt")) || (key4 === "capture_output"))){
const err76 = {instancePath:instancePath+"/observability",schemaPath:"#/properties/observability/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(data26.retention !== undefined){
let data27 = data26.retention;
if(!(((data27 === "none") || (data27 === "metadata-only")) || (data27 === "restricted-content"))){
const err77 = {instancePath:instancePath+"/observability/retention",schemaPath:"#/properties/observability/properties/retention/enum",keyword:"enum",params:{allowedValues: schema44.properties.observability.properties.retention.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data26.capture_prompt !== undefined){
if(typeof data26.capture_prompt !== "boolean"){
const err78 = {instancePath:instancePath+"/observability/capture_prompt",schemaPath:"#/properties/observability/properties/capture_prompt/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data26.capture_output !== undefined){
if(typeof data26.capture_output !== "boolean"){
const err79 = {instancePath:instancePath+"/observability/capture_output",schemaPath:"#/properties/observability/properties/capture_output/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
}
else {
const err80 = {instancePath:instancePath+"/observability",schemaPath:"#/properties/observability/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
}
if(data.extensions !== undefined){
let data30 = data.extensions;
if(data30 && typeof data30 == "object" && !Array.isArray(data30)){
for(const key5 in data30){
const _errs73 = errors;
if(typeof key5 === "string"){
if(func2(key5) > 128){
const err81 = {instancePath:instancePath+"/extensions",schemaPath:"#/$defs/namespace/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters",propertyName:key5};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(!pattern4.test(key5)){
const err82 = {instancePath:instancePath+"/extensions",schemaPath:"#/$defs/namespace/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"},message:"must match pattern \""+"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"+"\"",propertyName:key5};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
else {
const err83 = {instancePath:instancePath+"/extensions",schemaPath:"#/$defs/namespace/type",keyword:"type",params:{type: "string"},message:"must be string",propertyName:key5};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
var valid19 = _errs73 === errors;
if(!valid19){
const err84 = {instancePath:instancePath+"/extensions",schemaPath:"#/properties/extensions/propertyNames",keyword:"propertyNames",params:{propertyName: key5},message:"property name must be valid"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
for(const key6 in data30){
if(!(validate34(data30[key6], {instancePath:instancePath+"/extensions/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"),parentData:data30,parentDataProperty:key6,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate34.errors : vErrors.concat(validate34.errors);
errors = vErrors.length;
}
}
}
else {
const err85 = {instancePath:instancePath+"/extensions",schemaPath:"#/properties/extensions/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
}
else {
const err86 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema74 = {"type":"object","additionalProperties":false,"required":["spec_version","kind","execution_id","status","identity","timing","finish_reason","warnings"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"execution-result"},"execution_id":{"$ref":"#/$defs/safeId"},"correlation_id":{"$ref":"#/$defs/safeId"},"provider_request_id":{"type":"string","minLength":1,"maxLength":200},"status":{"enum":["succeeded","failed","cancelled","timed-out"]},"identity":{"type":"object","additionalProperties":false,"required":["adapter_id","adapter_version","provider_id","model_id"],"properties":{"adapter_id":{"$ref":"#/$defs/namespace"},"adapter_version":{"$ref":"#/$defs/semver"},"provider_id":{"$ref":"#/$defs/safeId"},"model_id":{"$ref":"#/$defs/safeId"},"model_revision":{"type":"string","minLength":1,"maxLength":128}}},"timing":{"type":"object","additionalProperties":false,"required":["started_at","completed_at","duration_ms"],"properties":{"started_at":{"$ref":"#/$defs/timestamp"},"completed_at":{"$ref":"#/$defs/timestamp"},"duration_ms":{"type":"integer","minimum":0}}},"finish_reason":{"enum":["stop","length","content-filter","cancelled","error","unknown"]},"usage":{"$ref":"#/$defs/normalizedUsage"},"warnings":{"type":"array","items":{"$ref":"#/$defs/resultWarning"}},"output":{"$ref":"#/$defs/executionOutput"},"error":{"$ref":"#/$defs/executionError"}},"allOf":[{"if":{"properties":{"status":{"const":"succeeded"}},"required":["status"]},"then":{"required":["output"],"not":{"required":["error"]},"properties":{"finish_reason":{"enum":["stop","length","content-filter","unknown"]}}},"else":{"required":["error"],"not":{"required":["output"]}}},{"if":{"properties":{"status":{"const":"failed"}},"required":["status"]},"then":{"properties":{"finish_reason":{"const":"error"}}}},{"if":{"properties":{"status":{"const":"cancelled"}},"required":["status"]},"then":{"properties":{"finish_reason":{"const":"cancelled"},"error":{"properties":{"category":{"const":"cancelled"}}}}}},{"if":{"properties":{"status":{"const":"timed-out"}},"required":["status"]},"then":{"properties":{"finish_reason":{"const":"error"},"error":{"properties":{"category":{"const":"timeout"}}}}}}]};
const schema81 = {"type":"string","format":"date-time"};
const schema83 = {"type":"object","additionalProperties":false,"required":["provider_reported"],"properties":{"provider_reported":{"type":"boolean"},"input_tokens":{"type":"integer","minimum":0},"output_tokens":{"type":"integer","minimum":0},"total_tokens":{"type":"integer","minimum":0}}};
const schema84 = {"type":"object","additionalProperties":false,"required":["code","message"],"properties":{"code":{"type":"string","pattern":"^[A-Z][A-Z0-9_]{0,127}$"},"message":{"type":"string","minLength":1,"maxLength":1000},"details":{"type":"object"}}};
const pattern48 = new RegExp("^[A-Z][A-Z0-9_]{0,127}$", "u");
const formats6 = require("ajv-formats/dist/formats").fullFormats["date-time"];
const schema85 = {"type":"object","additionalProperties":false,"required":["kind","media_type","delivery","classification","byte_size","sha256"],"properties":{"kind":{"enum":["text","json"]},"media_type":{"enum":["text/plain","application/json"]},"delivery":{"enum":["inline","reference"]},"classification":{"$ref":"#/$defs/classification"},"byte_size":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha256"},"content":{"type":"string"},"reference":{"$ref":"#/$defs/artifactReference"}},"allOf":[{"if":{"properties":{"kind":{"const":"text"}},"required":["kind"]},"then":{"properties":{"media_type":{"const":"text/plain"}}},"else":{"properties":{"media_type":{"const":"application/json"}}}},{"if":{"properties":{"delivery":{"const":"inline"}},"required":["delivery"]},"then":{"required":["content"],"not":{"required":["reference"]}},"else":{"required":["reference"],"not":{"required":["content"]}}}]};
const schema88 = {"type":"object","additionalProperties":false,"required":["artifact_uri","media_type","byte_size","sha256"],"properties":{"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},"byte_size":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha256"}}};

function validate39(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate39.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.artifact_uri === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "artifact_uri"},message:"must have required property '"+"artifact_uri"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.media_type === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "media_type"},message:"must have required property '"+"media_type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.byte_size === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "byte_size"},message:"must have required property '"+"byte_size"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.sha256 === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "artifact_uri") || (key0 === "media_type")) || (key0 === "byte_size")) || (key0 === "sha256"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.artifact_uri !== undefined){
let data0 = data.artifact_uri;
if(typeof data0 === "string"){
if(!pattern34.test(data0)){
const err5 = {instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!(formats0(data0))){
const err6 = {instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.media_type !== undefined){
let data1 = data.media_type;
if(typeof data1 === "string"){
if(!pattern9.test(data1)){
const err8 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},message:"must match pattern \""+"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.byte_size !== undefined){
let data2 = data.byte_size;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err10 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 < 0 || isNaN(data2)){
const err11 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
if(data.sha256 !== undefined){
let data3 = data.sha256;
if(typeof data3 === "string"){
if(!pattern23.test(data3)){
const err12 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
else {
const err13 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
else {
const err14 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
validate39.errors = vErrors;
return errors === 0;
}
validate39.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate38(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate38.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.kind === undefined) && (missing0 = "kind")){
const err0 = {};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
if(data.kind !== undefined){
if("text" !== data.kind){
const err1 = {};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
}
}
var _valid0 = _errs3 === errors;
errors = _errs2;
if(vErrors !== null){
if(_errs2){
vErrors.length = _errs2;
}
else {
vErrors = null;
}
}
let ifClause0;
if(_valid0){
const _errs5 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.media_type !== undefined){
if("text/plain" !== data.media_type){
const err2 = {instancePath:instancePath+"/media_type",schemaPath:"#/allOf/0/then/properties/media_type/const",keyword:"const",params:{allowedValue: "text/plain"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.media_type = true;
props0.kind = true;
}
ifClause0 = "then";
}
else {
const _errs7 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.media_type !== undefined){
if("application/json" !== data.media_type){
const err3 = {instancePath:instancePath+"/media_type",schemaPath:"#/allOf/0/else/properties/media_type/const",keyword:"const",params:{allowedValue: "application/json"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
}
var _valid0 = _errs7 === errors;
valid1 = _valid0;
if(valid1){
if(props0 !== true){
props0 = props0 || {};
props0.media_type = true;
}
}
ifClause0 = "else";
}
if(!valid1){
const err4 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
const _errs10 = errors;
let valid5 = true;
const _errs11 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.delivery === undefined) && (missing1 = "delivery")){
const err5 = {};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
else {
if(data.delivery !== undefined){
if("inline" !== data.delivery){
const err6 = {};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
}
}
var _valid1 = _errs11 === errors;
errors = _errs10;
if(vErrors !== null){
if(_errs10){
vErrors.length = _errs10;
}
else {
vErrors = null;
}
}
let ifClause1;
if(_valid1){
const _errs13 = errors;
const _errs14 = errors;
const _errs15 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if((data.reference === undefined) && (missing2 = "reference")){
const err7 = {};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
var valid7 = _errs15 === errors;
if(valid7){
const err8 = {instancePath,schemaPath:"#/allOf/1/then/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
errors = _errs14;
if(vErrors !== null){
if(_errs14){
vErrors.length = _errs14;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.content === undefined){
const err9 = {instancePath,schemaPath:"#/allOf/1/then/required",keyword:"required",params:{missingProperty: "content"},message:"must have required property '"+"content"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
var _valid1 = _errs13 === errors;
valid5 = _valid1;
ifClause1 = "then";
}
else {
const _errs16 = errors;
const _errs17 = errors;
const _errs18 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing3;
if((data.content === undefined) && (missing3 = "content")){
const err10 = {};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
var valid8 = _errs18 === errors;
if(valid8){
const err11 = {instancePath,schemaPath:"#/allOf/1/else/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
else {
errors = _errs17;
if(vErrors !== null){
if(_errs17){
vErrors.length = _errs17;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.reference === undefined){
const err12 = {instancePath,schemaPath:"#/allOf/1/else/required",keyword:"required",params:{missingProperty: "reference"},message:"must have required property '"+"reference"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
var _valid1 = _errs16 === errors;
valid5 = _valid1;
ifClause1 = "else";
}
if(!valid5){
const err13 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: ifClause1},message:"must match \""+ifClause1+"\" schema"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(props0 !== true){
props0 = props0 || {};
props0.delivery = true;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.media_type === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "media_type"},message:"must have required property '"+"media_type"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.delivery === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "delivery"},message:"must have required property '"+"delivery"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.classification === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "classification"},message:"must have required property '"+"classification"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.byte_size === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "byte_size"},message:"must have required property '"+"byte_size"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.sha256 === undefined){
const err19 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "kind") || (key0 === "media_type")) || (key0 === "delivery")) || (key0 === "classification")) || (key0 === "byte_size")) || (key0 === "sha256")) || (key0 === "content")) || (key0 === "reference"))){
const err20 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.kind !== undefined){
let data4 = data.kind;
if(!((data4 === "text") || (data4 === "json"))){
const err21 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema85.properties.kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.media_type !== undefined){
let data5 = data.media_type;
if(!((data5 === "text/plain") || (data5 === "application/json"))){
const err22 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/enum",keyword:"enum",params:{allowedValues: schema85.properties.media_type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.delivery !== undefined){
let data6 = data.delivery;
if(!((data6 === "inline") || (data6 === "reference"))){
const err23 = {instancePath:instancePath+"/delivery",schemaPath:"#/properties/delivery/enum",keyword:"enum",params:{allowedValues: schema85.properties.delivery.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.classification !== undefined){
let data7 = data.classification;
if(!((((data7 === "public") || (data7 === "internal")) || (data7 === "confidential")) || (data7 === "restricted"))){
const err24 = {instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema51.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.byte_size !== undefined){
let data8 = data.byte_size;
if(!(((typeof data8 == "number") && (!(data8 % 1) && !isNaN(data8))) && (isFinite(data8)))){
const err25 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if((typeof data8 == "number") && (isFinite(data8))){
if(data8 < 0 || isNaN(data8)){
const err26 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
if(data.sha256 !== undefined){
let data9 = data.sha256;
if(typeof data9 === "string"){
if(!pattern23.test(data9)){
const err27 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
else {
const err28 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.content !== undefined){
if(typeof data.content !== "string"){
const err29 = {instancePath:instancePath+"/content",schemaPath:"#/properties/content/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.reference !== undefined){
if(!(validate39(data.reference, {instancePath:instancePath+"/reference",parentData:data,parentDataProperty:"reference",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
errors = vErrors.length;
}
}
}
else {
const err30 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
validate38.errors = vErrors;
return errors === 0;
}
validate38.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema91 = {"type":"object","additionalProperties":false,"required":["category","code","message","retryable","stage"],"properties":{"category":{"enum":["invalid-request","authentication","authorization","not-found","capability-mismatch","rate-limit","quota","content-policy","timeout","cancelled","provider-unavailable","transport","invalid-provider-response","output-validation","internal"]},"code":{"type":"string","pattern":"^[A-Z][A-Z0-9_]{0,127}$"},"message":{"type":"string","minLength":1,"maxLength":1000},"retryable":{"type":"boolean"},"stage":{"enum":["preflight","adapter","transport","provider","normalization","output-validation","provenance"]},"retry_after_ms":{"type":"integer","minimum":1,"maximum":86400000},"provider":{"type":"object","additionalProperties":false,"properties":{"code":{"type":"string","minLength":1,"maxLength":200},"http_status":{"type":"integer","minimum":100,"maximum":599},"request_id":{"type":"string","minLength":1,"maxLength":200},"details_reference":{"$ref":"#/$defs/absoluteUri"}}}}};

function validate42(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate42.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.category === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "category"},message:"must have required property '"+"category"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.code === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.message === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "message"},message:"must have required property '"+"message"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.retryable === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "retryable"},message:"must have required property '"+"retryable"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.stage === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "category") || (key0 === "code")) || (key0 === "message")) || (key0 === "retryable")) || (key0 === "stage")) || (key0 === "retry_after_ms")) || (key0 === "provider"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.category !== undefined){
let data0 = data.category;
if(!(((((((((((((((data0 === "invalid-request") || (data0 === "authentication")) || (data0 === "authorization")) || (data0 === "not-found")) || (data0 === "capability-mismatch")) || (data0 === "rate-limit")) || (data0 === "quota")) || (data0 === "content-policy")) || (data0 === "timeout")) || (data0 === "cancelled")) || (data0 === "provider-unavailable")) || (data0 === "transport")) || (data0 === "invalid-provider-response")) || (data0 === "output-validation")) || (data0 === "internal"))){
const err6 = {instancePath:instancePath+"/category",schemaPath:"#/properties/category/enum",keyword:"enum",params:{allowedValues: schema91.properties.category.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.code !== undefined){
let data1 = data.code;
if(typeof data1 === "string"){
if(!pattern48.test(data1)){
const err7 = {instancePath:instancePath+"/code",schemaPath:"#/properties/code/pattern",keyword:"pattern",params:{pattern: "^[A-Z][A-Z0-9_]{0,127}$"},message:"must match pattern \""+"^[A-Z][A-Z0-9_]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
else {
const err8 = {instancePath:instancePath+"/code",schemaPath:"#/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.message !== undefined){
let data2 = data.message;
if(typeof data2 === "string"){
if(func2(data2) > 1000){
const err9 = {instancePath:instancePath+"/message",schemaPath:"#/properties/message/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(func2(data2) < 1){
const err10 = {instancePath:instancePath+"/message",schemaPath:"#/properties/message/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
else {
const err11 = {instancePath:instancePath+"/message",schemaPath:"#/properties/message/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.retryable !== undefined){
if(typeof data.retryable !== "boolean"){
const err12 = {instancePath:instancePath+"/retryable",schemaPath:"#/properties/retryable/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.stage !== undefined){
let data4 = data.stage;
if(!(((((((data4 === "preflight") || (data4 === "adapter")) || (data4 === "transport")) || (data4 === "provider")) || (data4 === "normalization")) || (data4 === "output-validation")) || (data4 === "provenance"))){
const err13 = {instancePath:instancePath+"/stage",schemaPath:"#/properties/stage/enum",keyword:"enum",params:{allowedValues: schema91.properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.retry_after_ms !== undefined){
let data5 = data.retry_after_ms;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err14 = {instancePath:instancePath+"/retry_after_ms",schemaPath:"#/properties/retry_after_ms/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 86400000 || isNaN(data5)){
const err15 = {instancePath:instancePath+"/retry_after_ms",schemaPath:"#/properties/retry_after_ms/maximum",keyword:"maximum",params:{comparison: "<=", limit: 86400000},message:"must be <= 86400000"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data5 < 1 || isNaN(data5)){
const err16 = {instancePath:instancePath+"/retry_after_ms",schemaPath:"#/properties/retry_after_ms/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
}
if(data.provider !== undefined){
let data6 = data.provider;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
for(const key1 in data6){
if(!((((key1 === "code") || (key1 === "http_status")) || (key1 === "request_id")) || (key1 === "details_reference"))){
const err17 = {instancePath:instancePath+"/provider",schemaPath:"#/properties/provider/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data6.code !== undefined){
let data7 = data6.code;
if(typeof data7 === "string"){
if(func2(data7) > 200){
const err18 = {instancePath:instancePath+"/provider/code",schemaPath:"#/properties/provider/properties/code/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(func2(data7) < 1){
const err19 = {instancePath:instancePath+"/provider/code",schemaPath:"#/properties/provider/properties/code/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
else {
const err20 = {instancePath:instancePath+"/provider/code",schemaPath:"#/properties/provider/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data6.http_status !== undefined){
let data8 = data6.http_status;
if(!(((typeof data8 == "number") && (!(data8 % 1) && !isNaN(data8))) && (isFinite(data8)))){
const err21 = {instancePath:instancePath+"/provider/http_status",schemaPath:"#/properties/provider/properties/http_status/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if((typeof data8 == "number") && (isFinite(data8))){
if(data8 > 599 || isNaN(data8)){
const err22 = {instancePath:instancePath+"/provider/http_status",schemaPath:"#/properties/provider/properties/http_status/maximum",keyword:"maximum",params:{comparison: "<=", limit: 599},message:"must be <= 599"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data8 < 100 || isNaN(data8)){
const err23 = {instancePath:instancePath+"/provider/http_status",schemaPath:"#/properties/provider/properties/http_status/minimum",keyword:"minimum",params:{comparison: ">=", limit: 100},message:"must be >= 100"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
}
if(data6.request_id !== undefined){
let data9 = data6.request_id;
if(typeof data9 === "string"){
if(func2(data9) > 200){
const err24 = {instancePath:instancePath+"/provider/request_id",schemaPath:"#/properties/provider/properties/request_id/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(func2(data9) < 1){
const err25 = {instancePath:instancePath+"/provider/request_id",schemaPath:"#/properties/provider/properties/request_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
else {
const err26 = {instancePath:instancePath+"/provider/request_id",schemaPath:"#/properties/provider/properties/request_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data6.details_reference !== undefined){
let data10 = data6.details_reference;
if(typeof data10 === "string"){
if(!pattern34.test(data10)){
const err27 = {instancePath:instancePath+"/provider/details_reference",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(!(formats0(data10))){
const err28 = {instancePath:instancePath+"/provider/details_reference",schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
else {
const err29 = {instancePath:instancePath+"/provider/details_reference",schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
}
else {
const err30 = {instancePath:instancePath+"/provider",schemaPath:"#/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
else {
const err31 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
validate42.errors = vErrors;
return errors === 0;
}
validate42.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate37(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate37.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.status === undefined) && (missing0 = "status")){
const err0 = {};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
if(data.status !== undefined){
if("succeeded" !== data.status){
const err1 = {};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
}
}
var _valid0 = _errs3 === errors;
errors = _errs2;
if(vErrors !== null){
if(_errs2){
vErrors.length = _errs2;
}
else {
vErrors = null;
}
}
let ifClause0;
if(_valid0){
const _errs5 = errors;
const _errs6 = errors;
const _errs7 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.error === undefined) && (missing1 = "error")){
const err2 = {};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
var valid3 = _errs7 === errors;
if(valid3){
const err3 = {instancePath,schemaPath:"#/allOf/0/then/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
else {
errors = _errs6;
if(vErrors !== null){
if(_errs6){
vErrors.length = _errs6;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.output === undefined){
const err4 = {instancePath,schemaPath:"#/allOf/0/then/required",keyword:"required",params:{missingProperty: "output"},message:"must have required property '"+"output"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.finish_reason !== undefined){
let data1 = data.finish_reason;
if(!((((data1 === "stop") || (data1 === "length")) || (data1 === "content-filter")) || (data1 === "unknown"))){
const err5 = {instancePath:instancePath+"/finish_reason",schemaPath:"#/allOf/0/then/properties/finish_reason/enum",keyword:"enum",params:{allowedValues: schema74.allOf[0].then.properties.finish_reason.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.finish_reason = true;
props0.status = true;
}
ifClause0 = "then";
}
else {
const _errs9 = errors;
const _errs10 = errors;
const _errs11 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if((data.output === undefined) && (missing2 = "output")){
const err6 = {};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
var valid5 = _errs11 === errors;
if(valid5){
const err7 = {instancePath,schemaPath:"#/allOf/0/else/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
else {
errors = _errs10;
if(vErrors !== null){
if(_errs10){
vErrors.length = _errs10;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.error === undefined){
const err8 = {instancePath,schemaPath:"#/allOf/0/else/required",keyword:"required",params:{missingProperty: "error"},message:"must have required property '"+"error"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
var _valid0 = _errs9 === errors;
valid1 = _valid0;
ifClause0 = "else";
}
if(!valid1){
const err9 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
const _errs13 = errors;
let valid6 = true;
const _errs14 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing3;
if((data.status === undefined) && (missing3 = "status")){
const err10 = {};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
else {
if(data.status !== undefined){
if("failed" !== data.status){
const err11 = {};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
}
var _valid1 = _errs14 === errors;
errors = _errs13;
if(vErrors !== null){
if(_errs13){
vErrors.length = _errs13;
}
else {
vErrors = null;
}
}
if(_valid1){
const _errs16 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.finish_reason !== undefined){
if("error" !== data.finish_reason){
const err12 = {instancePath:instancePath+"/finish_reason",schemaPath:"#/allOf/1/then/properties/finish_reason/const",keyword:"const",params:{allowedValue: "error"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
var _valid1 = _errs16 === errors;
valid6 = _valid1;
if(valid6){
var props1 = {};
props1.finish_reason = true;
props1.status = true;
}
}
if(!valid6){
const err13 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(props0 !== true && props1 !== undefined){
if(props1 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props1);
}
}
const _errs19 = errors;
let valid9 = true;
const _errs20 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing4;
if((data.status === undefined) && (missing4 = "status")){
const err14 = {};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
else {
if(data.status !== undefined){
if("cancelled" !== data.status){
const err15 = {};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
}
}
var _valid2 = _errs20 === errors;
errors = _errs19;
if(vErrors !== null){
if(_errs19){
vErrors.length = _errs19;
}
else {
vErrors = null;
}
}
if(_valid2){
const _errs22 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.finish_reason !== undefined){
if("cancelled" !== data.finish_reason){
const err16 = {instancePath:instancePath+"/finish_reason",schemaPath:"#/allOf/2/then/properties/finish_reason/const",keyword:"const",params:{allowedValue: "cancelled"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.error !== undefined){
let data6 = data.error;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.category !== undefined){
if("cancelled" !== data6.category){
const err17 = {instancePath:instancePath+"/error/category",schemaPath:"#/allOf/2/then/properties/error/properties/category/const",keyword:"const",params:{allowedValue: "cancelled"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
}
}
}
var _valid2 = _errs22 === errors;
valid9 = _valid2;
if(valid9){
var props2 = {};
props2.finish_reason = true;
props2.error = true;
props2.status = true;
}
}
if(!valid9){
const err18 = {instancePath,schemaPath:"#/allOf/2/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(props0 !== true && props2 !== undefined){
if(props2 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props2);
}
}
const _errs27 = errors;
let valid13 = true;
const _errs28 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing5;
if((data.status === undefined) && (missing5 = "status")){
const err19 = {};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
else {
if(data.status !== undefined){
if("timed-out" !== data.status){
const err20 = {};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
}
var _valid3 = _errs28 === errors;
errors = _errs27;
if(vErrors !== null){
if(_errs27){
vErrors.length = _errs27;
}
else {
vErrors = null;
}
}
if(_valid3){
const _errs30 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.finish_reason !== undefined){
if("error" !== data.finish_reason){
const err21 = {instancePath:instancePath+"/finish_reason",schemaPath:"#/allOf/3/then/properties/finish_reason/const",keyword:"const",params:{allowedValue: "error"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.error !== undefined){
let data10 = data.error;
if(data10 && typeof data10 == "object" && !Array.isArray(data10)){
if(data10.category !== undefined){
if("timeout" !== data10.category){
const err22 = {instancePath:instancePath+"/error/category",schemaPath:"#/allOf/3/then/properties/error/properties/category/const",keyword:"const",params:{allowedValue: "timeout"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
}
}
}
var _valid3 = _errs30 === errors;
valid13 = _valid3;
if(valid13){
var props3 = {};
props3.finish_reason = true;
props3.error = true;
props3.status = true;
}
}
if(!valid13){
const err23 = {instancePath,schemaPath:"#/allOf/3/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(props0 !== true && props3 !== undefined){
if(props3 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props3);
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.spec_version === undefined){
const err24 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "spec_version"},message:"must have required property '"+"spec_version"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data.kind === undefined){
const err25 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data.execution_id === undefined){
const err26 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "execution_id"},message:"must have required property '"+"execution_id"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data.status === undefined){
const err27 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data.identity === undefined){
const err28 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "identity"},message:"must have required property '"+"identity"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data.timing === undefined){
const err29 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "timing"},message:"must have required property '"+"timing"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data.finish_reason === undefined){
const err30 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "finish_reason"},message:"must have required property '"+"finish_reason"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data.warnings === undefined){
const err31 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "warnings"},message:"must have required property '"+"warnings"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema74.properties, key0))){
const err32 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.spec_version !== undefined){
if("1.0.0" !== data.spec_version){
const err33 = {instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.kind !== undefined){
if("execution-result" !== data.kind){
const err34 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "execution-result"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data.execution_id !== undefined){
let data14 = data.execution_id;
if(typeof data14 === "string"){
if(!pattern6.test(data14)){
const err35 = {instancePath:instancePath+"/execution_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
else {
const err36 = {instancePath:instancePath+"/execution_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data.correlation_id !== undefined){
let data15 = data.correlation_id;
if(typeof data15 === "string"){
if(!pattern6.test(data15)){
const err37 = {instancePath:instancePath+"/correlation_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
else {
const err38 = {instancePath:instancePath+"/correlation_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data.provider_request_id !== undefined){
let data16 = data.provider_request_id;
if(typeof data16 === "string"){
if(func2(data16) > 200){
const err39 = {instancePath:instancePath+"/provider_request_id",schemaPath:"#/properties/provider_request_id/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(func2(data16) < 1){
const err40 = {instancePath:instancePath+"/provider_request_id",schemaPath:"#/properties/provider_request_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
else {
const err41 = {instancePath:instancePath+"/provider_request_id",schemaPath:"#/properties/provider_request_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data.status !== undefined){
let data17 = data.status;
if(!((((data17 === "succeeded") || (data17 === "failed")) || (data17 === "cancelled")) || (data17 === "timed-out"))){
const err42 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema74.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.identity !== undefined){
let data18 = data.identity;
if(data18 && typeof data18 == "object" && !Array.isArray(data18)){
if(data18.adapter_id === undefined){
const err43 = {instancePath:instancePath+"/identity",schemaPath:"#/properties/identity/required",keyword:"required",params:{missingProperty: "adapter_id"},message:"must have required property '"+"adapter_id"+"'"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data18.adapter_version === undefined){
const err44 = {instancePath:instancePath+"/identity",schemaPath:"#/properties/identity/required",keyword:"required",params:{missingProperty: "adapter_version"},message:"must have required property '"+"adapter_version"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data18.provider_id === undefined){
const err45 = {instancePath:instancePath+"/identity",schemaPath:"#/properties/identity/required",keyword:"required",params:{missingProperty: "provider_id"},message:"must have required property '"+"provider_id"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data18.model_id === undefined){
const err46 = {instancePath:instancePath+"/identity",schemaPath:"#/properties/identity/required",keyword:"required",params:{missingProperty: "model_id"},message:"must have required property '"+"model_id"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
for(const key1 in data18){
if(!(((((key1 === "adapter_id") || (key1 === "adapter_version")) || (key1 === "provider_id")) || (key1 === "model_id")) || (key1 === "model_revision"))){
const err47 = {instancePath:instancePath+"/identity",schemaPath:"#/properties/identity/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data18.adapter_id !== undefined){
let data19 = data18.adapter_id;
if(typeof data19 === "string"){
if(func2(data19) > 128){
const err48 = {instancePath:instancePath+"/identity/adapter_id",schemaPath:"#/$defs/namespace/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(!pattern4.test(data19)){
const err49 = {instancePath:instancePath+"/identity/adapter_id",schemaPath:"#/$defs/namespace/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"},message:"must match pattern \""+"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"+"\""};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
else {
const err50 = {instancePath:instancePath+"/identity/adapter_id",schemaPath:"#/$defs/namespace/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data18.adapter_version !== undefined){
let data20 = data18.adapter_version;
if(typeof data20 === "string"){
if(!pattern5.test(data20)){
const err51 = {instancePath:instancePath+"/identity/adapter_version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"+"\""};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
else {
const err52 = {instancePath:instancePath+"/identity/adapter_version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data18.provider_id !== undefined){
let data21 = data18.provider_id;
if(typeof data21 === "string"){
if(!pattern6.test(data21)){
const err53 = {instancePath:instancePath+"/identity/provider_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
else {
const err54 = {instancePath:instancePath+"/identity/provider_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data18.model_id !== undefined){
let data22 = data18.model_id;
if(typeof data22 === "string"){
if(!pattern6.test(data22)){
const err55 = {instancePath:instancePath+"/identity/model_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
else {
const err56 = {instancePath:instancePath+"/identity/model_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data18.model_revision !== undefined){
let data23 = data18.model_revision;
if(typeof data23 === "string"){
if(func2(data23) > 128){
const err57 = {instancePath:instancePath+"/identity/model_revision",schemaPath:"#/properties/identity/properties/model_revision/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(func2(data23) < 1){
const err58 = {instancePath:instancePath+"/identity/model_revision",schemaPath:"#/properties/identity/properties/model_revision/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
else {
const err59 = {instancePath:instancePath+"/identity/model_revision",schemaPath:"#/properties/identity/properties/model_revision/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
}
else {
const err60 = {instancePath:instancePath+"/identity",schemaPath:"#/properties/identity/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(data.timing !== undefined){
let data24 = data.timing;
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
if(data24.started_at === undefined){
const err61 = {instancePath:instancePath+"/timing",schemaPath:"#/properties/timing/required",keyword:"required",params:{missingProperty: "started_at"},message:"must have required property '"+"started_at"+"'"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data24.completed_at === undefined){
const err62 = {instancePath:instancePath+"/timing",schemaPath:"#/properties/timing/required",keyword:"required",params:{missingProperty: "completed_at"},message:"must have required property '"+"completed_at"+"'"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(data24.duration_ms === undefined){
const err63 = {instancePath:instancePath+"/timing",schemaPath:"#/properties/timing/required",keyword:"required",params:{missingProperty: "duration_ms"},message:"must have required property '"+"duration_ms"+"'"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
for(const key2 in data24){
if(!(((key2 === "started_at") || (key2 === "completed_at")) || (key2 === "duration_ms"))){
const err64 = {instancePath:instancePath+"/timing",schemaPath:"#/properties/timing/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(data24.started_at !== undefined){
let data25 = data24.started_at;
if(typeof data25 === "string"){
if(!(formats6.validate(data25))){
const err65 = {instancePath:instancePath+"/timing/started_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
else {
const err66 = {instancePath:instancePath+"/timing/started_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data24.completed_at !== undefined){
let data26 = data24.completed_at;
if(typeof data26 === "string"){
if(!(formats6.validate(data26))){
const err67 = {instancePath:instancePath+"/timing/completed_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
else {
const err68 = {instancePath:instancePath+"/timing/completed_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data24.duration_ms !== undefined){
let data27 = data24.duration_ms;
if(!(((typeof data27 == "number") && (!(data27 % 1) && !isNaN(data27))) && (isFinite(data27)))){
const err69 = {instancePath:instancePath+"/timing/duration_ms",schemaPath:"#/properties/timing/properties/duration_ms/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if((typeof data27 == "number") && (isFinite(data27))){
if(data27 < 0 || isNaN(data27)){
const err70 = {instancePath:instancePath+"/timing/duration_ms",schemaPath:"#/properties/timing/properties/duration_ms/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
}
}
else {
const err71 = {instancePath:instancePath+"/timing",schemaPath:"#/properties/timing/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(data.finish_reason !== undefined){
let data28 = data.finish_reason;
if(!((((((data28 === "stop") || (data28 === "length")) || (data28 === "content-filter")) || (data28 === "cancelled")) || (data28 === "error")) || (data28 === "unknown"))){
const err72 = {instancePath:instancePath+"/finish_reason",schemaPath:"#/properties/finish_reason/enum",keyword:"enum",params:{allowedValues: schema74.properties.finish_reason.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data.usage !== undefined){
let data29 = data.usage;
if(data29 && typeof data29 == "object" && !Array.isArray(data29)){
if(data29.provider_reported === undefined){
const err73 = {instancePath:instancePath+"/usage",schemaPath:"#/$defs/normalizedUsage/required",keyword:"required",params:{missingProperty: "provider_reported"},message:"must have required property '"+"provider_reported"+"'"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
for(const key3 in data29){
if(!((((key3 === "provider_reported") || (key3 === "input_tokens")) || (key3 === "output_tokens")) || (key3 === "total_tokens"))){
const err74 = {instancePath:instancePath+"/usage",schemaPath:"#/$defs/normalizedUsage/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data29.provider_reported !== undefined){
if(typeof data29.provider_reported !== "boolean"){
const err75 = {instancePath:instancePath+"/usage/provider_reported",schemaPath:"#/$defs/normalizedUsage/properties/provider_reported/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(data29.input_tokens !== undefined){
let data31 = data29.input_tokens;
if(!(((typeof data31 == "number") && (!(data31 % 1) && !isNaN(data31))) && (isFinite(data31)))){
const err76 = {instancePath:instancePath+"/usage/input_tokens",schemaPath:"#/$defs/normalizedUsage/properties/input_tokens/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if((typeof data31 == "number") && (isFinite(data31))){
if(data31 < 0 || isNaN(data31)){
const err77 = {instancePath:instancePath+"/usage/input_tokens",schemaPath:"#/$defs/normalizedUsage/properties/input_tokens/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
}
if(data29.output_tokens !== undefined){
let data32 = data29.output_tokens;
if(!(((typeof data32 == "number") && (!(data32 % 1) && !isNaN(data32))) && (isFinite(data32)))){
const err78 = {instancePath:instancePath+"/usage/output_tokens",schemaPath:"#/$defs/normalizedUsage/properties/output_tokens/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if((typeof data32 == "number") && (isFinite(data32))){
if(data32 < 0 || isNaN(data32)){
const err79 = {instancePath:instancePath+"/usage/output_tokens",schemaPath:"#/$defs/normalizedUsage/properties/output_tokens/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
}
if(data29.total_tokens !== undefined){
let data33 = data29.total_tokens;
if(!(((typeof data33 == "number") && (!(data33 % 1) && !isNaN(data33))) && (isFinite(data33)))){
const err80 = {instancePath:instancePath+"/usage/total_tokens",schemaPath:"#/$defs/normalizedUsage/properties/total_tokens/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if((typeof data33 == "number") && (isFinite(data33))){
if(data33 < 0 || isNaN(data33)){
const err81 = {instancePath:instancePath+"/usage/total_tokens",schemaPath:"#/$defs/normalizedUsage/properties/total_tokens/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
}
}
else {
const err82 = {instancePath:instancePath+"/usage",schemaPath:"#/$defs/normalizedUsage/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
if(data.warnings !== undefined){
let data34 = data.warnings;
if(Array.isArray(data34)){
const len0 = data34.length;
for(let i0=0; i0<len0; i0++){
let data35 = data34[i0];
if(data35 && typeof data35 == "object" && !Array.isArray(data35)){
if(data35.code === undefined){
const err83 = {instancePath:instancePath+"/warnings/" + i0,schemaPath:"#/$defs/resultWarning/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data35.message === undefined){
const err84 = {instancePath:instancePath+"/warnings/" + i0,schemaPath:"#/$defs/resultWarning/required",keyword:"required",params:{missingProperty: "message"},message:"must have required property '"+"message"+"'"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
for(const key4 in data35){
if(!(((key4 === "code") || (key4 === "message")) || (key4 === "details"))){
const err85 = {instancePath:instancePath+"/warnings/" + i0,schemaPath:"#/$defs/resultWarning/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(data35.code !== undefined){
let data36 = data35.code;
if(typeof data36 === "string"){
if(!pattern48.test(data36)){
const err86 = {instancePath:instancePath+"/warnings/" + i0+"/code",schemaPath:"#/$defs/resultWarning/properties/code/pattern",keyword:"pattern",params:{pattern: "^[A-Z][A-Z0-9_]{0,127}$"},message:"must match pattern \""+"^[A-Z][A-Z0-9_]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
else {
const err87 = {instancePath:instancePath+"/warnings/" + i0+"/code",schemaPath:"#/$defs/resultWarning/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
if(data35.message !== undefined){
let data37 = data35.message;
if(typeof data37 === "string"){
if(func2(data37) > 1000){
const err88 = {instancePath:instancePath+"/warnings/" + i0+"/message",schemaPath:"#/$defs/resultWarning/properties/message/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if(func2(data37) < 1){
const err89 = {instancePath:instancePath+"/warnings/" + i0+"/message",schemaPath:"#/$defs/resultWarning/properties/message/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
else {
const err90 = {instancePath:instancePath+"/warnings/" + i0+"/message",schemaPath:"#/$defs/resultWarning/properties/message/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(data35.details !== undefined){
let data38 = data35.details;
if(!(data38 && typeof data38 == "object" && !Array.isArray(data38))){
const err91 = {instancePath:instancePath+"/warnings/" + i0+"/details",schemaPath:"#/$defs/resultWarning/properties/details/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
}
else {
const err92 = {instancePath:instancePath+"/warnings/" + i0,schemaPath:"#/$defs/resultWarning/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
}
else {
const err93 = {instancePath:instancePath+"/warnings",schemaPath:"#/properties/warnings/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
if(data.output !== undefined){
if(!(validate38(data.output, {instancePath:instancePath+"/output",parentData:data,parentDataProperty:"output",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate38.errors : vErrors.concat(validate38.errors);
errors = vErrors.length;
}
}
if(data.error !== undefined){
if(!(validate42(data.error, {instancePath:instancePath+"/error",parentData:data,parentDataProperty:"error",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate42.errors : vErrors.concat(validate42.errors);
errors = vErrors.length;
}
}
}
else {
const err94 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
validate37.errors = vErrors;
return errors === 0;
}
validate37.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:definitely-secure:contract:provider-execution:1.0.0:provider-execution" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate20.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(!(validate21(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate25(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
errors = vErrors.length;
}
var _valid0 = _errs2 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs3 = errors;
if(!(validate37(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate37.errors : vErrors.concat(validate37.errors);
errors = vErrors.length;
}
var _valid0 = _errs3 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
}
}
if(!valid0){
const err0 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate20.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate20.evaluated = {"dynamicProps":true,"dynamicItems":false};
