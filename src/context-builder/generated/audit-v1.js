// Generated from Codex 2301597014f6fefe8a3cf772e2e02527cda6a254; released immutable contract.
// SHA-256: 4adebedcef5a26e009e1d53ec9c480d372a31b73211fec1c53d6509ebc7929a3, d81e88780511c31099b2dd925f31aff26d6ba75e1173e953b98a37298764b617
// Rebuild with scripts/generate-builder-audit-validator.mjs; do not edit.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
"use strict";
export const validateResult = validate88;
const schema128 = {"type":"object","additionalProperties":false,"required":["spec_version","kind","build_id","correlation_id","request_identity","status","diagnostics"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"context-build-result"},"build_id":{"$ref":"#/$defs/opaque"},"correlation_id":{"$ref":"#/$defs/opaque"},"request_identity":{"$ref":"#/$defs/identity"},"status":{"enum":["prepared","failed"]},"diagnostics":{"type":"array","minItems":0,"maxItems":10000,"items":{"$ref":"#/$defs/diagnostic"}},"package":{"$ref":"urn:definitely-secure:contract:context-package:1.0.0:context-package#/$defs/contextPackage"},"lineage":{"type":"array","minItems":1,"maxItems":10000,"items":{"$ref":"#/$defs/lineage"}},"omissions":{"type":"array","minItems":0,"maxItems":10000,"items":{"$ref":"#/$defs/omission"}},"evidence_reference":{"$ref":"#/$defs/opaque"}},"oneOf":[{"properties":{"status":{"const":"prepared"},"diagnostics":{"maxItems":0}},"required":["package","lineage","omissions","evidence_reference"]},{"properties":{"status":{"const":"failed"},"diagnostics":{"minItems":1}},"not":{"anyOf":[{"required":["package"]},{"required":["lineage"]},{"required":["omissions"]},{"required":["evidence_reference"]}]}}]};
const schema33 = {"type":"string","pattern":"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"};
const schema131 = {"type":"object","additionalProperties":false,"required":["stage","code","action"],"properties":{"stage":{"enum":["request","authorization","source","normalization","selection","assembly","lifecycle","audit","handoff"]},"code":{"enum":["INVALID_REQUEST","UNSUPPORTED_VERSION","PREPARATION_DENIED","AUTHORITY_UNVERIFIABLE","SOURCE_UNAVAILABLE","SOURCE_INTEGRITY","INVALID_SOURCE","CONFLICT","REQUIRED_CONTEXT_MISSING","BUDGET_EXCEEDED","STALE_AUTHORITY","AUDIT_REQUIRED","CANCELLED","OPTIONAL_EMPTY","OPTIONAL_BUDGET","INELIGIBLE"]},"action":{"enum":["repair-request","obtain-authorization","repair-source","resolve-conflict","increase-budget","rebuild","retry-audit","none"]}}};
const func1 = Object.prototype.hasOwnProperty;
const pattern4 = new RegExp("^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", "u");
const schema63 = {"type":"object","additionalProperties":false,"required":["canonicalization","byte_size","sha256"],"properties":{"canonicalization":{"const":"studio-json-v1"},"byte_size":{"type":"integer","minimum":2},"sha256":{"$ref":"#/$defs/sha256"}}};
const schema57 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}$"};
const pattern18 = new RegExp("^sha256:[0-9a-f]{64}$", "u");

function validate45(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate45.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((data.canonicalization === undefined) && (missing0 = "canonicalization")) || ((data.byte_size === undefined) && (missing0 = "byte_size"))) || ((data.sha256 === undefined) && (missing0 = "sha256"))){
validate45.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!(((key0 === "canonicalization") || (key0 === "byte_size")) || (key0 === "sha256"))){
validate45.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.canonicalization !== undefined){
const _errs2 = errors;
if("studio-json-v1" !== data.canonicalization){
validate45.errors = [{instancePath:instancePath+"/canonicalization",schemaPath:"#/properties/canonicalization/const",keyword:"const",params:{allowedValue: "studio-json-v1"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.byte_size !== undefined){
let data1 = data.byte_size;
const _errs3 = errors;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
validate45.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs3){
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 < 2 || isNaN(data1)){
validate45.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 2},message:"must be >= 2"}];
return false;
}
}
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.sha256 !== undefined){
let data2 = data.sha256;
const _errs5 = errors;
const _errs6 = errors;
if(errors === _errs6){
if(typeof data2 === "string"){
if(!pattern18.test(data2)){
validate45.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""}];
return false;
}
}
else {
validate45.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
else {
validate45.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate45.errors = vErrors;
return errors === 0;
}
validate45.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema38 = {"type":"object","additionalProperties":false,"required":["spec_version","kind","manifest","manifest_identity"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"context-package"},"manifest":{"$ref":"#/$defs/manifest"},"manifest_identity":{"$ref":"#/$defs/contentIdentity"}}};
const schema39 = {"type":"object","additionalProperties":false,"required":["package","builder","created_at","review_after","expires_at","purpose","authority_reference","classification","total_content_bytes","sources","sections"],"properties":{"package":{"$ref":"#/$defs/packageIdentity"},"builder":{"type":"object","additionalProperties":false,"required":["id","version"],"properties":{"id":{"$ref":"#/$defs/namespace"},"version":{"$ref":"#/$defs/semver"}}},"created_at":{"$ref":"#/$defs/timestamp"},"review_after":{"$ref":"#/$defs/timestamp"},"expires_at":{"$ref":"#/$defs/timestamp"},"purpose":{"type":"string","minLength":1,"maxLength":1000},"authority_reference":{"$ref":"#/$defs/absoluteUri"},"classification":{"$ref":"#/$defs/classification"},"total_content_bytes":{"type":"integer","minimum":0},"sources":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/sourceRecord"}},"sections":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/section"}}}};
const schema44 = {"type":"string","pattern":"^[a-z0-9]+(?:[._-][a-z0-9]+)+$"};
const schema42 = {"type":"string","pattern":"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"};
const schema46 = {"type":"string","format":"date-time"};
const schema49 = {"type":"string","format":"uri","pattern":"^[A-Za-z][A-Za-z0-9+.-]*:"};
const schema50 = {"enum":["public","internal","confidential","restricted"]};
const func2 = require("ajv/dist/runtime/ucs2length").default;
const schema40 = {"type":"object","additionalProperties":false,"required":["id","version","instance_id"],"properties":{"id":{"$ref":"#/$defs/packageId"},"version":{"$ref":"#/$defs/semver"},"instance_id":{"$ref":"#/$defs/safeId"}}};
const schema41 = {"type":"string","pattern":"^context-package\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"};
const schema43 = {"type":"string","pattern":"^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"};
const pattern8 = new RegExp("^context-package\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$", "u");
const pattern9 = new RegExp("^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$", "u");
const pattern10 = new RegExp("^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$", "u");

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
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((data.id === undefined) && (missing0 = "id")) || ((data.version === undefined) && (missing0 = "version"))) || ((data.instance_id === undefined) && (missing0 = "instance_id"))){
validate25.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!(((key0 === "id") || (key0 === "version")) || (key0 === "instance_id"))){
validate25.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.id !== undefined){
let data0 = data.id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern8.test(data0)){
validate25.errors = [{instancePath:instancePath+"/id",schemaPath:"#/$defs/packageId/pattern",keyword:"pattern",params:{pattern: "^context-package\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"},message:"must match pattern \""+"^context-package\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"+"\""}];
return false;
}
}
else {
validate25.errors = [{instancePath:instancePath+"/id",schemaPath:"#/$defs/packageId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.version !== undefined){
let data1 = data.version;
const _errs5 = errors;
const _errs6 = errors;
if(errors === _errs6){
if(typeof data1 === "string"){
if(!pattern9.test(data1)){
validate25.errors = [{instancePath:instancePath+"/version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"+"\""}];
return false;
}
}
else {
validate25.errors = [{instancePath:instancePath+"/version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.instance_id !== undefined){
let data2 = data.instance_id;
const _errs8 = errors;
const _errs9 = errors;
if(errors === _errs9){
if(typeof data2 === "string"){
if(!pattern10.test(data2)){
validate25.errors = [{instancePath:instancePath+"/instance_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"+"\""}];
return false;
}
}
else {
validate25.errors = [{instancePath:instancePath+"/instance_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs8 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
else {
validate25.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema51 = {"type":"object","additionalProperties":false,"required":["source_id","kind","version","classification","evidence_reference"],"properties":{"source_id":{"$ref":"#/$defs/safeId"},"kind":{"enum":["public-canon","approved-private","caller-supplied","synthetic"]},"version":{"type":"string","minLength":1,"maxLength":200},"classification":{"$ref":"#/$defs/classification"},"evidence_reference":{"$ref":"#/$defs/absoluteUri"},"artifact":{"$ref":"#/$defs/artifactIdentity"}}};
const pattern13 = new RegExp("^[A-Za-z][A-Za-z0-9+.-]*:", "u");
const formats6 = require("ajv-formats/dist/formats").fullFormats.uri;
const schema55 = {"type":"object","additionalProperties":false,"required":["artifact_uri","media_type","byte_size","sha256"],"properties":{"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},"byte_size":{"type":"integer","minimum":1},"sha256":{"$ref":"#/$defs/sha256"}}};
const pattern17 = new RegExp("^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$", "u");

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
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((data.artifact_uri === undefined) && (missing0 = "artifact_uri")) || ((data.media_type === undefined) && (missing0 = "media_type"))) || ((data.byte_size === undefined) && (missing0 = "byte_size"))) || ((data.sha256 === undefined) && (missing0 = "sha256"))){
validate28.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!((((key0 === "artifact_uri") || (key0 === "media_type")) || (key0 === "byte_size")) || (key0 === "sha256"))){
validate28.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.artifact_uri !== undefined){
let data0 = data.artifact_uri;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern13.test(data0)){
validate28.errors = [{instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""}];
return false;
}
else {
if(!(formats6(data0))){
validate28.errors = [{instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""}];
return false;
}
}
}
else {
validate28.errors = [{instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.media_type !== undefined){
let data1 = data.media_type;
const _errs5 = errors;
if(errors === _errs5){
if(typeof data1 === "string"){
if(!pattern17.test(data1)){
validate28.errors = [{instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},message:"must match pattern \""+"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"+"\""}];
return false;
}
}
else {
validate28.errors = [{instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.byte_size !== undefined){
let data2 = data.byte_size;
const _errs7 = errors;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
validate28.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs7){
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 < 1 || isNaN(data2)){
validate28.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"}];
return false;
}
}
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.sha256 !== undefined){
let data3 = data.sha256;
const _errs9 = errors;
const _errs10 = errors;
if(errors === _errs10){
if(typeof data3 === "string"){
if(!pattern18.test(data3)){
validate28.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""}];
return false;
}
}
else {
validate28.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs9 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
}
else {
validate28.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((data.source_id === undefined) && (missing0 = "source_id")) || ((data.kind === undefined) && (missing0 = "kind"))) || ((data.version === undefined) && (missing0 = "version"))) || ((data.classification === undefined) && (missing0 = "classification"))) || ((data.evidence_reference === undefined) && (missing0 = "evidence_reference"))){
validate27.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!((((((key0 === "source_id") || (key0 === "kind")) || (key0 === "version")) || (key0 === "classification")) || (key0 === "evidence_reference")) || (key0 === "artifact"))){
validate27.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.source_id !== undefined){
let data0 = data.source_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern10.test(data0)){
validate27.errors = [{instancePath:instancePath+"/source_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"+"\""}];
return false;
}
}
else {
validate27.errors = [{instancePath:instancePath+"/source_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.kind !== undefined){
let data1 = data.kind;
const _errs5 = errors;
if(!((((data1 === "public-canon") || (data1 === "approved-private")) || (data1 === "caller-supplied")) || (data1 === "synthetic"))){
validate27.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema51.properties.kind.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.version !== undefined){
let data2 = data.version;
const _errs6 = errors;
if(errors === _errs6){
if(typeof data2 === "string"){
if(func2(data2) > 200){
validate27.errors = [{instancePath:instancePath+"/version",schemaPath:"#/properties/version/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"}];
return false;
}
else {
if(func2(data2) < 1){
validate27.errors = [{instancePath:instancePath+"/version",schemaPath:"#/properties/version/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate27.errors = [{instancePath:instancePath+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs6 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.classification !== undefined){
let data3 = data.classification;
const _errs8 = errors;
if(!((((data3 === "public") || (data3 === "internal")) || (data3 === "confidential")) || (data3 === "restricted"))){
validate27.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema50.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs8 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.evidence_reference !== undefined){
let data4 = data.evidence_reference;
const _errs10 = errors;
const _errs11 = errors;
if(errors === _errs11){
if(errors === _errs11){
if(typeof data4 === "string"){
if(!pattern13.test(data4)){
validate27.errors = [{instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""}];
return false;
}
else {
if(!(formats6(data4))){
validate27.errors = [{instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""}];
return false;
}
}
}
else {
validate27.errors = [{instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs10 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.artifact !== undefined){
const _errs13 = errors;
if(!(validate28(data.artifact, {instancePath:instancePath+"/artifact",parentData:data,parentDataProperty:"artifact",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
var valid0 = _errs13 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
}
}
}
else {
validate27.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate27.errors = vErrors;
return errors === 0;
}
validate27.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema58 = {"type":"object","additionalProperties":false,"required":["slot","classification","media_type","content","byte_size","sha256","source_ids"],"properties":{"slot":{"$ref":"#/$defs/symbol"},"classification":{"$ref":"#/$defs/classification"},"media_type":{"enum":["text/plain","application/json"]},"content":{},"byte_size":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha256"},"source_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/safeId"}}},"allOf":[{"if":{"properties":{"media_type":{"const":"text/plain"}},"required":["media_type"]},"then":{"properties":{"content":{"type":"string"}}}}]};
const schema59 = {"type":"string","pattern":"^[a-z][a-z0-9_]{0,63}$"};
const pattern19 = new RegExp("^[a-z][a-z0-9_]{0,63}$", "u");
const func0 = require("ajv/dist/runtime/equal").default;

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
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.media_type === undefined) && (missing0 = "media_type")){
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
if(data.media_type !== undefined){
if("text/plain" !== data.media_type){
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
if(data.content !== undefined){
if(typeof data.content !== "string"){
validate31.errors = [{instancePath:instancePath+"/content",schemaPath:"#/allOf/0/then/properties/content/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.content = true;
props0.media_type = true;
}
}
if(!valid1){
const err2 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
validate31.errors = vErrors;
return false;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((((((((data.slot === undefined) && (missing1 = "slot")) || ((data.classification === undefined) && (missing1 = "classification"))) || ((data.media_type === undefined) && (missing1 = "media_type"))) || ((data.content === undefined) && (missing1 = "content"))) || ((data.byte_size === undefined) && (missing1 = "byte_size"))) || ((data.sha256 === undefined) && (missing1 = "sha256"))) || ((data.source_ids === undefined) && (missing1 = "source_ids"))){
validate31.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"}];
return false;
}
else {
const _errs8 = errors;
for(const key0 in data){
if(!(((((((key0 === "slot") || (key0 === "classification")) || (key0 === "media_type")) || (key0 === "content")) || (key0 === "byte_size")) || (key0 === "sha256")) || (key0 === "source_ids"))){
validate31.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs8 === errors){
if(data.slot !== undefined){
let data2 = data.slot;
const _errs9 = errors;
const _errs10 = errors;
if(errors === _errs10){
if(typeof data2 === "string"){
if(!pattern19.test(data2)){
validate31.errors = [{instancePath:instancePath+"/slot",schemaPath:"#/$defs/symbol/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9_]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9_]{0,63}$"+"\""}];
return false;
}
}
else {
validate31.errors = [{instancePath:instancePath+"/slot",schemaPath:"#/$defs/symbol/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid4 = _errs9 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data.classification !== undefined){
let data3 = data.classification;
const _errs12 = errors;
if(!((((data3 === "public") || (data3 === "internal")) || (data3 === "confidential")) || (data3 === "restricted"))){
validate31.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema50.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid4 = _errs12 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data.media_type !== undefined){
let data4 = data.media_type;
const _errs14 = errors;
if(!((data4 === "text/plain") || (data4 === "application/json"))){
validate31.errors = [{instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/enum",keyword:"enum",params:{allowedValues: schema58.properties.media_type.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid4 = _errs14 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data.byte_size !== undefined){
let data5 = data.byte_size;
const _errs15 = errors;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
validate31.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs15){
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 < 0 || isNaN(data5)){
validate31.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"}];
return false;
}
}
}
var valid4 = _errs15 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data.sha256 !== undefined){
let data6 = data.sha256;
const _errs17 = errors;
const _errs18 = errors;
if(errors === _errs18){
if(typeof data6 === "string"){
if(!pattern18.test(data6)){
validate31.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""}];
return false;
}
}
else {
validate31.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid4 = _errs17 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data.source_ids !== undefined){
let data7 = data.source_ids;
const _errs20 = errors;
if(errors === _errs20){
if(Array.isArray(data7)){
if(data7.length < 1){
validate31.errors = [{instancePath:instancePath+"/source_ids",schemaPath:"#/properties/source_ids/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid8 = true;
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
const _errs22 = errors;
const _errs23 = errors;
if(errors === _errs23){
if(typeof data8 === "string"){
if(!pattern10.test(data8)){
validate31.errors = [{instancePath:instancePath+"/source_ids/" + i0,schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"+"\""}];
return false;
}
}
else {
validate31.errors = [{instancePath:instancePath+"/source_ids/" + i0,schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid8 = _errs22 === errors;
if(!valid8){
break;
}
}
if(valid8){
let i1 = data7.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data7[i1], data7[j0])){
validate31.errors = [{instancePath:instancePath+"/source_ids",schemaPath:"#/properties/source_ids/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"}];
return false;
break outer0;
}
}
}
}
}
}
}
else {
validate31.errors = [{instancePath:instancePath+"/source_ids",schemaPath:"#/properties/source_ids/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid4 = _errs20 === errors;
}
else {
var valid4 = true;
}
}
}
}
}
}
}
}
}
else {
validate31.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate31.errors = vErrors;
return errors === 0;
}
validate31.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const pattern11 = new RegExp("^[a-z0-9]+(?:[._-][a-z0-9]+)+$", "u");
const formats0 = require("ajv-formats/dist/formats").fullFormats["date-time"];

function validate24(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate24.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((((((((data.package === undefined) && (missing0 = "package")) || ((data.builder === undefined) && (missing0 = "builder"))) || ((data.created_at === undefined) && (missing0 = "created_at"))) || ((data.review_after === undefined) && (missing0 = "review_after"))) || ((data.expires_at === undefined) && (missing0 = "expires_at"))) || ((data.purpose === undefined) && (missing0 = "purpose"))) || ((data.authority_reference === undefined) && (missing0 = "authority_reference"))) || ((data.classification === undefined) && (missing0 = "classification"))) || ((data.total_content_bytes === undefined) && (missing0 = "total_content_bytes"))) || ((data.sources === undefined) && (missing0 = "sources"))) || ((data.sections === undefined) && (missing0 = "sections"))){
validate24.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!(func1.call(schema39.properties, key0))){
validate24.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.package !== undefined){
const _errs2 = errors;
if(!(validate25(data.package, {instancePath:instancePath+"/package",parentData:data,parentDataProperty:"package",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
errors = vErrors.length;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.builder !== undefined){
let data1 = data.builder;
const _errs3 = errors;
if(errors === _errs3){
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing1;
if(((data1.id === undefined) && (missing1 = "id")) || ((data1.version === undefined) && (missing1 = "version"))){
validate24.errors = [{instancePath:instancePath+"/builder",schemaPath:"#/properties/builder/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"}];
return false;
}
else {
const _errs5 = errors;
for(const key1 in data1){
if(!((key1 === "id") || (key1 === "version"))){
validate24.errors = [{instancePath:instancePath+"/builder",schemaPath:"#/properties/builder/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs5 === errors){
if(data1.id !== undefined){
let data2 = data1.id;
const _errs6 = errors;
const _errs7 = errors;
if(errors === _errs7){
if(typeof data2 === "string"){
if(!pattern11.test(data2)){
validate24.errors = [{instancePath:instancePath+"/builder/id",schemaPath:"#/$defs/namespace/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9]+(?:[._-][a-z0-9]+)+$"},message:"must match pattern \""+"^[a-z0-9]+(?:[._-][a-z0-9]+)+$"+"\""}];
return false;
}
}
else {
validate24.errors = [{instancePath:instancePath+"/builder/id",schemaPath:"#/$defs/namespace/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid1 = _errs6 === errors;
}
else {
var valid1 = true;
}
if(valid1){
if(data1.version !== undefined){
let data3 = data1.version;
const _errs9 = errors;
const _errs10 = errors;
if(errors === _errs10){
if(typeof data3 === "string"){
if(!pattern9.test(data3)){
validate24.errors = [{instancePath:instancePath+"/builder/version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"+"\""}];
return false;
}
}
else {
validate24.errors = [{instancePath:instancePath+"/builder/version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid1 = _errs9 === errors;
}
else {
var valid1 = true;
}
}
}
}
}
else {
validate24.errors = [{instancePath:instancePath+"/builder",schemaPath:"#/properties/builder/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.created_at !== undefined){
let data4 = data.created_at;
const _errs12 = errors;
const _errs13 = errors;
if(errors === _errs13){
if(errors === _errs13){
if(typeof data4 === "string"){
if(!(formats0.validate(data4))){
validate24.errors = [{instancePath:instancePath+"/created_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
else {
validate24.errors = [{instancePath:instancePath+"/created_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs12 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.review_after !== undefined){
let data5 = data.review_after;
const _errs15 = errors;
const _errs16 = errors;
if(errors === _errs16){
if(errors === _errs16){
if(typeof data5 === "string"){
if(!(formats0.validate(data5))){
validate24.errors = [{instancePath:instancePath+"/review_after",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
else {
validate24.errors = [{instancePath:instancePath+"/review_after",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs15 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.expires_at !== undefined){
let data6 = data.expires_at;
const _errs18 = errors;
const _errs19 = errors;
if(errors === _errs19){
if(errors === _errs19){
if(typeof data6 === "string"){
if(!(formats0.validate(data6))){
validate24.errors = [{instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
else {
validate24.errors = [{instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs18 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.purpose !== undefined){
let data7 = data.purpose;
const _errs21 = errors;
if(errors === _errs21){
if(typeof data7 === "string"){
if(func2(data7) > 1000){
validate24.errors = [{instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"}];
return false;
}
else {
if(func2(data7) < 1){
validate24.errors = [{instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate24.errors = [{instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs21 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.authority_reference !== undefined){
let data8 = data.authority_reference;
const _errs23 = errors;
const _errs24 = errors;
if(errors === _errs24){
if(errors === _errs24){
if(typeof data8 === "string"){
if(!pattern13.test(data8)){
validate24.errors = [{instancePath:instancePath+"/authority_reference",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""}];
return false;
}
else {
if(!(formats6(data8))){
validate24.errors = [{instancePath:instancePath+"/authority_reference",schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""}];
return false;
}
}
}
else {
validate24.errors = [{instancePath:instancePath+"/authority_reference",schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs23 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.classification !== undefined){
let data9 = data.classification;
const _errs26 = errors;
if(!((((data9 === "public") || (data9 === "internal")) || (data9 === "confidential")) || (data9 === "restricted"))){
validate24.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema50.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs26 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.total_content_bytes !== undefined){
let data10 = data.total_content_bytes;
const _errs28 = errors;
if(!(((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10))) && (isFinite(data10)))){
validate24.errors = [{instancePath:instancePath+"/total_content_bytes",schemaPath:"#/properties/total_content_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs28){
if((typeof data10 == "number") && (isFinite(data10))){
if(data10 < 0 || isNaN(data10)){
validate24.errors = [{instancePath:instancePath+"/total_content_bytes",schemaPath:"#/properties/total_content_bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"}];
return false;
}
}
}
var valid0 = _errs28 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.sources !== undefined){
let data11 = data.sources;
const _errs30 = errors;
if(errors === _errs30){
if(Array.isArray(data11)){
if(data11.length < 1){
validate24.errors = [{instancePath:instancePath+"/sources",schemaPath:"#/properties/sources/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid9 = true;
const len0 = data11.length;
for(let i0=0; i0<len0; i0++){
const _errs32 = errors;
if(!(validate27(data11[i0], {instancePath:instancePath+"/sources/" + i0,parentData:data11,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
errors = vErrors.length;
}
var valid9 = _errs32 === errors;
if(!valid9){
break;
}
}
}
}
else {
validate24.errors = [{instancePath:instancePath+"/sources",schemaPath:"#/properties/sources/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs30 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.sections !== undefined){
let data13 = data.sections;
const _errs33 = errors;
if(errors === _errs33){
if(Array.isArray(data13)){
if(data13.length < 1){
validate24.errors = [{instancePath:instancePath+"/sections",schemaPath:"#/properties/sections/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid10 = true;
const len1 = data13.length;
for(let i1=0; i1<len1; i1++){
const _errs35 = errors;
if(!(validate31(data13[i1], {instancePath:instancePath+"/sections/" + i1,parentData:data13,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate31.errors : vErrors.concat(validate31.errors);
errors = vErrors.length;
}
var valid10 = _errs35 === errors;
if(!valid10){
break;
}
}
}
}
else {
validate24.errors = [{instancePath:instancePath+"/sections",schemaPath:"#/properties/sections/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs33 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
else {
validate24.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((data.canonicalization === undefined) && (missing0 = "canonicalization")) || ((data.byte_size === undefined) && (missing0 = "byte_size"))) || ((data.sha256 === undefined) && (missing0 = "sha256"))){
validate34.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!(((key0 === "canonicalization") || (key0 === "byte_size")) || (key0 === "sha256"))){
validate34.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.canonicalization !== undefined){
const _errs2 = errors;
if("studio-json-v1" !== data.canonicalization){
validate34.errors = [{instancePath:instancePath+"/canonicalization",schemaPath:"#/properties/canonicalization/const",keyword:"const",params:{allowedValue: "studio-json-v1"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.byte_size !== undefined){
let data1 = data.byte_size;
const _errs3 = errors;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
validate34.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs3){
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 < 2 || isNaN(data1)){
validate34.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 2},message:"must be >= 2"}];
return false;
}
}
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.sha256 !== undefined){
let data2 = data.sha256;
const _errs5 = errors;
const _errs6 = errors;
if(errors === _errs6){
if(typeof data2 === "string"){
if(!pattern18.test(data2)){
validate34.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""}];
return false;
}
}
else {
validate34.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
else {
validate34.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate34.errors = vErrors;
return errors === 0;
}
validate34.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate76(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate76.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((data.spec_version === undefined) && (missing0 = "spec_version")) || ((data.kind === undefined) && (missing0 = "kind"))) || ((data.manifest === undefined) && (missing0 = "manifest"))) || ((data.manifest_identity === undefined) && (missing0 = "manifest_identity"))){
validate76.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!((((key0 === "spec_version") || (key0 === "kind")) || (key0 === "manifest")) || (key0 === "manifest_identity"))){
validate76.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.spec_version !== undefined){
const _errs2 = errors;
if("1.0.0" !== data.spec_version){
validate76.errors = [{instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.kind !== undefined){
const _errs3 = errors;
if("context-package" !== data.kind){
validate76.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "context-package"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.manifest !== undefined){
const _errs4 = errors;
if(!(validate24(data.manifest, {instancePath:instancePath+"/manifest",parentData:data,parentDataProperty:"manifest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
errors = vErrors.length;
}
var valid0 = _errs4 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.manifest_identity !== undefined){
const _errs5 = errors;
if(!(validate34(data.manifest_identity, {instancePath:instancePath+"/manifest_identity",parentData:data,parentDataProperty:"manifest_identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate34.errors : vErrors.concat(validate34.errors);
errors = vErrors.length;
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
}
else {
validate76.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate76.errors = vErrors;
return errors === 0;
}
validate76.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema133 = {"type":"object","additionalProperties":false,"required":["slot","candidates"],"properties":{"slot":{"$ref":"urn:definitely-secure:contract:context-package:1.0.0:context-package#/$defs/symbol"},"candidates":{"type":"array","minItems":1,"maxItems":10000,"items":{"$ref":"#/$defs/choice"}}}};
const schema116 = {"type":"object","additionalProperties":false,"required":["source_id","candidate_id"],"properties":{"source_id":{"$ref":"#/$defs/opaque"},"candidate_id":{"$ref":"#/$defs/opaque"}}};

function validate64(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate64.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((data.source_id === undefined) && (missing0 = "source_id")) || ((data.candidate_id === undefined) && (missing0 = "candidate_id"))){
validate64.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!((key0 === "source_id") || (key0 === "candidate_id"))){
validate64.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.source_id !== undefined){
let data0 = data.source_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern4.test(data0)){
validate64.errors = [{instancePath:instancePath+"/source_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate64.errors = [{instancePath:instancePath+"/source_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.candidate_id !== undefined){
let data1 = data.candidate_id;
const _errs5 = errors;
const _errs6 = errors;
if(errors === _errs6){
if(typeof data1 === "string"){
if(!pattern4.test(data1)){
validate64.errors = [{instancePath:instancePath+"/candidate_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate64.errors = [{instancePath:instancePath+"/candidate_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
else {
validate64.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate64.errors = vErrors;
return errors === 0;
}
validate64.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate80(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate80.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((data.slot === undefined) && (missing0 = "slot")) || ((data.candidates === undefined) && (missing0 = "candidates"))){
validate80.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!((key0 === "slot") || (key0 === "candidates"))){
validate80.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.slot !== undefined){
let data0 = data.slot;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern19.test(data0)){
validate80.errors = [{instancePath:instancePath+"/slot",schemaPath:"urn:definitely-secure:contract:context-package:1.0.0:context-package#/$defs/symbol/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9_]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9_]{0,63}$"+"\""}];
return false;
}
}
else {
validate80.errors = [{instancePath:instancePath+"/slot",schemaPath:"urn:definitely-secure:contract:context-package:1.0.0:context-package#/$defs/symbol/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.candidates !== undefined){
let data1 = data.candidates;
const _errs5 = errors;
if(errors === _errs5){
if(Array.isArray(data1)){
if(data1.length > 10000){
validate80.errors = [{instancePath:instancePath+"/candidates",schemaPath:"#/properties/candidates/maxItems",keyword:"maxItems",params:{limit: 10000},message:"must NOT have more than 10000 items"}];
return false;
}
else {
if(data1.length < 1){
validate80.errors = [{instancePath:instancePath+"/candidates",schemaPath:"#/properties/candidates/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid2 = true;
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
const _errs7 = errors;
if(!(validate64(data1[i0], {instancePath:instancePath+"/candidates/" + i0,parentData:data1,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate64.errors : vErrors.concat(validate64.errors);
errors = vErrors.length;
}
var valid2 = _errs7 === errors;
if(!valid2){
break;
}
}
}
}
}
else {
validate80.errors = [{instancePath:instancePath+"/candidates",schemaPath:"#/properties/candidates/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
else {
validate80.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate80.errors = vErrors;
return errors === 0;
}
validate80.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema135 = {"type":"object","additionalProperties":false,"required":["slot","code"],"properties":{"slot":{"$ref":"urn:definitely-secure:contract:context-package:1.0.0:context-package#/$defs/symbol"},"code":{"enum":["OPTIONAL_EMPTY","OPTIONAL_BUDGET"]}}};

function validate83(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate83.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((data.slot === undefined) && (missing0 = "slot")) || ((data.code === undefined) && (missing0 = "code"))){
validate83.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!((key0 === "slot") || (key0 === "code"))){
validate83.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.slot !== undefined){
let data0 = data.slot;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern19.test(data0)){
validate83.errors = [{instancePath:instancePath+"/slot",schemaPath:"urn:definitely-secure:contract:context-package:1.0.0:context-package#/$defs/symbol/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9_]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9_]{0,63}$"+"\""}];
return false;
}
}
else {
validate83.errors = [{instancePath:instancePath+"/slot",schemaPath:"urn:definitely-secure:contract:context-package:1.0.0:context-package#/$defs/symbol/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.code !== undefined){
let data1 = data.code;
const _errs5 = errors;
if(!((data1 === "OPTIONAL_EMPTY") || (data1 === "OPTIONAL_BUDGET"))){
validate83.errors = [{instancePath:instancePath+"/code",schemaPath:"#/properties/code/enum",keyword:"enum",params:{allowedValues: schema135.properties.code.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
else {
validate83.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate83.errors = vErrors;
return errors === 0;
}
validate83.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate88(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate88.evaluated;
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
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((data.package === undefined) && (missing0 = "package")) || ((data.lineage === undefined) && (missing0 = "lineage"))) || ((data.omissions === undefined) && (missing0 = "omissions"))) || ((data.evidence_reference === undefined) && (missing0 = "evidence_reference"))){
const err0 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"};
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
const _errs3 = errors;
if("prepared" !== data.status){
const err1 = {instancePath:instancePath+"/status",schemaPath:"#/oneOf/0/properties/status/const",keyword:"const",params:{allowedValue: "prepared"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
var valid1 = _errs3 === errors;
}
else {
var valid1 = true;
}
if(valid1){
if(data.diagnostics !== undefined){
let data1 = data.diagnostics;
const _errs4 = errors;
if(Array.isArray(data1)){
if(data1.length > 0){
const err2 = {instancePath:instancePath+"/diagnostics",schemaPath:"#/oneOf/0/properties/diagnostics/maxItems",keyword:"maxItems",params:{limit: 0},message:"must NOT have more than 0 items"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
var valid1 = _errs4 === errors;
}
else {
var valid1 = true;
}
}
}
}
var _valid0 = _errs2 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = {};
props0.status = true;
props0.diagnostics = true;
}
const _errs5 = errors;
const _errs6 = errors;
const _errs7 = errors;
const _errs8 = errors;
let valid3 = false;
const _errs9 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing1;
if((data.package === undefined) && (missing1 = "package")){
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
var _valid1 = _errs9 === errors;
valid3 = valid3 || _valid1;
const _errs10 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if((data.lineage === undefined) && (missing2 = "lineage")){
const err4 = {};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
var _valid1 = _errs10 === errors;
valid3 = valid3 || _valid1;
const _errs11 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing3;
if((data.omissions === undefined) && (missing3 = "omissions")){
const err5 = {};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
var _valid1 = _errs11 === errors;
valid3 = valid3 || _valid1;
const _errs12 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing4;
if((data.evidence_reference === undefined) && (missing4 = "evidence_reference")){
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
var _valid1 = _errs12 === errors;
valid3 = valid3 || _valid1;
if(!valid3){
const err7 = {};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
else {
errors = _errs8;
if(vErrors !== null){
if(_errs8){
vErrors.length = _errs8;
}
else {
vErrors = null;
}
}
}
var valid2 = _errs7 === errors;
if(valid2){
const err8 = {instancePath,schemaPath:"#/oneOf/1/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
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
if(errors === _errs5){
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status !== undefined){
const _errs13 = errors;
if("failed" !== data.status){
const err9 = {instancePath:instancePath+"/status",schemaPath:"#/oneOf/1/properties/status/const",keyword:"const",params:{allowedValue: "failed"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var valid4 = _errs13 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data.diagnostics !== undefined){
let data3 = data.diagnostics;
const _errs14 = errors;
if(Array.isArray(data3)){
if(data3.length < 1){
const err10 = {instancePath:instancePath+"/diagnostics",schemaPath:"#/oneOf/1/properties/diagnostics/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
var valid4 = _errs14 === errors;
}
else {
var valid4 = true;
}
}
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
if(props0 !== true){
props0 = props0 || {};
props0.status = true;
props0.diagnostics = true;
}
}
}
if(!valid0){
const err11 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
validate88.errors = vErrors;
return false;
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
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing5;
if((((((((data.spec_version === undefined) && (missing5 = "spec_version")) || ((data.kind === undefined) && (missing5 = "kind"))) || ((data.build_id === undefined) && (missing5 = "build_id"))) || ((data.correlation_id === undefined) && (missing5 = "correlation_id"))) || ((data.request_identity === undefined) && (missing5 = "request_identity"))) || ((data.status === undefined) && (missing5 = "status"))) || ((data.diagnostics === undefined) && (missing5 = "diagnostics"))){
validate88.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing5},message:"must have required property '"+missing5+"'"}];
return false;
}
else {
const _errs15 = errors;
for(const key0 in data){
if(!(func1.call(schema128.properties, key0))){
validate88.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs15 === errors){
if(data.spec_version !== undefined){
const _errs16 = errors;
if("1.0.0" !== data.spec_version){
validate88.errors = [{instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"}];
return false;
}
var valid5 = _errs16 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.kind !== undefined){
const _errs17 = errors;
if("context-build-result" !== data.kind){
validate88.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "context-build-result"},message:"must be equal to constant"}];
return false;
}
var valid5 = _errs17 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.build_id !== undefined){
let data6 = data.build_id;
const _errs18 = errors;
const _errs19 = errors;
if(errors === _errs19){
if(typeof data6 === "string"){
if(!pattern4.test(data6)){
validate88.errors = [{instancePath:instancePath+"/build_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate88.errors = [{instancePath:instancePath+"/build_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid5 = _errs18 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.correlation_id !== undefined){
let data7 = data.correlation_id;
const _errs21 = errors;
const _errs22 = errors;
if(errors === _errs22){
if(typeof data7 === "string"){
if(!pattern4.test(data7)){
validate88.errors = [{instancePath:instancePath+"/correlation_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate88.errors = [{instancePath:instancePath+"/correlation_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid5 = _errs21 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.request_identity !== undefined){
const _errs24 = errors;
if(!(validate45(data.request_identity, {instancePath:instancePath+"/request_identity",parentData:data,parentDataProperty:"request_identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate45.errors : vErrors.concat(validate45.errors);
errors = vErrors.length;
}
var valid5 = _errs24 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.status !== undefined){
let data9 = data.status;
const _errs25 = errors;
if(!((data9 === "prepared") || (data9 === "failed"))){
validate88.errors = [{instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema128.properties.status.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid5 = _errs25 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.diagnostics !== undefined){
let data10 = data.diagnostics;
const _errs26 = errors;
if(errors === _errs26){
if(Array.isArray(data10)){
if(data10.length > 10000){
validate88.errors = [{instancePath:instancePath+"/diagnostics",schemaPath:"#/properties/diagnostics/maxItems",keyword:"maxItems",params:{limit: 10000},message:"must NOT have more than 10000 items"}];
return false;
}
else {
if(data10.length < 0){
validate88.errors = [{instancePath:instancePath+"/diagnostics",schemaPath:"#/properties/diagnostics/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid8 = true;
const len0 = data10.length;
for(let i0=0; i0<len0; i0++){
let data11 = data10[i0];
const _errs28 = errors;
const _errs29 = errors;
if(errors === _errs29){
if(data11 && typeof data11 == "object" && !Array.isArray(data11)){
let missing6;
if((((data11.stage === undefined) && (missing6 = "stage")) || ((data11.code === undefined) && (missing6 = "code"))) || ((data11.action === undefined) && (missing6 = "action"))){
validate88.errors = [{instancePath:instancePath+"/diagnostics/" + i0,schemaPath:"#/$defs/diagnostic/required",keyword:"required",params:{missingProperty: missing6},message:"must have required property '"+missing6+"'"}];
return false;
}
else {
const _errs31 = errors;
for(const key1 in data11){
if(!(((key1 === "stage") || (key1 === "code")) || (key1 === "action"))){
validate88.errors = [{instancePath:instancePath+"/diagnostics/" + i0,schemaPath:"#/$defs/diagnostic/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs31 === errors){
if(data11.stage !== undefined){
let data12 = data11.stage;
const _errs32 = errors;
if(!(((((((((data12 === "request") || (data12 === "authorization")) || (data12 === "source")) || (data12 === "normalization")) || (data12 === "selection")) || (data12 === "assembly")) || (data12 === "lifecycle")) || (data12 === "audit")) || (data12 === "handoff"))){
validate88.errors = [{instancePath:instancePath+"/diagnostics/" + i0+"/stage",schemaPath:"#/$defs/diagnostic/properties/stage/enum",keyword:"enum",params:{allowedValues: schema131.properties.stage.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid10 = _errs32 === errors;
}
else {
var valid10 = true;
}
if(valid10){
if(data11.code !== undefined){
let data13 = data11.code;
const _errs33 = errors;
if(!((((((((((((((((data13 === "INVALID_REQUEST") || (data13 === "UNSUPPORTED_VERSION")) || (data13 === "PREPARATION_DENIED")) || (data13 === "AUTHORITY_UNVERIFIABLE")) || (data13 === "SOURCE_UNAVAILABLE")) || (data13 === "SOURCE_INTEGRITY")) || (data13 === "INVALID_SOURCE")) || (data13 === "CONFLICT")) || (data13 === "REQUIRED_CONTEXT_MISSING")) || (data13 === "BUDGET_EXCEEDED")) || (data13 === "STALE_AUTHORITY")) || (data13 === "AUDIT_REQUIRED")) || (data13 === "CANCELLED")) || (data13 === "OPTIONAL_EMPTY")) || (data13 === "OPTIONAL_BUDGET")) || (data13 === "INELIGIBLE"))){
validate88.errors = [{instancePath:instancePath+"/diagnostics/" + i0+"/code",schemaPath:"#/$defs/diagnostic/properties/code/enum",keyword:"enum",params:{allowedValues: schema131.properties.code.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid10 = _errs33 === errors;
}
else {
var valid10 = true;
}
if(valid10){
if(data11.action !== undefined){
let data14 = data11.action;
const _errs34 = errors;
if(!((((((((data14 === "repair-request") || (data14 === "obtain-authorization")) || (data14 === "repair-source")) || (data14 === "resolve-conflict")) || (data14 === "increase-budget")) || (data14 === "rebuild")) || (data14 === "retry-audit")) || (data14 === "none"))){
validate88.errors = [{instancePath:instancePath+"/diagnostics/" + i0+"/action",schemaPath:"#/$defs/diagnostic/properties/action/enum",keyword:"enum",params:{allowedValues: schema131.properties.action.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid10 = _errs34 === errors;
}
else {
var valid10 = true;
}
}
}
}
}
}
else {
validate88.errors = [{instancePath:instancePath+"/diagnostics/" + i0,schemaPath:"#/$defs/diagnostic/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
var valid8 = _errs28 === errors;
if(!valid8){
break;
}
}
}
}
}
else {
validate88.errors = [{instancePath:instancePath+"/diagnostics",schemaPath:"#/properties/diagnostics/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid5 = _errs26 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.package !== undefined){
const _errs35 = errors;
if(!(validate76(data.package, {instancePath:instancePath+"/package",parentData:data,parentDataProperty:"package",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate76.errors : vErrors.concat(validate76.errors);
errors = vErrors.length;
}
var valid5 = _errs35 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.lineage !== undefined){
let data16 = data.lineage;
const _errs36 = errors;
if(errors === _errs36){
if(Array.isArray(data16)){
if(data16.length > 10000){
validate88.errors = [{instancePath:instancePath+"/lineage",schemaPath:"#/properties/lineage/maxItems",keyword:"maxItems",params:{limit: 10000},message:"must NOT have more than 10000 items"}];
return false;
}
else {
if(data16.length < 1){
validate88.errors = [{instancePath:instancePath+"/lineage",schemaPath:"#/properties/lineage/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid11 = true;
const len1 = data16.length;
for(let i1=0; i1<len1; i1++){
const _errs38 = errors;
if(!(validate80(data16[i1], {instancePath:instancePath+"/lineage/" + i1,parentData:data16,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
errors = vErrors.length;
}
var valid11 = _errs38 === errors;
if(!valid11){
break;
}
}
}
}
}
else {
validate88.errors = [{instancePath:instancePath+"/lineage",schemaPath:"#/properties/lineage/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid5 = _errs36 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.omissions !== undefined){
let data18 = data.omissions;
const _errs39 = errors;
if(errors === _errs39){
if(Array.isArray(data18)){
if(data18.length > 10000){
validate88.errors = [{instancePath:instancePath+"/omissions",schemaPath:"#/properties/omissions/maxItems",keyword:"maxItems",params:{limit: 10000},message:"must NOT have more than 10000 items"}];
return false;
}
else {
if(data18.length < 0){
validate88.errors = [{instancePath:instancePath+"/omissions",schemaPath:"#/properties/omissions/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid12 = true;
const len2 = data18.length;
for(let i2=0; i2<len2; i2++){
const _errs41 = errors;
if(!(validate83(data18[i2], {instancePath:instancePath+"/omissions/" + i2,parentData:data18,parentDataProperty:i2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate83.errors : vErrors.concat(validate83.errors);
errors = vErrors.length;
}
var valid12 = _errs41 === errors;
if(!valid12){
break;
}
}
}
}
}
else {
validate88.errors = [{instancePath:instancePath+"/omissions",schemaPath:"#/properties/omissions/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid5 = _errs39 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.evidence_reference !== undefined){
let data20 = data.evidence_reference;
const _errs42 = errors;
const _errs43 = errors;
if(errors === _errs43){
if(typeof data20 === "string"){
if(!pattern4.test(data20)){
validate88.errors = [{instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate88.errors = [{instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid5 = _errs42 === errors;
}
else {
var valid5 = true;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
else {
validate88.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate88.errors = vErrors;
return errors === 0;
}
validate88.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validateReceipt = validate93;
const schema138 = {"type":"object","additionalProperties":false,"required":["spec_version","kind","attestation_reference"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"context-build-public-receipt"},"attestation_reference":{"$ref":"#/$defs/opaque"}}};

function validate93(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate93.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((data.spec_version === undefined) && (missing0 = "spec_version")) || ((data.kind === undefined) && (missing0 = "kind"))) || ((data.attestation_reference === undefined) && (missing0 = "attestation_reference"))){
validate93.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!(((key0 === "spec_version") || (key0 === "kind")) || (key0 === "attestation_reference"))){
validate93.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.spec_version !== undefined){
const _errs2 = errors;
if("1.0.0" !== data.spec_version){
validate93.errors = [{instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.kind !== undefined){
const _errs3 = errors;
if("context-build-public-receipt" !== data.kind){
validate93.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "context-build-public-receipt"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.attestation_reference !== undefined){
let data2 = data.attestation_reference;
const _errs4 = errors;
const _errs5 = errors;
if(errors === _errs5){
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
validate93.errors = [{instancePath:instancePath+"/attestation_reference",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate93.errors = [{instancePath:instancePath+"/attestation_reference",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs4 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
else {
validate93.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate93.errors = vErrors;
return errors === 0;
}
validate93.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
