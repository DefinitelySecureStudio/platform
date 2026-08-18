// Generated from DefinitelySecureStudio/codex@bd31b6249e068d3317306afb857d68024f2929be
// Source SHA-256: 6ac345956582d25c2db9c81b85cab9c73b2cbcfc79b8aac7a43d847c07173cb9
// Rebuild with scripts/generate-prompt-schema-validator.mjs; do not edit manually.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
"use strict";
export const validate = validate20;
export default validate20;
const schema31 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:definitely-secure:contract:prompt-definition:1.0.0:prompt-definition","title":"Definitely Secure Studio Prompt Definition v1.0.0","description":"Portable provider-neutral definition of one versioned Studio prompt.","type":"object","additionalProperties":false,"required":["spec_version","id","version","name","description","purpose","owners","lifecycle","inputs","context_slots","template","capabilities","output","provenance","governance"],"properties":{"spec_version":{"const":"1.0.0"},"id":{"$ref":"#/$defs/promptId"},"version":{"$ref":"#/$defs/semver"},"name":{"type":"string","minLength":1,"maxLength":120},"description":{"type":"string","minLength":1,"maxLength":1000},"purpose":{"type":"string","minLength":1,"maxLength":2000},"owners":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/owner"}},"lifecycle":{"$ref":"#/$defs/lifecycle"},"tags":{"type":"array","uniqueItems":true,"items":{"type":"string","pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$","maxLength":64}},"inputs":{"type":"array","items":{"$ref":"#/$defs/input"}},"context_slots":{"type":"array","items":{"$ref":"#/$defs/contextSlot"}},"template":{"$ref":"#/$defs/template"},"capabilities":{"$ref":"#/$defs/capabilities"},"output":{"$ref":"#/$defs/output"},"provenance":{"$ref":"#/$defs/provenance"},"governance":{"$ref":"#/$defs/governance"},"extensions":{"type":"object","propertyNames":{"pattern":"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"},"additionalProperties":{"$ref":"#/$defs/extension"}}},"$defs":{"semver":{"type":"string","pattern":"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"},"promptId":{"type":"string","pattern":"^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$","maxLength":255},"symbol":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,63}$"},"owner":{"type":"string","pattern":"^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"},"classification":{"enum":["public","internal","confidential","restricted"]},"absoluteUri":{"type":"string","format":"uri","pattern":"^[A-Za-z][A-Za-z0-9+.-]*:"},"timestamp":{"type":"string","format":"date-time"},"lifecycle":{"type":"object","additionalProperties":false,"required":["status"],"properties":{"status":{"enum":["draft","experimental","stable","deprecated","retired"]},"deprecation":{"$ref":"#/$defs/deprecation"}},"allOf":[{"if":{"properties":{"status":{"enum":["deprecated","retired"]}},"required":["status"]},"then":{"required":["deprecation"]},"else":{"not":{"required":["deprecation"]}}}]},"deprecation":{"type":"object","additionalProperties":false,"required":["deprecated_at","reason","support_until"],"properties":{"deprecated_at":{"$ref":"#/$defs/timestamp"},"reason":{"type":"string","minLength":1,"maxLength":1000},"support_until":{"$ref":"#/$defs/timestamp"},"replacement":{"type":"object","additionalProperties":false,"required":["id","version"],"properties":{"id":{"$ref":"#/$defs/promptId"},"version":{"$ref":"#/$defs/semver"}}},"no_replacement_reason":{"type":"string","minLength":1,"maxLength":1000}},"oneOf":[{"required":["replacement"],"not":{"required":["no_replacement_reason"]}},{"required":["no_replacement_reason"],"not":{"required":["replacement"]}}]},"input":{"type":"object","additionalProperties":false,"required":["name","description","type","required","classification"],"properties":{"name":{"$ref":"#/$defs/symbol"},"description":{"type":"string","minLength":1,"maxLength":1000},"type":{"enum":["string","integer","number","boolean","object","array"]},"required":{"type":"boolean"},"classification":{"$ref":"#/$defs/classification"},"constraints":{"$ref":"#/$defs/constraints"},"default":true},"allOf":[{"if":{"properties":{"required":{"const":true}},"required":["required"]},"then":{"not":{"required":["default"]}}}]},"constraints":{"type":"object","additionalProperties":false,"minProperties":1,"properties":{"enum":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":["string","number","integer","boolean","null"]}},"min_length":{"type":"integer","minimum":0},"max_length":{"type":"integer","minimum":0},"pattern":{"type":"string","minLength":1},"minimum":{"type":"number"},"maximum":{"type":"number"},"min_items":{"type":"integer","minimum":0},"max_items":{"type":"integer","minimum":0}}},"contextSlot":{"type":"object","additionalProperties":false,"required":["name","description","required","accepted_classifications"],"properties":{"name":{"$ref":"#/$defs/symbol"},"description":{"type":"string","minLength":1,"maxLength":1000},"required":{"type":"boolean"},"accepted_classifications":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/classification"}},"accepted_media_types":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"}},"max_bytes":{"type":"integer","minimum":1}}},"template":{"type":"object","additionalProperties":false,"required":["format","messages"],"properties":{"format":{"const":"studio-messages-v1"},"messages":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/message"}}}},"message":{"type":"object","additionalProperties":false,"required":["role","parts"],"properties":{"role":{"enum":["instruction","user","assistant-example"]},"parts":{"type":"array","minItems":1,"items":{"oneOf":[{"$ref":"#/$defs/textPart"},{"$ref":"#/$defs/inputPart"},{"$ref":"#/$defs/contextPart"}]}}}},"textPart":{"type":"object","additionalProperties":false,"required":["type","text"],"properties":{"type":{"const":"text"},"text":{"type":"string","minLength":1}}},"inputPart":{"type":"object","additionalProperties":false,"required":["type","name"],"properties":{"type":{"const":"input"},"name":{"$ref":"#/$defs/symbol"},"format":{"enum":["text","json"],"default":"text"}}},"contextPart":{"type":"object","additionalProperties":false,"required":["type","slot"],"properties":{"type":{"const":"context"},"slot":{"$ref":"#/$defs/symbol"},"format":{"enum":["text","json"],"default":"text"}}},"capability":{"type":"string","pattern":"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*$","maxLength":128},"capabilities":{"type":"object","additionalProperties":false,"required":["required","optional"],"properties":{"required":{"type":"array","minItems":1,"uniqueItems":true,"contains":{"const":"text-generation"},"items":{"$ref":"#/$defs/capability"}},"optional":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/capability"}}}},"output":{"type":"object","additionalProperties":false,"required":["kind","media_type","description"],"properties":{"kind":{"enum":["text","json"]},"media_type":{"enum":["text/plain","application/json"]},"description":{"type":"string","minLength":1,"maxLength":2000},"schema":{"$ref":"#/$defs/artifactSchemaReference"}},"allOf":[{"if":{"properties":{"kind":{"const":"text"}},"required":["kind"]},"then":{"properties":{"media_type":{"const":"text/plain"}},"not":{"required":["schema"]}},"else":{"properties":{"media_type":{"const":"application/json"}}}}]},"artifactSchemaReference":{"type":"object","additionalProperties":false,"required":["schema_id","repository","contract","version","tag","commit","artifact_uri","media_type","byte_size","sha256"],"properties":{"schema_id":{"type":"string","minLength":1,"maxLength":500},"repository":{"type":"string","pattern":"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"},"contract":{"type":"string","pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$"},"version":{"$ref":"#/$defs/semver"},"tag":{"type":"string","pattern":"^contract/[a-z0-9]+(?:-[a-z0-9]+)*/v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"},"commit":{"type":"string","pattern":"^[0-9a-f]{40}$"},"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"const":"application/schema+json"},"byte_size":{"type":"integer","minimum":1},"sha256":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"}}},"provenance":{"type":"object","additionalProperties":false,"required":["origin","created_by","created_at","source_references","rights"],"properties":{"origin":{"enum":["studio-original","promoted-experiment","derived","third-party"]},"created_by":{"$ref":"#/$defs/owner"},"created_at":{"$ref":"#/$defs/timestamp"},"source_references":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/absoluteUri"}},"rights":{"$ref":"#/$defs/rights"}},"allOf":[{"if":{"properties":{"origin":{"enum":["promoted-experiment","derived","third-party"]}},"required":["origin"]},"then":{"properties":{"source_references":{"minItems":1}}}}]},"rights":{"type":"object","additionalProperties":false,"required":["basis","reviewed_by","reviewed_at","notices"],"properties":{"basis":{"enum":["studio-original","licensed","public-domain","approved-public"]},"reviewed_by":{"$ref":"#/$defs/owner"},"reviewed_at":{"$ref":"#/$defs/timestamp"},"notices":{"type":"array","uniqueItems":true,"items":{"type":"string","minLength":1,"maxLength":1000}},"restrictions":{"type":"string","minLength":1,"maxLength":2000}}},"governance":{"type":"object","additionalProperties":false,"required":["constitution","decision_owner","evidence"],"properties":{"constitution":{"type":"object","additionalProperties":false,"required":["version","tag","commit"],"properties":{"version":{"const":"1.0.0"},"tag":{"const":"constitution/v1.0.0"},"commit":{"const":"a9cc8a503aa30e17820edc62ac95f7cbe10e0564"}}},"decision_owner":{"$ref":"#/$defs/owner"},"evidence":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/absoluteUri"}}}},"extension":{"type":"object","additionalProperties":false,"required":["required","fallback","configuration"],"properties":{"required":{"type":"boolean"},"fallback":{"enum":["reject","portable-baseline","omit"]},"configuration":{"type":"object"},"evidence":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/absoluteUri"}}}}}};
const schema32 = {"type":"string","pattern":"^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$","maxLength":255};
const schema33 = {"type":"string","pattern":"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"};
const schema34 = {"type":"string","pattern":"^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"};
const func1 = Object.prototype.hasOwnProperty;
const func2 = require("ajv/dist/runtime/ucs2length").default;
const func0 = require("ajv/dist/runtime/equal").default;
const pattern4 = new RegExp("^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$", "u");
const pattern5 = new RegExp("^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$", "u");
const pattern6 = new RegExp("^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$", "u");
const pattern9 = new RegExp("^[a-z0-9]+(?:-[a-z0-9]+)*$", "u");
const pattern29 = new RegExp("^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$", "u");
const schema35 = {"type":"object","additionalProperties":false,"required":["status"],"properties":{"status":{"enum":["draft","experimental","stable","deprecated","retired"]},"deprecation":{"$ref":"#/$defs/deprecation"}},"allOf":[{"if":{"properties":{"status":{"enum":["deprecated","retired"]}},"required":["status"]},"then":{"required":["deprecation"]},"else":{"not":{"required":["deprecation"]}}}]};
const schema36 = {"type":"object","additionalProperties":false,"required":["deprecated_at","reason","support_until"],"properties":{"deprecated_at":{"$ref":"#/$defs/timestamp"},"reason":{"type":"string","minLength":1,"maxLength":1000},"support_until":{"$ref":"#/$defs/timestamp"},"replacement":{"type":"object","additionalProperties":false,"required":["id","version"],"properties":{"id":{"$ref":"#/$defs/promptId"},"version":{"$ref":"#/$defs/semver"}}},"no_replacement_reason":{"type":"string","minLength":1,"maxLength":1000}},"oneOf":[{"required":["replacement"],"not":{"required":["no_replacement_reason"]}},{"required":["no_replacement_reason"],"not":{"required":["replacement"]}}]};
const schema37 = {"type":"string","format":"date-time"};
const formats0 = require("ajv-formats/dist/formats").fullFormats["date-time"];

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
const _errs1 = errors;
let valid0 = false;
let passing0 = null;
const _errs2 = errors;
const _errs3 = errors;
const _errs4 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.no_replacement_reason === undefined) && (missing0 = "no_replacement_reason")){
const err0 = {};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
var valid1 = _errs4 === errors;
if(valid1){
const err1 = {instancePath,schemaPath:"#/oneOf/0/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
else {
errors = _errs3;
if(vErrors !== null){
if(_errs3){
vErrors.length = _errs3;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.replacement === undefined){
const err2 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "replacement"},message:"must have required property '"+"replacement"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
var _valid0 = _errs2 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
}
const _errs5 = errors;
const _errs6 = errors;
const _errs7 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.replacement === undefined) && (missing1 = "replacement")){
const err3 = {};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
var valid2 = _errs7 === errors;
if(valid2){
const err4 = {instancePath,schemaPath:"#/oneOf/1/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
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
if(data.no_replacement_reason === undefined){
const err5 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "no_replacement_reason"},message:"must have required property '"+"no_replacement_reason"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
var _valid0 = _errs5 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
}
}
if(!valid0){
const err6 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
else {
errors = _errs1;
if(vErrors !== null){
if(_errs1){
vErrors.length = _errs1;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.deprecated_at === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "deprecated_at"},message:"must have required property '"+"deprecated_at"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.reason === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason"},message:"must have required property '"+"reason"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.support_until === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "support_until"},message:"must have required property '"+"support_until"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "deprecated_at") || (key0 === "reason")) || (key0 === "support_until")) || (key0 === "replacement")) || (key0 === "no_replacement_reason"))){
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
if(data.deprecated_at !== undefined){
let data0 = data.deprecated_at;
if(typeof data0 === "string"){
if(!(formats0.validate(data0))){
const err11 = {instancePath:instancePath+"/deprecated_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/deprecated_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.reason !== undefined){
let data1 = data.reason;
if(typeof data1 === "string"){
if(func2(data1) > 1000){
const err13 = {instancePath:instancePath+"/reason",schemaPath:"#/properties/reason/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(func2(data1) < 1){
const err14 = {instancePath:instancePath+"/reason",schemaPath:"#/properties/reason/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err15 = {instancePath:instancePath+"/reason",schemaPath:"#/properties/reason/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.support_until !== undefined){
let data2 = data.support_until;
if(typeof data2 === "string"){
if(!(formats0.validate(data2))){
const err16 = {instancePath:instancePath+"/support_until",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err17 = {instancePath:instancePath+"/support_until",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.replacement !== undefined){
let data3 = data.replacement;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.id === undefined){
const err18 = {instancePath:instancePath+"/replacement",schemaPath:"#/properties/replacement/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data3.version === undefined){
const err19 = {instancePath:instancePath+"/replacement",schemaPath:"#/properties/replacement/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
for(const key1 in data3){
if(!((key1 === "id") || (key1 === "version"))){
const err20 = {instancePath:instancePath+"/replacement",schemaPath:"#/properties/replacement/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data3.id !== undefined){
let data4 = data3.id;
if(typeof data4 === "string"){
if(func2(data4) > 255){
const err21 = {instancePath:instancePath+"/replacement/id",schemaPath:"#/$defs/promptId/maxLength",keyword:"maxLength",params:{limit: 255},message:"must NOT have more than 255 characters"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(!pattern4.test(data4)){
const err22 = {instancePath:instancePath+"/replacement/id",schemaPath:"#/$defs/promptId/pattern",keyword:"pattern",params:{pattern: "^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"},message:"must match pattern \""+"^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"+"\""};
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
const err23 = {instancePath:instancePath+"/replacement/id",schemaPath:"#/$defs/promptId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data3.version !== undefined){
let data5 = data3.version;
if(typeof data5 === "string"){
if(!pattern5.test(data5)){
const err24 = {instancePath:instancePath+"/replacement/version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"+"\""};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
else {
const err25 = {instancePath:instancePath+"/replacement/version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
}
else {
const err26 = {instancePath:instancePath+"/replacement",schemaPath:"#/properties/replacement/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.no_replacement_reason !== undefined){
let data6 = data.no_replacement_reason;
if(typeof data6 === "string"){
if(func2(data6) > 1000){
const err27 = {instancePath:instancePath+"/no_replacement_reason",schemaPath:"#/properties/no_replacement_reason/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(func2(data6) < 1){
const err28 = {instancePath:instancePath+"/no_replacement_reason",schemaPath:"#/properties/no_replacement_reason/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err29 = {instancePath:instancePath+"/no_replacement_reason",schemaPath:"#/properties/no_replacement_reason/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err30 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
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
let data0 = data.status;
if(!((data0 === "deprecated") || (data0 === "retired"))){
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
if(data.deprecation === undefined){
const err2 = {instancePath,schemaPath:"#/allOf/0/then/required",keyword:"required",params:{missingProperty: "deprecation"},message:"must have required property '"+"deprecation"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
ifClause0 = "then";
}
else {
const _errs6 = errors;
const _errs7 = errors;
const _errs8 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.deprecation === undefined) && (missing1 = "deprecation")){
const err3 = {};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
var valid3 = _errs8 === errors;
if(valid3){
const err4 = {instancePath,schemaPath:"#/allOf/0/else/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
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
var _valid0 = _errs6 === errors;
valid1 = _valid0;
ifClause0 = "else";
}
if(!valid1){
const err5 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "status") || (key0 === "deprecation"))){
const err7 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.status !== undefined){
let data1 = data.status;
if(!(((((data1 === "draft") || (data1 === "experimental")) || (data1 === "stable")) || (data1 === "deprecated")) || (data1 === "retired"))){
const err8 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema35.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.deprecation !== undefined){
if(!(validate22(data.deprecation, {instancePath:instancePath+"/deprecation",parentData:data,parentDataProperty:"deprecation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
errors = vErrors.length;
}
}
}
else {
const err9 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema41 = {"type":"object","additionalProperties":false,"required":["name","description","type","required","classification"],"properties":{"name":{"$ref":"#/$defs/symbol"},"description":{"type":"string","minLength":1,"maxLength":1000},"type":{"enum":["string","integer","number","boolean","object","array"]},"required":{"type":"boolean"},"classification":{"$ref":"#/$defs/classification"},"constraints":{"$ref":"#/$defs/constraints"},"default":true},"allOf":[{"if":{"properties":{"required":{"const":true}},"required":["required"]},"then":{"not":{"required":["default"]}}}]};
const schema42 = {"type":"string","pattern":"^[a-z][a-z0-9_]{0,63}$"};
const schema43 = {"enum":["public","internal","confidential","restricted"]};
const schema44 = {"type":"object","additionalProperties":false,"minProperties":1,"properties":{"enum":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":["string","number","integer","boolean","null"]}},"min_length":{"type":"integer","minimum":0},"max_length":{"type":"integer","minimum":0},"pattern":{"type":"string","minLength":1},"minimum":{"type":"number"},"maximum":{"type":"number"},"min_items":{"type":"integer","minimum":0},"max_items":{"type":"integer","minimum":0}}};
const pattern10 = new RegExp("^[a-z][a-z0-9_]{0,63}$", "u");

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
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.required === undefined) && (missing0 = "required")){
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
if(data.required !== undefined){
if(true !== data.required){
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
if(_valid0){
const _errs5 = errors;
const _errs6 = errors;
const _errs7 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.default === undefined) && (missing1 = "default")){
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
var _valid0 = _errs5 === errors;
valid1 = _valid0;
}
if(!valid1){
const err4 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.name === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.description === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "description"},message:"must have required property '"+"description"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.type === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.required === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "required"},message:"must have required property '"+"required"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.classification === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "classification"},message:"must have required property '"+"classification"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "name") || (key0 === "description")) || (key0 === "type")) || (key0 === "required")) || (key0 === "classification")) || (key0 === "constraints")) || (key0 === "default"))){
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
if(data.name !== undefined){
let data1 = data.name;
if(typeof data1 === "string"){
if(!pattern10.test(data1)){
const err11 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/symbol/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9_]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9_]{0,63}$"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/symbol/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.description !== undefined){
let data2 = data.description;
if(typeof data2 === "string"){
if(func2(data2) > 1000){
const err13 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(func2(data2) < 1){
const err14 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err15 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.type !== undefined){
let data3 = data.type;
if(!((((((data3 === "string") || (data3 === "integer")) || (data3 === "number")) || (data3 === "boolean")) || (data3 === "object")) || (data3 === "array"))){
const err16 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/enum",keyword:"enum",params:{allowedValues: schema41.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.required !== undefined){
if(typeof data.required !== "boolean"){
const err17 = {instancePath:instancePath+"/required",schemaPath:"#/properties/required/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.classification !== undefined){
let data5 = data.classification;
if(!((((data5 === "public") || (data5 === "internal")) || (data5 === "confidential")) || (data5 === "restricted"))){
const err18 = {instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema43.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.constraints !== undefined){
let data6 = data.constraints;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(Object.keys(data6).length < 1){
const err19 = {instancePath:instancePath+"/constraints",schemaPath:"#/$defs/constraints/minProperties",keyword:"minProperties",params:{limit: 1},message:"must NOT have fewer than 1 properties"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
for(const key1 in data6){
if(!((((((((key1 === "enum") || (key1 === "min_length")) || (key1 === "max_length")) || (key1 === "pattern")) || (key1 === "minimum")) || (key1 === "maximum")) || (key1 === "min_items")) || (key1 === "max_items"))){
const err20 = {instancePath:instancePath+"/constraints",schemaPath:"#/$defs/constraints/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data6.enum !== undefined){
let data7 = data6.enum;
if(Array.isArray(data7)){
if(data7.length < 1){
const err21 = {instancePath:instancePath+"/constraints/enum",schemaPath:"#/$defs/constraints/properties/enum/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
if((((typeof data8 !== "string") && (!((typeof data8 == "number") && (isFinite(data8))))) && (typeof data8 !== "boolean")) && (data8 !== null)){
const err22 = {instancePath:instancePath+"/constraints/enum/" + i0,schemaPath:"#/$defs/constraints/properties/enum/items/type",keyword:"type",params:{type: schema44.properties.enum.items.type},message:"must be string,number,integer,boolean,null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
let i1 = data7.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data7[i1];
if((((typeof item0 !== "string") && (!((typeof item0 == "number") && (isFinite(item0))))) && (typeof item0 !== "boolean")) && (item0 !== null)){
continue;
}
if(typeof item0 == "string"){
item0 += "_";
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err23 = {instancePath:instancePath+"/constraints/enum",schemaPath:"#/$defs/constraints/properties/enum/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err24 = {instancePath:instancePath+"/constraints/enum",schemaPath:"#/$defs/constraints/properties/enum/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data6.min_length !== undefined){
let data9 = data6.min_length;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err25 = {instancePath:instancePath+"/constraints/min_length",schemaPath:"#/$defs/constraints/properties/min_length/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if((typeof data9 == "number") && (isFinite(data9))){
if(data9 < 0 || isNaN(data9)){
const err26 = {instancePath:instancePath+"/constraints/min_length",schemaPath:"#/$defs/constraints/properties/min_length/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data6.max_length !== undefined){
let data10 = data6.max_length;
if(!(((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10))) && (isFinite(data10)))){
const err27 = {instancePath:instancePath+"/constraints/max_length",schemaPath:"#/$defs/constraints/properties/max_length/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if((typeof data10 == "number") && (isFinite(data10))){
if(data10 < 0 || isNaN(data10)){
const err28 = {instancePath:instancePath+"/constraints/max_length",schemaPath:"#/$defs/constraints/properties/max_length/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
}
if(data6.pattern !== undefined){
let data11 = data6.pattern;
if(typeof data11 === "string"){
if(func2(data11) < 1){
const err29 = {instancePath:instancePath+"/constraints/pattern",schemaPath:"#/$defs/constraints/properties/pattern/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err30 = {instancePath:instancePath+"/constraints/pattern",schemaPath:"#/$defs/constraints/properties/pattern/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data6.minimum !== undefined){
let data12 = data6.minimum;
if(!((typeof data12 == "number") && (isFinite(data12)))){
const err31 = {instancePath:instancePath+"/constraints/minimum",schemaPath:"#/$defs/constraints/properties/minimum/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data6.maximum !== undefined){
let data13 = data6.maximum;
if(!((typeof data13 == "number") && (isFinite(data13)))){
const err32 = {instancePath:instancePath+"/constraints/maximum",schemaPath:"#/$defs/constraints/properties/maximum/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data6.min_items !== undefined){
let data14 = data6.min_items;
if(!(((typeof data14 == "number") && (!(data14 % 1) && !isNaN(data14))) && (isFinite(data14)))){
const err33 = {instancePath:instancePath+"/constraints/min_items",schemaPath:"#/$defs/constraints/properties/min_items/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if((typeof data14 == "number") && (isFinite(data14))){
if(data14 < 0 || isNaN(data14)){
const err34 = {instancePath:instancePath+"/constraints/min_items",schemaPath:"#/$defs/constraints/properties/min_items/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data6.max_items !== undefined){
let data15 = data6.max_items;
if(!(((typeof data15 == "number") && (!(data15 % 1) && !isNaN(data15))) && (isFinite(data15)))){
const err35 = {instancePath:instancePath+"/constraints/max_items",schemaPath:"#/$defs/constraints/properties/max_items/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if((typeof data15 == "number") && (isFinite(data15))){
if(data15 < 0 || isNaN(data15)){
const err36 = {instancePath:instancePath+"/constraints/max_items",schemaPath:"#/$defs/constraints/properties/max_items/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
}
}
else {
const err37 = {instancePath:instancePath+"/constraints",schemaPath:"#/$defs/constraints/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
}
else {
const err38 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema45 = {"type":"object","additionalProperties":false,"required":["name","description","required","accepted_classifications"],"properties":{"name":{"$ref":"#/$defs/symbol"},"description":{"type":"string","minLength":1,"maxLength":1000},"required":{"type":"boolean"},"accepted_classifications":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/classification"}},"accepted_media_types":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"}},"max_bytes":{"type":"integer","minimum":1}}};
const pattern12 = new RegExp("^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$", "u");

function validate27(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate27.evaluated;
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
if(data.description === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "description"},message:"must have required property '"+"description"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.required === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "required"},message:"must have required property '"+"required"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.accepted_classifications === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "accepted_classifications"},message:"must have required property '"+"accepted_classifications"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "name") || (key0 === "description")) || (key0 === "required")) || (key0 === "accepted_classifications")) || (key0 === "accepted_media_types")) || (key0 === "max_bytes"))){
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
if(data.name !== undefined){
let data0 = data.name;
if(typeof data0 === "string"){
if(!pattern10.test(data0)){
const err5 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/symbol/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9_]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9_]{0,63}$"+"\""};
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
const err6 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/symbol/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.description !== undefined){
let data1 = data.description;
if(typeof data1 === "string"){
if(func2(data1) > 1000){
const err7 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func2(data1) < 1){
const err8 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err9 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.required !== undefined){
if(typeof data.required !== "boolean"){
const err10 = {instancePath:instancePath+"/required",schemaPath:"#/properties/required/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.accepted_classifications !== undefined){
let data3 = data.accepted_classifications;
if(Array.isArray(data3)){
if(data3.length < 1){
const err11 = {instancePath:instancePath+"/accepted_classifications",schemaPath:"#/properties/accepted_classifications/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
let data4 = data3[i0];
if(!((((data4 === "public") || (data4 === "internal")) || (data4 === "confidential")) || (data4 === "restricted"))){
const err12 = {instancePath:instancePath+"/accepted_classifications/" + i0,schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema43.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
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
const err13 = {instancePath:instancePath+"/accepted_classifications",schemaPath:"#/properties/accepted_classifications/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err14 = {instancePath:instancePath+"/accepted_classifications",schemaPath:"#/properties/accepted_classifications/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.accepted_media_types !== undefined){
let data5 = data.accepted_media_types;
if(Array.isArray(data5)){
if(data5.length < 1){
const err15 = {instancePath:instancePath+"/accepted_media_types",schemaPath:"#/properties/accepted_media_types/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
const len1 = data5.length;
for(let i2=0; i2<len1; i2++){
let data6 = data5[i2];
if(typeof data6 === "string"){
if(!pattern12.test(data6)){
const err16 = {instancePath:instancePath+"/accepted_media_types/" + i2,schemaPath:"#/properties/accepted_media_types/items/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},message:"must match pattern \""+"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"+"\""};
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
const err17 = {instancePath:instancePath+"/accepted_media_types/" + i2,schemaPath:"#/properties/accepted_media_types/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
let i3 = data5.length;
let j1;
if(i3 > 1){
const indices0 = {};
for(;i3--;){
let item0 = data5[i3];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j1 = indices0[item0];
const err18 = {instancePath:instancePath+"/accepted_media_types",schemaPath:"#/properties/accepted_media_types/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
break;
}
indices0[item0] = i3;
}
}
}
else {
const err19 = {instancePath:instancePath+"/accepted_media_types",schemaPath:"#/properties/accepted_media_types/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.max_bytes !== undefined){
let data7 = data.max_bytes;
if(!(((typeof data7 == "number") && (!(data7 % 1) && !isNaN(data7))) && (isFinite(data7)))){
const err20 = {instancePath:instancePath+"/max_bytes",schemaPath:"#/properties/max_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if((typeof data7 == "number") && (isFinite(data7))){
if(data7 < 1 || isNaN(data7)){
const err21 = {instancePath:instancePath+"/max_bytes",schemaPath:"#/properties/max_bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
validate27.errors = vErrors;
return errors === 0;
}
validate27.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema48 = {"type":"object","additionalProperties":false,"required":["format","messages"],"properties":{"format":{"const":"studio-messages-v1"},"messages":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/message"}}}};
const schema49 = {"type":"object","additionalProperties":false,"required":["role","parts"],"properties":{"role":{"enum":["instruction","user","assistant-example"]},"parts":{"type":"array","minItems":1,"items":{"oneOf":[{"$ref":"#/$defs/textPart"},{"$ref":"#/$defs/inputPart"},{"$ref":"#/$defs/contextPart"}]}}}};
const schema50 = {"type":"object","additionalProperties":false,"required":["type","text"],"properties":{"type":{"const":"text"},"text":{"type":"string","minLength":1}}};
const schema51 = {"type":"object","additionalProperties":false,"required":["type","name"],"properties":{"type":{"const":"input"},"name":{"$ref":"#/$defs/symbol"},"format":{"enum":["text","json"],"default":"text"}}};

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
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "type") || (key0 === "name")) || (key0 === "format"))){
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
if(data.type !== undefined){
if("input" !== data.type){
const err3 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "input"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.name !== undefined){
let data1 = data.name;
if(typeof data1 === "string"){
if(!pattern10.test(data1)){
const err4 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/symbol/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9_]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9_]{0,63}$"+"\""};
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
const err5 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/symbol/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.format !== undefined){
let data2 = data.format;
if(!((data2 === "text") || (data2 === "json"))){
const err6 = {instancePath:instancePath+"/format",schemaPath:"#/properties/format/enum",keyword:"enum",params:{allowedValues: schema51.properties.format.enum},message:"must be equal to one of the allowed values"};
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
else {
const err7 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
validate31.errors = vErrors;
return errors === 0;
}
validate31.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema53 = {"type":"object","additionalProperties":false,"required":["type","slot"],"properties":{"type":{"const":"context"},"slot":{"$ref":"#/$defs/symbol"},"format":{"enum":["text","json"],"default":"text"}}};

function validate33(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate33.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.slot === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "slot"},message:"must have required property '"+"slot"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "type") || (key0 === "slot")) || (key0 === "format"))){
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
if(data.type !== undefined){
if("context" !== data.type){
const err3 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "context"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.slot !== undefined){
let data1 = data.slot;
if(typeof data1 === "string"){
if(!pattern10.test(data1)){
const err4 = {instancePath:instancePath+"/slot",schemaPath:"#/$defs/symbol/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9_]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9_]{0,63}$"+"\""};
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
const err5 = {instancePath:instancePath+"/slot",schemaPath:"#/$defs/symbol/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.format !== undefined){
let data2 = data.format;
if(!((data2 === "text") || (data2 === "json"))){
const err6 = {instancePath:instancePath+"/format",schemaPath:"#/properties/format/enum",keyword:"enum",params:{allowedValues: schema53.properties.format.enum},message:"must be equal to one of the allowed values"};
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
else {
const err7 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
validate33.errors = vErrors;
return errors === 0;
}
validate33.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.role === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "role"},message:"must have required property '"+"role"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.parts === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parts"},message:"must have required property '"+"parts"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "role") || (key0 === "parts"))){
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
if(data.role !== undefined){
let data0 = data.role;
if(!(((data0 === "instruction") || (data0 === "user")) || (data0 === "assistant-example"))){
const err3 = {instancePath:instancePath+"/role",schemaPath:"#/properties/role/enum",keyword:"enum",params:{allowedValues: schema49.properties.role.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.parts !== undefined){
let data1 = data.parts;
if(Array.isArray(data1)){
if(data1.length < 1){
const err4 = {instancePath:instancePath+"/parts",schemaPath:"#/properties/parts/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
const _errs6 = errors;
let valid3 = false;
let passing0 = null;
const _errs7 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.type === undefined){
const err5 = {instancePath:instancePath+"/parts/" + i0,schemaPath:"#/$defs/textPart/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data2.text === undefined){
const err6 = {instancePath:instancePath+"/parts/" + i0,schemaPath:"#/$defs/textPart/required",keyword:"required",params:{missingProperty: "text"},message:"must have required property '"+"text"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key1 in data2){
if(!((key1 === "type") || (key1 === "text"))){
const err7 = {instancePath:instancePath+"/parts/" + i0,schemaPath:"#/$defs/textPart/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data2.type !== undefined){
if("text" !== data2.type){
const err8 = {instancePath:instancePath+"/parts/" + i0+"/type",schemaPath:"#/$defs/textPart/properties/type/const",keyword:"const",params:{allowedValue: "text"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data2.text !== undefined){
let data4 = data2.text;
if(typeof data4 === "string"){
if(func2(data4) < 1){
const err9 = {instancePath:instancePath+"/parts/" + i0+"/text",schemaPath:"#/$defs/textPart/properties/text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/parts/" + i0+"/text",schemaPath:"#/$defs/textPart/properties/text/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err11 = {instancePath:instancePath+"/parts/" + i0,schemaPath:"#/$defs/textPart/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs7 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
var props0 = true;
}
const _errs14 = errors;
if(!(validate31(data2, {instancePath:instancePath+"/parts/" + i0,parentData:data1,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate31.errors : vErrors.concat(validate31.errors);
errors = vErrors.length;
}
var _valid0 = _errs14 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs15 = errors;
if(!(validate33(data2, {instancePath:instancePath+"/parts/" + i0,parentData:data1,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate33.errors : vErrors.concat(validate33.errors);
errors = vErrors.length;
}
var _valid0 = _errs15 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid3 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
}
}
if(!valid3){
const err12 = {instancePath:instancePath+"/parts/" + i0,schemaPath:"#/properties/parts/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
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
}
}
else {
const err13 = {instancePath:instancePath+"/parts",schemaPath:"#/properties/parts/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate29(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate29.evaluated;
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
if(data.messages === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "messages"},message:"must have required property '"+"messages"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "format") || (key0 === "messages"))){
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
if(data.format !== undefined){
if("studio-messages-v1" !== data.format){
const err3 = {instancePath:instancePath+"/format",schemaPath:"#/properties/format/const",keyword:"const",params:{allowedValue: "studio-messages-v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.messages !== undefined){
let data1 = data.messages;
if(Array.isArray(data1)){
if(data1.length < 1){
const err4 = {instancePath:instancePath+"/messages",schemaPath:"#/properties/messages/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
if(!(validate30(data1[i0], {instancePath:instancePath+"/messages/" + i0,parentData:data1,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
errors = vErrors.length;
}
}
}
else {
const err5 = {instancePath:instancePath+"/messages",schemaPath:"#/properties/messages/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
else {
const err6 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
validate29.errors = vErrors;
return errors === 0;
}
validate29.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema55 = {"type":"object","additionalProperties":false,"required":["required","optional"],"properties":{"required":{"type":"array","minItems":1,"uniqueItems":true,"contains":{"const":"text-generation"},"items":{"$ref":"#/$defs/capability"}},"optional":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/capability"}}}};
const schema56 = {"type":"string","pattern":"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*$","maxLength":128};
const pattern15 = new RegExp("^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*$", "u");

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
if(!pattern15.test(data1)){
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
if(!pattern15.test(data4)){
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
validate37.errors = vErrors;
return errors === 0;
}
validate37.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema58 = {"type":"object","additionalProperties":false,"required":["kind","media_type","description"],"properties":{"kind":{"enum":["text","json"]},"media_type":{"enum":["text/plain","application/json"]},"description":{"type":"string","minLength":1,"maxLength":2000},"schema":{"$ref":"#/$defs/artifactSchemaReference"}},"allOf":[{"if":{"properties":{"kind":{"const":"text"}},"required":["kind"]},"then":{"properties":{"media_type":{"const":"text/plain"}},"not":{"required":["schema"]}},"else":{"properties":{"media_type":{"const":"application/json"}}}}]};
const schema59 = {"type":"object","additionalProperties":false,"required":["schema_id","repository","contract","version","tag","commit","artifact_uri","media_type","byte_size","sha256"],"properties":{"schema_id":{"type":"string","minLength":1,"maxLength":500},"repository":{"type":"string","pattern":"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"},"contract":{"type":"string","pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$"},"version":{"$ref":"#/$defs/semver"},"tag":{"type":"string","pattern":"^contract/[a-z0-9]+(?:-[a-z0-9]+)*/v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"},"commit":{"type":"string","pattern":"^[0-9a-f]{40}$"},"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"const":"application/schema+json"},"byte_size":{"type":"integer","minimum":1},"sha256":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"}}};
const schema61 = {"type":"string","format":"uri","pattern":"^[A-Za-z][A-Za-z0-9+.-]*:"};
const pattern17 = new RegExp("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", "u");
const pattern20 = new RegExp("^contract/[a-z0-9]+(?:-[a-z0-9]+)*/v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$", "u");
const pattern21 = new RegExp("^[0-9a-f]{40}$", "u");
const pattern22 = new RegExp("^[A-Za-z][A-Za-z0-9+.-]*:", "u");
const pattern23 = new RegExp("^sha256:[0-9a-f]{64}$", "u");
const formats4 = require("ajv-formats/dist/formats").fullFormats.uri;

function validate40(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate40.evaluated;
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
if(!(func1.call(schema59.properties, key0))){
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
if(!pattern17.test(data1)){
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
if(!pattern9.test(data2)){
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
if(!pattern20.test(data4)){
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
if(!pattern21.test(data5)){
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
if(!pattern22.test(data6)){
const err24 = {instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!(formats4(data6))){
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
const err30 = {instancePath:instancePath+"/sha256",schemaPath:"#/properties/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err31 = {instancePath:instancePath+"/sha256",schemaPath:"#/properties/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate40.errors = vErrors;
return errors === 0;
}
validate40.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
const _errs9 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.media_type !== undefined){
if("application/json" !== data.media_type){
const err5 = {instancePath:instancePath+"/media_type",schemaPath:"#/allOf/0/else/properties/media_type/const",keyword:"const",params:{allowedValue: "application/json"},message:"must be equal to constant"};
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
var _valid0 = _errs9 === errors;
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
const err6 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.media_type === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "media_type"},message:"must have required property '"+"media_type"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.description === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "description"},message:"must have required property '"+"description"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "kind") || (key0 === "media_type")) || (key0 === "description")) || (key0 === "schema"))){
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
if(data.kind !== undefined){
let data3 = data.kind;
if(!((data3 === "text") || (data3 === "json"))){
const err11 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema58.properties.kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.media_type !== undefined){
let data4 = data.media_type;
if(!((data4 === "text/plain") || (data4 === "application/json"))){
const err12 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/enum",keyword:"enum",params:{allowedValues: schema58.properties.media_type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.description !== undefined){
let data5 = data.description;
if(typeof data5 === "string"){
if(func2(data5) > 2000){
const err13 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/maxLength",keyword:"maxLength",params:{limit: 2000},message:"must NOT have more than 2000 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(func2(data5) < 1){
const err14 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err15 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.schema !== undefined){
if(!(validate40(data.schema, {instancePath:instancePath+"/schema",parentData:data,parentDataProperty:"schema",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate40.errors : vErrors.concat(validate40.errors);
errors = vErrors.length;
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
validate39.errors = vErrors;
return errors === 0;
}
validate39.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema62 = {"type":"object","additionalProperties":false,"required":["origin","created_by","created_at","source_references","rights"],"properties":{"origin":{"enum":["studio-original","promoted-experiment","derived","third-party"]},"created_by":{"$ref":"#/$defs/owner"},"created_at":{"$ref":"#/$defs/timestamp"},"source_references":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/absoluteUri"}},"rights":{"$ref":"#/$defs/rights"}},"allOf":[{"if":{"properties":{"origin":{"enum":["promoted-experiment","derived","third-party"]}},"required":["origin"]},"then":{"properties":{"source_references":{"minItems":1}}}}]};
const schema66 = {"type":"object","additionalProperties":false,"required":["basis","reviewed_by","reviewed_at","notices"],"properties":{"basis":{"enum":["studio-original","licensed","public-domain","approved-public"]},"reviewed_by":{"$ref":"#/$defs/owner"},"reviewed_at":{"$ref":"#/$defs/timestamp"},"notices":{"type":"array","uniqueItems":true,"items":{"type":"string","minLength":1,"maxLength":1000}},"restrictions":{"type":"string","minLength":1,"maxLength":2000}}};

function validate44(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate44.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.basis === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "basis"},message:"must have required property '"+"basis"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.reviewed_by === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reviewed_by"},message:"must have required property '"+"reviewed_by"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.reviewed_at === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reviewed_at"},message:"must have required property '"+"reviewed_at"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.notices === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "notices"},message:"must have required property '"+"notices"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "basis") || (key0 === "reviewed_by")) || (key0 === "reviewed_at")) || (key0 === "notices")) || (key0 === "restrictions"))){
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
if(data.basis !== undefined){
let data0 = data.basis;
if(!((((data0 === "studio-original") || (data0 === "licensed")) || (data0 === "public-domain")) || (data0 === "approved-public"))){
const err5 = {instancePath:instancePath+"/basis",schemaPath:"#/properties/basis/enum",keyword:"enum",params:{allowedValues: schema66.properties.basis.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.reviewed_by !== undefined){
let data1 = data.reviewed_by;
if(typeof data1 === "string"){
if(!pattern6.test(data1)){
const err6 = {instancePath:instancePath+"/reviewed_by",schemaPath:"#/$defs/owner/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"+"\""};
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
const err7 = {instancePath:instancePath+"/reviewed_by",schemaPath:"#/$defs/owner/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.reviewed_at !== undefined){
let data2 = data.reviewed_at;
if(typeof data2 === "string"){
if(!(formats0.validate(data2))){
const err8 = {instancePath:instancePath+"/reviewed_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err9 = {instancePath:instancePath+"/reviewed_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.notices !== undefined){
let data3 = data.notices;
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
let data4 = data3[i0];
if(typeof data4 === "string"){
if(func2(data4) > 1000){
const err10 = {instancePath:instancePath+"/notices/" + i0,schemaPath:"#/properties/notices/items/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(func2(data4) < 1){
const err11 = {instancePath:instancePath+"/notices/" + i0,schemaPath:"#/properties/notices/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/notices/" + i0,schemaPath:"#/properties/notices/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
let i1 = data3.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data3[i1];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err13 = {instancePath:instancePath+"/notices",schemaPath:"#/properties/notices/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err14 = {instancePath:instancePath+"/notices",schemaPath:"#/properties/notices/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.restrictions !== undefined){
let data5 = data.restrictions;
if(typeof data5 === "string"){
if(func2(data5) > 2000){
const err15 = {instancePath:instancePath+"/restrictions",schemaPath:"#/properties/restrictions/maxLength",keyword:"maxLength",params:{limit: 2000},message:"must NOT have more than 2000 characters"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(func2(data5) < 1){
const err16 = {instancePath:instancePath+"/restrictions",schemaPath:"#/properties/restrictions/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err17 = {instancePath:instancePath+"/restrictions",schemaPath:"#/properties/restrictions/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate44.errors = vErrors;
return errors === 0;
}
validate44.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate43(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate43.evaluated;
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
if((data.origin === undefined) && (missing0 = "origin")){
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
if(data.origin !== undefined){
let data0 = data.origin;
if(!(((data0 === "promoted-experiment") || (data0 === "derived")) || (data0 === "third-party"))){
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
if(_valid0){
const _errs5 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.source_references !== undefined){
let data1 = data.source_references;
if(Array.isArray(data1)){
if(data1.length < 1){
const err2 = {instancePath:instancePath+"/source_references",schemaPath:"#/allOf/0/then/properties/source_references/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
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
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.source_references = true;
props0.origin = true;
}
}
if(!valid1){
const err3 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.origin === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "origin"},message:"must have required property '"+"origin"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.created_by === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "created_by"},message:"must have required property '"+"created_by"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.created_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "created_at"},message:"must have required property '"+"created_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.source_references === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_references"},message:"must have required property '"+"source_references"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.rights === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "rights"},message:"must have required property '"+"rights"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "origin") || (key0 === "created_by")) || (key0 === "created_at")) || (key0 === "source_references")) || (key0 === "rights"))){
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
if(data.origin !== undefined){
let data2 = data.origin;
if(!((((data2 === "studio-original") || (data2 === "promoted-experiment")) || (data2 === "derived")) || (data2 === "third-party"))){
const err10 = {instancePath:instancePath+"/origin",schemaPath:"#/properties/origin/enum",keyword:"enum",params:{allowedValues: schema62.properties.origin.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.created_by !== undefined){
let data3 = data.created_by;
if(typeof data3 === "string"){
if(!pattern6.test(data3)){
const err11 = {instancePath:instancePath+"/created_by",schemaPath:"#/$defs/owner/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/created_by",schemaPath:"#/$defs/owner/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.created_at !== undefined){
let data4 = data.created_at;
if(typeof data4 === "string"){
if(!(formats0.validate(data4))){
const err13 = {instancePath:instancePath+"/created_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err14 = {instancePath:instancePath+"/created_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.source_references !== undefined){
let data5 = data.source_references;
if(Array.isArray(data5)){
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
let data6 = data5[i0];
if(typeof data6 === "string"){
if(!pattern22.test(data6)){
const err15 = {instancePath:instancePath+"/source_references/" + i0,schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(!(formats4(data6))){
const err16 = {instancePath:instancePath+"/source_references/" + i0,schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
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
const err17 = {instancePath:instancePath+"/source_references/" + i0,schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
let i1 = data5.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data5[i1], data5[j0])){
const err18 = {instancePath:instancePath+"/source_references",schemaPath:"#/properties/source_references/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err19 = {instancePath:instancePath+"/source_references",schemaPath:"#/properties/source_references/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.rights !== undefined){
if(!(validate44(data.rights, {instancePath:instancePath+"/rights",parentData:data,parentDataProperty:"rights",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate44.errors : vErrors.concat(validate44.errors);
errors = vErrors.length;
}
}
}
else {
const err20 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
validate43.errors = vErrors;
return errors === 0;
}
validate43.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema69 = {"type":"object","additionalProperties":false,"required":["constitution","decision_owner","evidence"],"properties":{"constitution":{"type":"object","additionalProperties":false,"required":["version","tag","commit"],"properties":{"version":{"const":"1.0.0"},"tag":{"const":"constitution/v1.0.0"},"commit":{"const":"a9cc8a503aa30e17820edc62ac95f7cbe10e0564"}}},"decision_owner":{"$ref":"#/$defs/owner"},"evidence":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/absoluteUri"}}}};

function validate47(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate47.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.constitution === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "constitution"},message:"must have required property '"+"constitution"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.decision_owner === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "decision_owner"},message:"must have required property '"+"decision_owner"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.evidence === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence"},message:"must have required property '"+"evidence"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "constitution") || (key0 === "decision_owner")) || (key0 === "evidence"))){
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
if(data.constitution !== undefined){
let data0 = data.constitution;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.version === undefined){
const err4 = {instancePath:instancePath+"/constitution",schemaPath:"#/properties/constitution/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data0.tag === undefined){
const err5 = {instancePath:instancePath+"/constitution",schemaPath:"#/properties/constitution/required",keyword:"required",params:{missingProperty: "tag"},message:"must have required property '"+"tag"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data0.commit === undefined){
const err6 = {instancePath:instancePath+"/constitution",schemaPath:"#/properties/constitution/required",keyword:"required",params:{missingProperty: "commit"},message:"must have required property '"+"commit"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key1 in data0){
if(!(((key1 === "version") || (key1 === "tag")) || (key1 === "commit"))){
const err7 = {instancePath:instancePath+"/constitution",schemaPath:"#/properties/constitution/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data0.version !== undefined){
if("1.0.0" !== data0.version){
const err8 = {instancePath:instancePath+"/constitution/version",schemaPath:"#/properties/constitution/properties/version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data0.tag !== undefined){
if("constitution/v1.0.0" !== data0.tag){
const err9 = {instancePath:instancePath+"/constitution/tag",schemaPath:"#/properties/constitution/properties/tag/const",keyword:"const",params:{allowedValue: "constitution/v1.0.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data0.commit !== undefined){
if("a9cc8a503aa30e17820edc62ac95f7cbe10e0564" !== data0.commit){
const err10 = {instancePath:instancePath+"/constitution/commit",schemaPath:"#/properties/constitution/properties/commit/const",keyword:"const",params:{allowedValue: "a9cc8a503aa30e17820edc62ac95f7cbe10e0564"},message:"must be equal to constant"};
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
else {
const err11 = {instancePath:instancePath+"/constitution",schemaPath:"#/properties/constitution/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.decision_owner !== undefined){
let data4 = data.decision_owner;
if(typeof data4 === "string"){
if(!pattern6.test(data4)){
const err12 = {instancePath:instancePath+"/decision_owner",schemaPath:"#/$defs/owner/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"+"\""};
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
const err13 = {instancePath:instancePath+"/decision_owner",schemaPath:"#/$defs/owner/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.evidence !== undefined){
let data5 = data.evidence;
if(Array.isArray(data5)){
if(data5.length < 1){
const err14 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
let data6 = data5[i0];
if(typeof data6 === "string"){
if(!pattern22.test(data6)){
const err15 = {instancePath:instancePath+"/evidence/" + i0,schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(!(formats4(data6))){
const err16 = {instancePath:instancePath+"/evidence/" + i0,schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
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
const err17 = {instancePath:instancePath+"/evidence/" + i0,schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
let i1 = data5.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data5[i1], data5[j0])){
const err18 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err19 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
const err20 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
validate47.errors = vErrors;
return errors === 0;
}
validate47.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema72 = {"type":"object","additionalProperties":false,"required":["required","fallback","configuration"],"properties":{"required":{"type":"boolean"},"fallback":{"enum":["reject","portable-baseline","omit"]},"configuration":{"type":"object"},"evidence":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/absoluteUri"}}}};

function validate49(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate49.evaluated;
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
if(!pattern22.test(data4)){
const err7 = {instancePath:instancePath+"/evidence/" + i0,schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!(formats4(data4))){
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
validate49.errors = vErrors;
return errors === 0;
}
validate49.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:definitely-secure:contract:prompt-definition:1.0.0:prompt-definition" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate20.evaluated;
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
if(data.id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.name === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.description === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "description"},message:"must have required property '"+"description"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.purpose === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.owners === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "owners"},message:"must have required property '"+"owners"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.lifecycle === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "lifecycle"},message:"must have required property '"+"lifecycle"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.inputs === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "inputs"},message:"must have required property '"+"inputs"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.context_slots === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "context_slots"},message:"must have required property '"+"context_slots"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.template === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "template"},message:"must have required property '"+"template"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.capabilities === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capabilities"},message:"must have required property '"+"capabilities"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.output === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "output"},message:"must have required property '"+"output"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.provenance === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "provenance"},message:"must have required property '"+"provenance"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.governance === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "governance"},message:"must have required property '"+"governance"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema31.properties, key0))){
const err15 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.spec_version !== undefined){
if("1.0.0" !== data.spec_version){
const err16 = {instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.id !== undefined){
let data1 = data.id;
if(typeof data1 === "string"){
if(func2(data1) > 255){
const err17 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/promptId/maxLength",keyword:"maxLength",params:{limit: 255},message:"must NOT have more than 255 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!pattern4.test(data1)){
const err18 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/promptId/pattern",keyword:"pattern",params:{pattern: "^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"},message:"must match pattern \""+"^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"+"\""};
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
const err19 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/promptId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.version !== undefined){
let data2 = data.version;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err20 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"+"\""};
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
const err21 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.name !== undefined){
let data3 = data.name;
if(typeof data3 === "string"){
if(func2(data3) > 120){
const err22 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/maxLength",keyword:"maxLength",params:{limit: 120},message:"must NOT have more than 120 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(func2(data3) < 1){
const err23 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err24 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.description !== undefined){
let data4 = data.description;
if(typeof data4 === "string"){
if(func2(data4) > 1000){
const err25 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(func2(data4) < 1){
const err26 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err27 = {instancePath:instancePath+"/description",schemaPath:"#/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.purpose !== undefined){
let data5 = data.purpose;
if(typeof data5 === "string"){
if(func2(data5) > 2000){
const err28 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/maxLength",keyword:"maxLength",params:{limit: 2000},message:"must NOT have more than 2000 characters"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(func2(data5) < 1){
const err29 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err30 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.owners !== undefined){
let data6 = data.owners;
if(Array.isArray(data6)){
if(data6.length < 1){
const err31 = {instancePath:instancePath+"/owners",schemaPath:"#/properties/owners/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
let data7 = data6[i0];
if(typeof data7 === "string"){
if(!pattern6.test(data7)){
const err32 = {instancePath:instancePath+"/owners/" + i0,schemaPath:"#/$defs/owner/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9@][A-Za-z0-9_.:/@-]{0,127}$"+"\""};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
else {
const err33 = {instancePath:instancePath+"/owners/" + i0,schemaPath:"#/$defs/owner/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
let i1 = data6.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data6[i1], data6[j0])){
const err34 = {instancePath:instancePath+"/owners",schemaPath:"#/properties/owners/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err35 = {instancePath:instancePath+"/owners",schemaPath:"#/properties/owners/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.lifecycle !== undefined){
if(!(validate21(data.lifecycle, {instancePath:instancePath+"/lifecycle",parentData:data,parentDataProperty:"lifecycle",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
}
if(data.tags !== undefined){
let data9 = data.tags;
if(Array.isArray(data9)){
const len1 = data9.length;
for(let i2=0; i2<len1; i2++){
let data10 = data9[i2];
if(typeof data10 === "string"){
if(func2(data10) > 64){
const err36 = {instancePath:instancePath+"/tags/" + i2,schemaPath:"#/properties/tags/items/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(!pattern9.test(data10)){
const err37 = {instancePath:instancePath+"/tags/" + i2,schemaPath:"#/properties/tags/items/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"},message:"must match pattern \""+"^[a-z0-9]+(?:-[a-z0-9]+)*$"+"\""};
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
const err38 = {instancePath:instancePath+"/tags/" + i2,schemaPath:"#/properties/tags/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
let i3 = data9.length;
let j1;
if(i3 > 1){
const indices0 = {};
for(;i3--;){
let item0 = data9[i3];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j1 = indices0[item0];
const err39 = {instancePath:instancePath+"/tags",schemaPath:"#/properties/tags/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
break;
}
indices0[item0] = i3;
}
}
}
else {
const err40 = {instancePath:instancePath+"/tags",schemaPath:"#/properties/tags/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data.inputs !== undefined){
let data11 = data.inputs;
if(Array.isArray(data11)){
const len2 = data11.length;
for(let i4=0; i4<len2; i4++){
if(!(validate25(data11[i4], {instancePath:instancePath+"/inputs/" + i4,parentData:data11,parentDataProperty:i4,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
errors = vErrors.length;
}
}
}
else {
const err41 = {instancePath:instancePath+"/inputs",schemaPath:"#/properties/inputs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data.context_slots !== undefined){
let data13 = data.context_slots;
if(Array.isArray(data13)){
const len3 = data13.length;
for(let i5=0; i5<len3; i5++){
if(!(validate27(data13[i5], {instancePath:instancePath+"/context_slots/" + i5,parentData:data13,parentDataProperty:i5,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
errors = vErrors.length;
}
}
}
else {
const err42 = {instancePath:instancePath+"/context_slots",schemaPath:"#/properties/context_slots/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.template !== undefined){
if(!(validate29(data.template, {instancePath:instancePath+"/template",parentData:data,parentDataProperty:"template",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate29.errors : vErrors.concat(validate29.errors);
errors = vErrors.length;
}
}
if(data.capabilities !== undefined){
if(!(validate37(data.capabilities, {instancePath:instancePath+"/capabilities",parentData:data,parentDataProperty:"capabilities",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate37.errors : vErrors.concat(validate37.errors);
errors = vErrors.length;
}
}
if(data.output !== undefined){
if(!(validate39(data.output, {instancePath:instancePath+"/output",parentData:data,parentDataProperty:"output",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
errors = vErrors.length;
}
}
if(data.provenance !== undefined){
if(!(validate43(data.provenance, {instancePath:instancePath+"/provenance",parentData:data,parentDataProperty:"provenance",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate43.errors : vErrors.concat(validate43.errors);
errors = vErrors.length;
}
}
if(data.governance !== undefined){
if(!(validate47(data.governance, {instancePath:instancePath+"/governance",parentData:data,parentDataProperty:"governance",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate47.errors : vErrors.concat(validate47.errors);
errors = vErrors.length;
}
}
if(data.extensions !== undefined){
let data20 = data.extensions;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
for(const key1 in data20){
const _errs38 = errors;
if(typeof key1 === "string"){
if(!pattern29.test(key1)){
const err43 = {instancePath:instancePath+"/extensions",schemaPath:"#/properties/extensions/propertyNames/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"},message:"must match pattern \""+"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"+"\"",propertyName:key1};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
var valid14 = _errs38 === errors;
if(!valid14){
const err44 = {instancePath:instancePath+"/extensions",schemaPath:"#/properties/extensions/propertyNames",keyword:"propertyNames",params:{propertyName: key1},message:"property name must be valid"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
for(const key2 in data20){
if(!(validate49(data20[key2], {instancePath:instancePath+"/extensions/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"),parentData:data20,parentDataProperty:key2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate49.errors : vErrors.concat(validate49.errors);
errors = vErrors.length;
}
}
}
else {
const err45 = {instancePath:instancePath+"/extensions",schemaPath:"#/properties/extensions/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
}
else {
const err46 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
validate20.errors = vErrors;
return errors === 0;
}
validate20.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
