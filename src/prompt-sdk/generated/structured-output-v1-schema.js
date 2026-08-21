// Generated from DefinitelySecureStudio/codex@275e0cda2e699fbcb1cdd56323a4d58e3f65e507
// Source SHA-256: 6ea2c5d4804b92bbca386d2b64063d72980ca1d294d23338be6adc057caaeeb2
// Rebuild with scripts/generate-structured-output-schema-validator.mjs; do not edit manually.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
"use strict";
export const validate = validate20;
export default validate20;
const schema31 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:definitely-secure:contract:structured-output:1.0.0:processing","title":"Definitely Secure Studio Structured Output Contract v1.0.0","description":"Provider-neutral validated JSON results and explicit parse or validation failures.","oneOf":[{"$ref":"#/$defs/structuredOutputResult"},{"$ref":"#/$defs/structuredOutputFailure"}],"$defs":{"semver":{"type":"string","pattern":"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"},"safeId":{"type":"string","pattern":"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},"namespace":{"type":"string","pattern":"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$","maxLength":128},"classification":{"enum":["public","internal","confidential","restricted"]},"sha256":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$"},"absoluteUri":{"type":"string","format":"uri","pattern":"^[A-Za-z][A-Za-z0-9+.-]*:"},"artifactReference":{"type":"object","additionalProperties":false,"required":["artifact_uri","media_type","byte_size","sha256"],"properties":{"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},"byte_size":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha256"}}},"outputSchemaReference":{"type":"object","additionalProperties":false,"required":["schema_id","repository","contract","version","tag","commit","artifact_uri","media_type","byte_size","sha256"],"properties":{"schema_id":{"type":"string","minLength":1,"maxLength":500},"repository":{"type":"string","pattern":"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"},"contract":{"type":"string","pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$"},"version":{"$ref":"#/$defs/semver"},"tag":{"type":"string","pattern":"^contract/[a-z0-9]+(?:-[a-z0-9]+)*/v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"},"commit":{"type":"string","pattern":"^[0-9a-f]{40}$"},"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"const":"application/schema+json"},"byte_size":{"type":"integer","minimum":1},"sha256":{"$ref":"#/$defs/sha256"}}},"expectation":{"type":"object","additionalProperties":false,"required":["kind","media_type","validation"],"properties":{"kind":{"const":"json"},"media_type":{"const":"application/json"},"validation":{"enum":["json-syntax","json-schema"]},"schema":{"$ref":"#/$defs/outputSchemaReference"}},"allOf":[{"if":{"properties":{"validation":{"const":"json-schema"}},"required":["validation"]},"then":{"required":["schema"]},"else":{"not":{"required":["schema"]}}}]},"rawOutput":{"type":"object","additionalProperties":false,"required":["media_type","classification","retention","byte_size","sha256"],"properties":{"media_type":{"const":"application/json"},"classification":{"$ref":"#/$defs/classification"},"retention":{"enum":["inline","reference","identity-only"]},"byte_size":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha256"},"content":{"type":"string"},"reference":{"$ref":"#/$defs/artifactReference"}},"allOf":[{"if":{"properties":{"retention":{"const":"inline"}},"required":["retention"]},"then":{"required":["content"],"not":{"required":["reference"]}},"else":{"if":{"properties":{"retention":{"const":"reference"}},"required":["retention"]},"then":{"required":["reference"],"not":{"required":["content"]}},"else":{"not":{"anyOf":[{"required":["content"]},{"required":["reference"]}]}}}}]},"normalizedOutput":{"type":"object","additionalProperties":false,"required":["media_type","canonicalization","value","byte_size","sha256"],"properties":{"media_type":{"const":"application/json"},"canonicalization":{"const":"studio-json-v1"},"value":{},"byte_size":{"type":"integer","minimum":1},"sha256":{"$ref":"#/$defs/sha256"}}},"validator":{"type":"object","additionalProperties":false,"required":["name","version","algorithm","json_schema_draft"],"properties":{"name":{"$ref":"#/$defs/namespace"},"version":{"$ref":"#/$defs/semver"},"algorithm":{"const":"parse-once-validate-v1"},"json_schema_draft":{"const":"2020-12"}}},"providerConstraint":{"type":"object","additionalProperties":false,"required":["mode","capability","independently_validated"],"properties":{"mode":{"enum":["portable-only","provider-native","adapter-emulated"]},"capability":{"const":"structured-output"},"adapter_id":{"$ref":"#/$defs/namespace"},"independently_validated":{"const":true}},"allOf":[{"if":{"properties":{"mode":{"enum":["provider-native","adapter-emulated"]}},"required":["mode"]},"then":{"required":["adapter_id"]},"else":{"not":{"required":["adapter_id"]}}}]},"diagnostic":{"type":"object","additionalProperties":false,"required":["code","message","path"],"properties":{"code":{"type":"string","pattern":"^[A-Z][A-Z0-9_]{0,127}$"},"message":{"type":"string","minLength":1,"maxLength":1000},"path":{"type":"string","pattern":"^(?:|(?:/(?:[^~/]|~0|~1)*)*)$"},"keyword":{"type":"string","pattern":"^[A-Za-z][A-Za-z0-9_-]{0,127}$"}}},"structuredOutputResult":{"type":"object","additionalProperties":false,"required":["spec_version","kind","processing_id","execution_id","status","expectation","raw","normalized","validator","provider_constraint"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"structured-output-result"},"processing_id":{"$ref":"#/$defs/safeId"},"execution_id":{"$ref":"#/$defs/safeId"},"status":{"const":"validated"},"expectation":{"$ref":"#/$defs/expectation"},"raw":{"$ref":"#/$defs/rawOutput"},"normalized":{"$ref":"#/$defs/normalizedOutput"},"validator":{"$ref":"#/$defs/validator"},"provider_constraint":{"$ref":"#/$defs/providerConstraint"}}},"structuredOutputFailure":{"type":"object","additionalProperties":false,"required":["spec_version","kind","processing_id","execution_id","status","stage","expectation","raw","validator","provider_constraint","diagnostics"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"structured-output-failure"},"processing_id":{"$ref":"#/$defs/safeId"},"execution_id":{"$ref":"#/$defs/safeId"},"status":{"const":"failed"},"stage":{"enum":["preflight","raw-integrity","schema-load","schema-integrity","parse","schema-validation","normalization","internal"]},"expectation":{"$ref":"#/$defs/expectation"},"raw":{"$ref":"#/$defs/rawOutput"},"validator":{"$ref":"#/$defs/validator"},"provider_constraint":{"$ref":"#/$defs/providerConstraint"},"diagnostics":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/diagnostic"}}}}}};
const schema32 = {"type":"object","additionalProperties":false,"required":["spec_version","kind","processing_id","execution_id","status","expectation","raw","normalized","validator","provider_constraint"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"structured-output-result"},"processing_id":{"$ref":"#/$defs/safeId"},"execution_id":{"$ref":"#/$defs/safeId"},"status":{"const":"validated"},"expectation":{"$ref":"#/$defs/expectation"},"raw":{"$ref":"#/$defs/rawOutput"},"normalized":{"$ref":"#/$defs/normalizedOutput"},"validator":{"$ref":"#/$defs/validator"},"provider_constraint":{"$ref":"#/$defs/providerConstraint"}}};
const schema33 = {"type":"string","pattern":"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"};
const func1 = Object.prototype.hasOwnProperty;
const pattern4 = new RegExp("^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$", "u");
const schema35 = {"type":"object","additionalProperties":false,"required":["kind","media_type","validation"],"properties":{"kind":{"const":"json"},"media_type":{"const":"application/json"},"validation":{"enum":["json-syntax","json-schema"]},"schema":{"$ref":"#/$defs/outputSchemaReference"}},"allOf":[{"if":{"properties":{"validation":{"const":"json-schema"}},"required":["validation"]},"then":{"required":["schema"]},"else":{"not":{"required":["schema"]}}}]};
const schema36 = {"type":"object","additionalProperties":false,"required":["schema_id","repository","contract","version","tag","commit","artifact_uri","media_type","byte_size","sha256"],"properties":{"schema_id":{"type":"string","minLength":1,"maxLength":500},"repository":{"type":"string","pattern":"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"},"contract":{"type":"string","pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$"},"version":{"$ref":"#/$defs/semver"},"tag":{"type":"string","pattern":"^contract/[a-z0-9]+(?:-[a-z0-9]+)*/v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"},"commit":{"type":"string","pattern":"^[0-9a-f]{40}$"},"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"const":"application/schema+json"},"byte_size":{"type":"integer","minimum":1},"sha256":{"$ref":"#/$defs/sha256"}}};
const schema37 = {"type":"string","pattern":"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"};
const schema38 = {"type":"string","format":"uri","pattern":"^[A-Za-z][A-Za-z0-9+.-]*:"};
const schema39 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}$"};
const func3 = require("ajv/dist/runtime/ucs2length").default;
const pattern6 = new RegExp("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", "u");
const pattern7 = new RegExp("^[a-z0-9]+(?:-[a-z0-9]+)*$", "u");
const pattern8 = new RegExp("^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$", "u");
const pattern9 = new RegExp("^contract/[a-z0-9]+(?:-[a-z0-9]+)*/v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$", "u");
const pattern10 = new RegExp("^[0-9a-f]{40}$", "u");
const pattern11 = new RegExp("^[A-Za-z][A-Za-z0-9+.-]*:", "u");
const pattern12 = new RegExp("^sha256:[0-9a-f]{64}$", "u");
const formats0 = require("ajv-formats/dist/formats").fullFormats.uri;

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
if(!(func1.call(schema36.properties, key0))){
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
if(func3(data0) > 500){
const err11 = {instancePath:instancePath+"/schema_id",schemaPath:"#/properties/schema_id/maxLength",keyword:"maxLength",params:{limit: 500},message:"must NOT have more than 500 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(func3(data0) < 1){
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
if(!pattern6.test(data1)){
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
if(!pattern7.test(data2)){
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
if(!pattern8.test(data3)){
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
if(!pattern9.test(data4)){
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
if(!pattern10.test(data5)){
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
if(!pattern11.test(data6)){
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
if(!pattern12.test(data9)){
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
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.validation === undefined) && (missing0 = "validation")){
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
if(data.validation !== undefined){
if("json-schema" !== data.validation){
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
if(data.schema === undefined){
const err2 = {instancePath,schemaPath:"#/allOf/0/then/required",keyword:"required",params:{missingProperty: "schema"},message:"must have required property '"+"schema"+"'"};
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
if((data.schema === undefined) && (missing1 = "schema")){
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
if(data.kind === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
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
if(data.validation === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "validation"},message:"must have required property '"+"validation"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "kind") || (key0 === "media_type")) || (key0 === "validation")) || (key0 === "schema"))){
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
if(data.kind !== undefined){
if("json" !== data.kind){
const err10 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "json"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.media_type !== undefined){
if("application/json" !== data.media_type){
const err11 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/const",keyword:"const",params:{allowedValue: "application/json"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.validation !== undefined){
let data3 = data.validation;
if(!((data3 === "json-syntax") || (data3 === "json-schema"))){
const err12 = {instancePath:instancePath+"/validation",schemaPath:"#/properties/validation/enum",keyword:"enum",params:{allowedValues: schema35.properties.validation.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.schema !== undefined){
if(!(validate23(data.schema, {instancePath:instancePath+"/schema",parentData:data,parentDataProperty:"schema",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
}
}
else {
const err13 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema40 = {"type":"object","additionalProperties":false,"required":["media_type","classification","retention","byte_size","sha256"],"properties":{"media_type":{"const":"application/json"},"classification":{"$ref":"#/$defs/classification"},"retention":{"enum":["inline","reference","identity-only"]},"byte_size":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha256"},"content":{"type":"string"},"reference":{"$ref":"#/$defs/artifactReference"}},"allOf":[{"if":{"properties":{"retention":{"const":"inline"}},"required":["retention"]},"then":{"required":["content"],"not":{"required":["reference"]}},"else":{"if":{"properties":{"retention":{"const":"reference"}},"required":["retention"]},"then":{"required":["reference"],"not":{"required":["content"]}},"else":{"not":{"anyOf":[{"required":["content"]},{"required":["reference"]}]}}}}]};
const schema41 = {"enum":["public","internal","confidential","restricted"]};
const schema43 = {"type":"object","additionalProperties":false,"required":["artifact_uri","media_type","byte_size","sha256"],"properties":{"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},"byte_size":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha256"}}};
const pattern15 = new RegExp("^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$", "u");

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
if(!pattern11.test(data0)){
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
if(!pattern15.test(data1)){
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
if(!pattern12.test(data3)){
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
validate27.errors = vErrors;
return errors === 0;
}
validate27.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.retention === undefined) && (missing0 = "retention")){
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
if(data.retention !== undefined){
if("inline" !== data.retention){
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
if((data.reference === undefined) && (missing1 = "reference")){
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
if(data.content === undefined){
const err4 = {instancePath,schemaPath:"#/allOf/0/then/required",keyword:"required",params:{missingProperty: "content"},message:"must have required property '"+"content"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
ifClause0 = "then";
}
else {
const _errs8 = errors;
const _errs9 = errors;
let valid4 = true;
const _errs10 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing2;
if((data.retention === undefined) && (missing2 = "retention")){
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
if(data.retention !== undefined){
if("reference" !== data.retention){
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
var _valid1 = _errs10 === errors;
errors = _errs9;
if(vErrors !== null){
if(_errs9){
vErrors.length = _errs9;
}
else {
vErrors = null;
}
}
let ifClause1;
if(_valid1){
const _errs12 = errors;
const _errs13 = errors;
const _errs14 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing3;
if((data.content === undefined) && (missing3 = "content")){
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
var valid6 = _errs14 === errors;
if(valid6){
const err8 = {instancePath,schemaPath:"#/allOf/0/else/then/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
errors = _errs13;
if(vErrors !== null){
if(_errs13){
vErrors.length = _errs13;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.reference === undefined){
const err9 = {instancePath,schemaPath:"#/allOf/0/else/then/required",keyword:"required",params:{missingProperty: "reference"},message:"must have required property '"+"reference"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
var _valid1 = _errs12 === errors;
valid4 = _valid1;
ifClause1 = "then";
}
else {
const _errs15 = errors;
const _errs16 = errors;
const _errs17 = errors;
const _errs18 = errors;
let valid8 = false;
const _errs19 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing4;
if((data.content === undefined) && (missing4 = "content")){
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
var _valid2 = _errs19 === errors;
valid8 = valid8 || _valid2;
const _errs20 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing5;
if((data.reference === undefined) && (missing5 = "reference")){
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
var _valid2 = _errs20 === errors;
valid8 = valid8 || _valid2;
if(!valid8){
const err12 = {};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
else {
errors = _errs18;
if(vErrors !== null){
if(_errs18){
vErrors.length = _errs18;
}
else {
vErrors = null;
}
}
}
var valid7 = _errs17 === errors;
if(valid7){
const err13 = {instancePath,schemaPath:"#/allOf/0/else/else/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
else {
errors = _errs16;
if(vErrors !== null){
if(_errs16){
vErrors.length = _errs16;
}
else {
vErrors = null;
}
}
}
var _valid1 = _errs15 === errors;
valid4 = _valid1;
ifClause1 = "else";
}
if(!valid4){
const err14 = {instancePath,schemaPath:"#/allOf/0/else/if",keyword:"if",params:{failingKeyword: ifClause1},message:"must match \""+ifClause1+"\" schema"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var _valid0 = _errs8 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.retention = true;
}
ifClause0 = "else";
}
if(!valid1){
const err15 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
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
if(data.retention === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "retention"},message:"must have required property '"+"retention"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.byte_size === undefined){
const err19 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "byte_size"},message:"must have required property '"+"byte_size"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data.sha256 === undefined){
const err20 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "media_type") || (key0 === "classification")) || (key0 === "retention")) || (key0 === "byte_size")) || (key0 === "sha256")) || (key0 === "content")) || (key0 === "reference"))){
const err21 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
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
if("application/json" !== data.media_type){
const err22 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/const",keyword:"const",params:{allowedValue: "application/json"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.classification !== undefined){
let data3 = data.classification;
if(!((((data3 === "public") || (data3 === "internal")) || (data3 === "confidential")) || (data3 === "restricted"))){
const err23 = {instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema41.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.retention !== undefined){
let data4 = data.retention;
if(!(((data4 === "inline") || (data4 === "reference")) || (data4 === "identity-only"))){
const err24 = {instancePath:instancePath+"/retention",schemaPath:"#/properties/retention/enum",keyword:"enum",params:{allowedValues: schema40.properties.retention.enum},message:"must be equal to one of the allowed values"};
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
let data5 = data.byte_size;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err25 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 < 0 || isNaN(data5)){
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
let data6 = data.sha256;
if(typeof data6 === "string"){
if(!pattern12.test(data6)){
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
if(!(validate27(data.reference, {instancePath:instancePath+"/reference",parentData:data,parentDataProperty:"reference",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
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
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema46 = {"type":"object","additionalProperties":false,"required":["media_type","canonicalization","value","byte_size","sha256"],"properties":{"media_type":{"const":"application/json"},"canonicalization":{"const":"studio-json-v1"},"value":{},"byte_size":{"type":"integer","minimum":1},"sha256":{"$ref":"#/$defs/sha256"}}};

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
if(data.media_type === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "media_type"},message:"must have required property '"+"media_type"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.canonicalization === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "canonicalization"},message:"must have required property '"+"canonicalization"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.value === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.byte_size === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "byte_size"},message:"must have required property '"+"byte_size"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.sha256 === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sha256"},message:"must have required property '"+"sha256"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "media_type") || (key0 === "canonicalization")) || (key0 === "value")) || (key0 === "byte_size")) || (key0 === "sha256"))){
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
if(data.media_type !== undefined){
if("application/json" !== data.media_type){
const err6 = {instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/const",keyword:"const",params:{allowedValue: "application/json"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.canonicalization !== undefined){
if("studio-json-v1" !== data.canonicalization){
const err7 = {instancePath:instancePath+"/canonicalization",schemaPath:"#/properties/canonicalization/const",keyword:"const",params:{allowedValue: "studio-json-v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.byte_size !== undefined){
let data2 = data.byte_size;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err8 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 < 1 || isNaN(data2)){
const err9 = {instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.sha256 !== undefined){
let data3 = data.sha256;
if(typeof data3 === "string"){
if(!pattern12.test(data3)){
const err10 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err11 = {instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema48 = {"type":"object","additionalProperties":false,"required":["name","version","algorithm","json_schema_draft"],"properties":{"name":{"$ref":"#/$defs/namespace"},"version":{"$ref":"#/$defs/semver"},"algorithm":{"const":"parse-once-validate-v1"},"json_schema_draft":{"const":"2020-12"}}};
const schema49 = {"type":"string","pattern":"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$","maxLength":128};
const pattern18 = new RegExp("^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$", "u");

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
if(data.algorithm === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "algorithm"},message:"must have required property '"+"algorithm"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.json_schema_draft === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "json_schema_draft"},message:"must have required property '"+"json_schema_draft"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "name") || (key0 === "version")) || (key0 === "algorithm")) || (key0 === "json_schema_draft"))){
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
if(func3(data0) > 128){
const err5 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/namespace/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern18.test(data0)){
const err6 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/namespace/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"},message:"must match pattern \""+"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"+"\""};
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
const err7 = {instancePath:instancePath+"/name",schemaPath:"#/$defs/namespace/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.version !== undefined){
let data1 = data.version;
if(typeof data1 === "string"){
if(!pattern8.test(data1)){
const err8 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/semver/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"+"\""};
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
const err9 = {instancePath:instancePath+"/version",schemaPath:"#/$defs/semver/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.algorithm !== undefined){
if("parse-once-validate-v1" !== data.algorithm){
const err10 = {instancePath:instancePath+"/algorithm",schemaPath:"#/properties/algorithm/const",keyword:"const",params:{allowedValue: "parse-once-validate-v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.json_schema_draft !== undefined){
if("2020-12" !== data.json_schema_draft){
const err11 = {instancePath:instancePath+"/json_schema_draft",schemaPath:"#/properties/json_schema_draft/const",keyword:"const",params:{allowedValue: "2020-12"},message:"must be equal to constant"};
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
validate32.errors = vErrors;
return errors === 0;
}
validate32.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema51 = {"type":"object","additionalProperties":false,"required":["mode","capability","independently_validated"],"properties":{"mode":{"enum":["portable-only","provider-native","adapter-emulated"]},"capability":{"const":"structured-output"},"adapter_id":{"$ref":"#/$defs/namespace"},"independently_validated":{"const":true}},"allOf":[{"if":{"properties":{"mode":{"enum":["provider-native","adapter-emulated"]}},"required":["mode"]},"then":{"required":["adapter_id"]},"else":{"not":{"required":["adapter_id"]}}}]};

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
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((data.mode === undefined) && (missing0 = "mode")){
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
if(data.mode !== undefined){
let data0 = data.mode;
if(!((data0 === "provider-native") || (data0 === "adapter-emulated"))){
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
if(data.adapter_id === undefined){
const err2 = {instancePath,schemaPath:"#/allOf/0/then/required",keyword:"required",params:{missingProperty: "adapter_id"},message:"must have required property '"+"adapter_id"+"'"};
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
if((data.adapter_id === undefined) && (missing1 = "adapter_id")){
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
if(data.mode === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.capability === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capability"},message:"must have required property '"+"capability"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.independently_validated === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "independently_validated"},message:"must have required property '"+"independently_validated"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "mode") || (key0 === "capability")) || (key0 === "adapter_id")) || (key0 === "independently_validated"))){
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
if(data.mode !== undefined){
let data1 = data.mode;
if(!(((data1 === "portable-only") || (data1 === "provider-native")) || (data1 === "adapter-emulated"))){
const err10 = {instancePath:instancePath+"/mode",schemaPath:"#/properties/mode/enum",keyword:"enum",params:{allowedValues: schema51.properties.mode.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.capability !== undefined){
if("structured-output" !== data.capability){
const err11 = {instancePath:instancePath+"/capability",schemaPath:"#/properties/capability/const",keyword:"const",params:{allowedValue: "structured-output"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.adapter_id !== undefined){
let data3 = data.adapter_id;
if(typeof data3 === "string"){
if(func3(data3) > 128){
const err12 = {instancePath:instancePath+"/adapter_id",schemaPath:"#/$defs/namespace/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!pattern18.test(data3)){
const err13 = {instancePath:instancePath+"/adapter_id",schemaPath:"#/$defs/namespace/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"},message:"must match pattern \""+"^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)+$"+"\""};
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
const err14 = {instancePath:instancePath+"/adapter_id",schemaPath:"#/$defs/namespace/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.independently_validated !== undefined){
if(true !== data.independently_validated){
const err15 = {instancePath:instancePath+"/independently_validated",schemaPath:"#/properties/independently_validated/const",keyword:"const",params:{allowedValue: true},message:"must be equal to constant"};
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
validate34.errors = vErrors;
return errors === 0;
}
validate34.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(data.processing_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "processing_id"},message:"must have required property '"+"processing_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.execution_id === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "execution_id"},message:"must have required property '"+"execution_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.status === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.expectation === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expectation"},message:"must have required property '"+"expectation"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.raw === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "raw"},message:"must have required property '"+"raw"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.normalized === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "normalized"},message:"must have required property '"+"normalized"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.validator === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "validator"},message:"must have required property '"+"validator"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.provider_constraint === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "provider_constraint"},message:"must have required property '"+"provider_constraint"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema32.properties, key0))){
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
if(data.spec_version !== undefined){
if("1.0.0" !== data.spec_version){
const err11 = {instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.kind !== undefined){
if("structured-output-result" !== data.kind){
const err12 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "structured-output-result"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.processing_id !== undefined){
let data2 = data.processing_id;
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
const err13 = {instancePath:instancePath+"/processing_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
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
const err14 = {instancePath:instancePath+"/processing_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.execution_id !== undefined){
let data3 = data.execution_id;
if(typeof data3 === "string"){
if(!pattern4.test(data3)){
const err15 = {instancePath:instancePath+"/execution_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
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
const err16 = {instancePath:instancePath+"/execution_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.status !== undefined){
if("validated" !== data.status){
const err17 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "validated"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.expectation !== undefined){
if(!(validate22(data.expectation, {instancePath:instancePath+"/expectation",parentData:data,parentDataProperty:"expectation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
errors = vErrors.length;
}
}
if(data.raw !== undefined){
if(!(validate26(data.raw, {instancePath:instancePath+"/raw",parentData:data,parentDataProperty:"raw",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
errors = vErrors.length;
}
}
if(data.normalized !== undefined){
if(!(validate30(data.normalized, {instancePath:instancePath+"/normalized",parentData:data,parentDataProperty:"normalized",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
errors = vErrors.length;
}
}
if(data.validator !== undefined){
if(!(validate32(data.validator, {instancePath:instancePath+"/validator",parentData:data,parentDataProperty:"validator",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate32.errors : vErrors.concat(validate32.errors);
errors = vErrors.length;
}
}
if(data.provider_constraint !== undefined){
if(!(validate34(data.provider_constraint, {instancePath:instancePath+"/provider_constraint",parentData:data,parentDataProperty:"provider_constraint",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate34.errors : vErrors.concat(validate34.errors);
errors = vErrors.length;
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
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema53 = {"type":"object","additionalProperties":false,"required":["spec_version","kind","processing_id","execution_id","status","stage","expectation","raw","validator","provider_constraint","diagnostics"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"structured-output-failure"},"processing_id":{"$ref":"#/$defs/safeId"},"execution_id":{"$ref":"#/$defs/safeId"},"status":{"const":"failed"},"stage":{"enum":["preflight","raw-integrity","schema-load","schema-integrity","parse","schema-validation","normalization","internal"]},"expectation":{"$ref":"#/$defs/expectation"},"raw":{"$ref":"#/$defs/rawOutput"},"validator":{"$ref":"#/$defs/validator"},"provider_constraint":{"$ref":"#/$defs/providerConstraint"},"diagnostics":{"type":"array","minItems":1,"items":{"$ref":"#/$defs/diagnostic"}}}};
const schema56 = {"type":"object","additionalProperties":false,"required":["code","message","path"],"properties":{"code":{"type":"string","pattern":"^[A-Z][A-Z0-9_]{0,127}$"},"message":{"type":"string","minLength":1,"maxLength":1000},"path":{"type":"string","pattern":"^(?:|(?:/(?:[^~/]|~0|~1)*)*)$"},"keyword":{"type":"string","pattern":"^[A-Za-z][A-Za-z0-9_-]{0,127}$"}}};
const pattern23 = new RegExp("^[A-Z][A-Z0-9_]{0,127}$", "u");
const pattern24 = new RegExp("^(?:|(?:/(?:[^~/]|~0|~1)*)*)$", "u");
const pattern25 = new RegExp("^[A-Za-z][A-Za-z0-9_-]{0,127}$", "u");

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
if(data.processing_id === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "processing_id"},message:"must have required property '"+"processing_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.execution_id === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "execution_id"},message:"must have required property '"+"execution_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.status === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.stage === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stage"},message:"must have required property '"+"stage"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.expectation === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expectation"},message:"must have required property '"+"expectation"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.raw === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "raw"},message:"must have required property '"+"raw"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.validator === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "validator"},message:"must have required property '"+"validator"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.provider_constraint === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "provider_constraint"},message:"must have required property '"+"provider_constraint"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.diagnostics === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "diagnostics"},message:"must have required property '"+"diagnostics"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema53.properties, key0))){
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
if("structured-output-failure" !== data.kind){
const err13 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "structured-output-failure"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.processing_id !== undefined){
let data2 = data.processing_id;
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
const err14 = {instancePath:instancePath+"/processing_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
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
const err15 = {instancePath:instancePath+"/processing_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.execution_id !== undefined){
let data3 = data.execution_id;
if(typeof data3 === "string"){
if(!pattern4.test(data3)){
const err16 = {instancePath:instancePath+"/execution_id",schemaPath:"#/$defs/safeId/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$"+"\""};
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
const err17 = {instancePath:instancePath+"/execution_id",schemaPath:"#/$defs/safeId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.status !== undefined){
if("failed" !== data.status){
const err18 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "failed"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.stage !== undefined){
let data5 = data.stage;
if(!((((((((data5 === "preflight") || (data5 === "raw-integrity")) || (data5 === "schema-load")) || (data5 === "schema-integrity")) || (data5 === "parse")) || (data5 === "schema-validation")) || (data5 === "normalization")) || (data5 === "internal"))){
const err19 = {instancePath:instancePath+"/stage",schemaPath:"#/properties/stage/enum",keyword:"enum",params:{allowedValues: schema53.properties.stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.expectation !== undefined){
if(!(validate22(data.expectation, {instancePath:instancePath+"/expectation",parentData:data,parentDataProperty:"expectation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
errors = vErrors.length;
}
}
if(data.raw !== undefined){
if(!(validate26(data.raw, {instancePath:instancePath+"/raw",parentData:data,parentDataProperty:"raw",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
errors = vErrors.length;
}
}
if(data.validator !== undefined){
if(!(validate32(data.validator, {instancePath:instancePath+"/validator",parentData:data,parentDataProperty:"validator",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate32.errors : vErrors.concat(validate32.errors);
errors = vErrors.length;
}
}
if(data.provider_constraint !== undefined){
if(!(validate34(data.provider_constraint, {instancePath:instancePath+"/provider_constraint",parentData:data,parentDataProperty:"provider_constraint",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate34.errors : vErrors.concat(validate34.errors);
errors = vErrors.length;
}
}
if(data.diagnostics !== undefined){
let data10 = data.diagnostics;
if(Array.isArray(data10)){
if(data10.length < 1){
const err20 = {instancePath:instancePath+"/diagnostics",schemaPath:"#/properties/diagnostics/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
const len0 = data10.length;
for(let i0=0; i0<len0; i0++){
let data11 = data10[i0];
if(data11 && typeof data11 == "object" && !Array.isArray(data11)){
if(data11.code === undefined){
const err21 = {instancePath:instancePath+"/diagnostics/" + i0,schemaPath:"#/$defs/diagnostic/required",keyword:"required",params:{missingProperty: "code"},message:"must have required property '"+"code"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data11.message === undefined){
const err22 = {instancePath:instancePath+"/diagnostics/" + i0,schemaPath:"#/$defs/diagnostic/required",keyword:"required",params:{missingProperty: "message"},message:"must have required property '"+"message"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data11.path === undefined){
const err23 = {instancePath:instancePath+"/diagnostics/" + i0,schemaPath:"#/$defs/diagnostic/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
for(const key1 in data11){
if(!((((key1 === "code") || (key1 === "message")) || (key1 === "path")) || (key1 === "keyword"))){
const err24 = {instancePath:instancePath+"/diagnostics/" + i0,schemaPath:"#/$defs/diagnostic/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data11.code !== undefined){
let data12 = data11.code;
if(typeof data12 === "string"){
if(!pattern23.test(data12)){
const err25 = {instancePath:instancePath+"/diagnostics/" + i0+"/code",schemaPath:"#/$defs/diagnostic/properties/code/pattern",keyword:"pattern",params:{pattern: "^[A-Z][A-Z0-9_]{0,127}$"},message:"must match pattern \""+"^[A-Z][A-Z0-9_]{0,127}$"+"\""};
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
const err26 = {instancePath:instancePath+"/diagnostics/" + i0+"/code",schemaPath:"#/$defs/diagnostic/properties/code/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data11.message !== undefined){
let data13 = data11.message;
if(typeof data13 === "string"){
if(func3(data13) > 1000){
const err27 = {instancePath:instancePath+"/diagnostics/" + i0+"/message",schemaPath:"#/$defs/diagnostic/properties/message/maxLength",keyword:"maxLength",params:{limit: 1000},message:"must NOT have more than 1000 characters"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(func3(data13) < 1){
const err28 = {instancePath:instancePath+"/diagnostics/" + i0+"/message",schemaPath:"#/$defs/diagnostic/properties/message/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err29 = {instancePath:instancePath+"/diagnostics/" + i0+"/message",schemaPath:"#/$defs/diagnostic/properties/message/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data11.path !== undefined){
let data14 = data11.path;
if(typeof data14 === "string"){
if(!pattern24.test(data14)){
const err30 = {instancePath:instancePath+"/diagnostics/" + i0+"/path",schemaPath:"#/$defs/diagnostic/properties/path/pattern",keyword:"pattern",params:{pattern: "^(?:|(?:/(?:[^~/]|~0|~1)*)*)$"},message:"must match pattern \""+"^(?:|(?:/(?:[^~/]|~0|~1)*)*)$"+"\""};
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
const err31 = {instancePath:instancePath+"/diagnostics/" + i0+"/path",schemaPath:"#/$defs/diagnostic/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data11.keyword !== undefined){
let data15 = data11.keyword;
if(typeof data15 === "string"){
if(!pattern25.test(data15)){
const err32 = {instancePath:instancePath+"/diagnostics/" + i0+"/keyword",schemaPath:"#/$defs/diagnostic/properties/keyword/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9_-]{0,127}$"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9_-]{0,127}$"+"\""};
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
const err33 = {instancePath:instancePath+"/diagnostics/" + i0+"/keyword",schemaPath:"#/$defs/diagnostic/properties/keyword/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
}
else {
const err34 = {instancePath:instancePath+"/diagnostics/" + i0,schemaPath:"#/$defs/diagnostic/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err35 = {instancePath:instancePath+"/diagnostics",schemaPath:"#/properties/diagnostics/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
}
else {
const err36 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
validate37.errors = vErrors;
return errors === 0;
}
validate37.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="urn:definitely-secure:contract:structured-output:1.0.0:processing" */;
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
if(!(validate37(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate37.errors : vErrors.concat(validate37.errors);
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
