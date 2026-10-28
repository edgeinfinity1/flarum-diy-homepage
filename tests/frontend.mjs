import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root=new URL('../js/src/common/',import.meta.url);
const source=name=>readFileSync(new URL(name,root),'utf8');
const load=async name=>import('data:text/javascript;base64,'+Buffer.from(source(name)).toString('base64'));
const {interpolateText}=await load('textVariables.js');
const {actionClass,statsFontStyle}=await load('widgetOptions.js');
const app={session:{user:null},forum:{attribute:key=>({title:'Forum',description:'Description'})[key]},translator:{trans:key=>key},diyHomepage:{get:()=>null}};
const utils=new Function('app','extractText','interpolateText',source('utils.js').replace(/^import .*;\n/gm,'').replaceAll('export ','')+'\nreturn {validConfig,displayText};')(app,x=>String(x),interpolateText);
test('variables are single pass, literal-safe, own-property only and preserve unknown names',()=>{
  assert.equal(interpolateText('Hi {username} / {displayName}',{username:'Alice',displayName:'艾丽丝'}),'Hi Alice / 艾丽丝');
  assert.equal(interpolateText('{{username}} {unknown} {constructor}',{username:'Alice'}),'{username} {unknown} {constructor}');
  assert.equal(interpolateText('{username}',{username:'<img onerror=x>{forumTitle}'}),'<img onerror=x>{forumTitle}');
  assert.equal(interpolateText('no variables',{}),'no variables');
});
test('variables resolve current actor on each render',()=>{
  assert.equal(utils.displayText('{forumTitle}'), 'Forum');
  assert.equal(utils.displayText('{username}'),'edgeinfinity-diy-homepage.forum.guest');
  app.session.user={username:()=> 'Alice',displayName:()=> 'A & B'};
  assert.equal(utils.displayText('{username}/{displayName}'),'Alice/A & B');
  app.session.user=null;
});
test('explicit button tones survive ordering; auto keeps old classes',()=>{
  assert.equal(actionClass({style:'primary'}),'Button Button--primary');
  assert.equal(actionClass({style:'secondary'},'Button Button--primary'),'Button DiyHome-secondaryAction');
  assert.equal(actionClass({},'Button Button--primary'),'Button Button--primary');
  assert.equal(actionClass({style:'auto'}),'DiyHome-action');
});
test('fonts inherit by default and remain independently configurable',()=>{
  assert.deepEqual(statsFontStyle({},'number'),{});
  assert.deepEqual(statsFontStyle({statsNumberFontSize:38,statsNumberFontWeight:'normal',statsNumberFontFamily:'Georgia, serif'},'number'),{fontSize:'38px',fontFamily:'Georgia, serif',fontWeight:'normal'});
  assert.deepEqual(statsFontStyle({statsNumberFontSize:38},'label'),{});
  assert.deepEqual(statsFontStyle({statsLabelFontFamily:'serif; color:red'},'label'),{});
});
test('new JSON fields validate on the client',()=>{
  const config=patch=>JSON.stringify({version:1,widgets:[{id:'sample',type:'stats',region:'main',...patch}]});
  for(const patch of [{noBottomPadding:true,noBottomMargin:false},{settings:{dividerStyle:'line',height:0}},{settings:{statsLabelFontFamily:'Georgia, serif',statsNumberFontWeight:'normal',statsNumberFontSize:50}},{settings:{actions:[{action:'all',style:'secondary'}]}}])assert.doesNotThrow(()=>utils.validConfig(config(patch)));
  for(const patch of [{noBottomPadding:'true'},{settings:{height:false}},{settings:{height:301}},{settings:{dividerStyle:'bad'}},{settings:{statsNumberFontSize:false}},{settings:{statsLabelFontFamily:'serif; color:red'}},{settings:{statsLabelFontWeight:'invalid'}},{settings:{actions:[{style:'invalid'}]}}])assert.throws(()=>utils.validConfig(config(patch)));
});
