"use strict";
// Visual direction adapted from the user-supplied starfield_warp_login.html.
// Password-only local decryption. No requests, credential logging or storage.
(() => {
  const text = {
    th:{title:"เข้าสู่พอร์ต",description:"ใส่รหัสผ่านเพื่อเปิดดูผลงาน\nAutoLISP Automation Developer",passwordLabel:"รหัสผ่าน",passwordHelp:"รหัสผ่านถูกใช้ถอดรหัสในเครื่อง ไม่ส่งออกจากเบราว์เซอร์",placeholder:"ใส่รหัสผ่านของพอร์ต",unlock:"เปิดดูผลงาน",privacy:"ไม่มีชื่อผู้ใช้ · ไม่บันทึกรหัสผ่าน\nเนื้อหาพอร์ตจะแสดงหลังถอดรหัสสำเร็จเท่านั้น",footer:"พื้นหลัง Starfield Warp · ไม่มีการส่งข้อมูลล็อกอิน",unlocked:"เปิดในเบราว์เซอร์นี้",lock:"ล็อกพอร์ต ↗",pauseMotion:"หยุดภาพเคลื่อนไหว",resumeMotion:"เปิดภาพเคลื่อนไหว",show:"แสดงรหัสผ่าน",hide:"ซ่อนรหัสผ่าน",empty:"กรุณาใส่รหัสผ่านก่อนเปิดพอร์ต",working:"กำลังถอดรหัสในเบราว์เซอร์…",opening:"ถอดรหัสสำเร็จ กำลังเปิดพอร์ต…",failed:"เปิดพอร์ตไม่ได้: รหัสผ่านไม่ถูกต้อง หรือไฟล์เข้ารหัสเสียหาย",unsupported:"เบราว์เซอร์นี้ยังใช้ระบบถอดรหัสไม่ได้ กรุณาใช้เบราว์เซอร์ปัจจุบันผ่าน HTTPS หรือ localhost",missing:"ไม่พบไฟล์ข้อมูลพอร์ตที่เข้ารหัส กรุณาตรวจว่ามีไฟล์เว็บครบชุด"},
    en:{title:"Enter the portfolio.",description:"Unlock the work with a password.\nAutoLISP Automation Developer",passwordLabel:"Password",passwordHelp:"Your password decrypts locally. It never leaves this browser.",placeholder:"Enter the portfolio password",unlock:"Unlock the portfolio",privacy:"No username. No password storage.\nPortfolio content appears only after successful decryption.",footer:"Starfield Warp · No login data is transmitted",unlocked:"Unlocked in this browser",lock:"Lock portfolio ↗",pauseMotion:"Pause animation",resumeMotion:"Resume animation",show:"Show password",hide:"Hide password",empty:"Enter a password to unlock the portfolio.",working:"Decrypting locally in your browser…",opening:"Decrypted. Opening the portfolio…",failed:"Unable to unlock: incorrect password or damaged encrypted content.",unsupported:"Local decryption is unavailable. Use a current browser over HTTPS or localhost.",missing:"Encrypted portfolio data is missing. Check that all website files are present."}
  };
  Object.assign(text.th,{privacy:"ไม่บันทึกรหัสผ่าน · ไม่ส่งข้อมูลล็อกอิน\nจำเนื้อหาที่ปลดล็อกชั่วคราวในแท็บนี้จนปิดแท็บหรือกดล็อกพอร์ต",unlocked:"จำการปลดล็อกในแท็บนี้",temporaryOnly:"จำแท็บไม่ได้ · Refresh ต้องใส่รหัสใหม่"});
  Object.assign(text.en,{privacy:"No password storage or login transmission.\nUnlocked content is cached for this tab until you close it or lock the portfolio.",unlocked:"Unlock remembered in this tab",temporaryOnly:"Tab storage unavailable · Password needed on reload"});
  Object.assign(text.th,{loadingView:"กำลังโหลดหน้ารวม…",displayFailed:"หน้ารวมโหลดไม่สำเร็จ กรุณารีเฟรชหรือลองเปิดพอร์ตอีกครั้ง",sessionEnded:"เรียกคืนสถานะไม่ได้ กรุณาใส่รหัสเพื่อเปิดพอร์ตอีกครั้ง"});
  Object.assign(text.en,{loadingView:"Loading the directory…",displayFailed:"The directory did not load. Refresh or unlock the portfolio again.",sessionEnded:"The session could not be restored. Enter your password to unlock again."});
  const input=document.getElementById("password"),form=document.getElementById("unlock-form"),status=document.getElementById("form-status"),submit=document.getElementById("unlock-button"),lockScreen=document.getElementById("lock-screen"),view=document.getElementById("portfolio-view");
  let frame=document.getElementById("portfolio-frame"),frameReady=false,frameWatch=null,historyRestoreTimer=null;
  const motionQuery=matchMedia("(prefers-reduced-motion: reduce)");
  let lang="th",busy=false,statusKey="",errorState=false,motionPaused=motionQuery.matches,unlockTimer=null,transitionResolve=null,attemptSerial=0;
  let collectionPaths=new Set();
  // Only decrypted content is cached for this tab; never the password or AES key.
  const sessionKey="TA_PORTFOLIO_TAB_V1:"+new URL(location.href).pathname;
  const maxSessionLength=5*1024*1024;
  let sessionRemembered=false,pageActive=true;
  function forgetSession(){try{sessionStorage.removeItem(sessionKey);}catch{}sessionRemembered=false;}
  async function sha256(value){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");}
  async function packageFingerprint(){const data=window.TA_ENCRYPTED_PORTFOLIO;if(data?.version!==1||data.iterations!==600000||!/^[a-f0-9]{64}$/.test(data.plaintextSha256||""))throw new Error("Invalid session package");return sha256(JSON.stringify([data.version,data.iterations,data.salt,data.iv,data.ciphertext,data.plaintextSha256]));}
  function updateViewerLabel(){const node=document.getElementById("viewer-state");if(node){node.dataset.i18n=!frameReady?"loadingView":sessionRemembered?"unlocked":"temporaryOnly";node.textContent=text[lang][node.dataset.i18n];}}
  function cancelFrameWatch(){if(frameWatch!==null)clearTimeout(frameWatch);frameWatch=null;}
  function cancelHistoryRestore(){if(historyRestoreTimer!==null)clearTimeout(historyRestoreTimer);historyRestoreTimer=null;}
  function replacePortfolioFrame(html=""){
    cancelFrameWatch();frameReady=false;
    // A new child browsing context cannot restore an old about:blank history entry.
    // Configure srcdoc while detached; keep the original sandbox and CSP intact.
    const next=frame.cloneNode(false);next.removeAttribute("srcdoc");
    if(html)next.srcdoc=html;
    frame.replaceWith(next);frame=next;
  }
  function clearDisplayedPortfolio(){releaseCollectionLinks();replacePortfolioFrame();view.hidden=true;lockScreen.hidden=false;lockScreen.classList.remove("departing");warp=false;if(!motionPaused)startStars();}
  async function rememberSession(html,attempt){
    sessionRemembered=false;
    try{
      if(html.length>maxSessionLength)throw new Error("Session too large");
      const fingerprint=await packageFingerprint();
      if(await sha256(html)!==window.TA_ENCRYPTED_PORTFOLIO.plaintextSha256)throw new Error("Content mismatch");
      if(attempt!==attemptSerial||!pageActive)return;
      sessionStorage.setItem(sessionKey,JSON.stringify({version:1,fingerprint,html}));sessionRemembered=true;
    }catch{if(attempt===attemptSerial)forgetSession();}
  }
  async function restoreSession(force=false){
    if(!pageActive||busy||(!force&&!view.hidden)||!window.crypto?.subtle)return;
    const attempt=++attemptSerial;
    try{
      const raw=sessionStorage.getItem(sessionKey);if(!raw){if(!view.hidden){clearDisplayedPortfolio();message("sessionEnded",true);}return;}
      if(raw.length>maxSessionLength*2)throw new Error("Invalid session size");
      const saved=JSON.parse(raw);
      if(saved.version!==1||typeof saved.html!=="string"||saved.html.length>maxSessionLength||saved.fingerprint!==await packageFingerprint()||await sha256(saved.html)!==window.TA_ENCRYPTED_PORTFOLIO.plaintextSha256)throw new Error("Expired or invalid session");
      if(attempt!==attemptSerial||!pageActive)return;
      sessionRemembered=true;renderPortfolio(saved.html);message("");
    }catch{if(attempt===attemptSerial){forgetSession();if(!view.hidden){clearDisplayedPortfolio();message("sessionEnded",true);}}}
  }
  function scheduleHistoryRestore(){
    cancelHistoryRestore();const attempt=attemptSerial;
    // Wait until history traversal has finished restoring the parent and children.
    historyRestoreTimer=setTimeout(()=>{historyRestoreTimer=null;if(pageActive&&attempt===attemptSerial)void restoreSession(true);},0);
  }
  function releaseCollectionLinks(){collectionPaths.clear();}
  addEventListener("message",event=>{
    if(!pageActive||view.hidden||event.source!==frame.contentWindow)return;
    if(event.data?.type==="TA_PORTFOLIO_READY"){frameReady=true;cancelFrameWatch();updateViewerLabel();return;}
    if(!frameReady||event.data?.type!=="TA_OPEN_COLLECTION_PAGE")return;
    const relative=event.data.path;
    if(typeof relative!=="string"||!collectionPaths.has(relative)||!/^\d{2}_[A-Za-z0-9_]+\/[A-Za-z0-9_-]+\/index\.html$/.test(relative))return;
    const base=new URL("../Autolisp%20Collection/",location.href),target=new URL(relative,base);
    if(target.origin!==base.origin||!target.pathname.startsWith(base.pathname))return;
    // These existing standalone detail pages are not encrypted by this login.
    location.assign(target.href);
  });
  function message(key,error=false){statusKey=key;errorState=error;status.textContent=key?text[lang][key]:"";status.classList.toggle("error",error);}
  function language(next){lang=next;document.documentElement.lang=lang;document.querySelectorAll("[data-i18n]").forEach(node=>{node.textContent=text[lang][node.dataset.i18n];});input.placeholder=text[lang].placeholder;document.getElementById("language-toggle").textContent=lang==="th"?"EN":"TH";document.getElementById("language-toggle").setAttribute("aria-label",lang==="th"?"Switch to English":"เปลี่ยนเป็นภาษาไทย");updateViewerLabel();updateMotionLabel();updatePasswordLabel();message(statusKey,errorState);}
  function updatePasswordLabel(){const visible=input.type==="text",button=document.getElementById("password-toggle");button.setAttribute("aria-label",text[lang][visible?"hide":"show"]);button.setAttribute("aria-pressed",String(visible));}
  function updateMotionLabel(){const button=document.getElementById("motion-toggle");button.textContent=text[lang][motionPaused?"resumeMotion":"pauseMotion"];button.setAttribute("aria-pressed",String(motionPaused));}
  function bytes(base64){const raw=atob(base64),array=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)array[i]=raw.charCodeAt(i);return array;}
  async function decrypt(password){
    const packageData=window.TA_ENCRYPTED_PORTFOLIO;
    if(!packageData || packageData.version!==1 || packageData.iterations!==600000) throw new Error("Invalid package");
    const encoder=new TextEncoder(),passwordBytes=encoder.encode(password);
    let material;
    try{material=await crypto.subtle.importKey("raw",passwordBytes,"PBKDF2",false,["deriveKey"]);}finally{passwordBytes.fill(0);}
    const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:bytes(packageData.salt),iterations:packageData.iterations,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["decrypt"]);
    const plaintext=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes(packageData.iv),additionalData:encoder.encode("TA-PORTFOLIO:1"),tagLength:128},key,bytes(packageData.ciphertext)));
    try{return new TextDecoder("utf-8",{fatal:true}).decode(plaintext);}finally{plaintext.fill(0);}
  }
  function renderPortfolio(html){
    const documentData=new DOMParser().parseFromString(html,"text/html");
    const paths=JSON.parse(documentData.getElementById("catalog-links")?.textContent||"[]");
    if(!Array.isArray(paths)||paths.some(item=>typeof item!=="string"))throw new Error("Invalid catalogue links");
    collectionPaths=new Set(paths);
    replacePortfolioFrame(html);view.hidden=false;lockScreen.hidden=true;lockScreen.classList.remove("departing");warp=false;stopStars();updateViewerLabel();document.getElementById("lock-button").focus();
    const attempt=attemptSerial;
    frameWatch=setTimeout(()=>{frameWatch=null;if(pageActive&&attempt===attemptSerial&&!frameReady){clearDisplayedPortfolio();message("displayFailed",true);input.focus();}},8000);
  }
  form.addEventListener("submit",async event=>{
    event.preventDefault();if(busy)return;
    if(!input.value){input.setAttribute("aria-invalid","true");message("empty",true);input.focus();return;}
    if(!window.crypto?.subtle){message("unsupported",true);return;}
    if(!window.TA_ENCRYPTED_PORTFOLIO){message("missing",true);return;}
    busy=true;submit.disabled=true;input.disabled=true;document.getElementById("password-toggle").disabled=true;input.removeAttribute("aria-invalid");form.setAttribute("aria-busy","true");message("working");
    const attempt=++attemptSerial;
    let password=input.value;input.value="";input.type="password";updatePasswordLabel();
    try{
      let html=await decrypt(password);password="";if(attempt!==attemptSerial){html="";return;}message("opening");
      if(!motionPaused){lockScreen.classList.add("departing");warp=true;warpStart=performance.now();startStars();await new Promise(resolve=>{transitionResolve=resolve;unlockTimer=setTimeout(()=>{unlockTimer=null;transitionResolve=null;resolve();},1500);});}
      if(attempt!==attemptSerial){html="";return;}await rememberSession(html,attempt);if(attempt!==attemptSerial){html="";return;}renderPortfolio(html);html="";message("");
    }catch{password="";if(attempt===attemptSerial){forgetSession();warp=false;lockScreen.classList.remove("departing");message("failed",true);input.setAttribute("aria-invalid","true");}}
    finally{busy=false;submit.disabled=false;input.disabled=false;document.getElementById("password-toggle").disabled=false;form.removeAttribute("aria-busy");if(view.hidden)input.focus();}
  });
  document.getElementById("password-toggle").addEventListener("click",()=>{input.type=input.type==="password"?"text":"password";updatePasswordLabel();input.focus();});
  document.getElementById("language-toggle").addEventListener("click",()=>language(lang==="th"?"en":"th"));
  document.getElementById("lock-button").addEventListener("click",()=>{attemptSerial++;cancelHistoryRestore();forgetSession();clearDisplayedPortfolio();message("");input.value="";input.type="password";updatePasswordLabel();resize();if(!motionPaused)startStars();input.focus();});

  // Canvas starfield: subdued drift, then a short warp without the reference's white flash.
  const canvas=document.getElementById("stars"),context=canvas.getContext("2d");
  let width=0,height=0,cx=0,cy=0,depth=0,stars=[],raf=null,last=0,warp=false,warpStart=0;
  function resetStar(star,randomDepth=false){star.x=(Math.random()-.5)*width*2.5;star.y=(Math.random()-.5)*height*2.5;star.z=randomDepth?Math.random()*depth+1:depth;star.hue=190+Math.random()*65;}
  function resize(){if(!context)return;const ratio=Math.min(devicePixelRatio||1,2);width=innerWidth;height=innerHeight;cx=width/2;cy=height/2;depth=Math.max(width,height)*1.25;canvas.width=width*ratio;canvas.height=height*ratio;context.setTransform(ratio,0,0,ratio,0,0);stars=Array.from({length:width<650?350:650},()=>{const star={};resetStar(star,true);return star;});draw(performance.now(),true);}
  function draw(time,still=false){
    if(!context)return;
    const delta=still?0:Math.min((time-(last||time))/16.67,2);last=time;
    context.fillStyle=warp?"rgba(2,5,15,.32)":"rgba(2,5,15,.96)";context.fillRect(0,0,width,height);
    const elapsed=warp?(time-warpStart)/1000:0,speed=warp?Math.min(45,2+elapsed*elapsed*20):.32;
    for(const star of stars){const oldDepth=star.z;star.z-=speed*delta*9;if(star.z<1){resetStar(star);continue;}const x=cx+star.x/star.z*500,y=cy+star.y/star.z*500;if(x<-width*.3||x>width*1.3||y<-height*.3||y>height*1.3){resetStar(star);continue;}const previousX=cx+star.x/Math.max(oldDepth,1)*500,previousY=cy+star.y/Math.max(oldDepth,1)*500,radius=Math.max(.45,Math.min(2.2,1.4*(1-star.z/depth)+.4));context.strokeStyle=`hsla(${star.hue},80%,${Math.round(70+(1-star.z/depth)*22)}%,${warp?.85:.67})`;context.fillStyle=context.strokeStyle;context.lineWidth=warp?Math.max(1,radius):radius;context.beginPath();if(warp&&!still){context.moveTo(previousX,previousY);context.lineTo(x,y);context.stroke();}else{context.arc(x,y,radius*.55,0,Math.PI*2);context.fill();}}
  }
  function tick(time){raf=null;if(motionPaused||document.hidden||!view.hidden)return;draw(time);raf=requestAnimationFrame(tick);}
  function startStars(){if(!context||motionPaused||document.hidden||!view.hidden||raf!==null)return;last=performance.now();raf=requestAnimationFrame(tick);}
  function stopStars(){if(raf!==null)cancelAnimationFrame(raf);raf=null;last=0;}
  document.getElementById("motion-toggle").addEventListener("click",()=>{motionPaused=!motionPaused;updateMotionLabel();if(motionPaused){stopStars();draw(performance.now(),true);}else startStars();});
  motionQuery.addEventListener("change",event=>{motionPaused=event.matches;updateMotionLabel();if(motionPaused){stopStars();draw(performance.now(),true);}else startStars();});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)stopStars();else startStars();});
  addEventListener("resize",resize);
  // Do not navigate/blank the iframe during pagehide: it can corrupt its Back entry.
  // BFCache may retain plaintext DOM, just as tab storage retains plaintext HTML.
  // It is revalidated/replaced on return; explicit Lock still clears both immediately.
  addEventListener("pagehide",()=>{pageActive=false;releaseCollectionLinks();attemptSerial++;cancelFrameWatch();cancelHistoryRestore();warp=false;stopStars();if(unlockTimer!==null)clearTimeout(unlockTimer);unlockTimer=null;if(transitionResolve){transitionResolve();transitionResolve=null;}input.value="";input.type="password";updatePasswordLabel();lockScreen.classList.remove("departing");});
  addEventListener("pageshow",()=>{pageActive=true;if(!motionPaused)startStars();scheduleHistoryRestore();});
  addEventListener("popstate",scheduleHistoryRestore);
  resize();language("th");startStars();void restoreSession();
})();
