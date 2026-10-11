import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {webcrypto,createHash} from 'node:crypto';
import vm from 'node:vm';

// Execute only our website login code against simulated DOM/storage/lifecycle.
// This is not a browser compatibility or visual test. No CAD code runs.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const script=await read('publish/js/login.js');
const payload=JSON.parse((await read('publish/js/encrypted-portfolio.js')).match(/Object\.freeze\((\{[\s\S]*\})\);/)[1]);
const credential=JSON.parse(await read('private/access-key.json'));
const tabStore=new Map();
const storageFor=store=>({getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value),removeItem:key=>store.delete(key)});
function page(storage=storageFor(tabStore),packageData=payload,href='file:///C:/TA/TA-PORTFOLIO/publish/index.html'){
  const elements=new Map(),events=new Map();
  const longTimers=new Map();let timerId=100000;
  function taskTimeout(callback,delay){if(delay===8000){const id=++timerId;longTimers.set(id,callback);return id;}return setTimeout(callback,delay);}
  function taskClearTimeout(id){if(longTimers.has(id))longTimers.delete(id);else clearTimeout(id);}
  function makeElement(id){return {value:'',type:'password',hidden:id==='portfolio-view',disabled:false,dataset:{},attributes:{},handlers:new Map(),contentWindow:id==='portfolio-frame'?{}:undefined,classList:{add(){},remove(){},toggle(){}},setAttribute(key,value){this.attributes[key]=value;},removeAttribute(key){delete this.attributes[key];if(key==='srcdoc')delete this.srcdoc;},cloneNode(){const copy=makeElement(id);copy.attributes={...this.attributes};return copy;},replaceWith(next){elements.set(id,next);},addEventListener(type,handler){this.handlers.set(type,handler);},focus(){},getContext(){return null;}};}
  function element(id){
    if(!elements.has(id))elements.set(id,makeElement(id));
    return elements.get(id);
  }
  const frame=element('portfolio-frame');frame.contentWindow={};
  const context=vm.createContext({document:{documentElement:{},hidden:false,getElementById:element,querySelectorAll:()=>[],addEventListener(){}},matchMedia:()=>({matches:true,addEventListener(){}}),addEventListener:(type,handler)=>events.set(type,handler),window:{TA_ENCRYPTED_PORTFOLIO:packageData,crypto:webcrypto},crypto:webcrypto,sessionStorage:storage,TextEncoder,TextDecoder,Uint8Array,atob:value=>Buffer.from(value,'base64').toString('binary'),URL,location:{href,assign(){}},DOMParser:class{parseFromString(html){return {getElementById:()=>({textContent:html.match(/<script type="application\/json" id="catalog-links">([\s\S]*?)<\/script>/)?.[1]||'[]'})};}},performance:{now:()=>0},clearTimeout:taskClearTimeout,setTimeout:taskTimeout,requestAnimationFrame:()=>1,cancelAnimationFrame(){},innerWidth:1280,innerHeight:900,devicePixelRatio:1});
  vm.runInContext(script,context,{timeout:2000});
  const ready=(sourceWindow=element('portfolio-frame').contentWindow)=>events.get('message')({source:sourceWindow,data:{type:'TA_PORTFOLIO_READY'}});
  return {element,events,get frame(){return element('portfolio-frame');},ready,expireFrameWatch(){for(const callback of [...longTimers.values()])callback();longTimers.clear();},lock:()=>element('lock-button').handlers.get('click')(),async unlock(){element('password').value=credential.password;await element('unlock-form').handlers.get('submit')({preventDefault(){}});ready();}};
}
async function settle(){for(let i=0;i<12;i++)await new Promise(resolve=>setTimeout(resolve,5));}
async function restored(instance,previousFrame){for(let i=0;i<200&&(instance.element('portfolio-view').hidden||(previousFrame&&instance.frame===previousFrame));i++)await new Promise(resolve=>setTimeout(resolve,5));assert.equal(instance.element('portfolio-view').hidden,false,'Expected session restore');if(previousFrame)assert.notEqual(instance.frame,previousFrame,'History return must replace the child frame');instance.ready();}
const locked=instance=>assert.equal(instance.element('portfolio-view').hidden,true);

try{
  let first=page();await settle();locked(first);assert.equal(tabStore.size,0);
  await first.unlock();assert.equal(first.element('portfolio-view').hidden,false);assert.equal(first.element('password').value,'');
  assert.equal(tabStore.size,1);
  const [cacheKey,cacheRaw]=[...tabStore][0],cache=JSON.parse(cacheRaw);
  assert.deepEqual(Object.keys(cache).sort(),['fingerprint','html','version']);
  assert.equal(cache.version,1);assert.equal(createHash('sha256').update(cache.html).digest('hex'),payload.plaintextSha256);
  assert.ok(!cacheRaw.includes(credential.password),'No stored password');
  assert.equal(first.element('viewer-state').dataset.i18n,'unlocked');

  // Reload reuses tab storage, but no entered password or live DOM from first page.
  const reload=page();await restored(reload);assert.equal(reload.frame.srcdoc,cache.html);assert.equal(reload.element('password').value,'');
  const beforeBack=first.frame;
  first.events.get('pagehide')();assert.equal(first.frame,beforeBack);assert.equal(first.frame.srcdoc,cache.html,'pagehide must not initiate a blank child navigation');assert.equal(tabStore.size,1);
  first.events.get('pageshow')();await restored(first,beforeBack);assert.equal(first.frame.srcdoc,cache.html);
  // Regression: the viewer bar is visible but its iframe is blank, as in the screenshot.
  let brokenFrame=reload.frame;brokenFrame.removeAttribute('srcdoc');reload.events.get('pageshow')();await restored(reload,brokenFrame);assert.equal(reload.frame.srcdoc,cache.html);
  // A stale child can also be blank despite retaining its srcdoc attribute.
  brokenFrame=reload.frame;reload.events.get('popstate')();await restored(reload,brokenFrame);assert.equal(reload.frame.srcdoc,cache.html);
  reload.ready(brokenFrame.contentWindow);assert.equal(reload.element('viewer-state').dataset.i18n,'unlocked');
  const newTab=page(storageFor(new Map()));await settle();locked(newTab);
  const otherPath=page(storageFor(tabStore),payload,'file:///C:/another/publish/index.html');await settle();locked(otherPath);

  // Lock discards the cache, rejects navigation, and the next reload stays locked.
  first.lock();locked(first);assert.equal(first.frame.srcdoc,undefined);assert.equal(tabStore.size,0);
  const afterLock=page();await settle();locked(afterLock);
  afterLock.events.get('pageshow')();afterLock.events.get('popstate')();await settle();locked(afterLock);

  // Corrupt, oversized and stale sessions are rejected without executing HTML.
  for(const raw of ['not-json',JSON.stringify({...cache,version:2}),JSON.stringify({...cache,html:cache.html+'<script>malicious()</script>'}),JSON.stringify({...cache,fingerprint:'old-bundle'}),'x'.repeat(10*1024*1024+1)]){
    tabStore.set(cacheKey,raw);const invalid=page();await settle();locked(invalid);assert.equal(tabStore.size,0);assert.equal(invalid.frame.srcdoc,undefined);
  }
  tabStore.set(cacheKey,cacheRaw);const rebuilt=page(storageFor(tabStore),{...payload,iv:Buffer.alloc(12).toString('base64')});await settle();locked(rebuilt);assert.equal(tabStore.size,0);

  // An explicit lock during asynchronous restore must win.
  tabStore.set(cacheKey,cacheRaw);const racingLock=page();racingLock.lock();await settle();locked(racingLock);assert.equal(tabStore.size,0);
  tabStore.set(cacheKey,cacheRaw);const hiddenRestore=page();hiddenRestore.events.get('pagehide')();await settle();locked(hiddenRestore);assert.equal(tabStore.size,1);
  hiddenRestore.events.get('pageshow')();await restored(hiddenRestore);hiddenRestore.lock();
  // Lock after a history callback was queued must cancel restoration.
  tabStore.set(cacheKey,cacheRaw);const queued=page();await restored(queued);queued.events.get('pageshow')();queued.lock();await settle();locked(queued);assert.equal(tabStore.size,0);
  // A valid unlock is not proof that the child script actually ran.
  tabStore.set(cacheKey,cacheRaw);const notReady=page();
  for(let i=0;i<200&&notReady.element('portfolio-view').hidden;i++)await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(notReady.element('portfolio-view').hidden,false);assert.equal(notReady.element('viewer-state').dataset.i18n,'loadingView');
  notReady.ready({});assert.equal(notReady.element('viewer-state').dataset.i18n,'loadingView','Reject readiness from another window');
  notReady.expireFrameWatch();locked(notReady);assert.ok(notReady.element('form-status').textContent);assert.equal(notReady.frame.srcdoc,undefined);notReady.lock();

  // Blocked/over-quota storage still permits regular password-only unlock.
  for(const storage of [{getItem(){throw new Error('SecurityError');},setItem(){throw new Error('SecurityError');},removeItem(){throw new Error('SecurityError');}},{getItem(){return null;},setItem(){throw new Error('QuotaExceededError');},removeItem(){}}]){
    const unavailable=page(storage);await settle();locked(unavailable);await unavailable.unlock();assert.equal(unavailable.element('portfolio-view').hidden,false);assert.equal(unavailable.element('viewer-state').dataset.i18n,'temporaryOnly');unavailable.lock();
  }
  const duringDecrypt=page();const pending=duringDecrypt.unlock();duringDecrypt.lock();await pending;locked(duringDecrypt);assert.equal(tabStore.size,0);
  assert.ok(!/\blocalStorage\b|document\.cookie|window\.name/.test(script),'No durable fallback');
  console.log('Passed: one unlock per tab, reload, visible-viewer/blank-frame Back regression, fresh iframe on pageshow/popstate, no blank child navigation on pagehide, validated child readiness/timeout, new-tab/path isolation, explicit lock/history races, tamper/stale/oversize/rebuild rejection, blocked/quota fallback, no password/key storage. Simulated DOM tests only; actual file/browser behavior not verified. No credentials printed.');
}finally{credential.password='';tabStore.clear();}
