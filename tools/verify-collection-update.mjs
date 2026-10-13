import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {scanCollection} from './sync-collection-catalog.mjs';

// Non-browser tests of our local catalogue and login code. No CAD code runs.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const hash=value=>createHash('sha256').update(value).digest('hex');
const categories=await scanCollection(root),source=await read('source/js/home.js');
const generated=JSON.parse(source.match(/const categories = ([\s\S]*?);\s*\/\/ END GENERATED COLLECTION/)[1]);
assert.deepEqual(generated,categories);
assert.equal(categories.length,8);
assert.equal(categories.at(-1).folder,'08_Insertion_Block');
assert.equal(categories.at(-1).title,'INSERTION BLOCK');
assert.equal(categories.at(-1).programs.length,3);
assert.deepEqual(categories.at(-1).programs.map(program=>program.title),['Boundary Center Block Placement','Polyline Vertex Block Placement','Xline Intersection Insert']);
const programs=categories.flatMap(category=>category.programs);
assert.deepEqual(programs.map(program=>program.title).sort(),['Block Layer Recolor','Block Name Filter','Boundary Center Block Placement','Polyline Vertex Block Placement','Selection Slots','Xline Intersection Insert']);
assert.deepEqual(categories[0].programs.map(program=>program.path),['01_Block_and_Dynamic_Block/Block_Layer_Recolor/index.html']);
for(const program of programs){await access(path.join(root,'Autolisp Collection',program.path));assert.equal(program.version,null);assert.equal(program.updated,null);}
const script=await read('publish/js/login.js'),payload=await read('publish/js/encrypted-portfolio.js'),parentHtml=await read('publish/index.html');
const packageData=JSON.parse(payload.match(/Object\.freeze\((\{[\s\S]*\})\);/)[1]);
const savedKey=JSON.parse(await read('private/access-key.json'));
const elements=new Map(),windowHandlers=new Map();
function makeElement(id){return {value:'',type:'password',hidden:id==='portfolio-view',disabled:false,dataset:{},attributes:{},handlers:new Map(),contentWindow:id==='portfolio-frame'?{}:undefined,classList:{add(){},remove(){},toggle(){}},setAttribute(key,value){this.attributes[key]=value;},removeAttribute(key){delete this.attributes[key];if(key==='srcdoc')delete this.srcdoc;},cloneNode(){const copy=makeElement(id);copy.attributes={...this.attributes};return copy;},replaceWith(next){elements.set(id,next);},addEventListener(type,handler){this.handlers.set(type,handler);},focus(){},getContext(){return null;}};}
function element(id){if(!elements.has(id))elements.set(id,makeElement(id));return elements.get(id);}
let frame=element('portfolio-frame');
let destination=null;
const context=vm.createContext({document:{documentElement:{},hidden:false,getElementById:element,querySelectorAll:()=>[],addEventListener(){}},matchMedia:()=>({matches:true,addEventListener(){}}),addEventListener:(type,handler)=>windowHandlers.set(type,handler),window:{TA_ENCRYPTED_PORTFOLIO:packageData,crypto:webcrypto},crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,atob:value=>Buffer.from(value,'base64').toString('binary'),URL,location:{href:'file:///C:/TA/TA-PORTFOLIO/publish/index.html',assign:url=>{destination=url;}},DOMParser:class{parseFromString(html){return {getElementById:()=>({textContent:html.match(/<script type="application\/json" id="catalog-links">([\s\S]*?)<\/script>/)[1]})};}},performance:{now:()=>0},clearTimeout,setTimeout,requestAnimationFrame:()=>1,cancelAnimationFrame(){},innerWidth:1280,innerHeight:900,devicePixelRatio:1});
vm.runInContext(script,context,{timeout:2000});
const message=windowHandlers.get('message'),send=(relative,sourceWindow=frame.contentWindow)=>message({source:sourceWindow,data:{type:'TA_OPEN_COLLECTION_PAGE',path:relative}});
send(programs[0].path);assert.equal(destination,null,'Locked catalogue must not navigate');
element('password').value=savedKey.password;
await element('unlock-form').handlers.get('submit')({preventDefault(){}});
savedKey.password='';
frame=element('portfolio-frame');message({source:frame.contentWindow,data:{type:'TA_PORTFOLIO_READY'}});
assert.equal(element('portfolio-view').hidden,false,'Local decrypt should expose the directory');
assert.equal(element('password').value,'','Password input must be cleared');
let html=frame.srcdoc;
assert.equal(hash(html),JSON.parse(await read('private/build-checks.json')).sourceSha256);
const expectedPaths=programs.map(program=>program.path);
assert.deepEqual(JSON.parse(html.match(/id="catalog-links">([\s\S]*?)<\/script>/)[1]),expectedPaths);
assert.ok(html.includes('INSERTION BLOCK'));
const childScript=html.match(/<script>([\s\S]*?)<\/script>/)[1],childStyle=html.match(/<style>([\s\S]*?)<\/style>/)[1];
assert.ok(childScript.includes('TA_PORTFOLIO_READY'),'Bundled child must announce readiness after building the catalogue');
for(const child of [childScript,childStyle])assert.ok(parentHtml.includes("sha256-"+createHash('sha256').update(child).digest('base64')),'Parent CSP hash must match the decrypted child');
assert.ok(parentHtml.includes('sandbox="allow-scripts"'),'Keep iframe sandbox unchanged');
assert.ok(!payload.includes('INSERTION BLOCK')&&!payload.includes('Block Name Filter'),'No plaintext names in the encrypted payload');
for(const invalid of ['../private/access-key.json','https://example.com','08_Insertion_Block/not-listed/index.html',programs[0].path+'?query=1']){destination=null;send(invalid);assert.equal(destination,null);}
send(programs[0].path,{});assert.equal(destination,null,'Reject messages from other windows');
for(const program of programs){destination=null;send(program.path);assert.equal(destination,new URL(program.path,'file:///C:/TA/TA-PORTFOLIO/Autolisp%20Collection/').href);}
context.location.href='https://example.com/TA-PORTFOLIO/publish/index.html';destination=null;send(programs[0].path);assert.equal(destination,new URL(programs[0].path,'https://example.com/TA-PORTFOLIO/Autolisp%20Collection/').href);
element('lock-button').handlers.get('click')();destination=null;send(programs[0].path);assert.equal(destination,null,'Relock must release links');
const originalGif=await readFile('C:/Users/popul/Videos/20261011-1555-58.9560393.gif'),packagedGif=await readFile(path.join(root,'Autolisp Collection/03_Selection_and_Inspection/Block_Name_Filter/assets/gifs/block-name-filter.gif'));assert.equal(hash(originalGif),hash(packagedGif));
html='';
console.log('Passed: folder inventory (8 categories / 6 pages), exact generated data, existing paths, local client decryption, CSP hashes, password clearing, allowed navigation for file/HTTPS, rejection of unlisted paths/foreign messages, relock, and unchanged GIF. Browser layout/playback not tested. No credentials printed.');
