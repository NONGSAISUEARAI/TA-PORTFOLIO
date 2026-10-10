# TA-PORTFOLIO

หน้า Password-only + Starfield Warp สำหรับเปิดพอร์ตด้วยการถอดรหัสในเบราว์เซอร์ ไม่ส่งรหัสผ่านให้เซิร์ฟเวอร์ ไม่ใช้ชื่อผู้ใช้ ไม่เก็บ password/key ใน cookie, localStorage หรือ sessionStorage

## ไฟล์สำหรับขึ้นเว็บ

**อัปโหลดเฉพาะเนื้อหาใน `publish/`** อย่าอัปโหลดทั้งโฟลเดอร์ TA-PORTFOLIO

```text
TA-PORTFOLIO/
  publish/
    index.html                 หน้า Password + พื้นหลัง Starfield
    css/login.css
    js/login.js                ถอดรหัสในเบราว์เซอร์และแสดงพอร์ต
    js/encrypted-portfolio.js   เนื้อหาพอร์ตที่เข้ารหัสแล้ว
  private/                     ห้ามเผยแพร่ / กำหนด ignore ไว้ใน .gitignore
    access-key.json             รหัสเริ่มต้นสำหรับเจ้าของ
    build-checks.json
  source/                      พอร์ตต้นฉบับสำหรับแก้ไข / ห้ามเผยแพร่ชุดนี้
    index.html
    css/home.css
    js/home.js
  tools/
    build-encrypted-portfolio.mjs
  previews/                    ภาพตรวจหน้าเว็บ / ไม่รวมในชุดอัปโหลด
```

เปิด `private/access-key.json` ในเครื่องเพื่อดูรหัสเริ่มต้น รหัสนี้สุ่มอย่างแข็งแรงและไม่ถูกฝังไว้ใน JavaScript สาธารณะ ไม่มีรหัสทดลองที่รู้กันทั่วไปในชุดขึ้นเว็บ แบ่งปันรหัสกับผู้ชมที่ต้องการโดยช่องทางที่ไว้ใจได้เท่านั้น

รหัสถูกใช้สร้าง key ด้วย PBKDF2-SHA256 (600,000 iterations, salt สุ่ม 16 bytes) แล้วถอดเนื้อหาด้วย AES-256-GCM (IV สุ่ม 12 bytes, 128-bit authentication tag) ตัวเว็บโหลด ciphertext แต่ไม่แสดงหรือรันเนื้อหาพอร์ตจนกว่าจะถอดรหัสสำเร็จ จากนั้นแสดง HTML/CSS/JS แบบ self-contained ใน sandboxed iframe ผ่าน srcdoc ปุ่มล็อกล้างเนื้อหา iframe; refresh ต้องใส่รหัสใหม่ ไม่มีการส่งรหัสผ่านหรือ HTML ที่ถอดรหัสกลับไปเซิร์ฟเวอร์ แต่ไฟล์เว็บสาธารณะยังต้องโหลดตามปกติ

ใช้ HTTPS เมื่อขึ้นเว็บ หรือ localhost ขณะตรวจในเครื่อง เนื่องจาก Web Crypto ต้องใช้ secure context การเปิด HTML จากไฟล์โดยตรงขึ้นกับเบราว์เซอร์ จึงยังไม่รับรองทุกเบราว์เซอร์ ไม่มี dependency จาก CDN/fonts ภายนอก และ CSP ปิด form submission/network connections ของตัวล็อกและพอร์ตภายใน

ตรวจในเครื่อง: เปิด PowerShell แล้วรัน `tools/start-preview.ps1` จากโฟลเดอร์นี้ จากนั้นเปิด http://127.0.0.1:8767/ ในเบราว์เซอร์ ปิดตัวอย่างด้วย Ctrl+C สคริปต์ให้บริการเฉพาะ `publish/` และรับการเชื่อมต่อเฉพาะเครื่องนี้ ไม่ใช่ระบบตรวจรหัสฝั่งเซิร์ฟเวอร์ ไม่เผยแพร่ private/source ใช้ Python ที่มีในเครื่องหรือ runtime ที่ติดตั้งมากับ Codex โดยไม่ดาวน์โหลดเพิ่ม

## ข้อจำกัดที่ต้องเข้าใจ

- เป็น encrypted static portfolio ไม่ใช่ระบบบัญชี/สิทธิ์ฝั่งเซิร์ฟเวอร์ ทุกคนดาวน์โหลด ciphertext ได้และสามารถลองเดารหัสแบบ offline จึงต้องใช้รหัสยาว ไม่ใช่รหัสสั้นหรือรหัสที่ใช้กับบัญชีอื่น
- คนที่มีรหัสและเปิดดูแล้วสามารถคัดลอก/บันทึกเนื้อหาได้ ไม่มี DRM และไม่สามารถถอนเนื้อหาที่ผู้ชมดาวน์โหลดแล้วได้
- ผู้ที่ควบคุมไฟล์เว็บ/hosting สามารถแก้ JavaScript ให้ขโมยรหัสได้ ต้องใช้ hosting ที่ไว้ใจได้และ HTTPS การไม่ส่งรหัสเป็นคุณสมบัติของชุดโค้ดนี้ ไม่ใช่ข้อรับรองสำหรับชุดที่ถูกดัดแปลง
- เปลี่ยนรหัสต้องเข้ารหัสใหม่; ผู้ชมที่เก็บ ciphertext เก่าและรหัสเก่าอาจยังเปิดสำเนาเก่าได้
- JavaScript strings/DOM/หน่วยความจำอาจถูกเก็บโดยเบราว์เซอร์/ส่วนขยาย จึงไม่อ้างว่าล้าง secret จาก memory ได้สมบูรณ์
- ไม่ใส่ source AutoLISP, audit report ที่มี path ในเครื่อง หรือไฟล์ดาวน์โหลด CAD ลงใน bundle รอบนี้ ผลงานยังมีสถานะรอทดสอบ CAD ตามหน้าแรกเดิม

## แก้หน้าแรก / สร้างข้อมูลเข้ารหัสใหม่

แก้ไฟล์ใน `source/` แล้วรัน `tools/build-encrypted-portfolio.mjs` ด้วย Node.js จากเครื่อง Build helper จะใช้รหัสเดิมใน `private/access-key.json` แต่สุ่ม salt/IV ใหม่ทุกครั้ง ไม่มีการ print รหัสหรือส่งข้อมูลออก หากแก้รหัสในไฟล์ส่วนตัวให้ใช้รหัสใหม่ที่ยาวอย่างน้อย 20 ตัวอักษรแล้ว build ใหม่

หน้า Password ใช้แนวทางภาพจากไฟล์ที่ผู้ใช้ให้ `starfield_warp_login.html` โดยทำใหม่ให้มีเฉพาะช่อง Password และตัด white flash ออก มีปุ่มหยุด animation และเคารพ prefers-reduced-motion ไม่แก้ไฟล์อ้างอิงเดิม

แหล่งอ้างอิงทางเทคนิค: [MDN deriveKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey), [MDN AES-GCM parameters](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams), [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

ยังไม่อัปโหลดหรือเผยแพร่เว็บให้ในรอบนี้ รักษา `.gitignore` และอย่า commit/upload `private/`, `source/` หรือภาพพอร์ตที่ปลดล็อกแล้วหากต้องการให้ข้อมูลเหล่านั้นไม่เป็นสาธารณะ

ข้อสังเกต Git: คำสั่งตรวจ ignore ใน repository นี้รายงานว่าไม่ได้อยู่ใน work tree จึงยังไม่รับรองว่า Git ของโฟลเดอร์นี้ทำงานหรือ ignore มีผลจริง ไม่แก้การตั้งค่า Git และไม่ commit ไฟล์ใด ตรวจสถานะก่อนใช้งาน GitHub โดยเฉพาะไฟล์รหัสผ่าน

ผลตรวจหน้าเว็บและขอบเขตการทดสอบอยู่ใน `QA.md` แนวทาง Sites ใช้จัดโครงสร้างเว็บและตรวจภาพหน้าเว็บในเครื่อง ไม่มีการเผยแพร่ด้วยบริการ Sites
