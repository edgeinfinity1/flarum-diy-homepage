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

test('quoted defaults apply only to known empty values and retain zero, false and whitespace',()=>{
  for (const value of [undefined,null,'']) assert.equal(interpolateText('{username, "Guest"}',{username:value}), 'Guest');
  assert.equal(interpolateText('{username, "Guest"}',{username:'Alice'}), 'Alice');
  assert.equal(interpolateText('{username, ""}',{username:null},{username:'Visitor'}), '');
  for (const value of [0,false,' ']) assert.equal(interpolateText('{forumTitle, "Default"}',{forumTitle:value}), String(value));
  assert.equal(interpolateText('{ username , "游客" }',{username:null}), '游客');
  assert.equal(interpolateText('{typo, "Guest"} {constructor, "Guest"}',{}), '{typo, "Guest"} {constructor, "Guest"}');
  assert.equal(interpolateText('{username, "Guest"}',Object.create({username:null})), '{username, "Guest"}');
});
test('defaults use JSON strings with commas, braces, quotes, backslashes and Unicode',()=>{
  for(const fallback of ['Guest, friend','Hello {username}','"Guest"','C:\\Users','你好 👋','Line 1\nLine 2','<img src=x onerror=alert(1)>','']) {
    const token='{username, '+JSON.stringify(fallback)+'}';
    assert.equal(interpolateText(token,{username:null}),fallback);
    assert.equal(interpolateText('{'+token+'}',{username:'Alice'}),token);
  }
  assert.equal(interpolateText('{username, "\\u6e38\\u5ba2"}',{username:null}),'游客');
  assert.equal(interpolateText('{username}',{username:'{forumTitle, "Other"}'}),'{forumTitle, "Other"}');
});
test('malformed or nested defaults remain visible and following valid tokens work',()=>{
  const invalid=['{username, Guest}',"{username, 'Guest'}",'{username, 0}','{username, null}','{username, "a", "b"}','{username, "bad\\q"}','{username, "line\nbreak"}','{username, {forumTitle}}','{username, "Guest"','{{username, Guest}}'];
  for(const token of invalid) assert.equal(interpolateText(token,{username:null,forumTitle:'Forum'}),token);
  assert.equal(interpolateText('{username, Guest} / {username, "Guest"}',{username:null}),'{username, Guest} / Guest');
  const long='{'+'x'.repeat(12000);assert.equal(interpolateText(long,{username:null}),long);
});
test('explicit defaults override guest labels while legacy identity fallbacks remain intact',()=>{
  app.session.user=null;
  assert.equal(utils.displayText('{username, "Guest"}/{displayName, "朋友"}'),'Guest/朋友');
  assert.equal(utils.displayText('{username, ""}'),'');
  assert.equal(utils.displayText('{username}'),'edgeinfinity-diy-homepage.forum.guest');
  app.session.user={username:()=> 'Alice',displayName:()=> ''};
  assert.equal(utils.displayText('{username, "Guest"}/{displayName, "朋友"}'),'Alice/朋友');
  assert.equal(utils.displayText('{displayName}'),'Alice');
  app.session.user={username:()=> 'Alice',displayName:()=> 'A & B'};
  assert.equal(utils.displayText('{username, "Guest"}/{displayName, "朋友"}'),'Alice/A & B');
  const attribute=app.forum.attribute;
  try { app.forum.attribute=()=>''; assert.equal(utils.displayText('{forumTitle, "Community"}/{forumDescription, ""}'),'Community/'); }
  finally {app.forum.attribute=attribute;app.session.user=null;}
});
