import {readdir,readFile,writeFile,lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Read HTML as data only. Do not load or execute any command, CAD or page code.
const labels={
  '01_Block_and_Dynamic_Block':{id:'block-dynamic',title:'Block & Dynamic Block',th:'บล็อกและไดนามิกบล็อก',en:'Block and dynamic block workflows'},
  '02_Attributes_Text_and_Numbering':{id:'attributes-text',title:'Attributes, Text & Numbering',th:'แอตทริบิวต์ ข้อความ และการรันเลข',en:'Attributes, text and numbering workflows'},
  '03_Selection_and_Inspection':{id:'selection-inspection',title:'Selection & Inspection',th:'การเลือกและตรวจสอบวัตถุ',en:'Object selection and inspection workflows'},
  '04_Geometry_and_Placement':{id:'geometry-placement',title:'Geometry & Placement',th:'เรขาคณิตและการจัดวาง',en:'Geometry and placement workflows'},
  '05_Drawing_Standards':{id:'drawing-standards',title:'Drawing Standards',th:'มาตรฐานงานเขียนแบบ',en:'Drawing standards workflows'},
  '06_Layout_and_Documentation':{id:'layout-documentation',title:'Layout & Documentation',th:'เลย์เอาต์และเอกสารแบบ',en:'Layout and documentation workflows'},
  '07_Data_and_Reporting':{id:'data-reporting',title:'Data & Reporting',th:'ข้อมูลและรายงาน',en:'Data and reporting workflows'},
  '08_Insertion_Block':{id:'insertion-block',title:'INSERTION BLOCK',th:'การแทรกและวางบล็อก',en:'Block insertion and placement'}
};
function decodeText(value){return value.replace(/&(?:amp|lt|gt|quot|apos|#39|#\d+|#x[\da-f]+);/gi,entity=>{const map={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'"};if(map[entity.toLowerCase()])return map[entity.toLowerCase()];const code=entity.toLowerCase().startsWith('&#x')?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10);return code>0&&code<=0x10ffff?String.fromCodePoint(code):'';});}
export async function scanCollection(root){
  const base=path.join(root,'Autolisp Collection'),categories=[];
  const folders=(await readdir(base,{withFileTypes:true})).filter(item=>item.isDirectory()&&!item.isSymbolicLink()&&/^\d{2}_[A-Za-z0-9_]+$/.test(item.name)).sort((a,b)=>a.name.localeCompare(b.name));
  for(const folder of folders){
    const fallback=folder.name.slice(3).replaceAll('_',' '),category={folder:folder.name,number:folder.name.slice(0,2),...(labels[folder.name]||{id:'category-'+folder.name.toLowerCase().replaceAll('_','-'),title:fallback,th:fallback,en:fallback}),programs:[]};
    const children=(await readdir(path.join(base,folder.name),{withFileTypes:true})).filter(item=>item.isDirectory()&&!item.isSymbolicLink()&&/^[A-Za-z0-9_-]+$/.test(item.name)).sort((a,b)=>a.name.localeCompare(b.name));
    for(const child of children){
      const relative=folder.name+'/'+child.name+'/index.html',page=path.join(base,relative);
      let stat;try{stat=await lstat(page);}catch(error){if(error.code==='ENOENT')continue;throw error;}
      if(!stat.isFile()||stat.isSymbolicLink())continue;
      const html=await readFile(page,'utf8'),rawTitle=html.match(/<title\b[^>]*>([^<]*)<\/title>/i)?.[1];
      const title=rawTitle?decodeText(rawTitle).replace(/\s*[—–|]\s*AutoLISP Collection\s*$/i,'').trim():child.name.replaceAll('_',' ');
      category.programs.push({title:title||child.name,path:relative,version:null,updated:null});
    }
    categories.push(category);
  }
  if(!categories.length)throw new Error('No numbered collection categories found; refusing to replace the directory');
  if(new Set(categories.map(category=>category.id)).size!==categories.length)throw new Error('Duplicate category IDs');
  return categories;
}
export async function syncCollectionCatalog(root){
  const categories=await scanCollection(root),jsPath=path.join(root,'source','js','home.js'),js=await readFile(jsPath,'utf8');
  const marker=/\/\/ BEGIN GENERATED COLLECTION[\s\S]*?\/\/ END GENERATED COLLECTION/;
  if(!marker.test(js))throw new Error('Catalog markers missing; renderer must be reviewed before syncing');
  const generated='// BEGIN GENERATED COLLECTION\n  const categories = '+JSON.stringify(categories,null,2)+';\n  // END GENERATED COLLECTION';
  await writeFile(jsPath,js.replace(marker,()=>generated),'utf8');
  console.log('Collection scan: '+categories.length+' categories, '+categories.reduce((count,category)=>count+category.programs.length,0)+' command pages.');
  return categories;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await syncCollectionCatalog(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
