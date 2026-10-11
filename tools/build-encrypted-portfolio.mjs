import {readFile,writeFile,mkdir,copyFile,access} from "node:fs/promises";
import path from "node:path";
import {webcrypto,randomBytes,createHash} from "node:crypto";
import {fileURLToPath} from "node:url";

// Local packaging only. Never print passwords or place plaintext in publish/.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const inputRoot=path.resolve(process.argv[2]||path.join(root,"source"));
const sourceDir=path.join(root,"source"),privateDir=path.join(root,"private"),publishDir=path.join(root,"publish");
const sourceFiles=["index.html","css/home.css","js/home.js"];
for(const relative of sourceFiles){const destination=path.join(sourceDir,relative);await mkdir(path.dirname(destination),{recursive:true});const original=path.join(inputRoot,relative);if(path.resolve(original)!==path.resolve(destination))await copyFile(original,destination);}
let html=(await readFile(path.join(sourceDir,"index.html"),"utf8")).replace(/\r\n?/g,"\n");
const css=(await readFile(path.join(sourceDir,"css/home.css"),"utf8")).replace(/\r\n?/g,"\n");
let js=(await readFile(path.join(sourceDir,"js/home.js"),"utf8")).replace(/\r\n?/g,"\n");
// Internal audit reports include local paths and are not part of the public bundle.
js=js.replace(/<a class="dialog-action" href="docs\/block-static-audit\.md"[^\n]*?<\/a>/g,"");
// srcdoc resolves relative anchors against the embedding page. Keep navigation local.
js+='\n document.addEventListener("click",event=>{const link=event.target.closest("a[href^=\\"#\\"]");if(!link)return;const destination=document.getElementById(link.getAttribute("href").slice(1));if(destination){event.preventDefault();destination.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});}});\n';
if(js.includes('href="docs/'))throw new Error("Unexpected plaintext report link");
if(!html.includes('<link rel="stylesheet" href="css/home.css">')||!html.includes('<script src="js/home.js" defer></script>'))throw new Error("Source structure changed; review bundling rules");
html=html.replace('<link rel="stylesheet" href="css/home.css">',`<style>${css}</style>`).replace('<script src="js/home.js" defer></script>',`<script>${js.replace(/<\/script/gi,"<\\/script")}</script>`);
// The source script used defer. Keep it at body end after DOM elements exist.
const inlineScript=html.match(/<script>[\s\S]*?<\/script>/)[0];
html=html.replace(inlineScript,"").replace("</body>",`${inlineScript}\n</body>`);
html=html.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'">');
// srcdoc documents inherit the parent CSP. Allow only these exact inline bytes.
const scriptHash=createHash("sha256").update(inlineScript.slice(8,-9)).digest("base64");
const styleHash=createHash("sha256").update(css).digest("base64");
const publicIndexPath=path.join(publishDir,"index.html");
let publicIndex=await readFile(publicIndexPath,"utf8");
publicIndex=publicIndex.replace(/script-src 'self' 'sha256-[^']*'/,`script-src 'self' 'sha256-${scriptHash}'`).replace(/style-src 'self' 'sha256-[^']*'/,`style-src 'self' 'sha256-${styleHash}'`);
if(publicIndex.includes("PORTFOLIO_SCRIPT_HASH")||publicIndex.includes("PORTFOLIO_STYLE_HASH"))throw new Error("CSP hashes were not applied");
await writeFile(publicIndexPath,publicIndex,"utf8");
await mkdir(privateDir,{recursive:true});
let password;
const keyPath=path.join(privateDir,"access-key.json");
try{const savedKey=JSON.parse(await readFile(keyPath,"utf8"));password=savedKey.password;const minimum=savedKey.allowShortPassword===true?8:20;if(typeof password!=="string"||password.length<minimum)throw new Error("Existing password is invalid; use a strong passphrase or an explicitly selected short-password override");}
catch(error){if(error.code!=="ENOENT")throw error;password=randomBytes(24).toString("base64url");await writeFile(keyPath,JSON.stringify({password,note:"PRIVATE: do not commit, upload or share this file. Use this password locally to unlock the portfolio."},null,2),{flag:"wx",mode:0o600});}
const salt=webcrypto.getRandomValues(new Uint8Array(16)),iv=webcrypto.getRandomValues(new Uint8Array(12)),encoder=new TextEncoder();
const passwordBytes=encoder.encode(password),material=await webcrypto.subtle.importKey("raw",passwordBytes,"PBKDF2",false,["deriveKey"]);passwordBytes.fill(0);
const iterations=600000,key=await webcrypto.subtle.deriveKey({name:"PBKDF2",salt,iterations,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
const plaintext=encoder.encode(html),algorithm={name:"AES-GCM",iv,additionalData:encoder.encode("TA-PORTFOLIO:1"),tagLength:128};
const ciphertext=new Uint8Array(await webcrypto.subtle.encrypt(algorithm,key,plaintext));
const decrypted=new Uint8Array(await webcrypto.subtle.decrypt(algorithm,key,ciphertext));
if(Buffer.compare(Buffer.from(plaintext),Buffer.from(decrypted))!==0)throw new Error("Round-trip failed");
const wrongMaterial=await webcrypto.subtle.importKey("raw",encoder.encode("wrong-password-validation-only"),"PBKDF2",false,["deriveKey"]);
const wrongKey=await webcrypto.subtle.deriveKey({name:"PBKDF2",salt,iterations,hash:"SHA-256"},wrongMaterial,{name:"AES-GCM",length:256},false,["decrypt"]);
let wrongRejected=false;try{await webcrypto.subtle.decrypt(algorithm,wrongKey,ciphertext);}catch{wrongRejected=true;}
const tampered=ciphertext.slice();tampered[0]^=1;let tamperRejected=false;try{await webcrypto.subtle.decrypt(algorithm,key,tampered);}catch{tamperRejected=true;}
if(!wrongRejected||!tamperRejected)throw new Error("Encryption validation failed");
const packageData={version:1,iterations,salt:Buffer.from(salt).toString("base64"),iv:Buffer.from(iv).toString("base64"),ciphertext:Buffer.from(ciphertext).toString("base64")};
await mkdir(path.join(publishDir,"js"),{recursive:true});
const payload=`"use strict";\nwindow.TA_ENCRYPTED_PORTFOLIO = Object.freeze(${JSON.stringify(packageData)});\n`;
if(payload.includes(password)||payload.includes("Match Block Attributes"))throw new Error("Plaintext leaked into payload");
await writeFile(path.join(publishDir,"js/encrypted-portfolio.js"),payload,"utf8");
await writeFile(path.join(privateDir,"build-checks.json"),JSON.stringify({roundTrip:true,wrongPasswordRejected:wrongRejected,tamperRejected,plaintextBytes:plaintext.length,ciphertextBytes:ciphertext.length,sourceSha256:createHash("sha256").update(html).digest("hex")},null,2),"utf8");
plaintext.fill(0);decrypted.fill(0);password="";html="";
console.log("Encrypted portfolio built. Round-trip, wrong-password and tamper checks passed. Password remains in private/access-key.json; no credentials printed.");
