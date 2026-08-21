// Generated from DefinitelySecureStudio/codex@dfd31a693674dc03dec4784dcdd1345f647cff1e
// Source SHA-256: a0915675a2036c8f929c53a212fcd14740e12fda0ef643fe13d727f0d62e9509
// Rebuild with scripts/generate-context-schema-validator.mjs; do not edit manually.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
"use strict";
export const validate = validate20;
export default validate20;
const schema31 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://schemas.definitelysecure.studio/context-packages/v1/context-package.schema.json","title":"Definitely Secure Studio Context Package v1","oneOf":[{"$ref":"#/$defs/contextPackage"},{"$ref":"#/$defs/contextPackageReference"},{"$ref":"#/$defs/contextAuthorization"}],"$defs":{"safeId":{"type":"string","pattern":"^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"},"namespace":{"type":"string","pattern":"^[a-z0-9]+(?:[._-][a-z0-9]+)+$"},"symbol":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,63}$"},"promptId":{"type":"string","pattern":"^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"},"packageId":{"type":"string","pattern":"^context-package\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"},"semver":{"type":"string","pattern":"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"},"timestamp":{"type":"string","format":"date-time"},"absoluteUri":{"type":"string","format":"uri","pattern":"^[A-Za-z][A-Za-z0-9+.-]*:"},"sha256":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"classification":{"enum":["public","internal","confidential","restricted"]},"owner":{"type":"string","pattern":"^@?[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$"},"packageIdentity":{"type":"object","additionalProperties":false,"required":["id","version","instance_id"],"properties":{"id":{"$ref":"#/$defs/packageId"},"version":{"$ref":"#/$defs/semver"},"instance_id":{"$ref":"#/$defs/safeId"}}},"contentIdentity":{"type":"object","additionalProperties":false,"required":["canonicalization","byte_size","sha256"],"properties":{"canonicalization":{"const":"studio-json-v1"},"byte_size":{"type":"integer","minimum":2},"sha256":{"$ref":"#/$defs/sha256"}}},"artifactIdentity":{"type":"object","additionalProperties":false,"required":["artifact_uri","media_type","byte_size","sha256"],"properties":{"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},"byte_size":{"type":"integer","minimum":1},"sha256":{"$ref":"#/$defs/sha256"}}},"sourceRecord":{"type":"object","additionalProperties":false,"required":["source_id","kind","version","classification","evidence_reference"],"properties":{"source_id":{"$ref":"#/$defs/safeId"},"kind":{"enum":["public-canon","approved-private","caller-supplied","synthetic"]},"version":{"type":"string","minLength":1,"maxLength":200},"classification":{"$ref":"#/$defs/classification"},"evidence_reference":{"$ref":"#/$defs/absoluteUri"},"artifact":{"$ref":"#/$defs/artifactIdentity"}}},"section":{"type":"object","additionalProperties":false,"required":["slot","classification","media_type","content","byte_size","sha256","source_ids"],"properties":{"slot":{"$ref":"#/$defs/symbol"},"classification":{"$ref":"#/$defs/classification"},"media_type":{"enum":["text/plain","application/json"]},"content":{},"byte_size":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha256"},"source_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/safeId"}}},"allOf":[{"if":{"properties":{"media_type":{"const":"text/plain"}},"required":["media_type"]},"then":{"properties":{"content":{"type":"string"}}}}]},"manifest":{"type":"object","additionalProperties":false,"required":["package","builder","created_at","review_after","expires_at","purpose","authority_reference","classification","total_content_bytes","sources","sections"],"properties":{"package":{"$ref":"#/$defs/packageIdentity"},"builder":{"type":"object","additionalProperties":false,"required":["id","version"],"properties":{"id":{"$ref":"#/$defs/namespace"},"version":{"$ref":"#/$defs/semver"}}},"created_at":{"$ref":"#/$defs/timestamp"},"review_after":{"$ref":"#/$defs/timestamp"},"expires_at":{"$ref":"#/$defs/timestamp"},"purpose":{"type":"string","minLength":1,"maxLength":1000},"authority_reference":{"$ref":"#/$defs/absoluteUri"},"classification":{"$ref":"#/$defs/classification"},"total_content_bytes":{"type":"integer","minimum":0},"sources":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/sourceRecord"}},"sections":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/section"}}}},"contextPackage":{"type":"object","additionalProperties":false,"required":["spec_version","kind","manifest","manifest_identity"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"context-package"},"manifest":{"$ref":"#/$defs/manifest"},"manifest_identity":{"$ref":"#/$defs/contentIdentity"}}},"contextPackageReference":{"type":"object","additionalProperties":false,"required":["spec_version","kind","package","artifact","manifest_identity"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"context-package-reference"},"package":{"$ref":"#/$defs/packageIdentity"},"artifact":{"allOf":[{"$ref":"#/$defs/artifactIdentity"},{"properties":{"media_type":{"const":"application/vnd.definitely-secure-studio.context-package+json"}}}]},"manifest_identity":{"$ref":"#/$defs/contentIdentity"}}},"contextAuthorization":{"type":"object","additionalProperties":false,"required":["spec_version","kind","decision_id","decision","package","prompt","sections","max_classification","purpose","decided_by","decided_at","expires_at","authority_reference"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"context-authorization"},"decision_id":{"$ref":"#/$defs/safeId"},"decision":{"enum":["allow","deny"]},"package":{"$ref":"#/$defs/packageIdentity"},"prompt":{"type":"object","additionalProperties":false,"required":["id","version"],"properties":{"id":{"$ref":"#/$defs/promptId"},"version":{"$ref":"#/$defs/semver"}}},"sections":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/symbol"}},"max_classification":{"$ref":"#/$defs/classification"},"purpose":{"type":"string","minLength":1,"maxLength":1000},"decided_by":{"$ref":"#/$defs/owner"},"decided_at":{"$ref":"#/$defs/timestamp"},"expires_at":{"$ref":"#/$defs/timestamp"},"authority_reference":{"$ref":"#/$defs/absoluteUri"}},"allOf":[{"if":{"properties":{"decision":{"const":"allow"}},"required":["decision"]},"then":{"properties":{"sections":{"minItems":1}}}}]}}};
const schema32 = {"type":"object","additionalProperties":false,"required":["spec_version","kind","manifest","manifest_identity"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"context-package"},"manifest":{"$ref":"#/$defs/manifest"},"manifest_identity":{"$ref":"#/$defs/contentIdentity"}}};
const schema33 = {"type":"object","additionalProperties":false,"required":["package","builder","created_at","review_after","expires_at","purpose","authority_reference","classification","total_content_bytes","sources","sections"],"properties":{"package":{"$ref":"#/$defs/packageIdentity"},"builder":{"type":"object","additionalProperties":false,"required":["id","version"],"properties":{"id":{"$ref":"#/$defs/namespace"},"version":{"$ref":"#/$defs/semver"}}},"created_at":{"$ref":"#/$defs/timestamp"},"review_after":{"$ref":"#/$defs/timestamp"},"expires_at":{"$ref":"#/$defs/timestamp"},"purpose":{"type":"string","minLength":1,"maxLength":1000},"authority_reference":{"$ref":"#/$defs/absoluteUri"},"classification":{"$ref":"#/$defs/classification"},"total_content_bytes":{"type":"integer","minimum":0},"sources":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/sourceRecord"}},"sections":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/section"}}}};
const schema38 = {"type":"string","pattern":"^[a-z0-9]+(?:[._-][a-z0-9]+)+$"};
const schema36 = {"type":"string","pattern":"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"};
const schema40 = {"type":"string","format":"date-time"};
const schema43 = {"type":"string","format":"uri","pattern":"^[A-Za-z][A-Za-z0-9+.-]*:"};
const schema44 = {"enum":["public","internal","confidential","restricted"]};
const func1 = Object.prototype.hasOwnProperty;
const func2 = require("ajv/dist/runtime/ucs2length").default;
const schema34 = {"type":"object","additionalProperties":false,"required":["id","version","instance_id"],"properties":{"id":{"$ref":"#/$defs/packageId"},"version":{"$ref":"#/$defs/semver"},"instance_id":{"$ref":"#/$defs/safeId"}}};
const schema35 = {"type":"string","pattern":"^context-package\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"};
const schema37 = {"type":"string","pattern":"^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"};
const pattern4 = new RegExp("^context-package\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$", "u");
const pattern5 = new RegExp("^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$", "u");
const pattern6 = new RegExp("^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$", "u");

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate23.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.version === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.instance_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "instance_id"},message:"must have required property '"+"instance_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "id") || (key0 === "version")) || (key0 === "instance_id"))){
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
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 === "string"){
if(!pattern4.test(data0)){
const err4 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/packageId/pattern",keyword:"pattern",params:{pattern: "^context-package\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"},message:"must match pattern \""+"^context-package\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"+"\""};
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
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/packageId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.version !== undefined){
let data1 = data.version;
if(typeof data1 === "string"){
if(!pattern5.test(data1)){
const err6 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"+"\""};
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
const err7 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.instance_id !== undefined){
let data2 = data.instance_id;
if(typeof data2 === "string"){
if(!pattern6.test(data2)){
const err8 = {instancePath:instancePath+"/instance_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"+"\""};
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
const err9 = {instancePath:instancePath+"/instance_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err10 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema45 = {"type":"object","additionalProperties":false,"required":["source_id","kind","version","classification","evidence_reference"],"properties":{"source_id":{"$ref":"#/$defs/safeId"},"kind":{"enum":["public-canon","approved-private","caller-supplied","synthetic"]},"version":{"type":"string","minLength":1,"maxLength":200},"classification":{"$ref":"#/$defs/classification"},"evidence_reference":{"$ref":"#/$defs/absoluteUri"},"artifact":{"$ref":"#/$defs/artifactIdentity"}}};
const pattern9 = new RegExp("^[A-Za-z][A-Za-z0-9+.-]*:", "u");
const formats6 = require("ajv-formats/dist/formats").fullFormats.uri;
const schema49 = {"type":"object","additionalProperties":false,"required":["artifact_uri","media_type","byte_size","sha256"],"properties":{"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},"byte_size":{"type":"integer","minimum":1},"sha256":{"$ref":"#/$defs/sha256"}}};
const schema51 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}$"};
const pattern13 = new RegExp("^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$", "u");
const pattern14 = new RegExp("^sha256:[0-9a-f]{64}$", "u");

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
if(!pattern9.test(data0)){
const err5 = {instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!(formats6(data0))){
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
if(!pattern13.test(data1)){
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
if(data2 < 1 || isNaN(data2)){
const err11 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(!pattern14.test(data3)){
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
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.source_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_id"},message:"must have required property '"+"source_id"+"'"};
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
if(data.evidence_reference === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_reference"},message:"must have required property '"+"evidence_reference"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "source_id") || (key0 === "kind")) || (key0 === "version")) || (key0 === "classification")) || (key0 === "evidence_reference")) || (key0 === "artifact"))){
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
if(data.source_id !== undefined){
let data0 = data.source_id;
if(typeof data0 === "string"){
if(!pattern6.test(data0)){
const err6 = {instancePath:instancePath+"/source_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"+"\""};
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
const err7 = {instancePath:instancePath+"/source_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.kind !== undefined){
let data1 = data.kind;
if(!((((data1 === "public-canon") || (data1 === "approved-private")) || (data1 === "caller-supplied")) || (data1 === "synthetic"))){
const err8 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema45.properties.kind.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.version !== undefined){
let data2 = data.version;
if(typeof data2 === "string"){
if(func2(data2) > 200){
const err9 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(func2(data2) < 1){
const err10 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err11 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.classification !== undefined){
let data3 = data.classification;
if(!((((data3 === "public") || (data3 === "internal")) || (data3 === "confidential")) || (data3 === "restricted"))){
const err12 = {instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema44.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.evidence_reference !== undefined){
let data4 = data.evidence_reference;
if(typeof data4 === "string"){
if(!pattern9.test(data4)){
const err13 = {instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!(formats6(data4))){
const err14 = {instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
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
const err15 = {instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.artifact !== undefined){
if(!(validate26(data.artifact, {instancePath:instancePath+"/artifact",parentData:data,parentDataProperty:"artifact",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
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
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema52 = {"type":"object","additionalProperties":false,"required":["slot","classification","media_type","content","byte_size","sha256","source_ids"],"properties":{"slot":{"$ref":"#/$defs/symbol"},"classification":{"$ref":"#/$defs/classification"},"media_type":{"enum":["text/plain","application/json"]},"content":{},"byte_size":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha256"},"source_ids":{"type":"array","minItems":1,"uniqueItems":true,"items":{"$ref":"#/$defs/safeId"}}},"allOf":[{"if":{"properties":{"media_type":{"const":"text/plain"}},"required":["media_type"]},"then":{"properties":{"content":{"type":"string"}}}}]};
const schema53 = {"type":"string","pattern":"^[a-z][a-z0-9_]{0,63}$"};
const pattern15 = new RegExp("^[a-z][a-z0-9_]{0,63}$", "u");
const func0 = require("ajv/dist/runtime/equal").default;

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
const err2 = {instancePath:instancePath+"/content",schemaPath:"#/allOf/0/then/properties/content/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
props0.content = true;
props0.media_type = true;
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
if(data.slot === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "slot"},message:"must have required property '"+"slot"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.classification === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "classification"},message:"must have required property '"+"classification"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.media_type === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "media_type"},message:"must have required property '"+"media_type"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.content === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "content"},message:"must have required property '"+"content"+"'"};
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
if(data.source_ids === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_ids"},message:"must have required property '"+"source_ids"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "slot") || (key0 === "classification")) || (key0 === "media_type")) || (key0 === "content")) || (key0 === "byte_size")) || (key0 === "sha256")) || (key0 === "source_ids"))){
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
if(data.slot !== undefined){
let data2 = data.slot;
if(typeof data2 === "string"){
if(!pattern15.test(data2)){
const err12 = {instancePath:instancePath+"/slot",schemaPath:"#/$defs/symbol/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9_]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9_]{0,63}$"+"\""};
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
const err13 = {instancePath:instancePath+"/slot",schemaPath:"#/$defs/symbol/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.classification !== undefined){
let data3 = data.classification;
if(!((((data3 === "public") || (data3 === "internal")) || (data3 === "confidential")) || (data3 === "restricted"))){
const err14 = {instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema44.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.media_type !== undefined){
let data4 = data.media_type;
if(!((data4 === "text/plain") || (data4 === "application/json"))){
const err15 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/enum",keyword:"enum",params:{allowedValues: schema52.properties.media_type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.byte_size !== undefined){
let data5 = data.byte_size;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err16 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 < 0 || isNaN(data5)){
const err17 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.sha256 !== undefined){
let data6 = data.sha256;
if(typeof data6 === "string"){
if(!pattern14.test(data6)){
const err18 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err19 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.source_ids !== undefined){
let data7 = data.source_ids;
if(Array.isArray(data7)){
if(data7.length < 1){
const err20 = {instancePath:instancePath+"/source_ids",schemaPath:"#/properties/source_ids/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
if(typeof data8 === "string"){
if(!pattern6.test(data8)){
const err21 = {instancePath:instancePath+"/source_ids/" + i0,schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"+"\""};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
else {
const err22 = {instancePath:instancePath+"/source_ids/" + i0,schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data7[i1], data7[j0])){
const err23 = {instancePath:instancePath+"/source_ids",schemaPath:"#/properties/source_ids/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err24 = {instancePath:instancePath+"/source_ids",schemaPath:"#/properties/source_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
}
else {
const err25 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
validate29.errors = vErrors;
return errors === 0;
}
validate29.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const pattern7 = new RegExp("^[a-z0-9]+(?:[._-][a-z0-9]+)+$", "u");
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
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.package === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "package"},message:"must have required property '"+"package"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.builder === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "builder"},message:"must have required property '"+"builder"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.created_at === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "created_at"},message:"must have required property '"+"created_at"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.review_after === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "review_after"},message:"must have required property '"+"review_after"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.expires_at === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expires_at"},message:"must have required property '"+"expires_at"+"'"};
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
if(data.authority_reference === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authority_reference"},message:"must have required property '"+"authority_reference"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.classification === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "classification"},message:"must have required property '"+"classification"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.total_content_bytes === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "total_content_bytes"},message:"must have required property '"+"total_content_bytes"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.sources === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sources"},message:"must have required property '"+"sources"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.sections === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sections"},message:"must have required property '"+"sections"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema33.properties, key0))){
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
if(data.package !== undefined){
if(!(validate23(data.package, {instancePath:instancePath+"/package",parentData:data,parentDataProperty:"package",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
}
if(data.builder !== undefined){
let data1 = data.builder;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.id === undefined){
const err12 = {instancePath:instancePath+"/builder",schemaPath:"#/properties/builder/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data1.version === undefined){
const err13 = {instancePath:instancePath+"/builder",schemaPath:"#/properties/builder/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
for(const key1 in data1){
if(!((key1 === "id") || (key1 === "version"))){
const err14 = {instancePath:instancePath+"/builder",schemaPath:"#/properties/builder/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
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
if(!pattern7.test(data2)){
const err15 = {instancePath:instancePath+"/builder/id",schemaPath:"#/$defs/namespace/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9]+(?:[._-][a-z0-9]+)+$"},message:"must match pattern \""+"^[a-z0-9]+(?:[._-][a-z0-9]+)+$"+"\""};
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
const err16 = {instancePath:instancePath+"/builder/id",schemaPath:"#/$defs/namespace/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err17 = {instancePath:instancePath+"/builder/version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"+"\""};
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
const err18 = {instancePath:instancePath+"/builder/version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
}
else {
const err19 = {instancePath:instancePath+"/builder",schemaPath:"#/properties/builder/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.created_at !== undefined){
let data4 = data.created_at;
if(typeof data4 === "string"){
if(!(formats0.validate(data4))){
const err20 = {instancePath:instancePath+"/created_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err21 = {instancePath:instancePath+"/created_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.review_after !== undefined){
let data5 = data.review_after;
if(typeof data5 === "string"){
if(!(formats0.validate(data5))){
const err22 = {instancePath:instancePath+"/review_after",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err23 = {instancePath:instancePath+"/review_after",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.expires_at !== undefined){
let data6 = data.expires_at;
if(typeof data6 === "string"){
if(!(formats0.validate(data6))){
const err24 = {instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err25 = {instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.purpose !== undefined){
let data7 = data.purpose;
if(typeof data7 === "string"){
if(func2(data7) > 1000){
const err26 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(func2(data7) < 1){
const err27 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err28 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.authority_reference !== undefined){
let data8 = data.authority_reference;
if(typeof data8 === "string"){
if(!pattern9.test(data8)){
const err29 = {instancePath:instancePath+"/authority_reference",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(!(formats6(data8))){
const err30 = {instancePath:instancePath+"/authority_reference",schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
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
const err31 = {instancePath:instancePath+"/authority_reference",schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.classification !== undefined){
let data9 = data.classification;
if(!((((data9 === "public") || (data9 === "internal")) || (data9 === "confidential")) || (data9 === "restricted"))){
const err32 = {instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema44.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.total_content_bytes !== undefined){
let data10 = data.total_content_bytes;
if(!(((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10))) && (isFinite(data10)))){
const err33 = {instancePath:instancePath+"/total_content_bytes",schemaPath:"#/properties/total_content_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if((typeof data10 == "number") && (isFinite(data10))){
if(data10 < 0 || isNaN(data10)){
const err34 = {instancePath:instancePath+"/total_content_bytes",schemaPath:"#/properties/total_content_bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.sources !== undefined){
let data11 = data.sources;
if(Array.isArray(data11)){
if(data11.length < 1){
const err35 = {instancePath:instancePath+"/sources",schemaPath:"#/properties/sources/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
const len0 = data11.length;
for(let i0=0; i0<len0; i0++){
if(!(validate25(data11[i0], {instancePath:instancePath+"/sources/" + i0,parentData:data11,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
errors = vErrors.length;
}
}
}
else {
const err36 = {instancePath:instancePath+"/sources",schemaPath:"#/properties/sources/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data.sections !== undefined){
let data13 = data.sections;
if(Array.isArray(data13)){
if(data13.length < 1){
const err37 = {instancePath:instancePath+"/sections",schemaPath:"#/properties/sections/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
const len1 = data13.length;
for(let i1=0; i1<len1; i1++){
if(!(validate29(data13[i1], {instancePath:instancePath+"/sections/" + i1,parentData:data13,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate29.errors : vErrors.concat(validate29.errors);
errors = vErrors.length;
}
}
}
else {
const err38 = {instancePath:instancePath+"/sections",schemaPath:"#/properties/sections/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
const err39 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema57 = {"type":"object","additionalProperties":false,"required":["canonicalization","byte_size","sha256"],"properties":{"canonicalization":{"const":"studio-json-v1"},"byte_size":{"type":"integer","minimum":2},"sha256":{"$ref":"#/$defs/sha256"}}};

function validate32(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate32.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.canonicalization === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "canonicalization"},message:"must have required property '"+"canonicalization"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.byte_size === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "byte_size"},message:"must have required property '"+"byte_size"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.sha256 === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "canonicalization") || (key0 === "byte_size")) || (key0 === "sha256"))){
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
if(data.canonicalization !== undefined){
if("studio-json-v1" !== data.canonicalization){
const err4 = {instancePath:instancePath+"/canonicalization",schemaPath:"#/properties/canonicalization/const",keyword:"const",params:{allowedValue: "studio-json-v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.byte_size !== undefined){
let data1 = data.byte_size;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
const err5 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 < 2 || isNaN(data1)){
const err6 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 2},message:"must be >= 2"};
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
if(data.sha256 !== undefined){
let data2 = data.sha256;
if(typeof data2 === "string"){
if(!pattern14.test(data2)){
const err7 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err8 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
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
validate32.errors = vErrors;
return errors === 0;
}
validate32.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.manifest === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest"},message:"must have required property '"+"manifest"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.manifest_identity === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_identity"},message:"must have required property '"+"manifest_identity"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "spec_version") || (key0 === "kind")) || (key0 === "manifest")) || (key0 === "manifest_identity"))){
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
if(data.spec_version !== undefined){
if("1.0.0" !== data.spec_version){
const err5 = {instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.kind !== undefined){
if("context-package" !== data.kind){
const err6 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "context-package"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.manifest !== undefined){
if(!(validate22(data.manifest, {instancePath:instancePath+"/manifest",parentData:data,parentDataProperty:"manifest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
errors = vErrors.length;
}
}
if(data.manifest_identity !== undefined){
if(!(validate32(data.manifest_identity, {instancePath:instancePath+"/manifest_identity",parentData:data,parentDataProperty:"manifest_identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate32.errors : vErrors.concat(validate32.errors);
errors = vErrors.length;
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
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema59 = {"type":"object","additionalProperties":false,"required":["spec_version","kind","package","artifact","manifest_identity"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"context-package-reference"},"package":{"$ref":"#/$defs/packageIdentity"},"artifact":{"allOf":[{"$ref":"#/$defs/artifactIdentity"},{"properties":{"media_type":{"const":"application/vnd.definitely-secure-studio.context-package+json"}}}]},"manifest_identity":{"$ref":"#/$defs/contentIdentity"}}};

function validate35(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate35.evaluated;
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
if(data.package === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "package"},message:"must have required property '"+"package"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.artifact === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "artifact"},message:"must have required property '"+"artifact"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.manifest_identity === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_identity"},message:"must have required property '"+"manifest_identity"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "spec_version") || (key0 === "kind")) || (key0 === "package")) || (key0 === "artifact")) || (key0 === "manifest_identity"))){
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
if(data.spec_version !== undefined){
if("1.0.0" !== data.spec_version){
const err6 = {instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.kind !== undefined){
if("context-package-reference" !== data.kind){
const err7 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "context-package-reference"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.package !== undefined){
if(!(validate23(data.package, {instancePath:instancePath+"/package",parentData:data,parentDataProperty:"package",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
}
if(data.artifact !== undefined){
let data3 = data.artifact;
if(!(validate26(data3, {instancePath:instancePath+"/artifact",parentData:data,parentDataProperty:"artifact",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
errors = vErrors.length;
}
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.media_type !== undefined){
if("application/vnd.definitely-secure-studio.context-package+json" !== data3.media_type){
const err8 = {instancePath:instancePath+"/artifact/media_type",schemaPath:"#/properties/artifact/allOf/1/properties/media_type/const",keyword:"const",params:{allowedValue: "application/vnd.definitely-secure-studio.context-package+json"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
}
if(data.manifest_identity !== undefined){
if(!(validate32(data.manifest_identity, {instancePath:instancePath+"/manifest_identity",parentData:data,parentDataProperty:"manifest_identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate32.errors : vErrors.concat(validate32.errors);
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
validate35.errors = vErrors;
return errors === 0;
}
validate35.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema60 = {"type":"object","additionalProperties":false,"required":["spec_version","kind","decision_id","decision","package","prompt","sections","max_classification","purpose","decided_by","decided_at","expires_at","authority_reference"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"context-authorization"},"decision_id":{"$ref":"#/$defs/safeId"},"decision":{"enum":["allow","deny"]},"package":{"$ref":"#/$defs/packageIdentity"},"prompt":{"type":"object","additionalProperties":false,"required":["id","version"],"properties":{"id":{"$ref":"#/$defs/promptId"},"version":{"$ref":"#/$defs/semver"}}},"sections":{"type":"array","uniqueItems":true,"items":{"$ref":"#/$defs/symbol"}},"max_classification":{"$ref":"#/$defs/classification"},"purpose":{"type":"string","minLength":1,"maxLength":1000},"decided_by":{"$ref":"#/$defs/owner"},"decided_at":{"$ref":"#/$defs/timestamp"},"expires_at":{"$ref":"#/$defs/timestamp"},"authority_reference":{"$ref":"#/$defs/absoluteUri"}},"allOf":[{"if":{"properties":{"decision":{"const":"allow"}},"required":["decision"]},"then":{"properties":{"sections":{"minItems":1}}}}]};
const schema62 = {"type":"string","pattern":"^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"};
const schema66 = {"type":"string","pattern":"^@?[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$"};
const pattern20 = new RegExp("^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$", "u");
const pattern23 = new RegExp("^@?[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$", "u");

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
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.decision === undefined) && (missing0 = "decision")){
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
if(data.decision !== undefined){
if("allow" !== data.decision){
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
if(data.sections !== undefined){
let data1 = data.sections;
if(Array.isArray(data1)){
if(data1.length < 1){
const err2 = {instancePath:instancePath+"/sections",schemaPath:"#/allOf/0/then/properties/sections/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
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
props0.sections = true;
props0.decision = true;
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
if(data.spec_version === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "spec_version"},message:"must have required property '"+"spec_version"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.kind === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.decision_id === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "decision_id"},message:"must have required property '"+"decision_id"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.decision === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "decision"},message:"must have required property '"+"decision"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.package === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "package"},message:"must have required property '"+"package"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.prompt === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "prompt"},message:"must have required property '"+"prompt"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.sections === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sections"},message:"must have required property '"+"sections"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.max_classification === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "max_classification"},message:"must have required property '"+"max_classification"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.purpose === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "purpose"},message:"must have required property '"+"purpose"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.decided_by === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "decided_by"},message:"must have required property '"+"decided_by"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.decided_at === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "decided_at"},message:"must have required property '"+"decided_at"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.expires_at === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expires_at"},message:"must have required property '"+"expires_at"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.authority_reference === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authority_reference"},message:"must have required property '"+"authority_reference"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema60.properties, key0))){
const err17 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.spec_version !== undefined){
if("1.0.0" !== data.spec_version){
const err18 = {instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"};
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
if("context-authorization" !== data.kind){
const err19 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "context-authorization"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.decision_id !== undefined){
let data4 = data.decision_id;
if(typeof data4 === "string"){
if(!pattern6.test(data4)){
const err20 = {instancePath:instancePath+"/decision_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$"+"\""};
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
const err21 = {instancePath:instancePath+"/decision_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.decision !== undefined){
let data5 = data.decision;
if(!((data5 === "allow") || (data5 === "deny"))){
const err22 = {instancePath:instancePath+"/decision",schemaPath:"#/properties/decision/enum",keyword:"enum",params:{allowedValues: schema60.properties.decision.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.package !== undefined){
if(!(validate23(data.package, {instancePath:instancePath+"/package",parentData:data,parentDataProperty:"package",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
}
if(data.prompt !== undefined){
let data7 = data.prompt;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.id === undefined){
const err23 = {instancePath:instancePath+"/prompt",schemaPath:"#/properties/prompt/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data7.version === undefined){
const err24 = {instancePath:instancePath+"/prompt",schemaPath:"#/properties/prompt/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
for(const key1 in data7){
if(!((key1 === "id") || (key1 === "version"))){
const err25 = {instancePath:instancePath+"/prompt",schemaPath:"#/properties/prompt/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data7.id !== undefined){
let data8 = data7.id;
if(typeof data8 === "string"){
if(!pattern20.test(data8)){
const err26 = {instancePath:instancePath+"/prompt/id",schemaPath:"#/$defs/promptId/pattern",keyword:"pattern",params:{pattern: "^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"},message:"must match pattern \""+"^prompt\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$"+"\""};
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
const err27 = {instancePath:instancePath+"/prompt/id",schemaPath:"#/$defs/promptId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data7.version !== undefined){
let data9 = data7.version;
if(typeof data9 === "string"){
if(!pattern5.test(data9)){
const err28 = {instancePath:instancePath+"/prompt/version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$"+"\""};
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
const err29 = {instancePath:instancePath+"/prompt/version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err30 = {instancePath:instancePath+"/prompt",schemaPath:"#/properties/prompt/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.sections !== undefined){
let data10 = data.sections;
if(Array.isArray(data10)){
const len0 = data10.length;
for(let i0=0; i0<len0; i0++){
let data11 = data10[i0];
if(typeof data11 === "string"){
if(!pattern15.test(data11)){
const err31 = {instancePath:instancePath+"/sections/" + i0,schemaPath:"#/$defs/symbol/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9_]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9_]{0,63}$"+"\""};
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
const err32 = {instancePath:instancePath+"/sections/" + i0,schemaPath:"#/$defs/symbol/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
let i1 = data10.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data10[i1], data10[j0])){
const err33 = {instancePath:instancePath+"/sections",schemaPath:"#/properties/sections/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err34 = {instancePath:instancePath+"/sections",schemaPath:"#/properties/sections/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data.max_classification !== undefined){
let data12 = data.max_classification;
if(!((((data12 === "public") || (data12 === "internal")) || (data12 === "confidential")) || (data12 === "restricted"))){
const err35 = {instancePath:instancePath+"/max_classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema44.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.purpose !== undefined){
let data13 = data.purpose;
if(typeof data13 === "string"){
if(func2(data13) > 1000){
const err36 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(func2(data13) < 1){
const err37 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err38 = {instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data.decided_by !== undefined){
let data14 = data.decided_by;
if(typeof data14 === "string"){
if(!pattern23.test(data14)){
const err39 = {instancePath:instancePath+"/decided_by",schemaPath:"#/$defs/owner/pattern",keyword:"pattern",params:{pattern: "^@?[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$"},message:"must match pattern \""+"^@?[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$"+"\""};
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
const err40 = {instancePath:instancePath+"/decided_by",schemaPath:"#/$defs/owner/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data.decided_at !== undefined){
let data15 = data.decided_at;
if(typeof data15 === "string"){
if(!(formats0.validate(data15))){
const err41 = {instancePath:instancePath+"/decided_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
else {
const err42 = {instancePath:instancePath+"/decided_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.expires_at !== undefined){
let data16 = data.expires_at;
if(typeof data16 === "string"){
if(!(formats0.validate(data16))){
const err43 = {instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/timestamp/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
else {
const err44 = {instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/timestamp/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data.authority_reference !== undefined){
let data17 = data.authority_reference;
if(typeof data17 === "string"){
if(!pattern9.test(data17)){
const err45 = {instancePath:instancePath+"/authority_reference",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(!(formats6(data17))){
const err46 = {instancePath:instancePath+"/authority_reference",schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
else {
const err47 = {instancePath:instancePath+"/authority_reference",schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err48 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
validate40.errors = vErrors;
return errors === 0;
}
validate40.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://schemas.definitelysecure.studio/context-packages/v1/context-package.schema.json" */;
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
if(!(validate35(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate35.errors : vErrors.concat(validate35.errors);
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
if(!(validate40(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate40.errors : vErrors.concat(validate40.errors);
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
