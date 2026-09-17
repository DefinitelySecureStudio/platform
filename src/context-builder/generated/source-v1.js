// Generated from Codex 2301597014f6fefe8a3cf772e2e02527cda6a254; released immutable contract.
// Schema SHA-256: 4adebedcef5a26e009e1d53ec9c480d372a31b73211fec1c53d6509ebc7929a3, d81e88780511c31099b2dd925f31aff26d6ba75e1173e953b98a37298764b617
// Rebuild with scripts/generate-builder-source-validator.mjs; do not edit.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
"use strict";
export const validateSource = validate88;
const schema91 = {"type":"object","additionalProperties":false,"required":["source_id","kind","version","classification","evidence_reference","authority_id","continuity_id","not_before","review_after","expires_at","media_type","reference","fragments"],"properties":{"source_id":{"$ref":"#/$defs/opaque"},"kind":{"enum":["public-canon","approved-private","caller-supplied","synthetic"]},"version":{"$ref":"#/$defs/opaque"},"classification":{"$ref":"#/$defs/classification"},"evidence_reference":{"$ref":"#/$defs/opaque"},"authority_id":{"$ref":"#/$defs/opaque"},"continuity_id":{"$ref":"#/$defs/opaque"},"not_before":{"$ref":"#/$defs/time"},"review_after":{"$ref":"#/$defs/time"},"expires_at":{"$ref":"#/$defs/time"},"media_type":{"enum":["text/plain","application/json"]},"reference":{"oneOf":[{"$ref":"#/$defs/publicArtifact"},{"$ref":"#/$defs/opaqueArtifact"}]},"fragments":{"type":"array","minItems":1,"maxItems":10000,"items":{"$ref":"#/$defs/extraction"}}},"allOf":[{"if":{"properties":{"classification":{"not":{"const":"public"}}}},"then":{"properties":{"reference":{"$ref":"#/$defs/opaqueArtifact"}}}},{"if":{"properties":{"kind":{"const":"approved-private"}}},"then":{"properties":{"reference":{"$ref":"#/$defs/opaqueArtifact"},"classification":{"enum":["internal","confidential","restricted"]}}}}]};
const schema33 = {"type":"string","pattern":"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"};
const schema50 = {"enum":["public","internal","confidential","restricted"]};
const schema87 = {"type":"string","format":"date-time","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"};
const schema92 = {"type":"object","additionalProperties":false,"required":["kind","handle"],"properties":{"kind":{"const":"opaque-artifact"},"handle":{"$ref":"#/$defs/opaque"}}};
const pattern4 = new RegExp("^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", "u");

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
if(((data.kind === undefined) && (missing0 = "kind")) || ((data.handle === undefined) && (missing0 = "handle"))){
validate52.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "handle"))){
validate52.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.kind !== undefined){
const _errs2 = errors;
if("opaque-artifact" !== data.kind){
validate52.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "opaque-artifact"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.handle !== undefined){
let data1 = data.handle;
const _errs3 = errors;
const _errs4 = errors;
if(errors === _errs4){
if(typeof data1 === "string"){
if(!pattern4.test(data1)){
validate52.errors = [{instancePath:instancePath+"/handle",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate52.errors = [{instancePath:instancePath+"/handle",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
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

const schema103 = {"type":"object","additionalProperties":false,"required":["kind","artifact"],"properties":{"kind":{"const":"public-artifact"},"artifact":{"$ref":"urn:definitely-secure:contract:context-package:1.0.0:context-package#/$defs/artifactIdentity"}}};
const schema55 = {"type":"object","additionalProperties":false,"required":["artifact_uri","media_type","byte_size","sha256"],"properties":{"artifact_uri":{"$ref":"#/$defs/absoluteUri"},"media_type":{"type":"string","pattern":"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},"byte_size":{"type":"integer","minimum":1},"sha256":{"$ref":"#/$defs/sha256"}}};
const schema49 = {"type":"string","format":"uri","pattern":"^[A-Za-z][A-Za-z0-9+.-]*:"};
const schema57 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}$"};
const formats6 = require("ajv-formats/dist/formats").fullFormats.uri;
const pattern13 = new RegExp("^[A-Za-z][A-Za-z0-9+.-]*:", "u");
const pattern17 = new RegExp("^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$", "u");
const pattern18 = new RegExp("^sha256:[0-9a-f]{64}$", "u");

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
if(((((data.artifact_uri === undefined) && (missing0 = "artifact_uri")) || ((data.media_type === undefined) && (missing0 = "media_type"))) || ((data.byte_size === undefined) && (missing0 = "byte_size"))) || ((data.sha256 === undefined) && (missing0 = "sha256"))){
validate56.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!((((key0 === "artifact_uri") || (key0 === "media_type")) || (key0 === "byte_size")) || (key0 === "sha256"))){
validate56.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
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
validate56.errors = [{instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z][A-Za-z0-9+.-]*:"},message:"must match pattern \""+"^[A-Za-z][A-Za-z0-9+.-]*:"+"\""}];
return false;
}
else {
if(!(formats6(data0))){
validate56.errors = [{instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""}];
return false;
}
}
}
else {
validate56.errors = [{instancePath:instancePath+"/artifact_uri",schemaPath:"#/$defs/absoluteUri/type",keyword:"type",params:{type: "string"},message:"must be string"}];
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
validate56.errors = [{instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"},message:"must match pattern \""+"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"+"\""}];
return false;
}
}
else {
validate56.errors = [{instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/type",keyword:"type",params:{type: "string"},message:"must be string"}];
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
validate56.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs7){
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 < 1 || isNaN(data2)){
validate56.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"}];
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
validate56.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""}];
return false;
}
}
else {
validate56.errors = [{instancePath:instancePath+"/sha256",schemaPath:"#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"}];
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
validate56.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate56.errors = vErrors;
return errors === 0;
}
validate56.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate55(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate55.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((data.kind === undefined) && (missing0 = "kind")) || ((data.artifact === undefined) && (missing0 = "artifact"))){
validate55.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!((key0 === "kind") || (key0 === "artifact"))){
validate55.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.kind !== undefined){
const _errs2 = errors;
if("public-artifact" !== data.kind){
validate55.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "public-artifact"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.artifact !== undefined){
const _errs3 = errors;
if(!(validate56(data.artifact, {instancePath:instancePath+"/artifact",parentData:data,parentDataProperty:"artifact",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
else {
validate55.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate55.errors = vErrors;
return errors === 0;
}
validate55.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema107 = {"type":"object","additionalProperties":false,"required":["candidate_id","fragment"],"properties":{"candidate_id":{"$ref":"#/$defs/opaque"},"fragment":{"$ref":"#/$defs/fragment"},"claim_id":{"$ref":"#/$defs/opaque"}}};
const schema109 = {"type":"object","additionalProperties":false,"required":["unit"],"properties":{"unit":{"enum":["utf8-byte-range","json-pointer"]},"start":{"type":"integer","minimum":0,"maximum":9007199254740991},"end":{"type":"integer","minimum":1,"maximum":9007199254740991},"pointer":{"type":"string","maxLength":4096,"pattern":"^(?:/(?:[^~/]|~[01])*)*$"}},"oneOf":[{"required":["start","end"],"properties":{"unit":{"const":"utf8-byte-range"}},"not":{"required":["pointer"]}},{"required":["pointer"],"properties":{"unit":{"const":"json-pointer"}},"not":{"anyOf":[{"required":["start"]},{"required":["end"]}]}}]};
const pattern53 = new RegExp("^(?:/(?:[^~/]|~[01])*)*$", "u");
const func2 = require("ajv/dist/runtime/ucs2length").default;

function validate60(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate60.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((data.candidate_id === undefined) && (missing0 = "candidate_id")) || ((data.fragment === undefined) && (missing0 = "fragment"))){
validate60.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!(((key0 === "candidate_id") || (key0 === "fragment")) || (key0 === "claim_id"))){
validate60.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.candidate_id !== undefined){
let data0 = data.candidate_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern4.test(data0)){
validate60.errors = [{instancePath:instancePath+"/candidate_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate60.errors = [{instancePath:instancePath+"/candidate_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.fragment !== undefined){
let data1 = data.fragment;
const _errs5 = errors;
const _errs6 = errors;
const _errs8 = errors;
let valid3 = false;
let passing0 = null;
const _errs9 = errors;
const _errs10 = errors;
const _errs11 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing1;
if((data1.pointer === undefined) && (missing1 = "pointer")){
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
var valid4 = _errs11 === errors;
if(valid4){
const err1 = {instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/oneOf/0/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
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
if(errors === _errs9){
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing2;
if(((data1.start === undefined) && (missing2 = "start")) || ((data1.end === undefined) && (missing2 = "end"))){
const err2 = {instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/oneOf/0/required",keyword:"required",params:{missingProperty: missing2},message:"must have required property '"+missing2+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
else {
if(data1.unit !== undefined){
if("utf8-byte-range" !== data1.unit){
const err3 = {instancePath:instancePath+"/fragment/unit",schemaPath:"#/$defs/fragment/oneOf/0/properties/unit/const",keyword:"const",params:{allowedValue: "utf8-byte-range"},message:"must be equal to constant"};
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
}
}
var _valid0 = _errs9 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
var props0 = {};
props0.unit = true;
}
const _errs13 = errors;
const _errs14 = errors;
const _errs15 = errors;
const _errs16 = errors;
let valid7 = false;
const _errs17 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing3;
if((data1.start === undefined) && (missing3 = "start")){
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
var _valid1 = _errs17 === errors;
valid7 = valid7 || _valid1;
const _errs18 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing4;
if((data1.end === undefined) && (missing4 = "end")){
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
var _valid1 = _errs18 === errors;
valid7 = valid7 || _valid1;
if(!valid7){
const err6 = {};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
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
var valid6 = _errs15 === errors;
if(valid6){
const err7 = {instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/oneOf/1/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
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
if(errors === _errs13){
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing5;
if((data1.pointer === undefined) && (missing5 = "pointer")){
const err8 = {instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/oneOf/1/required",keyword:"required",params:{missingProperty: missing5},message:"must have required property '"+missing5+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
if(data1.unit !== undefined){
if("json-pointer" !== data1.unit){
const err9 = {instancePath:instancePath+"/fragment/unit",schemaPath:"#/$defs/fragment/oneOf/1/properties/unit/const",keyword:"const",params:{allowedValue: "json-pointer"},message:"must be equal to constant"};
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
if(props0 !== true){
props0 = props0 || {};
props0.unit = true;
}
}
}
if(!valid3){
const err10 = {instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
validate60.errors = vErrors;
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
if(errors === _errs6){
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing6;
if((data1.unit === undefined) && (missing6 = "unit")){
validate60.errors = [{instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/required",keyword:"required",params:{missingProperty: missing6},message:"must have required property '"+missing6+"'"}];
return false;
}
else {
const _errs20 = errors;
for(const key1 in data1){
if(!((((key1 === "unit") || (key1 === "start")) || (key1 === "end")) || (key1 === "pointer"))){
validate60.errors = [{instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs20 === errors){
if(data1.unit !== undefined){
let data4 = data1.unit;
const _errs21 = errors;
if(!((data4 === "utf8-byte-range") || (data4 === "json-pointer"))){
validate60.errors = [{instancePath:instancePath+"/fragment/unit",schemaPath:"#/$defs/fragment/properties/unit/enum",keyword:"enum",params:{allowedValues: schema109.properties.unit.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid9 = _errs21 === errors;
}
else {
var valid9 = true;
}
if(valid9){
if(data1.start !== undefined){
let data5 = data1.start;
const _errs22 = errors;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
validate60.errors = [{instancePath:instancePath+"/fragment/start",schemaPath:"#/$defs/fragment/properties/start/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs22){
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 9007199254740991 || isNaN(data5)){
validate60.errors = [{instancePath:instancePath+"/fragment/start",schemaPath:"#/$defs/fragment/properties/start/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"}];
return false;
}
else {
if(data5 < 0 || isNaN(data5)){
validate60.errors = [{instancePath:instancePath+"/fragment/start",schemaPath:"#/$defs/fragment/properties/start/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"}];
return false;
}
}
}
}
var valid9 = _errs22 === errors;
}
else {
var valid9 = true;
}
if(valid9){
if(data1.end !== undefined){
let data6 = data1.end;
const _errs24 = errors;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
validate60.errors = [{instancePath:instancePath+"/fragment/end",schemaPath:"#/$defs/fragment/properties/end/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs24){
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 > 9007199254740991 || isNaN(data6)){
validate60.errors = [{instancePath:instancePath+"/fragment/end",schemaPath:"#/$defs/fragment/properties/end/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"}];
return false;
}
else {
if(data6 < 1 || isNaN(data6)){
validate60.errors = [{instancePath:instancePath+"/fragment/end",schemaPath:"#/$defs/fragment/properties/end/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"}];
return false;
}
}
}
}
var valid9 = _errs24 === errors;
}
else {
var valid9 = true;
}
if(valid9){
if(data1.pointer !== undefined){
let data7 = data1.pointer;
const _errs26 = errors;
if(errors === _errs26){
if(typeof data7 === "string"){
if(func2(data7) > 4096){
validate60.errors = [{instancePath:instancePath+"/fragment/pointer",schemaPath:"#/$defs/fragment/properties/pointer/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(!pattern53.test(data7)){
validate60.errors = [{instancePath:instancePath+"/fragment/pointer",schemaPath:"#/$defs/fragment/properties/pointer/pattern",keyword:"pattern",params:{pattern: "^(?:/(?:[^~/]|~[01])*)*$"},message:"must match pattern \""+"^(?:/(?:[^~/]|~[01])*)*$"+"\""}];
return false;
}
}
}
else {
validate60.errors = [{instancePath:instancePath+"/fragment/pointer",schemaPath:"#/$defs/fragment/properties/pointer/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid9 = _errs26 === errors;
}
else {
var valid9 = true;
}
}
}
}
}
}
}
else {
validate60.errors = [{instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.claim_id !== undefined){
let data8 = data.claim_id;
const _errs28 = errors;
const _errs29 = errors;
if(errors === _errs29){
if(typeof data8 === "string"){
if(!pattern4.test(data8)){
validate60.errors = [{instancePath:instancePath+"/claim_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate60.errors = [{instancePath:instancePath+"/claim_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs28 === errors;
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
validate60.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate60.errors = vErrors;
return errors === 0;
}
validate60.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const func1 = Object.prototype.hasOwnProperty;
const pattern37 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$", "u");
const formats0 = require("ajv-formats/dist/formats").fullFormats["date-time"];

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
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.classification !== undefined){
const _errs5 = errors;
const _errs6 = errors;
if("public" !== data.classification){
const err0 = {};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
var valid3 = _errs6 === errors;
if(valid3){
const err1 = {};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
else {
errors = _errs5;
if(vErrors !== null){
if(_errs5){
vErrors.length = _errs5;
}
else {
vErrors = null;
}
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
const _errs7 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.reference !== undefined){
if(!(validate52(data.reference, {instancePath:instancePath+"/reference",parentData:data,parentDataProperty:"reference",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
errors = vErrors.length;
}
}
}
var _valid0 = _errs7 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.reference = true;
props0.classification = true;
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
validate88.errors = vErrors;
return false;
}
var valid0 = _errs1 === errors;
if(valid0){
const _errs9 = errors;
const _errs10 = errors;
let valid5 = true;
const _errs11 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind !== undefined){
if("approved-private" !== data.kind){
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
if(_valid1){
const _errs13 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.reference !== undefined){
const _errs14 = errors;
if(!(validate52(data.reference, {instancePath:instancePath+"/reference",parentData:data,parentDataProperty:"reference",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
errors = vErrors.length;
}
var valid7 = _errs14 === errors;
}
else {
var valid7 = true;
}
if(valid7){
if(data.classification !== undefined){
let data4 = data.classification;
const _errs15 = errors;
if(!(((data4 === "internal") || (data4 === "confidential")) || (data4 === "restricted"))){
validate88.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/allOf/1/then/properties/classification/enum",keyword:"enum",params:{allowedValues: schema91.allOf[1].then.properties.classification.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid7 = _errs15 === errors;
}
else {
var valid7 = true;
}
}
}
var _valid1 = _errs13 === errors;
valid5 = _valid1;
if(valid5){
var props1 = {};
props1.reference = true;
props1.classification = true;
props1.kind = true;
}
}
if(!valid5){
const err4 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
validate88.errors = vErrors;
return false;
}
var valid0 = _errs9 === errors;
if(valid0){
if(props0 !== true && props1 !== undefined){
if(props1 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props1);
}
}
}
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((((((((((data.source_id === undefined) && (missing0 = "source_id")) || ((data.kind === undefined) && (missing0 = "kind"))) || ((data.version === undefined) && (missing0 = "version"))) || ((data.classification === undefined) && (missing0 = "classification"))) || ((data.evidence_reference === undefined) && (missing0 = "evidence_reference"))) || ((data.authority_id === undefined) && (missing0 = "authority_id"))) || ((data.continuity_id === undefined) && (missing0 = "continuity_id"))) || ((data.not_before === undefined) && (missing0 = "not_before"))) || ((data.review_after === undefined) && (missing0 = "review_after"))) || ((data.expires_at === undefined) && (missing0 = "expires_at"))) || ((data.media_type === undefined) && (missing0 = "media_type"))) || ((data.reference === undefined) && (missing0 = "reference"))) || ((data.fragments === undefined) && (missing0 = "fragments"))){
validate88.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs16 = errors;
for(const key0 in data){
if(!(func1.call(schema91.properties, key0))){
validate88.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs16 === errors){
if(data.source_id !== undefined){
let data5 = data.source_id;
const _errs17 = errors;
const _errs18 = errors;
if(errors === _errs18){
if(typeof data5 === "string"){
if(!pattern4.test(data5)){
validate88.errors = [{instancePath:instancePath+"/source_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate88.errors = [{instancePath:instancePath+"/source_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid8 = _errs17 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.kind !== undefined){
let data6 = data.kind;
const _errs20 = errors;
if(!((((data6 === "public-canon") || (data6 === "approved-private")) || (data6 === "caller-supplied")) || (data6 === "synthetic"))){
validate88.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema91.properties.kind.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid8 = _errs20 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.version !== undefined){
let data7 = data.version;
const _errs21 = errors;
const _errs22 = errors;
if(errors === _errs22){
if(typeof data7 === "string"){
if(!pattern4.test(data7)){
validate88.errors = [{instancePath:instancePath+"/version",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate88.errors = [{instancePath:instancePath+"/version",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid8 = _errs21 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.classification !== undefined){
let data8 = data.classification;
const _errs24 = errors;
if(!((((data8 === "public") || (data8 === "internal")) || (data8 === "confidential")) || (data8 === "restricted"))){
validate88.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema50.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid8 = _errs24 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.evidence_reference !== undefined){
let data9 = data.evidence_reference;
const _errs26 = errors;
const _errs27 = errors;
if(errors === _errs27){
if(typeof data9 === "string"){
if(!pattern4.test(data9)){
validate88.errors = [{instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate88.errors = [{instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid8 = _errs26 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.authority_id !== undefined){
let data10 = data.authority_id;
const _errs29 = errors;
const _errs30 = errors;
if(errors === _errs30){
if(typeof data10 === "string"){
if(!pattern4.test(data10)){
validate88.errors = [{instancePath:instancePath+"/authority_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate88.errors = [{instancePath:instancePath+"/authority_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid8 = _errs29 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.continuity_id !== undefined){
let data11 = data.continuity_id;
const _errs32 = errors;
const _errs33 = errors;
if(errors === _errs33){
if(typeof data11 === "string"){
if(!pattern4.test(data11)){
validate88.errors = [{instancePath:instancePath+"/continuity_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate88.errors = [{instancePath:instancePath+"/continuity_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid8 = _errs32 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.not_before !== undefined){
let data12 = data.not_before;
const _errs35 = errors;
const _errs36 = errors;
if(errors === _errs36){
if(errors === _errs36){
if(typeof data12 === "string"){
if(!pattern37.test(data12)){
validate88.errors = [{instancePath:instancePath+"/not_before",schemaPath:"#/$defs/time/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""}];
return false;
}
else {
if(!(formats0.validate(data12))){
validate88.errors = [{instancePath:instancePath+"/not_before",schemaPath:"#/$defs/time/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
}
else {
validate88.errors = [{instancePath:instancePath+"/not_before",schemaPath:"#/$defs/time/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid8 = _errs35 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.review_after !== undefined){
let data13 = data.review_after;
const _errs38 = errors;
const _errs39 = errors;
if(errors === _errs39){
if(errors === _errs39){
if(typeof data13 === "string"){
if(!pattern37.test(data13)){
validate88.errors = [{instancePath:instancePath+"/review_after",schemaPath:"#/$defs/time/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""}];
return false;
}
else {
if(!(formats0.validate(data13))){
validate88.errors = [{instancePath:instancePath+"/review_after",schemaPath:"#/$defs/time/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
}
else {
validate88.errors = [{instancePath:instancePath+"/review_after",schemaPath:"#/$defs/time/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid8 = _errs38 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.expires_at !== undefined){
let data14 = data.expires_at;
const _errs41 = errors;
const _errs42 = errors;
if(errors === _errs42){
if(errors === _errs42){
if(typeof data14 === "string"){
if(!pattern37.test(data14)){
validate88.errors = [{instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/time/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""}];
return false;
}
else {
if(!(formats0.validate(data14))){
validate88.errors = [{instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/time/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
}
else {
validate88.errors = [{instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/time/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid8 = _errs41 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.media_type !== undefined){
let data15 = data.media_type;
const _errs44 = errors;
if(!((data15 === "text/plain") || (data15 === "application/json"))){
validate88.errors = [{instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/enum",keyword:"enum",params:{allowedValues: schema91.properties.media_type.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid8 = _errs44 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.reference !== undefined){
let data16 = data.reference;
const _errs45 = errors;
const _errs46 = errors;
let valid18 = false;
let passing0 = null;
const _errs47 = errors;
if(!(validate55(data16, {instancePath:instancePath+"/reference",parentData:data,parentDataProperty:"reference",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
errors = vErrors.length;
}
var _valid2 = _errs47 === errors;
if(_valid2){
valid18 = true;
passing0 = 0;
var props2 = true;
}
const _errs48 = errors;
if(!(validate52(data16, {instancePath:instancePath+"/reference",parentData:data,parentDataProperty:"reference",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
errors = vErrors.length;
}
var _valid2 = _errs48 === errors;
if(_valid2 && valid18){
valid18 = false;
passing0 = [passing0, 1];
}
else {
if(_valid2){
valid18 = true;
passing0 = 1;
if(props2 !== true){
props2 = true;
}
}
}
if(!valid18){
const err5 = {instancePath:instancePath+"/reference",schemaPath:"#/properties/reference/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
validate88.errors = vErrors;
return false;
}
else {
errors = _errs46;
if(vErrors !== null){
if(_errs46){
vErrors.length = _errs46;
}
else {
vErrors = null;
}
}
}
var valid8 = _errs45 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.fragments !== undefined){
let data17 = data.fragments;
const _errs49 = errors;
if(errors === _errs49){
if(Array.isArray(data17)){
if(data17.length > 10000){
validate88.errors = [{instancePath:instancePath+"/fragments",schemaPath:"#/properties/fragments/maxItems",keyword:"maxItems",params:{limit: 10000},message:"must NOT have more than 10000 items"}];
return false;
}
else {
if(data17.length < 1){
validate88.errors = [{instancePath:instancePath+"/fragments",schemaPath:"#/properties/fragments/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid19 = true;
const len0 = data17.length;
for(let i0=0; i0<len0; i0++){
const _errs51 = errors;
if(!(validate60(data17[i0], {instancePath:instancePath+"/fragments/" + i0,parentData:data17,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate60.errors : vErrors.concat(validate60.errors);
errors = vErrors.length;
}
var valid19 = _errs51 === errors;
if(!valid19){
break;
}
}
}
}
}
else {
validate88.errors = [{instancePath:instancePath+"/fragments",schemaPath:"#/properties/fragments/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid8 = _errs49 === errors;
}
else {
var valid8 = true;
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
validate88.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate88.errors = vErrors;
return errors === 0;
}
validate88.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validateNormalized = validate94;
const schema120 = {"type":"object","additionalProperties":false,"required":["spec_version","kind","build_id","request_identity","source","normalization","candidates"],"properties":{"spec_version":{"const":"1.0.0"},"kind":{"const":"context-normalized-source"},"build_id":{"$ref":"#/$defs/opaque"},"request_identity":{"$ref":"#/$defs/identity"},"source":{"$ref":"#/$defs/source"},"normalization":{"const":"utf8-json-v1"},"candidates":{"type":"array","minItems":0,"maxItems":10000,"items":{"$ref":"#/$defs/candidate"}}}};
const schema63 = {"type":"object","additionalProperties":false,"required":["canonicalization","byte_size","sha256"],"properties":{"canonicalization":{"const":"studio-json-v1"},"byte_size":{"type":"integer","minimum":2},"sha256":{"$ref":"#/$defs/sha256"}}};

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


function validate51(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate51.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs1 = errors;
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.classification !== undefined){
const _errs5 = errors;
const _errs6 = errors;
if("public" !== data.classification){
const err0 = {};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
var valid3 = _errs6 === errors;
if(valid3){
const err1 = {};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
else {
errors = _errs5;
if(vErrors !== null){
if(_errs5){
vErrors.length = _errs5;
}
else {
vErrors = null;
}
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
const _errs7 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.reference !== undefined){
if(!(validate52(data.reference, {instancePath:instancePath+"/reference",parentData:data,parentDataProperty:"reference",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
errors = vErrors.length;
}
}
}
var _valid0 = _errs7 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.reference = true;
props0.classification = true;
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
validate51.errors = vErrors;
return false;
}
var valid0 = _errs1 === errors;
if(valid0){
const _errs9 = errors;
const _errs10 = errors;
let valid5 = true;
const _errs11 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.kind !== undefined){
if("approved-private" !== data.kind){
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
if(_valid1){
const _errs13 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.reference !== undefined){
const _errs14 = errors;
if(!(validate52(data.reference, {instancePath:instancePath+"/reference",parentData:data,parentDataProperty:"reference",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
errors = vErrors.length;
}
var valid7 = _errs14 === errors;
}
else {
var valid7 = true;
}
if(valid7){
if(data.classification !== undefined){
let data4 = data.classification;
const _errs15 = errors;
if(!(((data4 === "internal") || (data4 === "confidential")) || (data4 === "restricted"))){
validate51.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/allOf/1/then/properties/classification/enum",keyword:"enum",params:{allowedValues: schema91.allOf[1].then.properties.classification.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid7 = _errs15 === errors;
}
else {
var valid7 = true;
}
}
}
var _valid1 = _errs13 === errors;
valid5 = _valid1;
if(valid5){
var props1 = {};
props1.reference = true;
props1.classification = true;
props1.kind = true;
}
}
if(!valid5){
const err4 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
validate51.errors = vErrors;
return false;
}
var valid0 = _errs9 === errors;
if(valid0){
if(props0 !== true && props1 !== undefined){
if(props1 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props1);
}
}
}
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((((((((((data.source_id === undefined) && (missing0 = "source_id")) || ((data.kind === undefined) && (missing0 = "kind"))) || ((data.version === undefined) && (missing0 = "version"))) || ((data.classification === undefined) && (missing0 = "classification"))) || ((data.evidence_reference === undefined) && (missing0 = "evidence_reference"))) || ((data.authority_id === undefined) && (missing0 = "authority_id"))) || ((data.continuity_id === undefined) && (missing0 = "continuity_id"))) || ((data.not_before === undefined) && (missing0 = "not_before"))) || ((data.review_after === undefined) && (missing0 = "review_after"))) || ((data.expires_at === undefined) && (missing0 = "expires_at"))) || ((data.media_type === undefined) && (missing0 = "media_type"))) || ((data.reference === undefined) && (missing0 = "reference"))) || ((data.fragments === undefined) && (missing0 = "fragments"))){
validate51.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs16 = errors;
for(const key0 in data){
if(!(func1.call(schema91.properties, key0))){
validate51.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs16 === errors){
if(data.source_id !== undefined){
let data5 = data.source_id;
const _errs17 = errors;
const _errs18 = errors;
if(errors === _errs18){
if(typeof data5 === "string"){
if(!pattern4.test(data5)){
validate51.errors = [{instancePath:instancePath+"/source_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate51.errors = [{instancePath:instancePath+"/source_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid8 = _errs17 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.kind !== undefined){
let data6 = data.kind;
const _errs20 = errors;
if(!((((data6 === "public-canon") || (data6 === "approved-private")) || (data6 === "caller-supplied")) || (data6 === "synthetic"))){
validate51.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues: schema91.properties.kind.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid8 = _errs20 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.version !== undefined){
let data7 = data.version;
const _errs21 = errors;
const _errs22 = errors;
if(errors === _errs22){
if(typeof data7 === "string"){
if(!pattern4.test(data7)){
validate51.errors = [{instancePath:instancePath+"/version",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate51.errors = [{instancePath:instancePath+"/version",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid8 = _errs21 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.classification !== undefined){
let data8 = data.classification;
const _errs24 = errors;
if(!((((data8 === "public") || (data8 === "internal")) || (data8 === "confidential")) || (data8 === "restricted"))){
validate51.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema50.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid8 = _errs24 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.evidence_reference !== undefined){
let data9 = data.evidence_reference;
const _errs26 = errors;
const _errs27 = errors;
if(errors === _errs27){
if(typeof data9 === "string"){
if(!pattern4.test(data9)){
validate51.errors = [{instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate51.errors = [{instancePath:instancePath+"/evidence_reference",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid8 = _errs26 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.authority_id !== undefined){
let data10 = data.authority_id;
const _errs29 = errors;
const _errs30 = errors;
if(errors === _errs30){
if(typeof data10 === "string"){
if(!pattern4.test(data10)){
validate51.errors = [{instancePath:instancePath+"/authority_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate51.errors = [{instancePath:instancePath+"/authority_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid8 = _errs29 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.continuity_id !== undefined){
let data11 = data.continuity_id;
const _errs32 = errors;
const _errs33 = errors;
if(errors === _errs33){
if(typeof data11 === "string"){
if(!pattern4.test(data11)){
validate51.errors = [{instancePath:instancePath+"/continuity_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate51.errors = [{instancePath:instancePath+"/continuity_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid8 = _errs32 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.not_before !== undefined){
let data12 = data.not_before;
const _errs35 = errors;
const _errs36 = errors;
if(errors === _errs36){
if(errors === _errs36){
if(typeof data12 === "string"){
if(!pattern37.test(data12)){
validate51.errors = [{instancePath:instancePath+"/not_before",schemaPath:"#/$defs/time/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""}];
return false;
}
else {
if(!(formats0.validate(data12))){
validate51.errors = [{instancePath:instancePath+"/not_before",schemaPath:"#/$defs/time/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
}
else {
validate51.errors = [{instancePath:instancePath+"/not_before",schemaPath:"#/$defs/time/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid8 = _errs35 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.review_after !== undefined){
let data13 = data.review_after;
const _errs38 = errors;
const _errs39 = errors;
if(errors === _errs39){
if(errors === _errs39){
if(typeof data13 === "string"){
if(!pattern37.test(data13)){
validate51.errors = [{instancePath:instancePath+"/review_after",schemaPath:"#/$defs/time/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""}];
return false;
}
else {
if(!(formats0.validate(data13))){
validate51.errors = [{instancePath:instancePath+"/review_after",schemaPath:"#/$defs/time/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
}
else {
validate51.errors = [{instancePath:instancePath+"/review_after",schemaPath:"#/$defs/time/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid8 = _errs38 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.expires_at !== undefined){
let data14 = data.expires_at;
const _errs41 = errors;
const _errs42 = errors;
if(errors === _errs42){
if(errors === _errs42){
if(typeof data14 === "string"){
if(!pattern37.test(data14)){
validate51.errors = [{instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/time/pattern",keyword:"pattern",params:{pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"},message:"must match pattern \""+"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"+"\""}];
return false;
}
else {
if(!(formats0.validate(data14))){
validate51.errors = [{instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/time/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""}];
return false;
}
}
}
else {
validate51.errors = [{instancePath:instancePath+"/expires_at",schemaPath:"#/$defs/time/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid8 = _errs41 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.media_type !== undefined){
let data15 = data.media_type;
const _errs44 = errors;
if(!((data15 === "text/plain") || (data15 === "application/json"))){
validate51.errors = [{instancePath:instancePath+"/media_type",schemaPath:"#/properties/media_type/enum",keyword:"enum",params:{allowedValues: schema91.properties.media_type.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid8 = _errs44 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.reference !== undefined){
let data16 = data.reference;
const _errs45 = errors;
const _errs46 = errors;
let valid18 = false;
let passing0 = null;
const _errs47 = errors;
if(!(validate55(data16, {instancePath:instancePath+"/reference",parentData:data,parentDataProperty:"reference",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
errors = vErrors.length;
}
var _valid2 = _errs47 === errors;
if(_valid2){
valid18 = true;
passing0 = 0;
var props2 = true;
}
const _errs48 = errors;
if(!(validate52(data16, {instancePath:instancePath+"/reference",parentData:data,parentDataProperty:"reference",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
errors = vErrors.length;
}
var _valid2 = _errs48 === errors;
if(_valid2 && valid18){
valid18 = false;
passing0 = [passing0, 1];
}
else {
if(_valid2){
valid18 = true;
passing0 = 1;
if(props2 !== true){
props2 = true;
}
}
}
if(!valid18){
const err5 = {instancePath:instancePath+"/reference",schemaPath:"#/properties/reference/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
validate51.errors = vErrors;
return false;
}
else {
errors = _errs46;
if(vErrors !== null){
if(_errs46){
vErrors.length = _errs46;
}
else {
vErrors = null;
}
}
}
var valid8 = _errs45 === errors;
}
else {
var valid8 = true;
}
if(valid8){
if(data.fragments !== undefined){
let data17 = data.fragments;
const _errs49 = errors;
if(errors === _errs49){
if(Array.isArray(data17)){
if(data17.length > 10000){
validate51.errors = [{instancePath:instancePath+"/fragments",schemaPath:"#/properties/fragments/maxItems",keyword:"maxItems",params:{limit: 10000},message:"must NOT have more than 10000 items"}];
return false;
}
else {
if(data17.length < 1){
validate51.errors = [{instancePath:instancePath+"/fragments",schemaPath:"#/properties/fragments/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}];
return false;
}
else {
var valid19 = true;
const len0 = data17.length;
for(let i0=0; i0<len0; i0++){
const _errs51 = errors;
if(!(validate60(data17[i0], {instancePath:instancePath+"/fragments/" + i0,parentData:data17,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate60.errors : vErrors.concat(validate60.errors);
errors = vErrors.length;
}
var valid19 = _errs51 === errors;
if(!valid19){
break;
}
}
}
}
}
else {
validate51.errors = [{instancePath:instancePath+"/fragments",schemaPath:"#/properties/fragments/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid8 = _errs49 === errors;
}
else {
var valid8 = true;
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
validate51.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate51.errors = vErrors;
return errors === 0;
}
validate51.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema122 = {"type":"object","additionalProperties":false,"required":["candidate_id","fragment","classification","content","byte_size","sha256"],"properties":{"candidate_id":{"$ref":"#/$defs/opaque"},"fragment":{"$ref":"#/$defs/fragment"},"classification":{"$ref":"#/$defs/classification"},"content":{},"byte_size":{"type":"integer","minimum":0,"maximum":9007199254740991},"sha256":{"$ref":"urn:definitely-secure:contract:context-package:1.0.0:context-package#/$defs/sha256"},"claim_id":{"$ref":"#/$defs/opaque"}}};

function validate71(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate71.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((((data.candidate_id === undefined) && (missing0 = "candidate_id")) || ((data.fragment === undefined) && (missing0 = "fragment"))) || ((data.classification === undefined) && (missing0 = "classification"))) || ((data.content === undefined) && (missing0 = "content"))) || ((data.byte_size === undefined) && (missing0 = "byte_size"))) || ((data.sha256 === undefined) && (missing0 = "sha256"))){
validate71.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!(((((((key0 === "candidate_id") || (key0 === "fragment")) || (key0 === "classification")) || (key0 === "content")) || (key0 === "byte_size")) || (key0 === "sha256")) || (key0 === "claim_id"))){
validate71.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.candidate_id !== undefined){
let data0 = data.candidate_id;
const _errs2 = errors;
const _errs3 = errors;
if(errors === _errs3){
if(typeof data0 === "string"){
if(!pattern4.test(data0)){
validate71.errors = [{instancePath:instancePath+"/candidate_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate71.errors = [{instancePath:instancePath+"/candidate_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs2 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.fragment !== undefined){
let data1 = data.fragment;
const _errs5 = errors;
const _errs6 = errors;
const _errs8 = errors;
let valid3 = false;
let passing0 = null;
const _errs9 = errors;
const _errs10 = errors;
const _errs11 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing1;
if((data1.pointer === undefined) && (missing1 = "pointer")){
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
var valid4 = _errs11 === errors;
if(valid4){
const err1 = {instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/oneOf/0/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
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
if(errors === _errs9){
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing2;
if(((data1.start === undefined) && (missing2 = "start")) || ((data1.end === undefined) && (missing2 = "end"))){
const err2 = {instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/oneOf/0/required",keyword:"required",params:{missingProperty: missing2},message:"must have required property '"+missing2+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
else {
if(data1.unit !== undefined){
if("utf8-byte-range" !== data1.unit){
const err3 = {instancePath:instancePath+"/fragment/unit",schemaPath:"#/$defs/fragment/oneOf/0/properties/unit/const",keyword:"const",params:{allowedValue: "utf8-byte-range"},message:"must be equal to constant"};
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
}
}
var _valid0 = _errs9 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
var props0 = {};
props0.unit = true;
}
const _errs13 = errors;
const _errs14 = errors;
const _errs15 = errors;
const _errs16 = errors;
let valid7 = false;
const _errs17 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing3;
if((data1.start === undefined) && (missing3 = "start")){
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
var _valid1 = _errs17 === errors;
valid7 = valid7 || _valid1;
const _errs18 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing4;
if((data1.end === undefined) && (missing4 = "end")){
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
var _valid1 = _errs18 === errors;
valid7 = valid7 || _valid1;
if(!valid7){
const err6 = {};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
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
var valid6 = _errs15 === errors;
if(valid6){
const err7 = {instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/oneOf/1/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
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
if(errors === _errs13){
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing5;
if((data1.pointer === undefined) && (missing5 = "pointer")){
const err8 = {instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/oneOf/1/required",keyword:"required",params:{missingProperty: missing5},message:"must have required property '"+missing5+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
if(data1.unit !== undefined){
if("json-pointer" !== data1.unit){
const err9 = {instancePath:instancePath+"/fragment/unit",schemaPath:"#/$defs/fragment/oneOf/1/properties/unit/const",keyword:"const",params:{allowedValue: "json-pointer"},message:"must be equal to constant"};
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
if(props0 !== true){
props0 = props0 || {};
props0.unit = true;
}
}
}
if(!valid3){
const err10 = {instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
validate71.errors = vErrors;
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
if(errors === _errs6){
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing6;
if((data1.unit === undefined) && (missing6 = "unit")){
validate71.errors = [{instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/required",keyword:"required",params:{missingProperty: missing6},message:"must have required property '"+missing6+"'"}];
return false;
}
else {
const _errs20 = errors;
for(const key1 in data1){
if(!((((key1 === "unit") || (key1 === "start")) || (key1 === "end")) || (key1 === "pointer"))){
validate71.errors = [{instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs20 === errors){
if(data1.unit !== undefined){
let data4 = data1.unit;
const _errs21 = errors;
if(!((data4 === "utf8-byte-range") || (data4 === "json-pointer"))){
validate71.errors = [{instancePath:instancePath+"/fragment/unit",schemaPath:"#/$defs/fragment/properties/unit/enum",keyword:"enum",params:{allowedValues: schema109.properties.unit.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid9 = _errs21 === errors;
}
else {
var valid9 = true;
}
if(valid9){
if(data1.start !== undefined){
let data5 = data1.start;
const _errs22 = errors;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
validate71.errors = [{instancePath:instancePath+"/fragment/start",schemaPath:"#/$defs/fragment/properties/start/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs22){
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 9007199254740991 || isNaN(data5)){
validate71.errors = [{instancePath:instancePath+"/fragment/start",schemaPath:"#/$defs/fragment/properties/start/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"}];
return false;
}
else {
if(data5 < 0 || isNaN(data5)){
validate71.errors = [{instancePath:instancePath+"/fragment/start",schemaPath:"#/$defs/fragment/properties/start/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"}];
return false;
}
}
}
}
var valid9 = _errs22 === errors;
}
else {
var valid9 = true;
}
if(valid9){
if(data1.end !== undefined){
let data6 = data1.end;
const _errs24 = errors;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
validate71.errors = [{instancePath:instancePath+"/fragment/end",schemaPath:"#/$defs/fragment/properties/end/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs24){
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 > 9007199254740991 || isNaN(data6)){
validate71.errors = [{instancePath:instancePath+"/fragment/end",schemaPath:"#/$defs/fragment/properties/end/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"}];
return false;
}
else {
if(data6 < 1 || isNaN(data6)){
validate71.errors = [{instancePath:instancePath+"/fragment/end",schemaPath:"#/$defs/fragment/properties/end/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"}];
return false;
}
}
}
}
var valid9 = _errs24 === errors;
}
else {
var valid9 = true;
}
if(valid9){
if(data1.pointer !== undefined){
let data7 = data1.pointer;
const _errs26 = errors;
if(errors === _errs26){
if(typeof data7 === "string"){
if(func2(data7) > 4096){
validate71.errors = [{instancePath:instancePath+"/fragment/pointer",schemaPath:"#/$defs/fragment/properties/pointer/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"}];
return false;
}
else {
if(!pattern53.test(data7)){
validate71.errors = [{instancePath:instancePath+"/fragment/pointer",schemaPath:"#/$defs/fragment/properties/pointer/pattern",keyword:"pattern",params:{pattern: "^(?:/(?:[^~/]|~[01])*)*$"},message:"must match pattern \""+"^(?:/(?:[^~/]|~[01])*)*$"+"\""}];
return false;
}
}
}
else {
validate71.errors = [{instancePath:instancePath+"/fragment/pointer",schemaPath:"#/$defs/fragment/properties/pointer/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid9 = _errs26 === errors;
}
else {
var valid9 = true;
}
}
}
}
}
}
}
else {
validate71.errors = [{instancePath:instancePath+"/fragment",schemaPath:"#/$defs/fragment/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.classification !== undefined){
let data8 = data.classification;
const _errs28 = errors;
if(!((((data8 === "public") || (data8 === "internal")) || (data8 === "confidential")) || (data8 === "restricted"))){
validate71.errors = [{instancePath:instancePath+"/classification",schemaPath:"#/$defs/classification/enum",keyword:"enum",params:{allowedValues: schema50.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs28 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.byte_size !== undefined){
let data9 = data.byte_size;
const _errs30 = errors;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
validate71.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
return false;
}
if(errors === _errs30){
if((typeof data9 == "number") && (isFinite(data9))){
if(data9 > 9007199254740991 || isNaN(data9)){
validate71.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 9007199254740991},message:"must be <= 9007199254740991"}];
return false;
}
else {
if(data9 < 0 || isNaN(data9)){
validate71.errors = [{instancePath:instancePath+"/byte_size",schemaPath:"#/properties/byte_size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"}];
return false;
}
}
}
}
var valid0 = _errs30 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.sha256 !== undefined){
let data10 = data.sha256;
const _errs32 = errors;
const _errs33 = errors;
if(errors === _errs33){
if(typeof data10 === "string"){
if(!pattern18.test(data10)){
validate71.errors = [{instancePath:instancePath+"/sha256",schemaPath:"urn:definitely-secure:contract:context-package:1.0.0:context-package#/$defs/sha256/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""}];
return false;
}
}
else {
validate71.errors = [{instancePath:instancePath+"/sha256",schemaPath:"urn:definitely-secure:contract:context-package:1.0.0:context-package#/$defs/sha256/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs32 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.claim_id !== undefined){
let data11 = data.claim_id;
const _errs35 = errors;
const _errs36 = errors;
if(errors === _errs36){
if(typeof data11 === "string"){
if(!pattern4.test(data11)){
validate71.errors = [{instancePath:instancePath+"/claim_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate71.errors = [{instancePath:instancePath+"/claim_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs35 === errors;
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
validate71.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate71.errors = vErrors;
return errors === 0;
}
validate71.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate94(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate94.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((((data.spec_version === undefined) && (missing0 = "spec_version")) || ((data.kind === undefined) && (missing0 = "kind"))) || ((data.build_id === undefined) && (missing0 = "build_id"))) || ((data.request_identity === undefined) && (missing0 = "request_identity"))) || ((data.source === undefined) && (missing0 = "source"))) || ((data.normalization === undefined) && (missing0 = "normalization"))) || ((data.candidates === undefined) && (missing0 = "candidates"))){
validate94.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
const _errs1 = errors;
for(const key0 in data){
if(!(((((((key0 === "spec_version") || (key0 === "kind")) || (key0 === "build_id")) || (key0 === "request_identity")) || (key0 === "source")) || (key0 === "normalization")) || (key0 === "candidates"))){
validate94.errors = [{instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"}];
return false;
break;
}
}
if(_errs1 === errors){
if(data.spec_version !== undefined){
const _errs2 = errors;
if("1.0.0" !== data.spec_version){
validate94.errors = [{instancePath:instancePath+"/spec_version",schemaPath:"#/properties/spec_version/const",keyword:"const",params:{allowedValue: "1.0.0"},message:"must be equal to constant"}];
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
if("context-normalized-source" !== data.kind){
validate94.errors = [{instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "context-normalized-source"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.build_id !== undefined){
let data2 = data.build_id;
const _errs4 = errors;
const _errs5 = errors;
if(errors === _errs5){
if(typeof data2 === "string"){
if(!pattern4.test(data2)){
validate94.errors = [{instancePath:instancePath+"/build_id",schemaPath:"#/$defs/opaque/pattern",keyword:"pattern",params:{pattern: "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},message:"must match pattern \""+"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"+"\""}];
return false;
}
}
else {
validate94.errors = [{instancePath:instancePath+"/build_id",schemaPath:"#/$defs/opaque/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
var valid0 = _errs4 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.request_identity !== undefined){
const _errs7 = errors;
if(!(validate45(data.request_identity, {instancePath:instancePath+"/request_identity",parentData:data,parentDataProperty:"request_identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate45.errors : vErrors.concat(validate45.errors);
errors = vErrors.length;
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.source !== undefined){
const _errs8 = errors;
if(!(validate51(data.source, {instancePath:instancePath+"/source",parentData:data,parentDataProperty:"source",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate51.errors : vErrors.concat(validate51.errors);
errors = vErrors.length;
}
var valid0 = _errs8 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.normalization !== undefined){
const _errs9 = errors;
if("utf8-json-v1" !== data.normalization){
validate94.errors = [{instancePath:instancePath+"/normalization",schemaPath:"#/properties/normalization/const",keyword:"const",params:{allowedValue: "utf8-json-v1"},message:"must be equal to constant"}];
return false;
}
var valid0 = _errs9 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.candidates !== undefined){
let data6 = data.candidates;
const _errs10 = errors;
if(errors === _errs10){
if(Array.isArray(data6)){
if(data6.length > 10000){
validate94.errors = [{instancePath:instancePath+"/candidates",schemaPath:"#/properties/candidates/maxItems",keyword:"maxItems",params:{limit: 10000},message:"must NOT have more than 10000 items"}];
return false;
}
else {
if(data6.length < 0){
validate94.errors = [{instancePath:instancePath+"/candidates",schemaPath:"#/properties/candidates/minItems",keyword:"minItems",params:{limit: 0},message:"must NOT have fewer than 0 items"}];
return false;
}
else {
var valid2 = true;
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
const _errs12 = errors;
if(!(validate71(data6[i0], {instancePath:instancePath+"/candidates/" + i0,parentData:data6,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
errors = vErrors.length;
}
var valid2 = _errs12 === errors;
if(!valid2){
break;
}
}
}
}
}
else {
validate94.errors = [{instancePath:instancePath+"/candidates",schemaPath:"#/properties/candidates/type",keyword:"type",params:{type: "array"},message:"must be array"}];
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
}
}
}
else {
validate94.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate94.errors = vErrors;
return errors === 0;
}
validate94.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
