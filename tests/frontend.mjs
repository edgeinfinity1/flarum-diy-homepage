import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root=new URL('../js/src/common/',import.meta.url);
const source=name=>readFileSync(new URL(name,root),'utf8');
const load=async name=>import('data:text/javascript;base64,'+Buffer.from(source(name)).toString('base64'));
const {interpolateText}=await load('textVariables.js');
const {actionClass,statsFontStyle}=await load('widgetOptions.js');
const app={session:{user:null},forum:{attribute:key=>({title:'Forum',description:'Description'})[key]},translator:{trans:key=>key},diyHomepage:{get:()=>null}};
const utils=new Function('app','extractText','interpolateText','window',source('utils.js').replace(/^import .*;\n/gm,'').replaceAll('export ','')+'\nreturn {validConfig,displayText};')(app,x=>String(x),interpolateText,{location:{origin:'https://example.test',href:'https://example.test/'}});
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

const {withFofHeading}=await load('fofHeading.js');
test('FoF override is isolated per imported component and preserves provider behavior',()=>{
  class Provider {
    constructor(attrs){this.attrs=attrs;}
    header(){return ['provider title','provider subtitle'];}
    content(){return this.attrs.state;}
    view(){return this.attrs.state.loading?null:{header:this.header(),content:this.content()};}
  }
  const original=Provider.prototype.header, render=w=>w.showTitle===false?null:{title:w.title,subtitle:w.subtitle,link:w.linkUrl};
  const Adapted=withFofHeading(Provider,render);
  assert.equal(withFofHeading(Provider,render),Adapted);
  const state={body:'body'};
  const first=new Adapted({state,diyHomepageWidget:{overrideHeading:true,title:'First',subtitle:'Sub',linkUrl:'/all'}});
  const second=new Adapted({state,diyHomepageWidget:{overrideHeading:true,title:'Second'}});
  assert.equal(first.view().header.title,'First');assert.equal(second.view().header.title,'Second');
  assert.equal(first.content(),state);assert.equal(Provider.prototype.header,original);
  assert.deepEqual(new Provider({state}).header(),['provider title','provider subtitle']);
  first.attrs.diyHomepageWidget.overrideHeading=false;assert.deepEqual(first.header(),['provider title','provider subtitle']);
  first.attrs.diyHomepageWidget.overrideHeading=true;first.attrs.diyHomepageWidget.showTitle=false;assert.equal(first.header(),null);
  state.loading=true;assert.equal(first.view(),null);
  assert.equal(withFofHeading({view(){}},render),null);
  assert.equal(withFofHeading(class {view(){}},render),null);
});
test('FoF override validates and survives JSON round trips',()=>{
  const config=value=>JSON.stringify({version:1,widgets:[{id:'fof',type:'fof',region:'main',overrideHeading:value,title:'Saved',settings:{widgetId:'provider:widget'}}]});
  for(const value of [true,false]) {const parsed=utils.validConfig(config(value));assert.equal(parsed.widgets[0].overrideHeading,value);assert.equal(parsed.widgets[0].title,'Saved');}
  for(const value of ['true',1,{},[]])assert.throws(()=>utils.validConfig(config(value)));
});


test('rendered widget heading style is independent of FoF override and honors page defaults',()=>{
  const originalAttribute=app.forum.attribute,originalGet=app.diyHomepage.get;
  let config={version:1,appearance:{emphasizedTitles:false},widgets:[]};
  app.forum.attribute=key=>key==='diyHomepage.config'?JSON.stringify(config):originalAttribute(key);
  const presentation=new Function('app','parseConfig',source('presentation.js').replace(/^import .*;\n/gm,'').replaceAll('export ','')+'\nreturn {emphasizedTitle,radiusStyle};')(app,JSON.parse);
  const Card=new Function('app','Component','Background','WidgetHeading','emphasizedTitle','radiusStyle','widgetTitle','visible','m',
    source('../forum/components/WidgetCard.js').replace(/^import .*;\n/gm,'').replace('export default class WidgetCard','class WidgetCard')+'\nreturn WidgetCard;')(
      app,class {},{}, {},presentation.emphasizedTitle,presentation.radiusStyle,w=>w.title||w.id,()=>true,(tag,attrs,children)=>({tag,attrs,children}));
  app.diyHomepage.get=()=>({component:{}});
  try {
    for(const type of ['fof','stats'])for(const pageDefault of [false,true])for(const overrideHeading of [undefined,false,true])for(const titleStyle of [undefined,'inherit','fof','emphasized']){
      config.appearance.emphasizedTitles=pageDefault;
      const widget={id:'sample',type,overrideHeading,titleStyle},card=new Card();card.attrs={widget};
      const rendered=card.view(),expected=titleStyle==='emphasized'||(titleStyle!=='fof'&&pageDefault);
      assert.equal(rendered.attrs.className.includes('DiyHome-widget--emphasized'),expected,JSON.stringify({type,pageDefault,overrideHeading,titleStyle}));
      assert.equal(rendered.attrs.className.includes('DiyHome-widget--fofTitles'),!expected);
      if(type==='fof')assert.equal(rendered.children[0],false,'style alone must not create a replacement heading');
    }
  }finally{app.forum.attribute=originalAttribute;app.diyHomepage.get=originalGet;}
});

test('FoF style and saved override content survive configuration round trips independently',()=>{
  for(const overrideHeading of [false,true])for(const titleStyle of ['inherit','fof','emphasized']){
    const widget={id:'sample',type:'fof',region:'main',overrideHeading,titleStyle,title:'Saved title',subtitle:'Saved subtitle',linkUrl:'/all',settings:{widgetId:'provider:widget'}};
    const parsed=utils.validConfig(JSON.stringify({version:1,widgets:[widget]}));
    assert.deepEqual(parsed.widgets[0],widget);
  }
});
