// Generated from DefinitelySecureStudio/codex@e415596f2ec73f4d25b289532a72a565ff33c28d; unreleased reviewed candidate.
// Source sha256:c9e7d3ee3a9593ec7e85504f680d0cd9b5ece7a6c0db22f4a7152d08b6db2f5c; 29711 bytes.
// Rebuild with scripts/generate-comic-manifest-validator.mjs; do not edit.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
"use strict";
export const production = validate78;
const schema32 = {"type":"object","additionalProperties":false,"required":["kind","spec_version","production_id","revision","previous","classification","title","intent","inputs","panels","renditions"],"properties":{"kind":{"const":"comic-production"},"spec_version":{"const":"1.0.0"},"production_id":{"$ref":"#/$defs/uuid"},"revision":{"$ref":"#/$defs/revision"},"previous":{"anyOf":[{"$ref":"#/$defs/productionRef"},{"type":"null"}]},"classification":{"$ref":"#/$defs/classification"},"title":{"type":"string","minLength":1,"maxLength":200},"intent":{"type":"string","minLength":1,"maxLength":4096},"inputs":{"$ref":"#/$defs/inputs"},"panels":{"type":"array","items":{"$ref":"#/$defs/panel"},"minItems":1,"maxItems":256},"renditions":{"type":"array","items":{"$ref":"#/$defs/rendition"},"minItems":1,"maxItems":32}}};
const schema33 = {"type":"string","pattern":"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"};
const schema34 = {"type":"integer","minimum":1,"maximum":9007199254740991};
const schema41 = {"enum":["public","internal","confidential","restricted"]};
const func0 = Object.prototype.hasOwnProperty;
const func91 = require("ajv/dist/runtime/ucs2length").default;
const pattern4 = new RegExp("^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", "u");
const schema35 = {"type":"object","additionalProperties":false,"required":["production_id","revision","identity"],"properties":{"production_id":{"$ref":"#/$defs/uuid"},"revision":{"$ref":"#/$defs/revision"},"identity":{"$ref":"#/$defs/identity"}}};
const schema38 = {"type":"object","additionalProperties":false,"required":["canonicalization","byte_size","sha256"],"properties":{"canonicalization":{"const":"studio-json-v1"},"byte_size":{"$ref":"#/$defs/size"},"sha256":{"$ref":"#/$defs/digest"}}};
const schema39 = {"type":"integer","minimum":0,"maximum":9007199254740991};
const schema40 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}$"};
const pattern6 = new RegExp("^sha256:[0-9a-f]{64}$", "u");

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
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((data.canonicalization === undefined) || (!(func0.call(data, "canonicalization")))) && (missing0 = "canonicalization")) || (((data.byte_size === undefined) || (!(func0.call(data, "byte_size")))) && (missing0 = "byte_size"))) || (((data.sha256 === undefined) || (!(func0.call(data, "sha256")))) && (missing0 = "sha256"))){
validate23.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!(((key0 === "canonicalization") || (key0 === "byte_size")) || (key0 === "sha256"))){
validate23.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.canonicalization !== undefined && func0.call(data, "canonicalization")){
const _errs2 = errors;
if("studio-json-v1" !== data.canonicalization){
validate23.errors = [{instancePath:instancePath+"/canonicalization",schemaPath:"#/properties/canonicalization/const",keyword:"const",params:{allowedValue: "studio-json-v1"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.byte_size !== undefined && func0.call(data, "byte_size")){
let data1 = data.byte_size;
const _errs3 = errors;
const _errs4 = errors;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
validate23.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/$defs/size/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs4){
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 > 9007199254740991 || isNaN(data1)){
validate23.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/$defs/size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"}];
return false;
}
else {
if(data1 < 0 || isNaN(data1)){
validate23.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/$defs/size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"}];
return false;
}
}
}
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.sha256 !== undefined && func0.call(data, "sha256")){
let data2 = data.sha256;
const _errs6 = errors;
const _errs7 = errors;
if(errors === _errs7){
if(typeof data2 === "string"){
if(!pattern6.test(data2)){
validate23.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""}];
return false;
}
}
else {
validate23.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/digest/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs6 === errors;
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
validate23.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
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
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((data.production_id === undefined) || (!(func0.call(data, "production_id")))) && (missing0 = "production_id")) || (((data.revision === undefined) || (!(func0.call(data, "revision")))) && (missing0 = "revision"))) || (((data.identity === undefined) || (!(func0.call(data, "identity")))) && (missing0 = "identity"))){
validate22.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!(((key0 === "production_id") || (key0 === "revision")) || (key0 === "identity"))){
validate22.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.production_id !== undefined && func0.call(data, "production_id")){
let data0 = data.production_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern4.test(data0)){
validate22.errors = [{instancePath:instancePath+"/production_id",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate22.errors = [{instancePath:instancePath+"/production_id",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.revision !== undefined && func0.call(data, "revision")){
let data1 = data.revision;
const _errs5 = errors;
const _errs6 = errors;
if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
validate22.errors = [{instancePath:instancePath+"/revision",schemaPath:"#/$defs/revision/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs6){
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 > 9007199254740991 || isNaN(data1)){
validate22.errors = [{instancePath:instancePath+"/revision",schemaPath:"#/$defs/revision/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"}];
return false;
}
else {
if(data1 < 1 || isNaN(data1)){
validate22.errors = [{instancePath:instancePath+"/revision",schemaPath:"#/$defs/revision/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"}];
return false;
}
}
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.identity !== undefined && func0.call(data, "identity")){
const _errs8 = errors;
if(!(validate23(data.identity, {instancePath:instancePath+"/identity",parentData:data,parentDataProperty:"identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
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
validate22.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema42 = {"type":"object","additionalProperties":false,"required":["canon","dependencies","prompts","assets"],"properties":{"canon":{"$ref":"#/$defs/dependency"},"dependencies":{"type":"array","items":{"$ref":"#/$defs/dependency"},"minItems":1,"maxItems":256},"prompts":{"type":"array","items":{"$ref":"#/$defs/prompt"},"minItems":0,"maxItems":256},"assets":{"type":"array","items":{"$ref":"#/$defs/asset"},"minItems":0,"maxItems":256}}};
const schema43 = {"type":"object","additionalProperties":false,"required":["repository","version","tag","commit","artifact"],"properties":{"repository":{"type":"string","pattern":"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$","maxLength":200},"version":{"type":"string","pattern":"^[0-9]+\\.[0-9]+\\.[0-9]+$"},"tag":{"type":"string","minLength":1,"maxLength":200},"commit":{"type":"string","pattern":"^[0-9a-f]{40}$"},"artifact":{"$ref":"#/$defs/artifact"}}};
const pattern7 = new RegExp("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", "u");
const pattern8 = new RegExp("^[0-9]+\\.[0-9]+\\.[0-9]+$", "u");
const pattern9 = new RegExp("^[0-9a-f]{40}$", "u");
const schema44 = {"type":"object","additionalProperties":false,"required":["artifact_uri","media_type","byte_size","sha256"],"properties":{"artifact_uri":{"$ref":"#/$defs/uri"},"media_type":{"type":"string","minLength":1,"maxLength":128},"byte_size":{"$ref":"#/$defs/size"},"sha256":{"$ref":"#/$defs/digest"}}};
const schema45 = {"type":"string","format":"uri","pattern":"^https://","maxLength":2048};
const formats0 = require("ajv-formats/dist/formats").fullFormats.uri;
const pattern10 = new RegExp("^https://", "u");

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
if((((((data.artifact_uri === undefined) || (!(func0.call(data, "artifact_uri")))) && (missing0 = "artifact_uri")) || (((data.media_type === undefined) || (!(func0.call(data, "media_type")))) && (missing0 = "media_type"))) || (((data.byte_size === undefined) || (!(func0.call(data, "byte_size")))) && (missing0 = "byte_size"))) || (((data.sha256 === undefined) || (!(func0.call(data, "sha256")))) && (missing0 = "sha256"))){
validate28.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!((((key0 === "artifact_uri") || (key0 === "media_type")) || (key0 === "byte_size")) || (key0 === "sha256"))){
validate28.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.artifact_uri !== undefined && func0.call(data, "artifact_uri")){
let data0 = data.artifact_uri;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(errors === _errs3){
if(typeof data0 === "string"){
if(func91(data0) > 2048){
validate28.errors = [{instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/uri/maxLength",keyword:"maxLength",params:{limit: 2048},message:"must NOT have more than 2048 characters"}];
return false;
}
else {
if(!pattern10.test(data0)){
validate28.errors = [{instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/uri/pattern",keyword:"pattern",params:{pattern: "^https://"},message:"must match pattern \""+"^https://"+"\""}];
return false;
}
else {
if(!(formats0(data0))){
validate28.errors = [{instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/uri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""}];
return false;
}
}
}
}
else {
validate28.errors = [{instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/uri/type",keyword:"type",params:{type: "string"},message:"must be string"}];
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
if(data.media_type !== undefined && func0.call(data, "media_type")){
let data1 = data.media_type;
const _errs5 = errors;
if(errors === _errs5){
if(typeof data1 === "string"){
if(func91(data1) > 128){
validate28.errors = [{instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"}];
return false;
}
else {
if(func91(data1) < 1){
validate28.errors = [{instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
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
if(data.byte_size !== undefined && func0.call(data, "byte_size")){
let data2 = data.byte_size;
const _errs7 = errors;
const _errs8 = errors;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
validate28.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/$defs/size/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs8){
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
validate28.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/$defs/size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"}];
return false;
}
else {
if(data2 < 0 || isNaN(data2)){
validate28.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/$defs/size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"}];
return false;
}
}
}
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.sha256 !== undefined && func0.call(data, "sha256")){
let data3 = data.sha256;
const _errs10 = errors;
const _errs11 = errors;
if(errors === _errs11){
if(typeof data3 === "string"){
if(!pattern6.test(data3)){
validate28.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""}];
return false;
}
}
else {
validate28.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/digest/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs10 === errors;
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
if(((((((data.repository === undefined) || (!(func0.call(data, "repository")))) && (missing0 = "repository")) || (((data.version === undefined) || (!(func0.call(data, "version")))) && (missing0 = "version"))) || (((data.tag === undefined) || (!(func0.call(data, "tag")))) && (missing0 = "tag"))) || (((data.commit === undefined) || (!(func0.call(data, "commit")))) && (missing0 = "commit"))) || (((data.artifact === undefined) || (!(func0.call(data, "artifact")))) && (missing0 = "artifact"))){
validate27.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!(((((key0 === "repository") || (key0 === "version")) || (key0 === "tag")) || (key0 === "commit")) || (key0 === "artifact"))){
validate27.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.repository !== undefined && func0.call(data, "repository")){
let data0 = data.repository;
const _errs2 = errors;
if(errors === _errs2){
if(typeof data0 === "string"){
if(func91(data0) > 200){
validate27.errors = [{instancePath:instancePath+"/repository",schemaPath:"#/properties/repository/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"}];
return false;
}
else {
if(!pattern7.test(data0)){
validate27.errors = [{instancePath:instancePath+"/repository",schemaPath:"#/properties/repository/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"},message:"must match pattern \""+"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"+"\""}];
return false;
}
}
}
else {
validate27.errors = [{instancePath:instancePath+"/repository",schemaPath:"#/properties/repository/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.version !== undefined && func0.call(data, "version")){
let data1 = data.version;
const _errs4 = errors;
if(errors === _errs4){
if(typeof data1 === "string"){
if(!pattern8.test(data1)){
validate27.errors = [{instancePath:instancePath+"/version",schemaPath:"#/properties/version/pattern",keyword:"pattern",params:{pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$"},message:"must match pattern \""+"^[0-9]+\\.[0-9]+\\.[0-9]+$"+"\""}];
return false;
}
}
else {
validate27.errors = [{instancePath:instancePath+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs4 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.tag !== undefined && func0.call(data, "tag")){
let data2 = data.tag;
const _errs6 = errors;
if(errors === _errs6){
if(typeof data2 === "string"){
if(func91(data2) > 200){
validate27.errors = [{instancePath:instancePath+"/tag",schemaPath:"#/properties/tag/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"}];
return false;
}
else {
if(func91(data2) < 1){
validate27.errors = [{instancePath:instancePath+"/tag",schemaPath:"#/properties/tag/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate27.errors = [{instancePath:instancePath+"/tag",schemaPath:"#/properties/tag/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs6 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.commit !== undefined && func0.call(data, "commit")){
let data3 = data.commit;
const _errs8 = errors;
if(errors === _errs8){
if(typeof data3 === "string"){
if(!pattern9.test(data3)){
validate27.errors = [{instancePath:instancePath+"/commit",schemaPath:"#/properties/commit/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{40}$"},message:"must match pattern \""+"^[0-9a-f]{40}$"+"\""}];
return false;
}
}
else {
validate27.errors = [{instancePath:instancePath+"/commit",schemaPath:"#/properties/commit/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs8 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.artifact !== undefined && func0.call(data, "artifact")){
const _errs10 = errors;
if(!(validate28(data.artifact, {instancePath:instancePath+"/artifact",parentData:data,parentDataProperty:"artifact",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
var valid0 = _errs10 === errors;
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
else {
validate27.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate27.errors = vErrors;
return errors === 0;
}
validate27.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema48 = {"type":"object","additionalProperties":false,"required":["binding_id","definition","prompt_id","prompt_version","identity","context"],"properties":{"binding_id":{"$ref":"#/$defs/name"},"definition":{"$ref":"#/$defs/dependency"},"prompt_id":{"type":"string","minLength":1,"maxLength":200},"prompt_version":{"type":"string","pattern":"^[0-9]+\\.[0-9]+\\.[0-9]+$"},"identity":{"$ref":"#/$defs/identity"},"context":{"anyOf":[{"$ref":"#/$defs/context"},{"type":"null"}]}}};
const schema49 = {"type":"string","pattern":"^[a-z][a-z0-9-]{0,63}$"};
const pattern12 = new RegExp("^[a-z][a-z0-9-]{0,63}$", "u");
const schema50 = {"type":"object","additionalProperties":false,"required":["contract_version","package_id","package_version","instance_id","manifest_identity","classification","purpose","sections","builder_result_identity","preparation_reference","use_authorization_reference"],"properties":{"contract_version":{"const":"1.0.0"},"package_id":{"type":"string","minLength":1,"maxLength":200},"package_version":{"type":"string","minLength":1,"maxLength":32},"instance_id":{"$ref":"#/$defs/uuid"},"manifest_identity":{"$ref":"#/$defs/identity"},"classification":{"$ref":"#/$defs/classification"},"purpose":{"type":"string","minLength":1,"maxLength":4096},"sections":{"type":"array","items":{"type":"string","minLength":1,"maxLength":128},"minItems":1,"maxItems":256},"builder_result_identity":{"$ref":"#/$defs/identity"},"preparation_reference":{"$ref":"#/$defs/uuid"},"use_authorization_reference":{"$ref":"#/$defs/uuid"}}};

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
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((((((((((data.contract_version === undefined) || (!(func0.call(data, "contract_version")))) && (missing0 = "contract_version")) || (((data.package_id === undefined) || (!(func0.call(data, "package_id")))) && (missing0 = "package_id"))) || (((data.package_version === undefined) || (!(func0.call(data, "package_version")))) && (missing0 = "package_version"))) || (((data.instance_id === undefined) || (!(func0.call(data, "instance_id")))) && (missing0 = "instance_id"))) || (((data.manifest_identity === undefined) || (!(func0.call(data, "manifest_identity")))) && (missing0 = "manifest_identity"))) || (((data.classification === undefined) || (!(func0.call(data, "classification")))) && (missing0 = "classification"))) || (((data.purpose === undefined) || (!(func0.call(data, "purpose")))) && (missing0 = "purpose"))) || (((data.sections === undefined) || (!(func0.call(data, "sections")))) && (missing0 = "sections"))) || (((data.builder_result_identity === undefined) || (!(func0.call(data, "builder_result_identity")))) && (missing0 = "builder_result_identity"))) || (((data.preparation_reference === undefined) || (!(func0.call(data, "preparation_reference")))) && (missing0 = "preparation_reference"))) || (((data.use_authorization_reference === undefined) || (!(func0.call(data, "use_authorization_reference")))) && (missing0 = "use_authorization_reference"))){
validate35.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!(func0.call(schema50.properties, key0))){
validate35.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.contract_version !== undefined && func0.call(data, "contract_version")){
const _errs2 = errors;
if("1.0.0" !== data.contract_version){
validate35.errors = [{instancePath:instancePath+"/contract_version",schemaPath:"#/properties/contract_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.package_id !== undefined && func0.call(data, "package_id")){
let data1 = data.package_id;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data1 === "string"){
if(func91(data1) > 200){
validate35.errors = [{instancePath:instancePath+"/package_id",schemaPath:"#/properties/package_id/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"}];
return false;
}
else {
if(func91(data1) < 1){
validate35.errors = [{instancePath:instancePath+"/package_id",schemaPath:"#/properties/package_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate35.errors = [{instancePath:instancePath+"/package_id",schemaPath:"#/properties/package_id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.package_version !== undefined && func0.call(data, "package_version")){
let data2 = data.package_version;
const _errs5 = errors;
if(errors === _errs5){
if(typeof data2 === "string"){
if(func91(data2) > 32){
validate35.errors = [{instancePath:instancePath+"/package_version",schemaPath:"#/properties/package_version/maxLength",keyword:"maxLength",params:{limit: 32},message:"must NOT have more than 32 characters"}];
return false;
}
else {
if(func91(data2) < 1){
validate35.errors = [{instancePath:instancePath+"/package_version",schemaPath:"#/properties/package_version/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate35.errors = [{instancePath:instancePath+"/package_version",schemaPath:"#/properties/package_version/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.instance_id !== undefined && func0.call(data, "instance_id")){
let data3 = data.instance_id;
const _errs7 = errors;
const _errs8 = errors;
if(errors === _errs8){
if(typeof data3 === "string"){
if(!pattern4.test(data3)){
validate35.errors = [{instancePath:instancePath+"/instance_id",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate35.errors = [{instancePath:instancePath+"/instance_id",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.manifest_identity !== undefined && func0.call(data, "manifest_identity")){
const _errs10 = errors;
if(!(validate23(data.manifest_identity, {instancePath:instancePath+"/manifest_identity",parentData:data,parentDataProperty:"manifest_identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
var valid0 = _errs10 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.classification !== undefined && func0.call(data, "classification")){
let data5 = data.classification;
const _errs11 = errors;
if(!((((data5 === "public") || (data5 === "internal")) || (data5 === "confidential")) || (data5 === "restricted"))){
validate35.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema41.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs11 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.purpose !== undefined && func0.call(data, "purpose")){
let data6 = data.purpose;
const _errs13 = errors;
if(errors === _errs13){
if(typeof data6 === "string"){
if(func91(data6) > 4096){
validate35.errors = [{instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data6) < 1){
validate35.errors = [{instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate35.errors = [{instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs13 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.sections !== undefined && func0.call(data, "sections")){
let data7 = data.sections;
const _errs15 = errors;
if(errors === _errs15){
if(Array.isArray(data7)){
if(data7.length > 256){
validate35.errors = [{instancePath:instancePath+"/sections",schemaPath:"#/properties/sections/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data7.length < 1){
validate35.errors = [{instancePath:instancePath+"/sections",schemaPath:"#/properties/sections/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid3 = true;
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
const _errs17 = errors;
if(errors === _errs17){
if(typeof data8 === "string"){
if(func91(data8) > 128){
validate35.errors = [{instancePath:instancePath+"/sections/" + i0,schemaPath:"#/properties/sections/items/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"}];
return false;
}
else {
if(func91(data8) < 1){
validate35.errors = [{instancePath:instancePath+"/sections/" + i0,schemaPath:"#/properties/sections/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate35.errors = [{instancePath:instancePath+"/sections/" + i0,schemaPath:"#/properties/sections/items/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid3 = _errs17 === errors;
if(!valid3){
break;
}
}
}
}
}
else {
validate35.errors = [{instancePath:instancePath+"/sections",schemaPath:"#/properties/sections/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs15 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.builder_result_identity !== undefined && func0.call(data, "builder_result_identity")){
const _errs19 = errors;
if(!(validate23(data.builder_result_identity, {instancePath:instancePath+"/builder_result_identity",parentData:data,parentDataProperty:"builder_result_identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
var valid0 = _errs19 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.preparation_reference !== undefined && func0.call(data, "preparation_reference")){
let data10 = data.preparation_reference;
const _errs20 = errors;
const _errs21 = errors;
if(errors === _errs21){
if(typeof data10 === "string"){
if(!pattern4.test(data10)){
validate35.errors = [{instancePath:instancePath+"/preparation_reference",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate35.errors = [{instancePath:instancePath+"/preparation_reference",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs20 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.use_authorization_reference !== undefined && func0.call(data, "use_authorization_reference")){
let data11 = data.use_authorization_reference;
const _errs23 = errors;
const _errs24 = errors;
if(errors === _errs24){
if(typeof data11 === "string"){
if(!pattern4.test(data11)){
validate35.errors = [{instancePath:instancePath+"/use_authorization_reference",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate35.errors = [{instancePath:instancePath+"/use_authorization_reference",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs23 === errors;
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
validate35.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate35.errors = vErrors;
return errors === 0;
}
validate35.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((((data.binding_id === undefined) || (!(func0.call(data, "binding_id")))) && (missing0 = "binding_id")) || (((data.definition === undefined) || (!(func0.call(data, "definition")))) && (missing0 = "definition"))) || (((data.prompt_id === undefined) || (!(func0.call(data, "prompt_id")))) && (missing0 = "prompt_id"))) || (((data.prompt_version === undefined) || (!(func0.call(data, "prompt_version")))) && (missing0 = "prompt_version"))) || (((data.identity === undefined) || (!(func0.call(data, "identity")))) && (missing0 = "identity"))) || (((data.context === undefined) || (!(func0.call(data, "context")))) && (missing0 = "context"))){
validate32.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!((((((key0 === "binding_id") || (key0 === "definition")) || (key0 === "prompt_id")) || (key0 === "prompt_version")) || (key0 === "identity")) || (key0 === "context"))){
validate32.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.binding_id !== undefined && func0.call(data, "binding_id")){
let data0 = data.binding_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern12.test(data0)){
validate32.errors = [{instancePath:instancePath+"/binding_id",schemaPath:"#/$defs/name/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9-]{0,63}$"+"\""}];
return false;
}
}
else {
validate32.errors = [{instancePath:instancePath+"/binding_id",schemaPath:"#/$defs/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.definition !== undefined && func0.call(data, "definition")){
const _errs5 = errors;
if(!(validate27(data.definition, {instancePath:instancePath+"/definition",parentData:data,parentDataProperty:"definition",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
errors = vErrors.length;
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.prompt_id !== undefined && func0.call(data, "prompt_id")){
let data2 = data.prompt_id;
const _errs6 = errors;
if(errors === _errs6){
if(typeof data2 === "string"){
if(func91(data2) > 200){
validate32.errors = [{instancePath:instancePath+"/prompt_id",schemaPath:"#/properties/prompt_id/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"}];
return false;
}
else {
if(func91(data2) < 1){
validate32.errors = [{instancePath:instancePath+"/prompt_id",schemaPath:"#/properties/prompt_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate32.errors = [{instancePath:instancePath+"/prompt_id",schemaPath:"#/properties/prompt_id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs6 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.prompt_version !== undefined && func0.call(data, "prompt_version")){
let data3 = data.prompt_version;
const _errs8 = errors;
if(errors === _errs8){
if(typeof data3 === "string"){
if(!pattern8.test(data3)){
validate32.errors = [{instancePath:instancePath+"/prompt_version",schemaPath:"#/properties/prompt_version/pattern",keyword:"pattern",params:{pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$"},message:"must match pattern \""+"^[0-9]+\\.[0-9]+\\.[0-9]+$"+"\""}];
return false;
}
}
else {
validate32.errors = [{instancePath:instancePath+"/prompt_version",schemaPath:"#/properties/prompt_version/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs8 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.identity !== undefined && func0.call(data, "identity")){
const _errs10 = errors;
if(!(validate23(data.identity, {instancePath:instancePath+"/identity",parentData:data,parentDataProperty:"identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
var valid0 = _errs10 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.context !== undefined && func0.call(data, "context")){
let data5 = data.context;
const _errs11 = errors;
const _errs12 = errors;
let valid2 = false;
const _errs13 = errors;
if(!(validate35(data5, {instancePath:instancePath+"/context",parentData:data,parentDataProperty:"context",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate35.errors : vErrors.concat(validate35.errors);
errors = vErrors.length;
}
var _valid0 = _errs13 === errors;
valid2 = valid2 || _valid0;
const _errs14 = errors;
if(data5 !== null){
const err0 = {instancePath:instancePath+"/context",schemaPath:"#/properties/context/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
var _valid0 = _errs14 === errors;
valid2 = valid2 || _valid0;
if(!valid2){
const err1 = {instancePath:instancePath+"/context",schemaPath:"#/properties/context/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
validate32.errors = vErrors;
return false;
}
else {
errors = _errs12;
if(vErrors !== null){
if(_errs12){
vErrors.length = _errs12;
}
else {
vErrors = null;
}
}
}
var valid0 = _errs11 === errors;
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
validate32.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate32.errors = vErrors;
return errors === 0;
}
validate32.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema55 = {"type":"object","additionalProperties":false,"required":["asset_id","classification","reference","rights_notice"],"properties":{"asset_id":{"$ref":"#/$defs/name"},"classification":{"$ref":"#/$defs/classification"},"reference":{"oneOf":[{"type":"object","additionalProperties":false,"required":["kind","dependency"],"properties":{"kind":{"const":"public"},"dependency":{"$ref":"#/$defs/dependency"}}},{"type":"object","additionalProperties":false,"required":["kind","handle","media_type","byte_size","sha256"],"properties":{"kind":{"const":"protected"},"handle":{"$ref":"#/$defs/uuid"},"media_type":{"type":"string","minLength":1,"maxLength":128},"byte_size":{"$ref":"#/$defs/size"},"sha256":{"$ref":"#/$defs/digest"}}}]},"rights_notice":{"type":"string","minLength":1,"maxLength":4096}}};

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
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((data.asset_id === undefined) || (!(func0.call(data, "asset_id")))) && (missing0 = "asset_id")) || (((data.classification === undefined) || (!(func0.call(data, "classification")))) && (missing0 = "classification"))) || (((data.reference === undefined) || (!(func0.call(data, "reference")))) && (missing0 = "reference"))) || (((data.rights_notice === undefined) || (!(func0.call(data, "rights_notice")))) && (missing0 = "rights_notice"))){
validate40.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!((((key0 === "asset_id") || (key0 === "classification")) || (key0 === "reference")) || (key0 === "rights_notice"))){
validate40.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.asset_id !== undefined && func0.call(data, "asset_id")){
let data0 = data.asset_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern12.test(data0)){
validate40.errors = [{instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/name/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9-]{0,63}$"+"\""}];
return false;
}
}
else {
validate40.errors = [{instancePath:instancePath+"/asset_id",schemaPath:"#/$defs/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.classification !== undefined && func0.call(data, "classification")){
let data1 = data.classification;
const _errs5 = errors;
if(!((((data1 === "public") || (data1 === "internal")) || (data1 === "confidential")) || (data1 === "restricted"))){
validate40.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema41.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.reference !== undefined && func0.call(data, "reference")){
let data2 = data.reference;
const _errs7 = errors;
const _errs8 = errors;
let valid3 = false;
let passing0 = null;
const _errs9 = errors;
if(errors === _errs9){
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
let missing1;
if((((data2.kind === undefined) || (!(func0.call(data2, "kind")))) && (missing1 = "kind")) || (((data2.dependency === undefined) || (!(func0.call(data2, "dependency")))) && (missing1 = "dependency"))){
const err0 = {instancePath:instancePath+"/reference",schemaPath:"#/properties/reference/oneOf/0/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
const _errs11 = errors;
for(const key1 of Object.keys(data2)){
if(!((key1 === "kind") || (key1 === "dependency"))){
const err1 = {instancePath:instancePath+"/reference",schemaPath:"#/properties/reference/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
break;
}
}
if(_errs11 === errors){
if(data2.kind !== undefined && func0.call(data2, "kind")){
const _errs12 = errors;
if("public" !== data2.kind){
const err2 = {instancePath:instancePath+"/reference/kind",schemaPath:"#/properties/reference/oneOf/0/properties/kind/const",keyword:"const",params:{allowedValue: "public"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
var valid4 = _errs12 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data2.dependency !== undefined && func0.call(data2, "dependency")){
const _errs13 = errors;
if(!(validate27(data2.dependency, {instancePath:instancePath+"/reference/dependency",parentData:data2,parentDataProperty:"dependency",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
errors = vErrors.length;
}
var valid4 = _errs13 === errors;
}
else {
var valid4 = true;
}
}
}
}
}
else {
const err3 = {instancePath:instancePath+"/reference",schemaPath:"#/properties/reference/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
var _valid0 = _errs9 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
var props0 = true;
}
const _errs14 = errors;
if(errors === _errs14){
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
let missing2;
if(((((((data2.kind === undefined) || (!(func0.call(data2, "kind")))) && (missing2 = "kind")) || (((data2.handle === undefined) || (!(func0.call(data2, "handle")))) && (missing2 = "handle"))) || (((data2.media_type === undefined) || (!(func0.call(data2, "media_type")))) && (missing2 = "media_type"))) || (((data2.byte_size === undefined) || (!(func0.call(data2, "byte_size")))) && (missing2 = "byte_size"))) || (((data2.sha256 === undefined) || (!(func0.call(data2, "sha256")))) && (missing2 = "sha256"))){
const err4 = {instancePath:instancePath+"/reference",schemaPath:"#/properties/reference/oneOf/1/required",keyword:"required",params:{missingProperty: missing2},message:"must have required property '"+missing2+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
else {
const _errs16 = errors;
for(const key2 of Object.keys(data2)){
if(!(((((key2 === "kind") || (key2 === "handle")) || (key2 === "media_type")) || (key2 === "byte_size")) || (key2 === "sha256"))){
const err5 = {instancePath:instancePath+"/reference",schemaPath:"#/properties/reference/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
break;
}
}
if(_errs16 === errors){
if(data2.kind !== undefined && func0.call(data2, "kind")){
const _errs17 = errors;
if("protected" !== data2.kind){
const err6 = {instancePath:instancePath+"/reference/kind",schemaPath:"#/properties/reference/oneOf/1/properties/kind/const",keyword:"const",params:{allowedValue: "protected"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
var valid5 = _errs17 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data2.handle !== undefined && func0.call(data2, "handle")){
let data6 = data2.handle;
const _errs18 = errors;
const _errs19 = errors;
if(errors === _errs19){
if(typeof data6 === "string"){
if(!pattern4.test(data6)){
const err7 = {instancePath:instancePath+"/reference/handle",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
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
const err8 = {instancePath:instancePath+"/reference/handle",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
var valid5 = _errs18 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data2.media_type !== undefined && func0.call(data2, "media_type")){
let data7 = data2.media_type;
const _errs21 = errors;
if(errors === _errs21){
if(typeof data7 === "string"){
if(func91(data7) > 128){
const err9 = {instancePath:instancePath+"/reference/media_type",schemaPath:"#/properties/reference/oneOf/1/properties/media_type/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
else {
if(func91(data7) < 1){
const err10 = {instancePath:instancePath+"/reference/media_type",schemaPath:"#/properties/reference/oneOf/1/properties/media_type/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err11 = {instancePath:instancePath+"/reference/media_type",schemaPath:"#/properties/reference/oneOf/1/properties/media_type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
var valid5 = _errs21 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data2.byte_size !== undefined && func0.call(data2, "byte_size")){
let data8 = data2.byte_size;
const _errs23 = errors;
const _errs24 = errors;
if(!(((typeof data8 == "number") && (!(data8 % 1) && !isNaN(data8))) && (isFinite(data8)))){
const err12 = {instancePath:instancePath+"/reference/byte_size",schemaPath:"#/$defs/size/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(errors === _errs24){
if((typeof data8 == "number") && (isFinite(data8))){
if(data8 > 9007199254740991 || isNaN(data8)){
const err13 = {instancePath:instancePath+"/reference/byte_size",schemaPath:"#/$defs/size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
else {
if(data8 < 0 || isNaN(data8)){
const err14 = {instancePath:instancePath+"/reference/byte_size",schemaPath:"#/$defs/size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
}
var valid5 = _errs23 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data2.sha256 !== undefined && func0.call(data2, "sha256")){
let data9 = data2.sha256;
const _errs26 = errors;
const _errs27 = errors;
if(errors === _errs27){
if(typeof data9 === "string"){
if(!pattern6.test(data9)){
const err15 = {instancePath:instancePath+"/reference/sha256",schemaPath:"#/$defs/digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
const err16 = {instancePath:instancePath+"/reference/sha256",schemaPath:"#/$defs/digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
var valid5 = _errs26 === errors;
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
else {
const err17 = {instancePath:instancePath+"/reference",schemaPath:"#/properties/reference/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
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
}
if(!valid3){
const err18 = {instancePath:instancePath+"/reference",schemaPath:"#/properties/reference/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
validate40.errors = vErrors;
return false;
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
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.rights_notice !== undefined && func0.call(data, "rights_notice")){
let data10 = data.rights_notice;
const _errs29 = errors;
if(errors === _errs29){
if(typeof data10 === "string"){
if(func91(data10) > 4096){
validate40.errors = [{instancePath:instancePath+"/rights_notice",schemaPath:"#/properties/rights_notice/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data10) < 1){
validate40.errors = [{instancePath:instancePath+"/rights_notice",schemaPath:"#/properties/rights_notice/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate40.errors = [{instancePath:instancePath+"/rights_notice",schemaPath:"#/properties/rights_notice/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs29 === errors;
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
validate40.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate40.errors = vErrors;
return errors === 0;
}
validate40.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((data.canon === undefined) || (!(func0.call(data, "canon")))) && (missing0 = "canon")) || (((data.dependencies === undefined) || (!(func0.call(data, "dependencies")))) && (missing0 = "dependencies"))) || (((data.prompts === undefined) || (!(func0.call(data, "prompts")))) && (missing0 = "prompts"))) || (((data.assets === undefined) || (!(func0.call(data, "assets")))) && (missing0 = "assets"))){
validate26.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!((((key0 === "canon") || (key0 === "dependencies")) || (key0 === "prompts")) || (key0 === "assets"))){
validate26.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.canon !== undefined && func0.call(data, "canon")){
const _errs2 = errors;
if(!(validate27(data.canon, {instancePath:instancePath+"/canon",parentData:data,parentDataProperty:"canon",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
errors = vErrors.length;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.dependencies !== undefined && func0.call(data, "dependencies")){
let data1 = data.dependencies;
const _errs3 = errors;
if(errors === _errs3){
if(Array.isArray(data1)){
if(data1.length > 256){
validate26.errors = [{instancePath:instancePath+"/dependencies",schemaPath:"#/properties/dependencies/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data1.length < 1){
validate26.errors = [{instancePath:instancePath+"/dependencies",schemaPath:"#/properties/dependencies/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid1 = true;
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
const _errs5 = errors;
if(!(validate27(data1[i0], {instancePath:instancePath+"/dependencies/" + i0,parentData:data1,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
errors = vErrors.length;
}
var valid1 = _errs5 === errors;
if(!valid1){
break;
}
}
}
}
}
else {
validate26.errors = [{instancePath:instancePath+"/dependencies",schemaPath:"#/properties/dependencies/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.prompts !== undefined && func0.call(data, "prompts")){
let data3 = data.prompts;
const _errs6 = errors;
if(errors === _errs6){
if(Array.isArray(data3)){
if(data3.length > 256){
validate26.errors = [{instancePath:instancePath+"/prompts",schemaPath:"#/properties/prompts/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data3.length < 0){
validate26.errors = [{instancePath:instancePath+"/prompts",schemaPath:"#/properties/prompts/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid2 = true;
const len1 = data3.length;
for(let i1=0; i1<len1; i1++){
const _errs8 = errors;
if(!(validate32(data3[i1], {instancePath:instancePath+"/prompts/" + i1,parentData:data3,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate32.errors : vErrors.concat(validate32.errors);
errors = vErrors.length;
}
var valid2 = _errs8 === errors;
if(!valid2){
break;
}
}
}
}
}
else {
validate26.errors = [{instancePath:instancePath+"/prompts",schemaPath:"#/properties/prompts/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs6 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.assets !== undefined && func0.call(data, "assets")){
let data5 = data.assets;
const _errs9 = errors;
if(errors === _errs9){
if(Array.isArray(data5)){
if(data5.length > 256){
validate26.errors = [{instancePath:instancePath+"/assets",schemaPath:"#/properties/assets/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data5.length < 0){
validate26.errors = [{instancePath:instancePath+"/assets",schemaPath:"#/properties/assets/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid3 = true;
const len2 = data5.length;
for(let i2=0; i2<len2; i2++){
const _errs11 = errors;
if(!(validate40(data5[i2], {instancePath:instancePath+"/assets/" + i2,parentData:data5,parentDataProperty:i2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate40.errors : vErrors.concat(validate40.errors);
errors = vErrors.length;
}
var valid3 = _errs11 === errors;
if(!valid3){
break;
}
}
}
}
}
else {
validate26.errors = [{instancePath:instancePath+"/assets",schemaPath:"#/properties/assets/type",keyword:"type",params:{type: "array"},message:"must be array"}];
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
validate26.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema61 = {"type":"object","additionalProperties":false,"required":["panel_id","description","text","asset_ids","prompt_bindings"],"properties":{"panel_id":{"$ref":"#/$defs/name"},"description":{"type":"string","minLength":1,"maxLength":4096},"text":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["text_id","kind","speaker","text"],"properties":{"text_id":{"$ref":"#/$defs/name"},"kind":{"enum":["dialogue","caption"]},"speaker":{"anyOf":[{"type":"string","minLength":1,"maxLength":128},{"type":"null"}]},"text":{"type":"string","minLength":1,"maxLength":4096}}},"minItems":0,"maxItems":256},"asset_ids":{"type":"array","items":{"$ref":"#/$defs/name"},"minItems":0,"maxItems":256},"prompt_bindings":{"type":"array","items":{"$ref":"#/$defs/name"},"minItems":0,"maxItems":256}}};

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
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((((data.panel_id === undefined) || (!(func0.call(data, "panel_id")))) && (missing0 = "panel_id")) || (((data.description === undefined) || (!(func0.call(data, "description")))) && (missing0 = "description"))) || (((data.text === undefined) || (!(func0.call(data, "text")))) && (missing0 = "text"))) || (((data.asset_ids === undefined) || (!(func0.call(data, "asset_ids")))) && (missing0 = "asset_ids"))) || (((data.prompt_bindings === undefined) || (!(func0.call(data, "prompt_bindings")))) && (missing0 = "prompt_bindings"))){
validate44.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!(((((key0 === "panel_id") || (key0 === "description")) || (key0 === "text")) || (key0 === "asset_ids")) || (key0 === "prompt_bindings"))){
validate44.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.panel_id !== undefined && func0.call(data, "panel_id")){
let data0 = data.panel_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern12.test(data0)){
validate44.errors = [{instancePath:instancePath+"/panel_id",schemaPath:"#/$defs/name/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9-]{0,63}$"+"\""}];
return false;
}
}
else {
validate44.errors = [{instancePath:instancePath+"/panel_id",schemaPath:"#/$defs/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.description !== undefined && func0.call(data, "description")){
let data1 = data.description;
const _errs5 = errors;
if(errors === _errs5){
if(typeof data1 === "string"){
if(func91(data1) > 4096){
validate44.errors = [{instancePath:instancePath+"/description",schemaPath:"#/properties/description/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data1) < 1){
validate44.errors = [{instancePath:instancePath+"/description",schemaPath:"#/properties/description/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate44.errors = [{instancePath:instancePath+"/description",schemaPath:"#/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.text !== undefined && func0.call(data, "text")){
let data2 = data.text;
const _errs7 = errors;
if(errors === _errs7){
if(Array.isArray(data2)){
if(data2.length > 256){
validate44.errors = [{instancePath:instancePath+"/text",schemaPath:"#/properties/text/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data2.length < 0){
validate44.errors = [{instancePath:instancePath+"/text",schemaPath:"#/properties/text/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid2 = true;
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
const _errs9 = errors;
if(errors === _errs9){
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
let missing1;
if((((((data3.text_id === undefined) || (!(func0.call(data3, "text_id")))) && (missing1 = "text_id")) || (((data3.kind === undefined) || (!(func0.call(data3, "kind")))) && (missing1 = "kind"))) || (((data3.speaker === undefined) || (!(func0.call(data3, "speaker")))) && (missing1 = "speaker"))) || (((data3.text === undefined) || (!(func0.call(data3, "text")))) && (missing1 = "text"))){
validate44.errors = [{instancePath:instancePath+"/text/" + i0,schemaPath:"#/properties/text/items/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"}];
return false;
}
else {
const _errs11 = errors;
for(const key1 of Object.keys(data3)){
if(!((((key1 === "text_id") || (key1 === "kind")) || (key1 === "speaker")) || (key1 === "text"))){
validate44.errors = [{instancePath:instancePath+"/text/" + i0,schemaPath:"#/properties/text/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs11 === errors){
if(data3.text_id !== undefined && func0.call(data3, "text_id")){
let data4 = data3.text_id;
const _errs12 = errors;
const _errs13 = errors;
if(errors === _errs13){
if(typeof data4 === "string"){
if(!pattern12.test(data4)){
validate44.errors = [{instancePath:instancePath+"/text/" + i0+"/text_id",schemaPath:"#/$defs/name/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9-]{0,63}$"+"\""}];
return false;
}
}
else {
validate44.errors = [{instancePath:instancePath+"/text/" + i0+"/text_id",schemaPath:"#/$defs/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid3 = _errs12 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data3.kind !== undefined && func0.call(data3, "kind")){
let data5 = data3.kind;
const _errs15 = errors;
if(!((data5 === "dialogue") || (data5 === "caption"))){
validate44.errors = [{instancePath:instancePath+"/text/" + i0+"/kind",schemaPath:"#/properties/text/items/properties/kind/enum",keyword:"enum",params:{allowedValues: schema61.properties.text.items.properties.kind.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid3 = _errs15 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data3.speaker !== undefined && func0.call(data3, "speaker")){
let data6 = data3.speaker;
const _errs16 = errors;
const _errs17 = errors;
let valid5 = false;
const _errs18 = errors;
if(errors === _errs18){
if(typeof data6 === "string"){
if(func91(data6) > 128){
const err0 = {instancePath:instancePath+"/text/" + i0+"/speaker",schemaPath:"#/properties/text/items/properties/speaker/anyOf/0/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
if(func91(data6) < 1){
const err1 = {instancePath:instancePath+"/text/" + i0+"/speaker",schemaPath:"#/properties/text/items/properties/speaker/anyOf/0/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
else {
const err2 = {instancePath:instancePath+"/text/" + i0+"/speaker",schemaPath:"#/properties/text/items/properties/speaker/anyOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
var _valid0 = _errs18 === errors;
valid5 = valid5 || _valid0;
const _errs20 = errors;
if(data6 !== null){
const err3 = {instancePath:instancePath+"/text/" + i0+"/speaker",schemaPath:"#/properties/text/items/properties/speaker/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
var _valid0 = _errs20 === errors;
valid5 = valid5 || _valid0;
if(!valid5){
const err4 = {instancePath:instancePath+"/text/" + i0+"/speaker",schemaPath:"#/properties/text/items/properties/speaker/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
validate44.errors = vErrors;
return false;
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
var valid3 = _errs16 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data3.text !== undefined && func0.call(data3, "text")){
let data7 = data3.text;
const _errs22 = errors;
if(errors === _errs22){
if(typeof data7 === "string"){
if(func91(data7) > 4096){
validate44.errors = [{instancePath:instancePath+"/text/" + i0+"/text",schemaPath:"#/properties/text/items/properties/text/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data7) < 1){
validate44.errors = [{instancePath:instancePath+"/text/" + i0+"/text",schemaPath:"#/properties/text/items/properties/text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate44.errors = [{instancePath:instancePath+"/text/" + i0+"/text",schemaPath:"#/properties/text/items/properties/text/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid3 = _errs22 === errors;
}
else {
var valid3 = true;
}
}
}
}
}
}
}
else {
validate44.errors = [{instancePath:instancePath+"/text/" + i0,schemaPath:"#/properties/text/items/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
var valid2 = _errs9 === errors;
if(!valid2){
break;
}
}
}
}
}
else {
validate44.errors = [{instancePath:instancePath+"/text",schemaPath:"#/properties/text/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.asset_ids !== undefined && func0.call(data, "asset_ids")){
let data8 = data.asset_ids;
const _errs24 = errors;
if(errors === _errs24){
if(Array.isArray(data8)){
if(data8.length > 256){
validate44.errors = [{instancePath:instancePath+"/asset_ids",schemaPath:"#/properties/asset_ids/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data8.length < 0){
validate44.errors = [{instancePath:instancePath+"/asset_ids",schemaPath:"#/properties/asset_ids/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid6 = true;
const len1 = data8.length;
for(let i1=0; i1<len1; i1++){
let data9 = data8[i1];
const _errs26 = errors;
const _errs27 = errors;
if(errors === _errs27){
if(typeof data9 === "string"){
if(!pattern12.test(data9)){
validate44.errors = [{instancePath:instancePath+"/asset_ids/" + i1,schemaPath:"#/$defs/name/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9-]{0,63}$"+"\""}];
return false;
}
}
else {
validate44.errors = [{instancePath:instancePath+"/asset_ids/" + i1,schemaPath:"#/$defs/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid6 = _errs26 === errors;
if(!valid6){
break;
}
}
}
}
}
else {
validate44.errors = [{instancePath:instancePath+"/asset_ids",schemaPath:"#/properties/asset_ids/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs24 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.prompt_bindings !== undefined && func0.call(data, "prompt_bindings")){
let data10 = data.prompt_bindings;
const _errs29 = errors;
if(errors === _errs29){
if(Array.isArray(data10)){
if(data10.length > 256){
validate44.errors = [{instancePath:instancePath+"/prompt_bindings",schemaPath:"#/properties/prompt_bindings/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data10.length < 0){
validate44.errors = [{instancePath:instancePath+"/prompt_bindings",schemaPath:"#/properties/prompt_bindings/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid8 = true;
const len2 = data10.length;
for(let i2=0; i2<len2; i2++){
let data11 = data10[i2];
const _errs31 = errors;
const _errs32 = errors;
if(errors === _errs32){
if(typeof data11 === "string"){
if(!pattern12.test(data11)){
validate44.errors = [{instancePath:instancePath+"/prompt_bindings/" + i2,schemaPath:"#/$defs/name/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9-]{0,63}$"+"\""}];
return false;
}
}
else {
validate44.errors = [{instancePath:instancePath+"/prompt_bindings/" + i2,schemaPath:"#/$defs/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid8 = _errs31 === errors;
if(!valid8){
break;
}
}
}
}
}
else {
validate44.errors = [{instancePath:instancePath+"/prompt_bindings",schemaPath:"#/properties/prompt_bindings/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs29 === errors;
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
else {
validate44.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate44.errors = vErrors;
return errors === 0;
}
validate44.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema66 = {"type":"object","additionalProperties":false,"required":["rendition_id","required","media_type","dimensions","alt_text","transcript","rights_notice"],"properties":{"rendition_id":{"$ref":"#/$defs/name"},"required":{"type":"boolean"},"media_type":{"enum":["image/png","image/jpeg","image/webp","application/pdf","text/plain"]},"dimensions":{"$ref":"#/$defs/dimensions"},"alt_text":{"type":"string","minLength":1,"maxLength":4096},"transcript":{"type":"string","minLength":1,"maxLength":32768},"rights_notice":{"type":"string","minLength":1,"maxLength":4096}}};
const schema68 = {"anyOf":[{"type":"object","additionalProperties":false,"required":["width","height"],"properties":{"width":{"type":"integer","minimum":1,"maximum":32768},"height":{"type":"integer","minimum":1,"maximum":32768}}},{"type":"null"}]};

function validate46(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate46.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((((((data.rendition_id === undefined) || (!(func0.call(data, "rendition_id")))) && (missing0 = "rendition_id")) || (((data.required === undefined) || (!(func0.call(data, "required")))) && (missing0 = "required"))) || (((data.media_type === undefined) || (!(func0.call(data, "media_type")))) && (missing0 = "media_type"))) || (((data.dimensions === undefined) || (!(func0.call(data, "dimensions")))) && (missing0 = "dimensions"))) || (((data.alt_text === undefined) || (!(func0.call(data, "alt_text")))) && (missing0 = "alt_text"))) || (((data.transcript === undefined) || (!(func0.call(data, "transcript")))) && (missing0 = "transcript"))) || (((data.rights_notice === undefined) || (!(func0.call(data, "rights_notice")))) && (missing0 = "rights_notice"))){
validate46.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!(((((((key0 === "rendition_id") || (key0 === "required")) || (key0 === "media_type")) || (key0 === "dimensions")) || (key0 === "alt_text")) || (key0 === "transcript")) || (key0 === "rights_notice"))){
validate46.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.rendition_id !== undefined && func0.call(data, "rendition_id")){
let data0 = data.rendition_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern12.test(data0)){
validate46.errors = [{instancePath:instancePath+"/rendition_id",schemaPath:"#/$defs/name/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9-]{0,63}$"+"\""}];
return false;
}
}
else {
validate46.errors = [{instancePath:instancePath+"/rendition_id",schemaPath:"#/$defs/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.required !== undefined && func0.call(data, "required")){
const _errs5 = errors;
if(typeof data.required !== "boolean"){
validate46.errors = [{instancePath:instancePath+"/required",schemaPath:"#/properties/required/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
return false;
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.media_type !== undefined && func0.call(data, "media_type")){
let data2 = data.media_type;
const _errs7 = errors;
if(!(((((data2 === "image/png") || (data2 === "image/jpeg")) || (data2 === "image/webp")) || (data2 === "application/pdf")) || (data2 === "text/plain"))){
validate46.errors = [{instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/enum",keyword:"enum",params:{allowedValues: schema66.properties.media_type.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.dimensions !== undefined && func0.call(data, "dimensions")){
let data3 = data.dimensions;
const _errs8 = errors;
const _errs10 = errors;
let valid3 = false;
const _errs11 = errors;
if(errors === _errs11){
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
let missing1;
if((((data3.width === undefined) || (!(func0.call(data3, "width")))) && (missing1 = "width")) || (((data3.height === undefined) || (!(func0.call(data3, "height")))) && (missing1 = "height"))){
const err0 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf/0/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
const _errs13 = errors;
for(const key1 of Object.keys(data3)){
if(!((key1 === "width") || (key1 === "height"))){
const err1 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
break;
}
}
if(_errs13 === errors){
if(data3.width !== undefined && func0.call(data3, "width")){
let data4 = data3.width;
const _errs14 = errors;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err2 = {instancePath:instancePath+"/dimensions/width",schemaPath:"#/$defs/dimensions/anyOf/0/properties/width/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors === _errs14){
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 32768 || isNaN(data4)){
const err3 = {instancePath:instancePath+"/dimensions/width",schemaPath:"#/$defs/dimensions/anyOf/0/properties/width/maximum",keyword:"maximum",params:{comparison: "<=", limit: 32768},message:"must be <= 32768"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
else {
if(data4 < 1 || isNaN(data4)){
const err4 = {instancePath:instancePath+"/dimensions/width",schemaPath:"#/$defs/dimensions/anyOf/0/properties/width/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
}
var valid4 = _errs14 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data3.height !== undefined && func0.call(data3, "height")){
let data5 = data3.height;
const _errs16 = errors;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err5 = {instancePath:instancePath+"/dimensions/height",schemaPath:"#/$defs/dimensions/anyOf/0/properties/height/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors === _errs16){
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 32768 || isNaN(data5)){
const err6 = {instancePath:instancePath+"/dimensions/height",schemaPath:"#/$defs/dimensions/anyOf/0/properties/height/maximum",keyword:"maximum",params:{comparison: "<=", limit: 32768},message:"must be <= 32768"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
else {
if(data5 < 1 || isNaN(data5)){
const err7 = {instancePath:instancePath+"/dimensions/height",schemaPath:"#/$defs/dimensions/anyOf/0/properties/height/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
}
var valid4 = _errs16 === errors;
}
else {
var valid4 = true;
}
}
}
}
}
else {
const err8 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
var _valid0 = _errs11 === errors;
valid3 = valid3 || _valid0;
const _errs18 = errors;
if(data3 !== null){
const err9 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid0 = _errs18 === errors;
valid3 = valid3 || _valid0;
if(!valid3){
const err10 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
validate46.errors = vErrors;
return false;
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
var valid0 = _errs8 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.alt_text !== undefined && func0.call(data, "alt_text")){
let data6 = data.alt_text;
const _errs20 = errors;
if(errors === _errs20){
if(typeof data6 === "string"){
if(func91(data6) > 4096){
validate46.errors = [{instancePath:instancePath+"/alt_text",schemaPath:"#/properties/alt_text/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data6) < 1){
validate46.errors = [{instancePath:instancePath+"/alt_text",schemaPath:"#/properties/alt_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate46.errors = [{instancePath:instancePath+"/alt_text",schemaPath:"#/properties/alt_text/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs20 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.transcript !== undefined && func0.call(data, "transcript")){
let data7 = data.transcript;
const _errs22 = errors;
if(errors === _errs22){
if(typeof data7 === "string"){
if(func91(data7) > 32768){
validate46.errors = [{instancePath:instancePath+"/transcript",schemaPath:"#/properties/transcript/maxLength",keyword:"maxLength",params:{limit: 32768},message:"must NOT have more than 32768 characters"}];
return false;
}
else {
if(func91(data7) < 1){
validate46.errors = [{instancePath:instancePath+"/transcript",schemaPath:"#/properties/transcript/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate46.errors = [{instancePath:instancePath+"/transcript",schemaPath:"#/properties/transcript/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs22 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.rights_notice !== undefined && func0.call(data, "rights_notice")){
let data8 = data.rights_notice;
const _errs24 = errors;
if(errors === _errs24){
if(typeof data8 === "string"){
if(func91(data8) > 4096){
validate46.errors = [{instancePath:instancePath+"/rights_notice",schemaPath:"#/properties/rights_notice/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data8) < 1){
validate46.errors = [{instancePath:instancePath+"/rights_notice",schemaPath:"#/properties/rights_notice/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate46.errors = [{instancePath:instancePath+"/rights_notice",schemaPath:"#/properties/rights_notice/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs24 === errors;
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
else {
validate46.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate46.errors = vErrors;
return errors === 0;
}
validate46.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate78(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate78.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((((((((((data.kind === undefined) || (!(func0.call(data, "kind")))) && (missing0 = "kind")) || (((data.spec_version === undefined) || (!(func0.call(data, "spec_version")))) && (missing0 = "spec_version"))) || (((data.production_id === undefined) || (!(func0.call(data, "production_id")))) && (missing0 = "production_id"))) || (((data.revision === undefined) || (!(func0.call(data, "revision")))) && (missing0 = "revision"))) || (((data.previous === undefined) || (!(func0.call(data, "previous")))) && (missing0 = "previous"))) || (((data.classification === undefined) || (!(func0.call(data, "classification")))) && (missing0 = "classification"))) || (((data.title === undefined) || (!(func0.call(data, "title")))) && (missing0 = "title"))) || (((data.intent === undefined) || (!(func0.call(data, "intent")))) && (missing0 = "intent"))) || (((data.inputs === undefined) || (!(func0.call(data, "inputs")))) && (missing0 = "inputs"))) || (((data.panels === undefined) || (!(func0.call(data, "panels")))) && (missing0 = "panels"))) || (((data.renditions === undefined) || (!(func0.call(data, "renditions")))) && (missing0 = "renditions"))){
validate78.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!(func0.call(schema32.properties, key0))){
validate78.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.kind !== undefined && func0.call(data, "kind")){
const _errs2 = errors;
if("comic-production" !== data.kind){
validate78.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "comic-production"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.spec_version !== undefined && func0.call(data, "spec_version")){
const _errs3 = errors;
if("1.0.0" !== data.spec_version){
validate78.errors = [{instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.production_id !== undefined && func0.call(data, "production_id")){
let data2 = data.production_id;
const _errs4 = errors;
const _errs5 = errors;
if(errors === _errs5){
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
validate78.errors = [{instancePath:instancePath+"/production_id",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate78.errors = [{instancePath:instancePath+"/production_id",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs4 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.revision !== undefined && func0.call(data, "revision")){
let data3 = data.revision;
const _errs7 = errors;
const _errs8 = errors;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
validate78.errors = [{instancePath:instancePath+"/revision",schemaPath:"#/$defs/revision/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs8){
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 9007199254740991 || isNaN(data3)){
validate78.errors = [{instancePath:instancePath+"/revision",schemaPath:"#/$defs/revision/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"}];
return false;
}
else {
if(data3 < 1 || isNaN(data3)){
validate78.errors = [{instancePath:instancePath+"/revision",schemaPath:"#/$defs/revision/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"}];
return false;
}
}
}
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.previous !== undefined && func0.call(data, "previous")){
let data4 = data.previous;
const _errs10 = errors;
const _errs11 = errors;
let valid3 = false;
const _errs12 = errors;
if(!(validate22(data4, {instancePath:instancePath+"/previous",parentData:data,parentDataProperty:"previous",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
errors = vErrors.length;
}
var _valid0 = _errs12 === errors;
valid3 = valid3 || _valid0;
const _errs13 = errors;
if(data4 !== null){
const err0 = {instancePath:instancePath+"/previous",schemaPath:"#/properties/previous/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
var _valid0 = _errs13 === errors;
valid3 = valid3 || _valid0;
if(!valid3){
const err1 = {instancePath:instancePath+"/previous",schemaPath:"#/properties/previous/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
validate78.errors = vErrors;
return false;
}
else {
errors = _errs11;
if(vErrors !== null){
if(_errs11){
vErrors.length = _errs11;
}
else {
vErrors = null;
}
}
}
var valid0 = _errs10 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.classification !== undefined && func0.call(data, "classification")){
let data5 = data.classification;
const _errs15 = errors;
if(!((((data5 === "public") || (data5 === "internal")) || (data5 === "confidential")) || (data5 === "restricted"))){
validate78.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema41.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs15 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.title !== undefined && func0.call(data, "title")){
let data6 = data.title;
const _errs17 = errors;
if(errors === _errs17){
if(typeof data6 === "string"){
if(func91(data6) > 200){
validate78.errors = [{instancePath:instancePath+"/title",schemaPath:"#/properties/title/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"}];
return false;
}
else {
if(func91(data6) < 1){
validate78.errors = [{instancePath:instancePath+"/title",schemaPath:"#/properties/title/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate78.errors = [{instancePath:instancePath+"/title",schemaPath:"#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs17 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.intent !== undefined && func0.call(data, "intent")){
let data7 = data.intent;
const _errs19 = errors;
if(errors === _errs19){
if(typeof data7 === "string"){
if(func91(data7) > 4096){
validate78.errors = [{instancePath:instancePath+"/intent",schemaPath:"#/properties/intent/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data7) < 1){
validate78.errors = [{instancePath:instancePath+"/intent",schemaPath:"#/properties/intent/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate78.errors = [{instancePath:instancePath+"/intent",schemaPath:"#/properties/intent/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs19 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.inputs !== undefined && func0.call(data, "inputs")){
const _errs21 = errors;
if(!(validate26(data.inputs, {instancePath:instancePath+"/inputs",parentData:data,parentDataProperty:"inputs",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
errors = vErrors.length;
}
var valid0 = _errs21 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.panels !== undefined && func0.call(data, "panels")){
let data9 = data.panels;
const _errs22 = errors;
if(errors === _errs22){
if(Array.isArray(data9)){
if(data9.length > 256){
validate78.errors = [{instancePath:instancePath+"/panels",schemaPath:"#/properties/panels/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data9.length < 1){
validate78.errors = [{instancePath:instancePath+"/panels",schemaPath:"#/properties/panels/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid5 = true;
const len0 = data9.length;
for(let i0=0; i0<len0; i0++){
const _errs24 = errors;
if(!(validate44(data9[i0], {instancePath:instancePath+"/panels/" + i0,parentData:data9,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate44.errors : vErrors.concat(validate44.errors);
errors = vErrors.length;
}
var valid5 = _errs24 === errors;
if(!valid5){
break;
}
}
}
}
}
else {
validate78.errors = [{instancePath:instancePath+"/panels",schemaPath:"#/properties/panels/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs22 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.renditions !== undefined && func0.call(data, "renditions")){
let data11 = data.renditions;
const _errs25 = errors;
if(errors === _errs25){
if(Array.isArray(data11)){
if(data11.length > 32){
validate78.errors = [{instancePath:instancePath+"/renditions",schemaPath:"#/properties/renditions/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"}];
return false;
}
else {
if(data11.length < 1){
validate78.errors = [{instancePath:instancePath+"/renditions",schemaPath:"#/properties/renditions/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid6 = true;
const len1 = data11.length;
for(let i1=0; i1<len1; i1++){
const _errs27 = errors;
if(!(validate46(data11[i1], {instancePath:instancePath+"/renditions/" + i1,parentData:data11,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate46.errors : vErrors.concat(validate46.errors);
errors = vErrors.length;
}
var valid6 = _errs27 === errors;
if(!valid6){
break;
}
}
}
}
}
else {
validate78.errors = [{instancePath:instancePath+"/renditions",schemaPath:"#/properties/renditions/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs25 === errors;
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
validate78.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate78.errors = vErrors;
return errors === 0;
}
validate78.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const result = validate83;
const schema69 = {"type":"object","additionalProperties":false,"required":["kind","spec_version","result_id","attempt_id","production","classification","inputs","status","outputs","gates","execution","diagnostics"],"properties":{"kind":{"const":"comic-build-result"},"spec_version":{"const":"1.0.0"},"result_id":{"$ref":"#/$defs/uuid"},"attempt_id":{"$ref":"#/$defs/uuid"},"production":{"$ref":"#/$defs/productionRef"},"classification":{"$ref":"#/$defs/classification"},"inputs":{"$ref":"#/$defs/inputs"},"status":{"enum":["complete","partial","failed"]},"outputs":{"type":"array","items":{"$ref":"#/$defs/buildOutput"},"minItems":0,"maxItems":32},"gates":{"type":"array","items":{"$ref":"#/$defs/gate"},"minItems":0,"maxItems":9},"execution":{"$ref":"#/$defs/execution"},"diagnostics":{"type":"array","items":{"enum":["INPUT_MISMATCH","OUTPUT_MISSING","OUTPUT_INTEGRITY","AUTHORITY_DENIED","VALIDATION_FAILED","CANCELLED"]},"minItems":0,"maxItems":32}},"allOf":[{"if":{"properties":{"status":{"const":"complete"}}},"then":{"properties":{"outputs":{"minItems":1},"diagnostics":{"maxItems":0}}},"else":{"properties":{"diagnostics":{"minItems":1}}}}]};
const schema73 = {"type":"object","additionalProperties":false,"required":["rendition_id","artifact","dimensions","rights_notice","alt_text","transcript"],"properties":{"rendition_id":{"$ref":"#/$defs/name"},"artifact":{"type":"object","additionalProperties":false,"required":["artifact_uri","media_type","byte_size","sha256"],"properties":{"artifact_uri":{"oneOf":[{"$ref":"#/$defs/uri"},{"$ref":"#/$defs/uuid"}]},"media_type":{"type":"string","minLength":1,"maxLength":128},"byte_size":{"$ref":"#/$defs/size"},"sha256":{"$ref":"#/$defs/digest"}}},"dimensions":{"$ref":"#/$defs/dimensions"},"rights_notice":{"type":"string","minLength":1,"maxLength":4096},"alt_text":{"type":"string","minLength":1,"maxLength":4096},"transcript":{"type":"string","minLength":1,"maxLength":32768}}};

function validate52(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate52.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((((data.rendition_id === undefined) || (!(func0.call(data, "rendition_id")))) && (missing0 = "rendition_id")) || (((data.artifact === undefined) || (!(func0.call(data, "artifact")))) && (missing0 = "artifact"))) || (((data.dimensions === undefined) || (!(func0.call(data, "dimensions")))) && (missing0 = "dimensions"))) || (((data.rights_notice === undefined) || (!(func0.call(data, "rights_notice")))) && (missing0 = "rights_notice"))) || (((data.alt_text === undefined) || (!(func0.call(data, "alt_text")))) && (missing0 = "alt_text"))) || (((data.transcript === undefined) || (!(func0.call(data, "transcript")))) && (missing0 = "transcript"))){
validate52.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!((((((key0 === "rendition_id") || (key0 === "artifact")) || (key0 === "dimensions")) || (key0 === "rights_notice")) || (key0 === "alt_text")) || (key0 === "transcript"))){
validate52.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.rendition_id !== undefined && func0.call(data, "rendition_id")){
let data0 = data.rendition_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern12.test(data0)){
validate52.errors = [{instancePath:instancePath+"/rendition_id",schemaPath:"#/$defs/name/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9-]{0,63}$"+"\""}];
return false;
}
}
else {
validate52.errors = [{instancePath:instancePath+"/rendition_id",schemaPath:"#/$defs/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.artifact !== undefined && func0.call(data, "artifact")){
let data1 = data.artifact;
const _errs5 = errors;
if(errors === _errs5){
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing1;
if((((((data1.artifact_uri === undefined) || (!(func0.call(data1, "artifact_uri")))) && (missing1 = "artifact_uri")) || (((data1.media_type === undefined) || (!(func0.call(data1, "media_type")))) && (missing1 = "media_type"))) || (((data1.byte_size === undefined) || (!(func0.call(data1, "byte_size")))) && (missing1 = "byte_size"))) || (((data1.sha256 === undefined) || (!(func0.call(data1, "sha256")))) && (missing1 = "sha256"))){
validate52.errors = [{instancePath:instancePath+"/artifact",schemaPath:"#/properties/artifact/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"}];
return false;
}
else {
const _errs7 = errors;
for(const key1 of Object.keys(data1)){
if(!((((key1 === "artifact_uri") || (key1 === "media_type")) || (key1 === "byte_size")) || (key1 === "sha256"))){
validate52.errors = [{instancePath:instancePath+"/artifact",schemaPath:"#/properties/artifact/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs7 === errors){
if(data1.artifact_uri !== undefined && func0.call(data1, "artifact_uri")){
let data2 = data1.artifact_uri;
const _errs8 = errors;
const _errs9 = errors;
let valid3 = false;
let passing0 = null;
const _errs10 = errors;
const _errs11 = errors;
if(errors === _errs11){
if(errors === _errs11){
if(typeof data2 === "string"){
if(func91(data2) > 2048){
const err0 = {instancePath:instancePath+"/artifact/artifact_uri",schemaPath:"#/$defs/uri/maxLength",keyword:"maxLength",params:{limit: 2048},message:"must NOT have more than 2048 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
if(!pattern10.test(data2)){
const err1 = {instancePath:instancePath+"/artifact/artifact_uri",schemaPath:"#/$defs/uri/pattern",keyword:"pattern",params:{pattern: "^https://"},message:"must match pattern \""+"^https://"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
else {
if(!(formats0(data2))){
const err2 = {instancePath:instancePath+"/artifact/artifact_uri",schemaPath:"#/$defs/uri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
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
else {
const err3 = {instancePath:instancePath+"/artifact/artifact_uri",schemaPath:"#/$defs/uri/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
var _valid0 = _errs10 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs13 = errors;
const _errs14 = errors;
if(errors === _errs14){
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
const err4 = {instancePath:instancePath+"/artifact/artifact_uri",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
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
const err5 = {instancePath:instancePath+"/artifact/artifact_uri",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
var _valid0 = _errs13 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
}
}
if(!valid3){
const err6 = {instancePath:instancePath+"/artifact/artifact_uri",schemaPath:"#/properties/artifact/properties/artifact_uri/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
validate52.errors = vErrors;
return false;
}
else {
errors = _errs9;
if(vErrors !== null){
if(_errs9){
vErrors.length = _errs9;
}
else {
vErrors = null;
}
}
}
var valid2 = _errs8 === errors;
}
else {
var valid2 = true;
}
if(valid2){
if(data1.media_type !== undefined && func0.call(data1, "media_type")){
let data3 = data1.media_type;
const _errs16 = errors;
if(errors === _errs16){
if(typeof data3 === "string"){
if(func91(data3) > 128){
validate52.errors = [{instancePath:instancePath+"/artifact/media_type",schemaPath:"#/properties/artifact/properties/media_type/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"}];
return false;
}
else {
if(func91(data3) < 1){
validate52.errors = [{instancePath:instancePath+"/artifact/media_type",schemaPath:"#/properties/artifact/properties/media_type/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate52.errors = [{instancePath:instancePath+"/artifact/media_type",schemaPath:"#/properties/artifact/properties/media_type/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid2 = _errs16 === errors;
}
else {
var valid2 = true;
}
if(valid2){
if(data1.byte_size !== undefined && func0.call(data1, "byte_size")){
let data4 = data1.byte_size;
const _errs18 = errors;
const _errs19 = errors;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
validate52.errors = [{instancePath:instancePath+"/artifact/byte_size",schemaPath:"#/$defs/size/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs19){
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 9007199254740991 || isNaN(data4)){
validate52.errors = [{instancePath:instancePath+"/artifact/byte_size",schemaPath:"#/$defs/size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"}];
return false;
}
else {
if(data4 < 0 || isNaN(data4)){
validate52.errors = [{instancePath:instancePath+"/artifact/byte_size",schemaPath:"#/$defs/size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"}];
return false;
}
}
}
}
var valid2 = _errs18 === errors;
}
else {
var valid2 = true;
}
if(valid2){
if(data1.sha256 !== undefined && func0.call(data1, "sha256")){
let data5 = data1.sha256;
const _errs21 = errors;
const _errs22 = errors;
if(errors === _errs22){
if(typeof data5 === "string"){
if(!pattern6.test(data5)){
validate52.errors = [{instancePath:instancePath+"/artifact/sha256",schemaPath:"#/$defs/digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""}];
return false;
}
}
else {
validate52.errors = [{instancePath:instancePath+"/artifact/sha256",schemaPath:"#/$defs/digest/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid2 = _errs21 === errors;
}
else {
var valid2 = true;
}
}
}
}
}
}
}
else {
validate52.errors = [{instancePath:instancePath+"/artifact",schemaPath:"#/properties/artifact/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.dimensions !== undefined && func0.call(data, "dimensions")){
let data6 = data.dimensions;
const _errs24 = errors;
const _errs26 = errors;
let valid9 = false;
const _errs27 = errors;
if(errors === _errs27){
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
let missing2;
if((((data6.width === undefined) || (!(func0.call(data6, "width")))) && (missing2 = "width")) || (((data6.height === undefined) || (!(func0.call(data6, "height")))) && (missing2 = "height"))){
const err7 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf/0/required",keyword:"required",params:{missingProperty: missing2},message:"must have required property '"+missing2+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
else {
const _errs29 = errors;
for(const key2 of Object.keys(data6)){
if(!((key2 === "width") || (key2 === "height"))){
const err8 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
break;
}
}
if(_errs29 === errors){
if(data6.width !== undefined && func0.call(data6, "width")){
let data7 = data6.width;
const _errs30 = errors;
if(!(((typeof data7 == "number") && (!(data7 % 1) && !isNaN(data7))) && (isFinite(data7)))){
const err9 = {instancePath:instancePath+"/dimensions/width",schemaPath:"#/$defs/dimensions/anyOf/0/properties/width/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(errors === _errs30){
if((typeof data7 == "number") && (isFinite(data7))){
if(data7 > 32768 || isNaN(data7)){
const err10 = {instancePath:instancePath+"/dimensions/width",schemaPath:"#/$defs/dimensions/anyOf/0/properties/width/maximum",keyword:"maximum",params:{comparison: "<=", limit: 32768},message:"must be <= 32768"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
else {
if(data7 < 1 || isNaN(data7)){
const err11 = {instancePath:instancePath+"/dimensions/width",schemaPath:"#/$defs/dimensions/anyOf/0/properties/width/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
var valid10 = _errs30 === errors;
}
else {
var valid10 = true;
}
if(valid10){
if(data6.height !== undefined && func0.call(data6, "height")){
let data8 = data6.height;
const _errs32 = errors;
if(!(((typeof data8 == "number") && (!(data8 % 1) && !isNaN(data8))) && (isFinite(data8)))){
const err12 = {instancePath:instancePath+"/dimensions/height",schemaPath:"#/$defs/dimensions/anyOf/0/properties/height/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(errors === _errs32){
if((typeof data8 == "number") && (isFinite(data8))){
if(data8 > 32768 || isNaN(data8)){
const err13 = {instancePath:instancePath+"/dimensions/height",schemaPath:"#/$defs/dimensions/anyOf/0/properties/height/maximum",keyword:"maximum",params:{comparison: "<=", limit: 32768},message:"must be <= 32768"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
else {
if(data8 < 1 || isNaN(data8)){
const err14 = {instancePath:instancePath+"/dimensions/height",schemaPath:"#/$defs/dimensions/anyOf/0/properties/height/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
}
var valid10 = _errs32 === errors;
}
else {
var valid10 = true;
}
}
}
}
}
else {
const err15 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
var _valid1 = _errs27 === errors;
valid9 = valid9 || _valid1;
const _errs34 = errors;
if(data6 !== null){
const err16 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
var _valid1 = _errs34 === errors;
valid9 = valid9 || _valid1;
if(!valid9){
const err17 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
validate52.errors = vErrors;
return false;
}
else {
errors = _errs26;
if(vErrors !== null){
if(_errs26){
vErrors.length = _errs26;
}
else {
vErrors = null;
}
}
}
var valid0 = _errs24 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.rights_notice !== undefined && func0.call(data, "rights_notice")){
let data9 = data.rights_notice;
const _errs36 = errors;
if(errors === _errs36){
if(typeof data9 === "string"){
if(func91(data9) > 4096){
validate52.errors = [{instancePath:instancePath+"/rights_notice",schemaPath:"#/properties/rights_notice/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data9) < 1){
validate52.errors = [{instancePath:instancePath+"/rights_notice",schemaPath:"#/properties/rights_notice/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate52.errors = [{instancePath:instancePath+"/rights_notice",schemaPath:"#/properties/rights_notice/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs36 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.alt_text !== undefined && func0.call(data, "alt_text")){
let data10 = data.alt_text;
const _errs38 = errors;
if(errors === _errs38){
if(typeof data10 === "string"){
if(func91(data10) > 4096){
validate52.errors = [{instancePath:instancePath+"/alt_text",schemaPath:"#/properties/alt_text/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data10) < 1){
validate52.errors = [{instancePath:instancePath+"/alt_text",schemaPath:"#/properties/alt_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate52.errors = [{instancePath:instancePath+"/alt_text",schemaPath:"#/properties/alt_text/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs38 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.transcript !== undefined && func0.call(data, "transcript")){
let data11 = data.transcript;
const _errs40 = errors;
if(errors === _errs40){
if(typeof data11 === "string"){
if(func91(data11) > 32768){
validate52.errors = [{instancePath:instancePath+"/transcript",schemaPath:"#/properties/transcript/maxLength",keyword:"maxLength",params:{limit: 32768},message:"must NOT have more than 32768 characters"}];
return false;
}
else {
if(func91(data11) < 1){
validate52.errors = [{instancePath:instancePath+"/transcript",schemaPath:"#/properties/transcript/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate52.errors = [{instancePath:instancePath+"/transcript",schemaPath:"#/properties/transcript/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs40 === errors;
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
validate52.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate52.errors = vErrors;
return errors === 0;
}
validate52.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema80 = {"type":"object","additionalProperties":false,"required":["gate","disposition","evidence_reference","rationale"],"properties":{"gate":{"enum":["editorial","canon-continuity","visual-text","integrity","provenance","security-privacy","rights","accessibility","packaging"]},"disposition":{"enum":["pass","fail","inconclusive","not-run","not-applicable"]},"evidence_reference":{"$ref":"#/$defs/uuid"},"rationale":{"type":"string","minLength":1,"maxLength":4096}}};

function validate54(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate54.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((data.gate === undefined) || (!(func0.call(data, "gate")))) && (missing0 = "gate")) || (((data.disposition === undefined) || (!(func0.call(data, "disposition")))) && (missing0 = "disposition"))) || (((data.evidence_reference === undefined) || (!(func0.call(data, "evidence_reference")))) && (missing0 = "evidence_reference"))) || (((data.rationale === undefined) || (!(func0.call(data, "rationale")))) && (missing0 = "rationale"))){
validate54.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!((((key0 === "gate") || (key0 === "disposition")) || (key0 === "evidence_reference")) || (key0 === "rationale"))){
validate54.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.gate !== undefined && func0.call(data, "gate")){
let data0 = data.gate;
const _errs2 = errors;
if(!(((((((((data0 === "editorial") || (data0 === "canon-continuity")) || (data0 === "visual-text")) || (data0 === "integrity")) || (data0 === "provenance")) || (data0 === "security-privacy")) || (data0 === "rights")) || (data0 === "accessibility")) || (data0 === "packaging"))){
validate54.errors = [{instancePath:instancePath+"/gate",schemaPath:"#/properties/gate/enum",keyword:"enum",params:{allowedValues: schema80.properties.gate.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.disposition !== undefined && func0.call(data, "disposition")){
let data1 = data.disposition;
const _errs3 = errors;
if(!(((((data1 === "pass") || (data1 === "fail")) || (data1 === "inconclusive")) || (data1 === "not-run")) || (data1 === "not-applicable"))){
validate54.errors = [{instancePath:instancePath+"/disposition",schemaPath:"#/properties/disposition/enum",keyword:"enum",params:{allowedValues: schema80.properties.disposition.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.evidence_reference !== undefined && func0.call(data, "evidence_reference")){
let data2 = data.evidence_reference;
const _errs4 = errors;
const _errs5 = errors;
if(errors === _errs5){
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
validate54.errors = [{instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate54.errors = [{instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs4 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.rationale !== undefined && func0.call(data, "rationale")){
let data3 = data.rationale;
const _errs7 = errors;
if(errors === _errs7){
if(typeof data3 === "string"){
if(func91(data3) > 4096){
validate54.errors = [{instancePath:instancePath+"/rationale",schemaPath:"#/properties/rationale/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data3) < 1){
validate54.errors = [{instancePath:instancePath+"/rationale",schemaPath:"#/properties/rationale/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate54.errors = [{instancePath:instancePath+"/rationale",schemaPath:"#/properties/rationale/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs7 === errors;
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
validate54.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate54.errors = vErrors;
return errors === 0;
}
validate54.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema82 = {"type":"object","additionalProperties":false,"required":["tool","workflow_id","run_uri","started_at","finished_at","transformations","generation","reproducibility","limitations"],"properties":{"tool":{"$ref":"#/$defs/dependency"},"workflow_id":{"type":"string","minLength":1,"maxLength":200},"run_uri":{"anyOf":[{"$ref":"#/$defs/uri"},{"type":"null"}]},"started_at":{"$ref":"#/$defs/time"},"finished_at":{"$ref":"#/$defs/time"},"transformations":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["step_id","input_digests","output_digests","private_inputs_withheld","private_outputs_withheld"],"properties":{"step_id":{"$ref":"#/$defs/name"},"input_digests":{"type":"array","items":{"$ref":"#/$defs/digest"},"minItems":0,"maxItems":256},"output_digests":{"type":"array","items":{"$ref":"#/$defs/digest"},"minItems":0,"maxItems":256},"private_inputs_withheld":{"type":"boolean"},"private_outputs_withheld":{"type":"boolean"}}},"minItems":1,"maxItems":256},"generation":{"type":"array","items":{"$ref":"#/$defs/generation"},"minItems":0,"maxItems":256},"reproducibility":{"enum":["exact","partial","audit-only"]},"limitations":{"type":"string","minLength":1,"maxLength":4096}}};
const schema84 = {"type":"string","format":"date-time","pattern":"Z$","maxLength":32};
const schema89 = {"type":"object","additionalProperties":false,"required":["provider","model","parameters","evidence_state","limitations"],"properties":{"provider":{"type":"string","minLength":1,"maxLength":128},"model":{"type":"string","minLength":1,"maxLength":128},"parameters":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["name","value"],"properties":{"name":{"$ref":"#/$defs/name"},"value":{"type":"string","minLength":1,"maxLength":1024}}},"minItems":0,"maxItems":256},"evidence_state":{"enum":["recorded","unavailable","withheld"]},"limitations":{"type":"string","minLength":1,"maxLength":4096}}};

function validate58(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate58.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((((data.provider === undefined) || (!(func0.call(data, "provider")))) && (missing0 = "provider")) || (((data.model === undefined) || (!(func0.call(data, "model")))) && (missing0 = "model"))) || (((data.parameters === undefined) || (!(func0.call(data, "parameters")))) && (missing0 = "parameters"))) || (((data.evidence_state === undefined) || (!(func0.call(data, "evidence_state")))) && (missing0 = "evidence_state"))) || (((data.limitations === undefined) || (!(func0.call(data, "limitations")))) && (missing0 = "limitations"))){
validate58.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!(((((key0 === "provider") || (key0 === "model")) || (key0 === "parameters")) || (key0 === "evidence_state")) || (key0 === "limitations"))){
validate58.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.provider !== undefined && func0.call(data, "provider")){
let data0 = data.provider;
const _errs2 = errors;
if(errors === _errs2){
if(typeof data0 === "string"){
if(func91(data0) > 128){
validate58.errors = [{instancePath:instancePath+"/provider",schemaPath:"#/properties/provider/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"}];
return false;
}
else {
if(func91(data0) < 1){
validate58.errors = [{instancePath:instancePath+"/provider",schemaPath:"#/properties/provider/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate58.errors = [{instancePath:instancePath+"/provider",schemaPath:"#/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.model !== undefined && func0.call(data, "model")){
let data1 = data.model;
const _errs4 = errors;
if(errors === _errs4){
if(typeof data1 === "string"){
if(func91(data1) > 128){
validate58.errors = [{instancePath:instancePath+"/model",schemaPath:"#/properties/model/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"}];
return false;
}
else {
if(func91(data1) < 1){
validate58.errors = [{instancePath:instancePath+"/model",schemaPath:"#/properties/model/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate58.errors = [{instancePath:instancePath+"/model",schemaPath:"#/properties/model/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs4 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.parameters !== undefined && func0.call(data, "parameters")){
let data2 = data.parameters;
const _errs6 = errors;
if(errors === _errs6){
if(Array.isArray(data2)){
if(data2.length > 256){
validate58.errors = [{instancePath:instancePath+"/parameters",schemaPath:"#/properties/parameters/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data2.length < 0){
validate58.errors = [{instancePath:instancePath+"/parameters",schemaPath:"#/properties/parameters/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid1 = true;
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
const _errs8 = errors;
if(errors === _errs8){
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
let missing1;
if((((data3.name === undefined) || (!(func0.call(data3, "name")))) && (missing1 = "name")) || (((data3.value === undefined) || (!(func0.call(data3, "value")))) && (missing1 = "value"))){
validate58.errors = [{instancePath:instancePath+"/parameters/" + i0,schemaPath:"#/properties/parameters/items/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"}];
return false;
}
else {
const _errs10 = errors;
for(const key1 of Object.keys(data3)){
if(!((key1 === "name") || (key1 === "value"))){
validate58.errors = [{instancePath:instancePath+"/parameters/" + i0,schemaPath:"#/properties/parameters/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs10 === errors){
if(data3.name !== undefined && func0.call(data3, "name")){
let data4 = data3.name;
const _errs11 = errors;
const _errs12 = errors;
if(errors === _errs12){
if(typeof data4 === "string"){
if(!pattern12.test(data4)){
validate58.errors = [{instancePath:instancePath+"/parameters/" + i0+"/name",schemaPath:"#/$defs/name/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9-]{0,63}$"+"\""}];
return false;
}
}
else {
validate58.errors = [{instancePath:instancePath+"/parameters/" + i0+"/name",schemaPath:"#/$defs/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid2 = _errs11 === errors;
}
else {
var valid2 = true;
}
if(valid2){
if(data3.value !== undefined && func0.call(data3, "value")){
let data5 = data3.value;
const _errs14 = errors;
if(errors === _errs14){
if(typeof data5 === "string"){
if(func91(data5) > 1024){
validate58.errors = [{instancePath:instancePath+"/parameters/" + i0+"/value",schemaPath:"#/properties/parameters/items/properties/value/maxLength",keyword:"maxLength",params:{limit: 1024},message:"must NOT have more than 1024 characters"}];
return false;
}
else {
if(func91(data5) < 1){
validate58.errors = [{instancePath:instancePath+"/parameters/" + i0+"/value",schemaPath:"#/properties/parameters/items/properties/value/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate58.errors = [{instancePath:instancePath+"/parameters/" + i0+"/value",schemaPath:"#/properties/parameters/items/properties/value/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid2 = _errs14 === errors;
}
else {
var valid2 = true;
}
}
}
}
}
else {
validate58.errors = [{instancePath:instancePath+"/parameters/" + i0,schemaPath:"#/properties/parameters/items/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
var valid1 = _errs8 === errors;
if(!valid1){
break;
}
}
}
}
}
else {
validate58.errors = [{instancePath:instancePath+"/parameters",schemaPath:"#/properties/parameters/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs6 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.evidence_state !== undefined && func0.call(data, "evidence_state")){
let data6 = data.evidence_state;
const _errs16 = errors;
if(!(((data6 === "recorded") || (data6 === "unavailable")) || (data6 === "withheld"))){
validate58.errors = [{instancePath:instancePath+"/evidence_state",schemaPath:"#/properties/evidence_state/enum",keyword:"enum",params:{allowedValues: schema89.properties.evidence_state.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs16 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.limitations !== undefined && func0.call(data, "limitations")){
let data7 = data.limitations;
const _errs17 = errors;
if(errors === _errs17){
if(typeof data7 === "string"){
if(func91(data7) > 4096){
validate58.errors = [{instancePath:instancePath+"/limitations",schemaPath:"#/properties/limitations/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data7) < 1){
validate58.errors = [{instancePath:instancePath+"/limitations",schemaPath:"#/properties/limitations/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate58.errors = [{instancePath:instancePath+"/limitations",schemaPath:"#/properties/limitations/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs17 === errors;
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
else {
validate58.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate58.errors = vErrors;
return errors === 0;
}
validate58.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const formats6 = require("ajv-formats/dist/formats").fullFormats["date-time"];
const pattern33 = new RegExp("Z$", "u");

function validate56(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate56.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((((((((data.tool === undefined) || (!(func0.call(data, "tool")))) && (missing0 = "tool")) || (((data.workflow_id === undefined) || (!(func0.call(data, "workflow_id")))) && (missing0 = "workflow_id"))) || (((data.run_uri === undefined) || (!(func0.call(data, "run_uri")))) && (missing0 = "run_uri"))) || (((data.started_at === undefined) || (!(func0.call(data, "started_at")))) && (missing0 = "started_at"))) || (((data.finished_at === undefined) || (!(func0.call(data, "finished_at")))) && (missing0 = "finished_at"))) || (((data.transformations === undefined) || (!(func0.call(data, "transformations")))) && (missing0 = "transformations"))) || (((data.generation === undefined) || (!(func0.call(data, "generation")))) && (missing0 = "generation"))) || (((data.reproducibility === undefined) || (!(func0.call(data, "reproducibility")))) && (missing0 = "reproducibility"))) || (((data.limitations === undefined) || (!(func0.call(data, "limitations")))) && (missing0 = "limitations"))){
validate56.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!(func0.call(schema82.properties, key0))){
validate56.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.tool !== undefined && func0.call(data, "tool")){
const _errs2 = errors;
if(!(validate27(data.tool, {instancePath:instancePath+"/tool",parentData:data,parentDataProperty:"tool",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
errors = vErrors.length;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.workflow_id !== undefined && func0.call(data, "workflow_id")){
let data1 = data.workflow_id;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data1 === "string"){
if(func91(data1) > 200){
validate56.errors = [{instancePath:instancePath+"/workflow_id",schemaPath:"#/properties/workflow_id/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"}];
return false;
}
else {
if(func91(data1) < 1){
validate56.errors = [{instancePath:instancePath+"/workflow_id",schemaPath:"#/properties/workflow_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate56.errors = [{instancePath:instancePath+"/workflow_id",schemaPath:"#/properties/workflow_id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.run_uri !== undefined && func0.call(data, "run_uri")){
let data2 = data.run_uri;
const _errs5 = errors;
const _errs6 = errors;
let valid1 = false;
const _errs7 = errors;
const _errs8 = errors;
if(errors === _errs8){
if(errors === _errs8){
if(typeof data2 === "string"){
if(func91(data2) > 2048){
const err0 = {instancePath:instancePath+"/run_uri",schemaPath:"#/$defs/uri/maxLength",keyword:"maxLength",params:{limit: 2048},message:"must NOT have more than 2048 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
if(!pattern10.test(data2)){
const err1 = {instancePath:instancePath+"/run_uri",schemaPath:"#/$defs/uri/pattern",keyword:"pattern",params:{pattern: "^https://"},message:"must match pattern \""+"^https://"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
else {
if(!(formats0(data2))){
const err2 = {instancePath:instancePath+"/run_uri",schemaPath:"#/$defs/uri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
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
else {
const err3 = {instancePath:instancePath+"/run_uri",schemaPath:"#/$defs/uri/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
valid1 = valid1 || _valid0;
const _errs10 = errors;
if(data2 !== null){
const err4 = {instancePath:instancePath+"/run_uri",schemaPath:"#/properties/run_uri/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
var _valid0 = _errs10 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err5 = {instancePath:instancePath+"/run_uri",schemaPath:"#/properties/run_uri/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
validate56.errors = vErrors;
return false;
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
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.started_at !== undefined && func0.call(data, "started_at")){
let data3 = data.started_at;
const _errs12 = errors;
const _errs13 = errors;
if(errors === _errs13){
if(errors === _errs13){
if(typeof data3 === "string"){
if(func91(data3) > 32){
validate56.errors = [{instancePath:instancePath+"/started_at",schemaPath:"#/$defs/time/maxLength",keyword:"maxLength",params:{limit: 32},message:"must NOT have more than 32 characters"}];
return false;
}
else {
if(!pattern33.test(data3)){
validate56.errors = [{instancePath:instancePath+"/started_at",schemaPath:"#/$defs/time/pattern",keyword:"pattern",params:{pattern: "Z$"},message:"must match pattern \""+"Z$"+"\""}];
return false;
}
else {
if(!(formats6.validate(data3))){
validate56.errors = [{instancePath:instancePath+"/started_at",schemaPath:"#/$defs/time/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
}
}
else {
validate56.errors = [{instancePath:instancePath+"/started_at",schemaPath:"#/$defs/time/type",keyword:"type",params:{type: "string"},message:"must be string"}];
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
if(data.finished_at !== undefined && func0.call(data, "finished_at")){
let data4 = data.finished_at;
const _errs15 = errors;
const _errs16 = errors;
if(errors === _errs16){
if(errors === _errs16){
if(typeof data4 === "string"){
if(func91(data4) > 32){
validate56.errors = [{instancePath:instancePath+"/finished_at",schemaPath:"#/$defs/time/maxLength",keyword:"maxLength",params:{limit: 32},message:"must NOT have more than 32 characters"}];
return false;
}
else {
if(!pattern33.test(data4)){
validate56.errors = [{instancePath:instancePath+"/finished_at",schemaPath:"#/$defs/time/pattern",keyword:"pattern",params:{pattern: "Z$"},message:"must match pattern \""+"Z$"+"\""}];
return false;
}
else {
if(!(formats6.validate(data4))){
validate56.errors = [{instancePath:instancePath+"/finished_at",schemaPath:"#/$defs/time/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
}
}
else {
validate56.errors = [{instancePath:instancePath+"/finished_at",schemaPath:"#/$defs/time/type",keyword:"type",params:{type: "string"},message:"must be string"}];
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
if(data.transformations !== undefined && func0.call(data, "transformations")){
let data5 = data.transformations;
const _errs18 = errors;
if(errors === _errs18){
if(Array.isArray(data5)){
if(data5.length > 256){
validate56.errors = [{instancePath:instancePath+"/transformations",schemaPath:"#/properties/transformations/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data5.length < 1){
validate56.errors = [{instancePath:instancePath+"/transformations",schemaPath:"#/properties/transformations/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid5 = true;
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
let data6 = data5[i0];
const _errs20 = errors;
if(errors === _errs20){
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
let missing1;
if(((((((data6.step_id === undefined) || (!(func0.call(data6, "step_id")))) && (missing1 = "step_id")) || (((data6.input_digests === undefined) || (!(func0.call(data6, "input_digests")))) && (missing1 = "input_digests"))) || (((data6.output_digests === undefined) || (!(func0.call(data6, "output_digests")))) && (missing1 = "output_digests"))) || (((data6.private_inputs_withheld === undefined) || (!(func0.call(data6, "private_inputs_withheld")))) && (missing1 = "private_inputs_withheld"))) || (((data6.private_outputs_withheld === undefined) || (!(func0.call(data6, "private_outputs_withheld")))) && (missing1 = "private_outputs_withheld"))){
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0,schemaPath:"#/properties/transformations/items/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"}];
return false;
}
else {
const _errs22 = errors;
for(const key1 of Object.keys(data6)){
if(!(((((key1 === "step_id") || (key1 === "input_digests")) || (key1 === "output_digests")) || (key1 === "private_inputs_withheld")) || (key1 === "private_outputs_withheld"))){
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0,schemaPath:"#/properties/transformations/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs22 === errors){
if(data6.step_id !== undefined && func0.call(data6, "step_id")){
let data7 = data6.step_id;
const _errs23 = errors;
const _errs24 = errors;
if(errors === _errs24){
if(typeof data7 === "string"){
if(!pattern12.test(data7)){
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/step_id",schemaPath:"#/$defs/name/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9-]{0,63}$"+"\""}];
return false;
}
}
else {
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/step_id",schemaPath:"#/$defs/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid6 = _errs23 === errors;
}
else {
var valid6 = true;
}
if(valid6){
if(data6.input_digests !== undefined && func0.call(data6, "input_digests")){
let data8 = data6.input_digests;
const _errs26 = errors;
if(errors === _errs26){
if(Array.isArray(data8)){
if(data8.length > 256){
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/input_digests",schemaPath:"#/properties/transformations/items/properties/input_digests/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data8.length < 0){
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/input_digests",schemaPath:"#/properties/transformations/items/properties/input_digests/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid8 = true;
const len1 = data8.length;
for(let i1=0; i1<len1; i1++){
let data9 = data8[i1];
const _errs28 = errors;
const _errs29 = errors;
if(errors === _errs29){
if(typeof data9 === "string"){
if(!pattern6.test(data9)){
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/input_digests/" + i1,schemaPath:"#/$defs/digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""}];
return false;
}
}
else {
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/input_digests/" + i1,schemaPath:"#/$defs/digest/type",keyword:"type",params:{type: "string"},message:"must be string"}];
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
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/input_digests",schemaPath:"#/properties/transformations/items/properties/input_digests/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid6 = _errs26 === errors;
}
else {
var valid6 = true;
}
if(valid6){
if(data6.output_digests !== undefined && func0.call(data6, "output_digests")){
let data10 = data6.output_digests;
const _errs31 = errors;
if(errors === _errs31){
if(Array.isArray(data10)){
if(data10.length > 256){
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/output_digests",schemaPath:"#/properties/transformations/items/properties/output_digests/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data10.length < 0){
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/output_digests",schemaPath:"#/properties/transformations/items/properties/output_digests/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid10 = true;
const len2 = data10.length;
for(let i2=0; i2<len2; i2++){
let data11 = data10[i2];
const _errs33 = errors;
const _errs34 = errors;
if(errors === _errs34){
if(typeof data11 === "string"){
if(!pattern6.test(data11)){
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/output_digests/" + i2,schemaPath:"#/$defs/digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""}];
return false;
}
}
else {
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/output_digests/" + i2,schemaPath:"#/$defs/digest/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid10 = _errs33 === errors;
if(!valid10){
break;
}
}
}
}
}
else {
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/output_digests",schemaPath:"#/properties/transformations/items/properties/output_digests/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid6 = _errs31 === errors;
}
else {
var valid6 = true;
}
if(valid6){
if(data6.private_inputs_withheld !== undefined && func0.call(data6, "private_inputs_withheld")){
const _errs36 = errors;
if(typeof data6.private_inputs_withheld !== "boolean"){
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/private_inputs_withheld",schemaPath:"#/properties/transformations/items/properties/private_inputs_withheld/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
return false;
}
var valid6 = _errs36 === errors;
}
else {
var valid6 = true;
}
if(valid6){
if(data6.private_outputs_withheld !== undefined && func0.call(data6, "private_outputs_withheld")){
const _errs38 = errors;
if(typeof data6.private_outputs_withheld !== "boolean"){
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0+"/private_outputs_withheld",schemaPath:"#/properties/transformations/items/properties/private_outputs_withheld/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
return false;
}
var valid6 = _errs38 === errors;
}
else {
var valid6 = true;
}
}
}
}
}
}
}
}
else {
validate56.errors = [{instancePath:instancePath+"/transformations/" + i0,schemaPath:"#/properties/transformations/items/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
var valid5 = _errs20 === errors;
if(!valid5){
break;
}
}
}
}
}
else {
validate56.errors = [{instancePath:instancePath+"/transformations",schemaPath:"#/properties/transformations/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs18 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.generation !== undefined && func0.call(data, "generation")){
let data14 = data.generation;
const _errs40 = errors;
if(errors === _errs40){
if(Array.isArray(data14)){
if(data14.length > 256){
validate56.errors = [{instancePath:instancePath+"/generation",schemaPath:"#/properties/generation/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data14.length < 0){
validate56.errors = [{instancePath:instancePath+"/generation",schemaPath:"#/properties/generation/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid12 = true;
const len3 = data14.length;
for(let i3=0; i3<len3; i3++){
const _errs42 = errors;
if(!(validate58(data14[i3], {instancePath:instancePath+"/generation/" + i3,parentData:data14,parentDataProperty:i3,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
errors = vErrors.length;
}
var valid12 = _errs42 === errors;
if(!valid12){
break;
}
}
}
}
}
else {
validate56.errors = [{instancePath:instancePath+"/generation",schemaPath:"#/properties/generation/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs40 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.reproducibility !== undefined && func0.call(data, "reproducibility")){
let data16 = data.reproducibility;
const _errs43 = errors;
if(!(((data16 === "exact") || (data16 === "partial")) || (data16 === "audit-only"))){
validate56.errors = [{instancePath:instancePath+"/reproducibility",schemaPath:"#/properties/reproducibility/enum",keyword:"enum",params:{allowedValues: schema82.properties.reproducibility.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs43 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.limitations !== undefined && func0.call(data, "limitations")){
let data17 = data.limitations;
const _errs44 = errors;
if(errors === _errs44){
if(typeof data17 === "string"){
if(func91(data17) > 4096){
validate56.errors = [{instancePath:instancePath+"/limitations",schemaPath:"#/properties/limitations/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data17) < 1){
validate56.errors = [{instancePath:instancePath+"/limitations",schemaPath:"#/properties/limitations/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate56.errors = [{instancePath:instancePath+"/limitations",schemaPath:"#/properties/limitations/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs44 === errors;
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
else {
validate56.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate56.errors = vErrors;
return errors === 0;
}
validate56.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.status !== undefined && func0.call(data, "status")){
if("complete" !== data.status){
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
if(data.outputs !== undefined && func0.call(data, "outputs")){
let data1 = data.outputs;
const _errs6 = errors;
if(Array.isArray(data1)){
if(data1.length < 1){
validate83.errors = [{instancePath:instancePath+"/outputs",schemaPath:"#/allOf/0/then/properties/outputs/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
}
var valid3 = _errs6 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data.diagnostics !== undefined && func0.call(data, "diagnostics")){
let data2 = data.diagnostics;
const _errs7 = errors;
if(Array.isArray(data2)){
if(data2.length > 0){
validate83.errors = [{instancePath:instancePath+"/diagnostics",schemaPath:"#/allOf/0/then/properties/diagnostics/maxItems",keyword:"maxItems",params:{limit: 0},message:"must NOT have more than 0 items"}];
return false;
}
}
var valid3 = _errs7 === errors;
}
else {
var valid3 = true;
}
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.outputs = true;
props0.diagnostics = true;
props0.status = true;
}
ifClause0 = "then";
}
else {
const _errs8 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.diagnostics !== undefined && func0.call(data, "diagnostics")){
let data3 = data.diagnostics;
if(Array.isArray(data3)){
if(data3.length < 1){
validate83.errors = [{instancePath:instancePath+"/diagnostics",schemaPath:"#/allOf/0/else/properties/diagnostics/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
}
}
}
var _valid0 = _errs8 === errors;
valid1 = _valid0;
if(valid1){
if(props0 !== true){
props0 = props0 || {};
props0.diagnostics = true;
}
}
ifClause0 = "else";
}
if(!valid1){
const err1 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
validate83.errors = vErrors;
return false;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((((((((((data.kind === undefined) || (!(func0.call(data, "kind")))) && (missing0 = "kind")) || (((data.spec_version === undefined) || (!(func0.call(data, "spec_version")))) && (missing0 = "spec_version"))) || (((data.result_id === undefined) || (!(func0.call(data, "result_id")))) && (missing0 = "result_id"))) || (((data.attempt_id === undefined) || (!(func0.call(data, "attempt_id")))) && (missing0 = "attempt_id"))) || (((data.production === undefined) || (!(func0.call(data, "production")))) && (missing0 = "production"))) || (((data.classification === undefined) || (!(func0.call(data, "classification")))) && (missing0 = "classification"))) || (((data.inputs === undefined) || (!(func0.call(data, "inputs")))) && (missing0 = "inputs"))) || (((data.status === undefined) || (!(func0.call(data, "status")))) && (missing0 = "status"))) || (((data.outputs === undefined) || (!(func0.call(data, "outputs")))) && (missing0 = "outputs"))) || (((data.gates === undefined) || (!(func0.call(data, "gates")))) && (missing0 = "gates"))) || (((data.execution === undefined) || (!(func0.call(data, "execution")))) && (missing0 = "execution"))) || (((data.diagnostics === undefined) || (!(func0.call(data, "diagnostics")))) && (missing0 = "diagnostics"))){
validate83.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs10 = errors;
for(const key0 of Object.keys(data)){
if(!(func0.call(schema69.properties, key0))){
validate83.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs10 === errors){
if(data.kind !== undefined && func0.call(data, "kind")){
const _errs11 = errors;
if("comic-build-result" !== data.kind){
validate83.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "comic-build-result"},message:"must be equal to constant"}];
return false;
}
var valid5 = _errs11 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.spec_version !== undefined && func0.call(data, "spec_version")){
const _errs12 = errors;
if("1.0.0" !== data.spec_version){
validate83.errors = [{instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"}];
return false;
}
var valid5 = _errs12 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.result_id !== undefined && func0.call(data, "result_id")){
let data6 = data.result_id;
const _errs13 = errors;
const _errs14 = errors;
if(errors === _errs14){
if(typeof data6 === "string"){
if(!pattern4.test(data6)){
validate83.errors = [{instancePath:instancePath+"/result_id",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate83.errors = [{instancePath:instancePath+"/result_id",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid5 = _errs13 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.attempt_id !== undefined && func0.call(data, "attempt_id")){
let data7 = data.attempt_id;
const _errs16 = errors;
const _errs17 = errors;
if(errors === _errs17){
if(typeof data7 === "string"){
if(!pattern4.test(data7)){
validate83.errors = [{instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate83.errors = [{instancePath:instancePath+"/attempt_id",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid5 = _errs16 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.production !== undefined && func0.call(data, "production")){
const _errs19 = errors;
if(!(validate22(data.production, {instancePath:instancePath+"/production",parentData:data,parentDataProperty:"production",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
errors = vErrors.length;
}
var valid5 = _errs19 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.classification !== undefined && func0.call(data, "classification")){
let data9 = data.classification;
const _errs20 = errors;
if(!((((data9 === "public") || (data9 === "internal")) || (data9 === "confidential")) || (data9 === "restricted"))){
validate83.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema41.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid5 = _errs20 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.inputs !== undefined && func0.call(data, "inputs")){
const _errs22 = errors;
if(!(validate26(data.inputs, {instancePath:instancePath+"/inputs",parentData:data,parentDataProperty:"inputs",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
errors = vErrors.length;
}
var valid5 = _errs22 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.status !== undefined && func0.call(data, "status")){
let data11 = data.status;
const _errs23 = errors;
if(!(((data11 === "complete") || (data11 === "partial")) || (data11 === "failed"))){
validate83.errors = [{instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema69.properties.status.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid5 = _errs23 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.outputs !== undefined && func0.call(data, "outputs")){
let data12 = data.outputs;
const _errs24 = errors;
if(errors === _errs24){
if(Array.isArray(data12)){
if(data12.length > 32){
validate83.errors = [{instancePath:instancePath+"/outputs",schemaPath:"#/properties/outputs/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"}];
return false;
}
else {
if(data12.length < 0){
validate83.errors = [{instancePath:instancePath+"/outputs",schemaPath:"#/properties/outputs/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid9 = true;
const len0 = data12.length;
for(let i0=0; i0<len0; i0++){
const _errs26 = errors;
if(!(validate52(data12[i0], {instancePath:instancePath+"/outputs/" + i0,parentData:data12,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
errors = vErrors.length;
}
var valid9 = _errs26 === errors;
if(!valid9){
break;
}
}
}
}
}
else {
validate83.errors = [{instancePath:instancePath+"/outputs",schemaPath:"#/properties/outputs/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid5 = _errs24 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.gates !== undefined && func0.call(data, "gates")){
let data14 = data.gates;
const _errs27 = errors;
if(errors === _errs27){
if(Array.isArray(data14)){
if(data14.length > 9){
validate83.errors = [{instancePath:instancePath+"/gates",schemaPath:"#/properties/gates/maxItems",keyword:"maxItems",params:{limit: 9},message:"must NOT have more than 9 items"}];
return false;
}
else {
if(data14.length < 0){
validate83.errors = [{instancePath:instancePath+"/gates",schemaPath:"#/properties/gates/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid10 = true;
const len1 = data14.length;
for(let i1=0; i1<len1; i1++){
const _errs29 = errors;
if(!(validate54(data14[i1], {instancePath:instancePath+"/gates/" + i1,parentData:data14,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate54.errors : vErrors.concat(validate54.errors);
errors = vErrors.length;
}
var valid10 = _errs29 === errors;
if(!valid10){
break;
}
}
}
}
}
else {
validate83.errors = [{instancePath:instancePath+"/gates",schemaPath:"#/properties/gates/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid5 = _errs27 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.execution !== undefined && func0.call(data, "execution")){
const _errs30 = errors;
if(!(validate56(data.execution, {instancePath:instancePath+"/execution",parentData:data,parentDataProperty:"execution",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
var valid5 = _errs30 === errors;
}
else {
var valid5 = true;
}
if(valid5){
if(data.diagnostics !== undefined && func0.call(data, "diagnostics")){
let data17 = data.diagnostics;
const _errs31 = errors;
if(errors === _errs31){
if(Array.isArray(data17)){
if(data17.length > 32){
validate83.errors = [{instancePath:instancePath+"/diagnostics",schemaPath:"#/properties/diagnostics/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"}];
return false;
}
else {
if(data17.length < 0){
validate83.errors = [{instancePath:instancePath+"/diagnostics",schemaPath:"#/properties/diagnostics/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid11 = true;
const len2 = data17.length;
for(let i2=0; i2<len2; i2++){
let data18 = data17[i2];
const _errs33 = errors;
if(!((((((data18 === "INPUT_MISMATCH") || (data18 === "OUTPUT_MISSING")) || (data18 === "OUTPUT_INTEGRITY")) || (data18 === "AUTHORITY_DENIED")) || (data18 === "VALIDATION_FAILED")) || (data18 === "CANCELLED"))){
validate83.errors = [{instancePath:instancePath+"/diagnostics/" + i2,schemaPath:"#/properties/diagnostics/items/enum",keyword:"enum",params:{allowedValues: schema69.properties.diagnostics.items.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid11 = _errs33 === errors;
if(!valid11){
break;
}
}
}
}
}
else {
validate83.errors = [{instancePath:instancePath+"/diagnostics",schemaPath:"#/properties/diagnostics/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid5 = _errs31 === errors;
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

export const release = validate89;
const schema91 = {"type":"object","additionalProperties":false,"required":["kind","spec_version","release_id","episode_id","revision","previous","classification","title","production_credit","canon_scope","scope","input_canon","dependencies","outputs","gates","execution","approvers","private_context"],"properties":{"kind":{"const":"comic-public-release"},"spec_version":{"const":"1.0.0"},"release_id":{"$ref":"#/$defs/uuid"},"episode_id":{"type":"string","pattern":"^DS-(?!0000)[0-9]{4}$"},"revision":{"$ref":"#/$defs/revision"},"previous":{"anyOf":[{"$ref":"#/$defs/releaseRef"},{"type":"null"}]},"classification":{"const":"public"},"title":{"type":"string","minLength":1,"maxLength":200},"production_credit":{"const":"A Definitely Secure Studio production."},"canon_scope":{"type":"string","minLength":1,"maxLength":4096},"scope":{"$ref":"#/$defs/scope"},"input_canon":{"$ref":"#/$defs/dependency"},"dependencies":{"type":"array","items":{"$ref":"#/$defs/dependency"},"minItems":1,"maxItems":256},"outputs":{"type":"array","items":{"$ref":"#/$defs/output"},"minItems":1,"maxItems":32},"gates":{"type":"array","items":{"$ref":"#/$defs/gate"},"minItems":9,"maxItems":9},"execution":{"$ref":"#/$defs/execution"},"approvers":{"type":"array","items":{"$ref":"#/$defs/approver"},"minItems":2,"maxItems":16},"private_context":{"oneOf":[{"type":"object","additionalProperties":false,"required":["influenced"],"properties":{"influenced":{"const":false}}},{"type":"object","additionalProperties":false,"required":["influenced","attestation_reference"],"properties":{"influenced":{"const":true},"attestation_reference":{"$ref":"#/$defs/uuid"}}}]}}};
const pattern40 = new RegExp("^DS-(?!0000)[0-9]{4}$", "u");
const schema94 = {"type":"object","additionalProperties":false,"required":["release_id","episode_id","revision","identity"],"properties":{"release_id":{"$ref":"#/$defs/uuid"},"episode_id":{"type":"string","pattern":"^DS-(?!0000)[0-9]{4}$"},"revision":{"$ref":"#/$defs/revision"},"identity":{"$ref":"#/$defs/identity"}}};

function validate63(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate63.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((data.release_id === undefined) || (!(func0.call(data, "release_id")))) && (missing0 = "release_id")) || (((data.episode_id === undefined) || (!(func0.call(data, "episode_id")))) && (missing0 = "episode_id"))) || (((data.revision === undefined) || (!(func0.call(data, "revision")))) && (missing0 = "revision"))) || (((data.identity === undefined) || (!(func0.call(data, "identity")))) && (missing0 = "identity"))){
validate63.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!((((key0 === "release_id") || (key0 === "episode_id")) || (key0 === "revision")) || (key0 === "identity"))){
validate63.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.release_id !== undefined && func0.call(data, "release_id")){
let data0 = data.release_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern4.test(data0)){
validate63.errors = [{instancePath:instancePath+"/release_id",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate63.errors = [{instancePath:instancePath+"/release_id",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.episode_id !== undefined && func0.call(data, "episode_id")){
let data1 = data.episode_id;
const _errs5 = errors;
if(errors === _errs5){
if(typeof data1 === "string"){
if(!pattern40.test(data1)){
validate63.errors = [{instancePath:instancePath+"/episode_id",schemaPath:"#/properties/episode_id/pattern",keyword:"pattern",params:{pattern: "^DS-(?!0000)[0-9]{4}$"},message:"must match pattern \""+"^DS-(?!0000)[0-9]{4}$"+"\""}];
return false;
}
}
else {
validate63.errors = [{instancePath:instancePath+"/episode_id",schemaPath:"#/properties/episode_id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.revision !== undefined && func0.call(data, "revision")){
let data2 = data.revision;
const _errs7 = errors;
const _errs8 = errors;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
validate63.errors = [{instancePath:instancePath+"/revision",schemaPath:"#/$defs/revision/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs8){
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 9007199254740991 || isNaN(data2)){
validate63.errors = [{instancePath:instancePath+"/revision",schemaPath:"#/$defs/revision/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"}];
return false;
}
else {
if(data2 < 1 || isNaN(data2)){
validate63.errors = [{instancePath:instancePath+"/revision",schemaPath:"#/$defs/revision/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"}];
return false;
}
}
}
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.identity !== undefined && func0.call(data, "identity")){
const _errs10 = errors;
if(!(validate23(data.identity, {instancePath:instancePath+"/identity",parentData:data,parentDataProperty:"identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
var valid0 = _errs10 === errors;
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
validate63.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate63.errors = vErrors;
return errors === 0;
}
validate63.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema97 = {"type":"object","additionalProperties":false,"required":["destination","audience","purpose","publication_time"],"properties":{"destination":{"$ref":"#/$defs/uri"},"audience":{"type":"string","minLength":1,"maxLength":200},"purpose":{"type":"string","minLength":1,"maxLength":4096},"publication_time":{"$ref":"#/$defs/time"}}};

function validate66(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate66.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((data.destination === undefined) || (!(func0.call(data, "destination")))) && (missing0 = "destination")) || (((data.audience === undefined) || (!(func0.call(data, "audience")))) && (missing0 = "audience"))) || (((data.purpose === undefined) || (!(func0.call(data, "purpose")))) && (missing0 = "purpose"))) || (((data.publication_time === undefined) || (!(func0.call(data, "publication_time")))) && (missing0 = "publication_time"))){
validate66.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!((((key0 === "destination") || (key0 === "audience")) || (key0 === "purpose")) || (key0 === "publication_time"))){
validate66.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.destination !== undefined && func0.call(data, "destination")){
let data0 = data.destination;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(errors === _errs3){
if(typeof data0 === "string"){
if(func91(data0) > 2048){
validate66.errors = [{instancePath:instancePath+"/destination",schemaPath:"#/$defs/uri/maxLength",keyword:"maxLength",params:{limit: 2048},message:"must NOT have more than 2048 characters"}];
return false;
}
else {
if(!pattern10.test(data0)){
validate66.errors = [{instancePath:instancePath+"/destination",schemaPath:"#/$defs/uri/pattern",keyword:"pattern",params:{pattern: "^https://"},message:"must match pattern \""+"^https://"+"\""}];
return false;
}
else {
if(!(formats0(data0))){
validate66.errors = [{instancePath:instancePath+"/destination",schemaPath:"#/$defs/uri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""}];
return false;
}
}
}
}
else {
validate66.errors = [{instancePath:instancePath+"/destination",schemaPath:"#/$defs/uri/type",keyword:"type",params:{type: "string"},message:"must be string"}];
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
if(data.audience !== undefined && func0.call(data, "audience")){
let data1 = data.audience;
const _errs5 = errors;
if(errors === _errs5){
if(typeof data1 === "string"){
if(func91(data1) > 200){
validate66.errors = [{instancePath:instancePath+"/audience",schemaPath:"#/properties/audience/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"}];
return false;
}
else {
if(func91(data1) < 1){
validate66.errors = [{instancePath:instancePath+"/audience",schemaPath:"#/properties/audience/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate66.errors = [{instancePath:instancePath+"/audience",schemaPath:"#/properties/audience/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.purpose !== undefined && func0.call(data, "purpose")){
let data2 = data.purpose;
const _errs7 = errors;
if(errors === _errs7){
if(typeof data2 === "string"){
if(func91(data2) > 4096){
validate66.errors = [{instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data2) < 1){
validate66.errors = [{instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate66.errors = [{instancePath:instancePath+"/purpose",schemaPath:"#/properties/purpose/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.publication_time !== undefined && func0.call(data, "publication_time")){
let data3 = data.publication_time;
const _errs9 = errors;
const _errs10 = errors;
if(errors === _errs10){
if(errors === _errs10){
if(typeof data3 === "string"){
if(func91(data3) > 32){
validate66.errors = [{instancePath:instancePath+"/publication_time",schemaPath:"#/$defs/time/maxLength",keyword:"maxLength",params:{limit: 32},message:"must NOT have more than 32 characters"}];
return false;
}
else {
if(!pattern33.test(data3)){
validate66.errors = [{instancePath:instancePath+"/publication_time",schemaPath:"#/$defs/time/pattern",keyword:"pattern",params:{pattern: "Z$"},message:"must match pattern \""+"Z$"+"\""}];
return false;
}
else {
if(!(formats6.validate(data3))){
validate66.errors = [{instancePath:instancePath+"/publication_time",schemaPath:"#/$defs/time/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
}
}
else {
validate66.errors = [{instancePath:instancePath+"/publication_time",schemaPath:"#/$defs/time/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
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
validate66.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate66.errors = vErrors;
return errors === 0;
}
validate66.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema100 = {"type":"object","additionalProperties":false,"required":["rendition_id","artifact","dimensions","rights_notice","alt_text","transcript"],"properties":{"rendition_id":{"$ref":"#/$defs/name"},"artifact":{"$ref":"#/$defs/artifact"},"dimensions":{"$ref":"#/$defs/dimensions"},"rights_notice":{"type":"string","minLength":1,"maxLength":4096},"alt_text":{"type":"string","minLength":1,"maxLength":4096},"transcript":{"type":"string","minLength":1,"maxLength":32768}}};

function validate70(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate70.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((((data.rendition_id === undefined) || (!(func0.call(data, "rendition_id")))) && (missing0 = "rendition_id")) || (((data.artifact === undefined) || (!(func0.call(data, "artifact")))) && (missing0 = "artifact"))) || (((data.dimensions === undefined) || (!(func0.call(data, "dimensions")))) && (missing0 = "dimensions"))) || (((data.rights_notice === undefined) || (!(func0.call(data, "rights_notice")))) && (missing0 = "rights_notice"))) || (((data.alt_text === undefined) || (!(func0.call(data, "alt_text")))) && (missing0 = "alt_text"))) || (((data.transcript === undefined) || (!(func0.call(data, "transcript")))) && (missing0 = "transcript"))){
validate70.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!((((((key0 === "rendition_id") || (key0 === "artifact")) || (key0 === "dimensions")) || (key0 === "rights_notice")) || (key0 === "alt_text")) || (key0 === "transcript"))){
validate70.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.rendition_id !== undefined && func0.call(data, "rendition_id")){
let data0 = data.rendition_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern12.test(data0)){
validate70.errors = [{instancePath:instancePath+"/rendition_id",schemaPath:"#/$defs/name/pattern",keyword:"pattern",params:{pattern: "^[a-z][a-z0-9-]{0,63}$"},message:"must match pattern \""+"^[a-z][a-z0-9-]{0,63}$"+"\""}];
return false;
}
}
else {
validate70.errors = [{instancePath:instancePath+"/rendition_id",schemaPath:"#/$defs/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.artifact !== undefined && func0.call(data, "artifact")){
const _errs5 = errors;
if(!(validate28(data.artifact, {instancePath:instancePath+"/artifact",parentData:data,parentDataProperty:"artifact",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.dimensions !== undefined && func0.call(data, "dimensions")){
let data2 = data.dimensions;
const _errs6 = errors;
const _errs8 = errors;
let valid3 = false;
const _errs9 = errors;
if(errors === _errs9){
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
let missing1;
if((((data2.width === undefined) || (!(func0.call(data2, "width")))) && (missing1 = "width")) || (((data2.height === undefined) || (!(func0.call(data2, "height")))) && (missing1 = "height"))){
const err0 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf/0/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
const _errs11 = errors;
for(const key1 of Object.keys(data2)){
if(!((key1 === "width") || (key1 === "height"))){
const err1 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
break;
}
}
if(_errs11 === errors){
if(data2.width !== undefined && func0.call(data2, "width")){
let data3 = data2.width;
const _errs12 = errors;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err2 = {instancePath:instancePath+"/dimensions/width",schemaPath:"#/$defs/dimensions/anyOf/0/properties/width/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors === _errs12){
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 32768 || isNaN(data3)){
const err3 = {instancePath:instancePath+"/dimensions/width",schemaPath:"#/$defs/dimensions/anyOf/0/properties/width/maximum",keyword:"maximum",params:{comparison: "<=", limit: 32768},message:"must be <= 32768"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
else {
if(data3 < 1 || isNaN(data3)){
const err4 = {instancePath:instancePath+"/dimensions/width",schemaPath:"#/$defs/dimensions/anyOf/0/properties/width/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
}
var valid4 = _errs12 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data2.height !== undefined && func0.call(data2, "height")){
let data4 = data2.height;
const _errs14 = errors;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
const err5 = {instancePath:instancePath+"/dimensions/height",schemaPath:"#/$defs/dimensions/anyOf/0/properties/height/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors === _errs14){
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 32768 || isNaN(data4)){
const err6 = {instancePath:instancePath+"/dimensions/height",schemaPath:"#/$defs/dimensions/anyOf/0/properties/height/maximum",keyword:"maximum",params:{comparison: "<=", limit: 32768},message:"must be <= 32768"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
else {
if(data4 < 1 || isNaN(data4)){
const err7 = {instancePath:instancePath+"/dimensions/height",schemaPath:"#/$defs/dimensions/anyOf/0/properties/height/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
}
var valid4 = _errs14 === errors;
}
else {
var valid4 = true;
}
}
}
}
}
else {
const err8 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
valid3 = valid3 || _valid0;
const _errs16 = errors;
if(data2 !== null){
const err9 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid0 = _errs16 === errors;
valid3 = valid3 || _valid0;
if(!valid3){
const err10 = {instancePath:instancePath+"/dimensions",schemaPath:"#/$defs/dimensions/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
validate70.errors = vErrors;
return false;
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
var valid0 = _errs6 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.rights_notice !== undefined && func0.call(data, "rights_notice")){
let data5 = data.rights_notice;
const _errs18 = errors;
if(errors === _errs18){
if(typeof data5 === "string"){
if(func91(data5) > 4096){
validate70.errors = [{instancePath:instancePath+"/rights_notice",schemaPath:"#/properties/rights_notice/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data5) < 1){
validate70.errors = [{instancePath:instancePath+"/rights_notice",schemaPath:"#/properties/rights_notice/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate70.errors = [{instancePath:instancePath+"/rights_notice",schemaPath:"#/properties/rights_notice/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs18 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.alt_text !== undefined && func0.call(data, "alt_text")){
let data6 = data.alt_text;
const _errs20 = errors;
if(errors === _errs20){
if(typeof data6 === "string"){
if(func91(data6) > 4096){
validate70.errors = [{instancePath:instancePath+"/alt_text",schemaPath:"#/properties/alt_text/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data6) < 1){
validate70.errors = [{instancePath:instancePath+"/alt_text",schemaPath:"#/properties/alt_text/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate70.errors = [{instancePath:instancePath+"/alt_text",schemaPath:"#/properties/alt_text/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs20 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.transcript !== undefined && func0.call(data, "transcript")){
let data7 = data.transcript;
const _errs22 = errors;
if(errors === _errs22){
if(typeof data7 === "string"){
if(func91(data7) > 32768){
validate70.errors = [{instancePath:instancePath+"/transcript",schemaPath:"#/properties/transcript/maxLength",keyword:"maxLength",params:{limit: 32768},message:"must NOT have more than 32768 characters"}];
return false;
}
else {
if(func91(data7) < 1){
validate70.errors = [{instancePath:instancePath+"/transcript",schemaPath:"#/properties/transcript/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate70.errors = [{instancePath:instancePath+"/transcript",schemaPath:"#/properties/transcript/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs22 === errors;
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
validate70.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate70.errors = vErrors;
return errors === 0;
}
validate70.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema103 = {"type":"object","additionalProperties":false,"required":["decision_id","role","actor","decided_at"],"properties":{"decision_id":{"$ref":"#/$defs/uuid"},"role":{"enum":["publisher","canon-editor","disclosure-reviewer"]},"actor":{"type":"string","minLength":1,"maxLength":200},"decided_at":{"$ref":"#/$defs/time"}}};

function validate75(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate75.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((data.decision_id === undefined) || (!(func0.call(data, "decision_id")))) && (missing0 = "decision_id")) || (((data.role === undefined) || (!(func0.call(data, "role")))) && (missing0 = "role"))) || (((data.actor === undefined) || (!(func0.call(data, "actor")))) && (missing0 = "actor"))) || (((data.decided_at === undefined) || (!(func0.call(data, "decided_at")))) && (missing0 = "decided_at"))){
validate75.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!((((key0 === "decision_id") || (key0 === "role")) || (key0 === "actor")) || (key0 === "decided_at"))){
validate75.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.decision_id !== undefined && func0.call(data, "decision_id")){
let data0 = data.decision_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern4.test(data0)){
validate75.errors = [{instancePath:instancePath+"/decision_id",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate75.errors = [{instancePath:instancePath+"/decision_id",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.role !== undefined && func0.call(data, "role")){
let data1 = data.role;
const _errs5 = errors;
if(!(((data1 === "publisher") || (data1 === "canon-editor")) || (data1 === "disclosure-reviewer"))){
validate75.errors = [{instancePath:instancePath+"/role",schemaPath:"#/properties/role/enum",keyword:"enum",params:{allowedValues: schema103.properties.role.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.actor !== undefined && func0.call(data, "actor")){
let data2 = data.actor;
const _errs6 = errors;
if(errors === _errs6){
if(typeof data2 === "string"){
if(func91(data2) > 200){
validate75.errors = [{instancePath:instancePath+"/actor",schemaPath:"#/properties/actor/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"}];
return false;
}
else {
if(func91(data2) < 1){
validate75.errors = [{instancePath:instancePath+"/actor",schemaPath:"#/properties/actor/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate75.errors = [{instancePath:instancePath+"/actor",schemaPath:"#/properties/actor/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs6 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.decided_at !== undefined && func0.call(data, "decided_at")){
let data3 = data.decided_at;
const _errs8 = errors;
const _errs9 = errors;
if(errors === _errs9){
if(errors === _errs9){
if(typeof data3 === "string"){
if(func91(data3) > 32){
validate75.errors = [{instancePath:instancePath+"/decided_at",schemaPath:"#/$defs/time/maxLength",keyword:"maxLength",params:{limit: 32},message:"must NOT have more than 32 characters"}];
return false;
}
else {
if(!pattern33.test(data3)){
validate75.errors = [{instancePath:instancePath+"/decided_at",schemaPath:"#/$defs/time/pattern",keyword:"pattern",params:{pattern: "Z$"},message:"must match pattern \""+"Z$"+"\""}];
return false;
}
else {
if(!(formats6.validate(data3))){
validate75.errors = [{instancePath:instancePath+"/decided_at",schemaPath:"#/$defs/time/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
}
}
else {
validate75.errors = [{instancePath:instancePath+"/decided_at",schemaPath:"#/$defs/time/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
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
}
else {
validate75.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate75.errors = vErrors;
return errors === 0;
}
validate75.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate89(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate89.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((((((((((((((((data.kind === undefined) || (!(func0.call(data, "kind")))) && (missing0 = "kind")) || (((data.spec_version === undefined) || (!(func0.call(data, "spec_version")))) && (missing0 = "spec_version"))) || (((data.release_id === undefined) || (!(func0.call(data, "release_id")))) && (missing0 = "release_id"))) || (((data.episode_id === undefined) || (!(func0.call(data, "episode_id")))) && (missing0 = "episode_id"))) || (((data.revision === undefined) || (!(func0.call(data, "revision")))) && (missing0 = "revision"))) || (((data.previous === undefined) || (!(func0.call(data, "previous")))) && (missing0 = "previous"))) || (((data.classification === undefined) || (!(func0.call(data, "classification")))) && (missing0 = "classification"))) || (((data.title === undefined) || (!(func0.call(data, "title")))) && (missing0 = "title"))) || (((data.production_credit === undefined) || (!(func0.call(data, "production_credit")))) && (missing0 = "production_credit"))) || (((data.canon_scope === undefined) || (!(func0.call(data, "canon_scope")))) && (missing0 = "canon_scope"))) || (((data.scope === undefined) || (!(func0.call(data, "scope")))) && (missing0 = "scope"))) || (((data.input_canon === undefined) || (!(func0.call(data, "input_canon")))) && (missing0 = "input_canon"))) || (((data.dependencies === undefined) || (!(func0.call(data, "dependencies")))) && (missing0 = "dependencies"))) || (((data.outputs === undefined) || (!(func0.call(data, "outputs")))) && (missing0 = "outputs"))) || (((data.gates === undefined) || (!(func0.call(data, "gates")))) && (missing0 = "gates"))) || (((data.execution === undefined) || (!(func0.call(data, "execution")))) && (missing0 = "execution"))) || (((data.approvers === undefined) || (!(func0.call(data, "approvers")))) && (missing0 = "approvers"))) || (((data.private_context === undefined) || (!(func0.call(data, "private_context")))) && (missing0 = "private_context"))){
validate89.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!(func0.call(schema91.properties, key0))){
validate89.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.kind !== undefined && func0.call(data, "kind")){
const _errs2 = errors;
if("comic-public-release" !== data.kind){
validate89.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "comic-public-release"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.spec_version !== undefined && func0.call(data, "spec_version")){
const _errs3 = errors;
if("1.0.0" !== data.spec_version){
validate89.errors = [{instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.release_id !== undefined && func0.call(data, "release_id")){
let data2 = data.release_id;
const _errs4 = errors;
const _errs5 = errors;
if(errors === _errs5){
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
validate89.errors = [{instancePath:instancePath+"/release_id",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate89.errors = [{instancePath:instancePath+"/release_id",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs4 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.episode_id !== undefined && func0.call(data, "episode_id")){
let data3 = data.episode_id;
const _errs7 = errors;
if(errors === _errs7){
if(typeof data3 === "string"){
if(!pattern40.test(data3)){
validate89.errors = [{instancePath:instancePath+"/episode_id",schemaPath:"#/properties/episode_id/pattern",keyword:"pattern",params:{pattern: "^DS-(?!0000)[0-9]{4}$"},message:"must match pattern \""+"^DS-(?!0000)[0-9]{4}$"+"\""}];
return false;
}
}
else {
validate89.errors = [{instancePath:instancePath+"/episode_id",schemaPath:"#/properties/episode_id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.revision !== undefined && func0.call(data, "revision")){
let data4 = data.revision;
const _errs9 = errors;
const _errs10 = errors;
if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
validate89.errors = [{instancePath:instancePath+"/revision",schemaPath:"#/$defs/revision/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs10){
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 9007199254740991 || isNaN(data4)){
validate89.errors = [{instancePath:instancePath+"/revision",schemaPath:"#/$defs/revision/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"}];
return false;
}
else {
if(data4 < 1 || isNaN(data4)){
validate89.errors = [{instancePath:instancePath+"/revision",schemaPath:"#/$defs/revision/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"}];
return false;
}
}
}
}
var valid0 = _errs9 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.previous !== undefined && func0.call(data, "previous")){
let data5 = data.previous;
const _errs12 = errors;
const _errs13 = errors;
let valid3 = false;
const _errs14 = errors;
if(!(validate63(data5, {instancePath:instancePath+"/previous",parentData:data,parentDataProperty:"previous",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate63.errors : vErrors.concat(validate63.errors);
errors = vErrors.length;
}
var _valid0 = _errs14 === errors;
valid3 = valid3 || _valid0;
const _errs15 = errors;
if(data5 !== null){
const err0 = {instancePath:instancePath+"/previous",schemaPath:"#/properties/previous/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
var _valid0 = _errs15 === errors;
valid3 = valid3 || _valid0;
if(!valid3){
const err1 = {instancePath:instancePath+"/previous",schemaPath:"#/properties/previous/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
validate89.errors = vErrors;
return false;
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
var valid0 = _errs12 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.classification !== undefined && func0.call(data, "classification")){
const _errs17 = errors;
if("public" !== data.classification){
validate89.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/properties/classification/const",keyword:"const",params:{allowedValue: "public"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs17 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.title !== undefined && func0.call(data, "title")){
let data7 = data.title;
const _errs18 = errors;
if(errors === _errs18){
if(typeof data7 === "string"){
if(func91(data7) > 200){
validate89.errors = [{instancePath:instancePath+"/title",schemaPath:"#/properties/title/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"}];
return false;
}
else {
if(func91(data7) < 1){
validate89.errors = [{instancePath:instancePath+"/title",schemaPath:"#/properties/title/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate89.errors = [{instancePath:instancePath+"/title",schemaPath:"#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs18 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.production_credit !== undefined && func0.call(data, "production_credit")){
const _errs20 = errors;
if("A Definitely Secure Studio production." !== data.production_credit){
validate89.errors = [{instancePath:instancePath+"/production_credit",schemaPath:"#/properties/production_credit/const",keyword:"const",params:{allowedValue: "A Definitely Secure Studio production."},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs20 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.canon_scope !== undefined && func0.call(data, "canon_scope")){
let data9 = data.canon_scope;
const _errs21 = errors;
if(errors === _errs21){
if(typeof data9 === "string"){
if(func91(data9) > 4096){
validate89.errors = [{instancePath:instancePath+"/canon_scope",schemaPath:"#/properties/canon_scope/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(func91(data9) < 1){
validate89.errors = [{instancePath:instancePath+"/canon_scope",schemaPath:"#/properties/canon_scope/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate89.errors = [{instancePath:instancePath+"/canon_scope",schemaPath:"#/properties/canon_scope/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs21 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.scope !== undefined && func0.call(data, "scope")){
const _errs23 = errors;
if(!(validate66(data.scope, {instancePath:instancePath+"/scope",parentData:data,parentDataProperty:"scope",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate66.errors : vErrors.concat(validate66.errors);
errors = vErrors.length;
}
var valid0 = _errs23 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.input_canon !== undefined && func0.call(data, "input_canon")){
const _errs24 = errors;
if(!(validate27(data.input_canon, {instancePath:instancePath+"/input_canon",parentData:data,parentDataProperty:"input_canon",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
errors = vErrors.length;
}
var valid0 = _errs24 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.dependencies !== undefined && func0.call(data, "dependencies")){
let data12 = data.dependencies;
const _errs25 = errors;
if(errors === _errs25){
if(Array.isArray(data12)){
if(data12.length > 256){
validate89.errors = [{instancePath:instancePath+"/dependencies",schemaPath:"#/properties/dependencies/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data12.length < 1){
validate89.errors = [{instancePath:instancePath+"/dependencies",schemaPath:"#/properties/dependencies/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid4 = true;
const len0 = data12.length;
for(let i0=0; i0<len0; i0++){
const _errs27 = errors;
if(!(validate27(data12[i0], {instancePath:instancePath+"/dependencies/" + i0,parentData:data12,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
errors = vErrors.length;
}
var valid4 = _errs27 === errors;
if(!valid4){
break;
}
}
}
}
}
else {
validate89.errors = [{instancePath:instancePath+"/dependencies",schemaPath:"#/properties/dependencies/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs25 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.outputs !== undefined && func0.call(data, "outputs")){
let data14 = data.outputs;
const _errs28 = errors;
if(errors === _errs28){
if(Array.isArray(data14)){
if(data14.length > 32){
validate89.errors = [{instancePath:instancePath+"/outputs",schemaPath:"#/properties/outputs/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"}];
return false;
}
else {
if(data14.length < 1){
validate89.errors = [{instancePath:instancePath+"/outputs",schemaPath:"#/properties/outputs/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid5 = true;
const len1 = data14.length;
for(let i1=0; i1<len1; i1++){
const _errs30 = errors;
if(!(validate70(data14[i1], {instancePath:instancePath+"/outputs/" + i1,parentData:data14,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate70.errors : vErrors.concat(validate70.errors);
errors = vErrors.length;
}
var valid5 = _errs30 === errors;
if(!valid5){
break;
}
}
}
}
}
else {
validate89.errors = [{instancePath:instancePath+"/outputs",schemaPath:"#/properties/outputs/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs28 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.gates !== undefined && func0.call(data, "gates")){
let data16 = data.gates;
const _errs31 = errors;
if(errors === _errs31){
if(Array.isArray(data16)){
if(data16.length > 9){
validate89.errors = [{instancePath:instancePath+"/gates",schemaPath:"#/properties/gates/maxItems",keyword:"maxItems",params:{limit: 9},message:"must NOT have more than 9 items"}];
return false;
}
else {
if(data16.length < 9){
validate89.errors = [{instancePath:instancePath+"/gates",schemaPath:"#/properties/gates/minItems",keyword:"minItems",params:{limit: 9},message:"must NOT have fewer than 9 items"}];
return false;
}
else {
var valid6 = true;
const len2 = data16.length;
for(let i2=0; i2<len2; i2++){
const _errs33 = errors;
if(!(validate54(data16[i2], {instancePath:instancePath+"/gates/" + i2,parentData:data16,parentDataProperty:i2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate54.errors : vErrors.concat(validate54.errors);
errors = vErrors.length;
}
var valid6 = _errs33 === errors;
if(!valid6){
break;
}
}
}
}
}
else {
validate89.errors = [{instancePath:instancePath+"/gates",schemaPath:"#/properties/gates/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs31 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.execution !== undefined && func0.call(data, "execution")){
const _errs34 = errors;
if(!(validate56(data.execution, {instancePath:instancePath+"/execution",parentData:data,parentDataProperty:"execution",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
var valid0 = _errs34 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.approvers !== undefined && func0.call(data, "approvers")){
let data19 = data.approvers;
const _errs35 = errors;
if(errors === _errs35){
if(Array.isArray(data19)){
if(data19.length > 16){
validate89.errors = [{instancePath:instancePath+"/approvers",schemaPath:"#/properties/approvers/maxItems",keyword:"maxItems",params:{limit: 16},message:"must NOT have more than 16 items"}];
return false;
}
else {
if(data19.length < 2){
validate89.errors = [{instancePath:instancePath+"/approvers",schemaPath:"#/properties/approvers/minItems",keyword:"minItems",params:{limit: 2},message:"must NOT have fewer than 2 items"}];
return false;
}
else {
var valid7 = true;
const len3 = data19.length;
for(let i3=0; i3<len3; i3++){
const _errs37 = errors;
if(!(validate75(data19[i3], {instancePath:instancePath+"/approvers/" + i3,parentData:data19,parentDataProperty:i3,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate75.errors : vErrors.concat(validate75.errors);
errors = vErrors.length;
}
var valid7 = _errs37 === errors;
if(!valid7){
break;
}
}
}
}
}
else {
validate89.errors = [{instancePath:instancePath+"/approvers",schemaPath:"#/properties/approvers/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs35 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.private_context !== undefined && func0.call(data, "private_context")){
let data21 = data.private_context;
const _errs38 = errors;
const _errs39 = errors;
let valid8 = false;
let passing0 = null;
const _errs40 = errors;
if(errors === _errs40){
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
let missing1;
if(((data21.influenced === undefined) || (!(func0.call(data21, "influenced")))) && (missing1 = "influenced")){
const err2 = {instancePath:instancePath+"/private_context",schemaPath:"#/properties/private_context/oneOf/0/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
else {
const _errs42 = errors;
for(const key1 of Object.keys(data21)){
if(!(key1 === "influenced")){
const err3 = {instancePath:instancePath+"/private_context",schemaPath:"#/properties/private_context/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
break;
}
}
if(_errs42 === errors){
if(data21.influenced !== undefined && func0.call(data21, "influenced")){
if(false !== data21.influenced){
const err4 = {instancePath:instancePath+"/private_context/influenced",schemaPath:"#/properties/private_context/oneOf/0/properties/influenced/const",keyword:"const",params:{allowedValue: false},message:"must be equal to constant"};
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
}
}
else {
const err5 = {instancePath:instancePath+"/private_context",schemaPath:"#/properties/private_context/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
var _valid1 = _errs40 === errors;
if(_valid1){
valid8 = true;
passing0 = 0;
var props1 = true;
}
const _errs44 = errors;
if(errors === _errs44){
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
let missing2;
if((((data21.influenced === undefined) || (!(func0.call(data21, "influenced")))) && (missing2 = "influenced")) || (((data21.attestation_reference === undefined) || (!(func0.call(data21, "attestation_reference")))) && (missing2 = "attestation_reference"))){
const err6 = {instancePath:instancePath+"/private_context",schemaPath:"#/properties/private_context/oneOf/1/required",keyword:"required",params:{missingProperty: missing2},message:"must have required property '"+missing2+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
else {
const _errs46 = errors;
for(const key2 of Object.keys(data21)){
if(!((key2 === "influenced") || (key2 === "attestation_reference"))){
const err7 = {instancePath:instancePath+"/private_context",schemaPath:"#/properties/private_context/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
break;
}
}
if(_errs46 === errors){
if(data21.influenced !== undefined && func0.call(data21, "influenced")){
const _errs47 = errors;
if(true !== data21.influenced){
const err8 = {instancePath:instancePath+"/private_context/influenced",schemaPath:"#/properties/private_context/oneOf/1/properties/influenced/const",keyword:"const",params:{allowedValue: true},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
var valid10 = _errs47 === errors;
}
else {
var valid10 = true;
}
if(valid10){
if(data21.attestation_reference !== undefined && func0.call(data21, "attestation_reference")){
let data24 = data21.attestation_reference;
const _errs48 = errors;
const _errs49 = errors;
if(errors === _errs49){
if(typeof data24 === "string"){
if(!pattern4.test(data24)){
const err9 = {instancePath:instancePath+"/private_context/attestation_reference",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""};
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
const err10 = {instancePath:instancePath+"/private_context/attestation_reference",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
var valid10 = _errs48 === errors;
}
else {
var valid10 = true;
}
}
}
}
}
else {
const err11 = {instancePath:instancePath+"/private_context",schemaPath:"#/properties/private_context/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
var _valid1 = _errs44 === errors;
if(_valid1 && valid8){
valid8 = false;
passing0 = [passing0, 1];
}
else {
if(_valid1){
valid8 = true;
passing0 = 1;
if(props1 !== true){
props1 = true;
}
}
}
if(!valid8){
const err12 = {instancePath:instancePath+"/private_context",schemaPath:"#/properties/private_context/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
validate89.errors = vErrors;
return false;
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
var valid0 = _errs38 === errors;
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
}
}
}
}
}
}
}
else {
validate89.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate89.errors = vErrors;
return errors === 0;
}
validate89.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const approval = validate98;
const schema119 = {"type":"object","additionalProperties":false,"required":["kind","spec_version","decision_id","role","actor","subject","artifact_digests","scope","decided_at","expires_at","authority_reference"],"properties":{"kind":{"const":"comic-approval-binding"},"spec_version":{"const":"1.0.0"},"decision_id":{"$ref":"#/$defs/uuid"},"role":{"enum":["production-reviewer","publisher","canon-editor","disclosure-reviewer"]},"actor":{"type":"string","minLength":1,"maxLength":200},"subject":{"$ref":"#/$defs/identity"},"artifact_digests":{"type":"array","items":{"$ref":"#/$defs/digest"},"minItems":0,"maxItems":256},"scope":{"$ref":"#/$defs/scope"},"decided_at":{"$ref":"#/$defs/time"},"expires_at":{"$ref":"#/$defs/time"},"authority_reference":{"$ref":"#/$defs/uuid"}}};

function validate98(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate98.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((((((((((data.kind === undefined) || (!(func0.call(data, "kind")))) && (missing0 = "kind")) || (((data.spec_version === undefined) || (!(func0.call(data, "spec_version")))) && (missing0 = "spec_version"))) || (((data.decision_id === undefined) || (!(func0.call(data, "decision_id")))) && (missing0 = "decision_id"))) || (((data.role === undefined) || (!(func0.call(data, "role")))) && (missing0 = "role"))) || (((data.actor === undefined) || (!(func0.call(data, "actor")))) && (missing0 = "actor"))) || (((data.subject === undefined) || (!(func0.call(data, "subject")))) && (missing0 = "subject"))) || (((data.artifact_digests === undefined) || (!(func0.call(data, "artifact_digests")))) && (missing0 = "artifact_digests"))) || (((data.scope === undefined) || (!(func0.call(data, "scope")))) && (missing0 = "scope"))) || (((data.decided_at === undefined) || (!(func0.call(data, "decided_at")))) && (missing0 = "decided_at"))) || (((data.expires_at === undefined) || (!(func0.call(data, "expires_at")))) && (missing0 = "expires_at"))) || (((data.authority_reference === undefined) || (!(func0.call(data, "authority_reference")))) && (missing0 = "authority_reference"))){
validate98.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 of Object.keys(data)){
if(!(func0.call(schema119.properties, key0))){
validate98.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.kind !== undefined && func0.call(data, "kind")){
const _errs2 = errors;
if("comic-approval-binding" !== data.kind){
validate98.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "comic-approval-binding"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.spec_version !== undefined && func0.call(data, "spec_version")){
const _errs3 = errors;
if("1.0.0" !== data.spec_version){
validate98.errors = [{instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.decision_id !== undefined && func0.call(data, "decision_id")){
let data2 = data.decision_id;
const _errs4 = errors;
const _errs5 = errors;
if(errors === _errs5){
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
validate98.errors = [{instancePath:instancePath+"/decision_id",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate98.errors = [{instancePath:instancePath+"/decision_id",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs4 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.role !== undefined && func0.call(data, "role")){
let data3 = data.role;
const _errs7 = errors;
if(!((((data3 === "production-reviewer") || (data3 === "publisher")) || (data3 === "canon-editor")) || (data3 === "disclosure-reviewer"))){
validate98.errors = [{instancePath:instancePath+"/role",schemaPath:"#/properties/role/enum",keyword:"enum",params:{allowedValues: schema119.properties.role.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.actor !== undefined && func0.call(data, "actor")){
let data4 = data.actor;
const _errs8 = errors;
if(errors === _errs8){
if(typeof data4 === "string"){
if(func91(data4) > 200){
validate98.errors = [{instancePath:instancePath+"/actor",schemaPath:"#/properties/actor/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters"}];
return false;
}
else {
if(func91(data4) < 1){
validate98.errors = [{instancePath:instancePath+"/actor",schemaPath:"#/properties/actor/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"}];
return false;
}
}
}
else {
validate98.errors = [{instancePath:instancePath+"/actor",schemaPath:"#/properties/actor/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs8 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.subject !== undefined && func0.call(data, "subject")){
const _errs10 = errors;
if(!(validate23(data.subject, {instancePath:instancePath+"/subject",parentData:data,parentDataProperty:"subject",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
var valid0 = _errs10 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.artifact_digests !== undefined && func0.call(data, "artifact_digests")){
let data6 = data.artifact_digests;
const _errs11 = errors;
if(errors === _errs11){
if(Array.isArray(data6)){
if(data6.length > 256){
validate98.errors = [{instancePath:instancePath+"/artifact_digests",schemaPath:"#/properties/artifact_digests/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"}];
return false;
}
else {
if(data6.length < 0){
validate98.errors = [{instancePath:instancePath+"/artifact_digests",schemaPath:"#/properties/artifact_digests/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid2 = true;
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
let data7 = data6[i0];
const _errs13 = errors;
const _errs14 = errors;
if(errors === _errs14){
if(typeof data7 === "string"){
if(!pattern6.test(data7)){
validate98.errors = [{instancePath:instancePath+"/artifact_digests/" + i0,schemaPath:"#/$defs/digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""}];
return false;
}
}
else {
validate98.errors = [{instancePath:instancePath+"/artifact_digests/" + i0,schemaPath:"#/$defs/digest/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid2 = _errs13 === errors;
if(!valid2){
break;
}
}
}
}
}
else {
validate98.errors = [{instancePath:instancePath+"/artifact_digests",schemaPath:"#/properties/artifact_digests/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs11 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.scope !== undefined && func0.call(data, "scope")){
const _errs16 = errors;
if(!(validate66(data.scope, {instancePath:instancePath+"/scope",parentData:data,parentDataProperty:"scope",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate66.errors : vErrors.concat(validate66.errors);
errors = vErrors.length;
}
var valid0 = _errs16 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.decided_at !== undefined && func0.call(data, "decided_at")){
let data9 = data.decided_at;
const _errs17 = errors;
const _errs18 = errors;
if(errors === _errs18){
if(errors === _errs18){
if(typeof data9 === "string"){
if(func91(data9) > 32){
validate98.errors = [{instancePath:instancePath+"/decided_at",schemaPath:"#/$defs/time/maxLength",keyword:"maxLength",params:{limit: 32},message:"must NOT have more than 32 characters"}];
return false;
}
else {
if(!pattern33.test(data9)){
validate98.errors = [{instancePath:instancePath+"/decided_at",schemaPath:"#/$defs/time/pattern",keyword:"pattern",params:{pattern: "Z$"},message:"must match pattern \""+"Z$"+"\""}];
return false;
}
else {
if(!(formats6.validate(data9))){
validate98.errors = [{instancePath:instancePath+"/decided_at",schemaPath:"#/$defs/time/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
}
}
else {
validate98.errors = [{instancePath:instancePath+"/decided_at",schemaPath:"#/$defs/time/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs17 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.expires_at !== undefined && func0.call(data, "expires_at")){
let data10 = data.expires_at;
const _errs20 = errors;
const _errs21 = errors;
if(errors === _errs21){
if(errors === _errs21){
if(typeof data10 === "string"){
if(func91(data10) > 32){
validate98.errors = [{instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/time/maxLength",keyword:"maxLength",params:{limit: 32},message:"must NOT have more than 32 characters"}];
return false;
}
else {
if(!pattern33.test(data10)){
validate98.errors = [{instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/time/pattern",keyword:"pattern",params:{pattern: "Z$"},message:"must match pattern \""+"Z$"+"\""}];
return false;
}
else {
if(!(formats6.validate(data10))){
validate98.errors = [{instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/time/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
}
}
else {
validate98.errors = [{instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/time/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs20 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.authority_reference !== undefined && func0.call(data, "authority_reference")){
let data11 = data.authority_reference;
const _errs23 = errors;
const _errs24 = errors;
if(errors === _errs24){
if(typeof data11 === "string"){
if(!pattern4.test(data11)){
validate98.errors = [{instancePath:instancePath+"/authority_reference",schemaPath:"#/$defs/uuid/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate98.errors = [{instancePath:instancePath+"/authority_reference",schemaPath:"#/$defs/uuid/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs23 === errors;
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
validate98.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate98.errors = vErrors;
return errors === 0;
}
validate98.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
