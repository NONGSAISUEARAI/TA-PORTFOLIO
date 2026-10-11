import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const relative=process.argv[2]||'03_Selection_and_Inspection/Block_Name_Filter';
const examples={
  '08_Insertion_Block/Boundary_Center_Block_Placement':{src:'assets/gifs/boundary-center-block-placement.gif',original:'C:/Users/popul/AppData/Local/Temp/codex-clipboard-2a3541d9-df0f-4106-9053-1a3b8f3ea225.gif'},
  '03_Selection_and_Inspection/Block_Name_Filter':{src:'assets/gifs/block-name-filter.gif',original:'C:/Users/popul/Videos/20261011-1555-58.9560393.gif'},
  '08_Insertion_Block/Polyline_Vertex_Block_Placement':{src:'assets/gifs/polyline-vertex-block-placement.gif',original:'C:/Users/popul/AppData/Local/Temp/codex-clipboard-50f9cf76-c629-4d9a-b60a-dfba98abed3c.gif'}
};
assert.ok(Object.hasOwn(examples,relative),'Only explicitly listed local showcase fixtures are allowed');
const example=examples[relative],pageRoot=path.join(root,'Autolisp Collection',relative);
const html=await readFile(path.join(pageRoot,'index.html'),'utf8');
const script=await readFile(path.join(pageRoot,'assets/page.js'),'utf8');
function fixture(reduced=false,hidden=false){
  const elements=new Map(),events=new Map(),documentEvents=new Map(),motionEvents=new Map();
  function element(id){if(!elements.has(id))elements.set(id,{hidden:id==='demo-gif',open:false,dataset:{},textContent:'',attributes:{},handlers:new Map(),addEventListener(type,handler){this.handlers.set(type,handler);},setAttribute(key,value){this.attributes[key]=value;},removeAttribute(key){delete this.attributes[key];if(key==='src')delete this.src;},getContext(){return null;},showModal(){this.open=true;},close(){if(this.open){this.open=false;this.handlers.get('close')?.();}}});return elements.get(id);}
  const translations=[...html.matchAll(/<[^>]+data-i18n="([^"]+)"[^>]*>([\s\S]*?)<\/[^>]+>/g)].map(match=>({dataset:{i18n:match[1]},textContent:match[2].replace(/<br\s*\/?\s*>/g,'\n').replace(/<[^>]+>/g,'')}));
  const document={hidden,documentElement:{},getElementById:element,querySelectorAll:()=>translations,addEventListener:(type,handler)=>documentEvents.set(type,handler)};
  const query={matches:reduced,addEventListener:(type,handler)=>motionEvents.set(type,handler)};
  vm.runInNewContext(script,{document,matchMedia:()=>query,addEventListener:(type,handler)=>events.set(type,handler),navigator:{clipboard:{writeText:async()=>{}}},performance:{now:()=>0},requestAnimationFrame:()=>1,cancelAnimationFrame(){},innerWidth:1280,innerHeight:900,devicePixelRatio:1},{timeout:2000});
  return {element,translations,click:id=>element(id).handlers.get('click')(),event:type=>events.get(type)(),visible(value){document.hidden=!value;documentEvents.get('visibilitychange')();},reduce(value){query.matches=value;motionEvents.get('change')({matches:value});}};
}
const src=example.src;
function playing(test){assert.equal(test.element('demo-gif').hidden,false);assert.equal(test.element('demo-gif').src,src);assert.equal(test.element('gif-placeholder').hidden,true);assert.equal(test.element('toggle-gif').attributes['aria-pressed'],'true');}
function stopped(test){assert.equal(test.element('demo-gif').hidden,true);assert.equal(test.element('demo-gif').src,undefined);assert.equal(test.element('gif-placeholder').hidden,false);}

const normal=fixture();playing(normal);assert.equal(normal.element('toggle-gif').textContent,'หยุด GIF ■');
normal.visible(false);stopped(normal);normal.visible(true);playing(normal);
normal.click('toggle-gif');stopped(normal);normal.visible(false);normal.visible(true);stopped(normal);normal.event('pagehide');normal.event('pageshow');stopped(normal);
normal.click('play-gif');playing(normal);normal.event('pagehide');stopped(normal);normal.event('pageshow');playing(normal);
normal.click('language');assert.equal(normal.element('toggle-gif').textContent,'Stop GIF ■');for(const node of normal.translations)assert.ok(typeof node.textContent==='string'&&node.textContent.length>0,'Missing English text: '+node.dataset.i18n);normal.click('toggle-gif');assert.equal(normal.element('toggle-gif').textContent,'Play GIF ▶');normal.click('toggle-gif');playing(normal);
normal.click('expand-media');stopped(normal);assert.equal(normal.element('dialog-gif').src,src);assert.equal(normal.element('media-dialog').open,true);normal.click('close-dialog');assert.equal(normal.element('dialog-gif').src,undefined);stopped(normal);
const accessible=fixture(true);stopped(accessible);accessible.click('play-gif');playing(accessible);accessible.reduce(true);stopped(accessible);accessible.reduce(false);playing(accessible);
const background=fixture(false,true);stopped(background);background.visible(true);playing(background);
const failed=fixture();failed.element('demo-gif').handlers.get('error')();stopped(failed);assert.ok(failed.element('feedback').textContent);failed.event('pageshow');stopped(failed);failed.visible(false);failed.visible(true);stopped(failed);failed.click('play-gif');playing(failed);assert.equal(failed.element('feedback').textContent,'');
const packaged=await readFile(path.join(pageRoot,src)),original=await readFile(example.original);
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');assert.equal(hash(packaged),hash(original));
console.log('Passed: visible-page GIF autoplay, reduced-motion/background exceptions, manual stop/play, Back and tab return, TH/EN controls, expand cleanup, error/manual retry, unchanged original GIF. Simulated DOM tests; actual browser playback not verified.');
